from datetime import date
from unittest.mock import Mock

import httpx

import pytest

from app.services.workflow_service import (
    WorkflowConflictError,
    WorkflowNotFoundError,
    WorkflowSemanticError,
    WorkflowUpstreamError,
    _read_in_chunks,
    build_dashboard,
    create_validation,
    derive_status,
    effective_class,
    get_dashboard,
    list_followups,
    list_pending_validations,
    list_validation_history,
    local_day_utc_bounds,
    merge_workflow_rows,
    transition_followup,
    update_validation,
)


PREDICTION_ID = "10000000-0000-0000-0000-000000000001"
SECOND_PREDICTION_ID = "10000000-0000-0000-0000-000000000002"
WORKER_ID = "20000000-0000-0000-0000-000000000001"


def prediction(
    prediction_id=PREDICTION_ID,
    disease="Coccidiosis",
    created_at="2026-08-02T10:00:00+00:00",
    deleted_at=None,
):
    return {
        "id": prediction_id,
        "image_url": "https://example.test/image.jpg",
        "prediction": disease,
        "confidence": 94.5,
        "all_predictions": {
            "Coccidiosis": 94.5,
            "Healthy": 2.0,
            "New Castle Disease": 2.0,
            "Salmonellosis": 1.5,
        },
        "worker_id": WORKER_ID,
        "created_at": created_at,
        "deleted_at": deleted_at,
    }


def followup(prediction_id=PREDICTION_ID, **overrides):
    row = {
        "prediction_id": prediction_id,
        "isolated_at": None,
        "isolated_by": None,
        "treatment_started_at": None,
        "treatment_started_by": None,
        "treatment_completed_at": None,
        "treatment_completed_by": None,
        "closed_at": None,
        "close_reason": None,
        "closed_by": None,
        "created_at": "2026-08-02T10:00:01+00:00",
        "updated_at": "2026-08-02T10:00:01+00:00",
    }
    row.update(overrides)
    return row


def validation(
    prediction_id=PREDICTION_ID,
    verdict="matching",
    corrected_prediction=None,
    **overrides,
):
    row = {
        "id": "30000000-0000-0000-0000-000000000001",
        "prediction_id": prediction_id,
        "veterinarian_id": "40000000-0000-0000-0000-000000000001",
        "verdict": verdict,
        "corrected_prediction": corrected_prediction,
        "note": "checked",
        "created_at": "2026-08-02T11:00:00+00:00",
        "updated_at": "2026-08-02T11:00:00+00:00",
    }
    row.update(overrides)
    return row


@pytest.mark.parametrize(
    ("validation_row", "expected"),
    [
        (None, "Coccidiosis"),
        (validation(verdict="matching"), "Coccidiosis"),
        (validation(verdict="uncertain"), "Coccidiosis"),
        (
            validation(verdict="incorrect", corrected_prediction="Salmonellosis"),
            "Salmonellosis",
        ),
    ],
)
def test_effective_class_uses_correction_only_for_incorrect_verdict(
    validation_row, expected
):
    assert effective_class("Coccidiosis", validation_row) == expected


@pytest.mark.parametrize(
    ("followup_row", "validation_row", "expected"),
    [
        (followup(), None, "pending_isolation"),
        (
            followup(isolated_at="2026-08-02T11:10:00+00:00", isolated_by="head-1"),
            None,
            "pending_validation",
        ),
        (
            followup(isolated_at="2026-08-02T11:10:00+00:00", isolated_by="head-1"),
            validation(verdict="uncertain"),
            "requires_examination",
        ),
        (
            followup(isolated_at="2026-08-02T11:10:00+00:00", isolated_by="head-1"),
            validation(),
            "ready_for_treatment",
        ),
        (
            followup(
                isolated_at="2026-08-02T11:10:00+00:00",
                isolated_by="head-1",
                treatment_started_at="2026-08-02T12:00:00+00:00",
                treatment_started_by="head-1",
            ),
            validation(),
            "active_treatment",
        ),
        (
            followup(
                isolated_at="2026-08-02T11:10:00+00:00",
                isolated_by="head-1",
                treatment_started_at="2026-08-02T12:00:00+00:00",
                treatment_started_by="head-1",
                treatment_completed_at="2026-08-02T13:00:00+00:00",
                treatment_completed_by="head-1",
            ),
            validation(),
            "treatment_completed",
        ),
        (
            followup(
                closed_at="2026-08-02T11:00:01+00:00",
                close_reason="corrected_healthy",
                closed_by="vet-1",
            ),
            validation(verdict="incorrect", corrected_prediction="Healthy"),
            "auto_closed",
        ),
    ],
)
def test_derive_status_models_the_workflow_order(
    followup_row, validation_row, expected
):
    assert derive_status(followup_row, validation_row) == expected


def test_merge_excludes_healthy_deleted_and_legacy_predictions_and_sorts_newest():
    predictions = [
        prediction(),
        prediction(
            SECOND_PREDICTION_ID,
            created_at="2026-08-02T12:00:00+00:00",
        ),
        prediction("healthy", disease="Healthy"),
        prediction("deleted", deleted_at="2026-08-02T12:00:00+00:00"),
        prediction("legacy"),
    ]
    followups = [
        followup(),
        followup(SECOND_PREDICTION_ID),
        followup("healthy"),
        followup("deleted"),
    ]

    items = merge_workflow_rows(
        predictions=predictions,
        followups=followups,
        validations=[],
        workers=[{"id": WORKER_ID, "name": "Budi"}],
    )

    assert [item["prediction_id"] for item in items] == [
        SECOND_PREDICTION_ID,
        PREDICTION_ID,
    ]
    assert all(item["worker_name"] == "Budi" for item in items)


def test_merge_applies_effective_recommendation_and_examination_flag():
    uncertain_items = merge_workflow_rows(
        predictions=[prediction()],
        followups=[followup()],
        validations=[validation(verdict="uncertain")],
        workers=[{"id": WORKER_ID, "name": "Budi"}],
    )
    corrected_items = merge_workflow_rows(
        predictions=[prediction()],
        followups=[followup()],
        validations=[
            validation(verdict="incorrect", corrected_prediction="Salmonellosis")
        ],
        workers=[{"id": WORKER_ID, "name": "Budi"}],
    )

    assert uncertain_items[0]["effective_class"] == "Coccidiosis"
    assert uncertain_items[0]["requires_examination"] is True
    assert "Eimeria" in uncertain_items[0]["recommendation_data"]["cause"]
    assert corrected_items[0]["effective_class"] == "Salmonellosis"
    assert "Salmonella" in corrected_items[0]["recommendation_data"]["cause"]


def test_build_dashboard_counts_today_workflow_state_and_limits_latest():
    items = []
    states = [
        (followup(), None),
        (
            followup(
                SECOND_PREDICTION_ID,
                isolated_at="2026-08-02T11:00:00+00:00",
                isolated_by="head-1",
            ),
            None,
        ),
        (
            followup(
                "active",
                isolated_at="2026-08-02T11:00:00+00:00",
                isolated_by="head-1",
                treatment_started_at="2026-08-02T12:00:00+00:00",
                treatment_started_by="head-1",
            ),
            validation("active"),
        ),
    ]
    predictions = [
        prediction(PREDICTION_ID, created_at="2026-08-02T10:00:00+00:00"),
        prediction(SECOND_PREDICTION_ID, created_at="2026-08-02T11:00:00+00:00"),
        prediction("active", created_at="2026-08-02T12:00:00+00:00"),
    ]
    items = merge_workflow_rows(
        predictions=predictions,
        followups=[state[0] for state in states],
        validations=[state[1] for state in states if state[1]],
        workers=[{"id": WORKER_ID, "name": "Budi"}],
    )

    dashboard = build_dashboard(items, today=date(2026, 8, 2), latest_limit=2)

    assert dashboard["counts"] == {
        "total_disease_cases": 3,
        "pending_isolation": 1,
        "pending_validation": 2,
        "active_treatment": 1,
    }
    assert len(dashboard["latest_cases"]) == 2
    assert dashboard["latest_cases"][0]["prediction_id"] == "active"


def test_build_dashboard_excludes_auto_closed_from_pending_isolation():
    items = merge_workflow_rows(
        predictions=[prediction()],
        followups=[
            followup(
                closed_at="2026-08-02T11:00:00+00:00",
                close_reason="corrected_healthy",
                closed_by="vet-1",
            )
        ],
        validations=[
            validation(verdict="incorrect", corrected_prediction="Healthy")
        ],
        workers=[{"id": WORKER_ID, "name": "Budi"}],
    )

    assert build_dashboard(items, today=date(2026, 8, 2))["counts"] == {
        "total_disease_cases": 1,
        "pending_isolation": 0,
        "pending_validation": 0,
        "active_treatment": 0,
    }


def test_local_day_utc_bounds_convert_jakarta_midnights_to_utc():
    assert local_day_utc_bounds(date(2026, 8, 2)) == (
        "2026-08-01T17:00:00+00:00",
        "2026-08-02T17:00:00+00:00",
    )


def test_dashboard_counts_only_timestamps_inside_jakarta_local_day():
    base = {
        "prediction_id": "case",
        "isolated_at": None,
        "closed_at": None,
        "validation": None,
        "treatment_started_at": None,
        "treatment_completed_at": None,
    }
    items = [
        # 2026-08-02 00:30 WIB: included.
        dict(base, prediction_id="local-0030", created_at="2026-08-01T17:30:00Z"),
        # 2026-08-02 23:59 WIB: included.
        dict(base, prediction_id="local-2359", created_at="2026-08-02T16:59:00Z"),
        # 2026-08-01 23:59 WIB: excluded.
        dict(base, prediction_id="prior-2359", created_at="2026-08-01T16:59:00Z"),
        # 2026-08-03 00:00 WIB, the exclusive end: excluded.
        dict(base, prediction_id="next-0000", created_at="2026-08-02T17:00:00Z"),
    ]

    dashboard = build_dashboard(items, today=date(2026, 8, 2), latest_limit=10)

    assert dashboard["counts"] == {
        "total_disease_cases": 2,
        "pending_isolation": 2,
        "pending_validation": 2,
        "active_treatment": 0,
    }
    assert {row["prediction_id"] for row in dashboard["latest_cases"]} == {
        "local-0030",
        "local-2359",
    }


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload
        self.text = str(payload)

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("GET", "https://example.test")
            response = httpx.Response(self.status_code, request=request)
            raise httpx.HTTPStatusError(
                "request failed", request=request, response=response
            )


class FakeClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def _call(self, method, path, **kwargs):
        self.calls.append((method, path, kwargs))
        return self.responses.pop(0)

    def get(self, path, **kwargs):
        return self._call("GET", path, **kwargs)

    def post(self, path, **kwargs):
        return self._call("POST", path, **kwargs)

    def patch(self, path, **kwargs):
        return self._call("PATCH", path, **kwargs)


def service_read_responses(*, validation_rows=None):
    return [
        FakeResponse(200, [followup()]),
        FakeResponse(200, [prediction()]),
        FakeResponse(200, validation_rows or []),
        FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
    ]


def test_pending_query_uses_parameterized_filters_and_returns_unvalidated(monkeypatch):
    client = FakeClient(service_read_responses())
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    result = list_pending_validations(
        disease="Coccidiosis",
        date_from=date(2026, 8, 1),
        date_to=date(2026, 8, 2),
    )

    assert result[0]["prediction_id"] == PREDICTION_ID
    assert result[0]["validation"] is None
    prediction_params = client.calls[1][2]["params"]
    assert ("prediction", "eq.Coccidiosis") in prediction_params
    assert ("created_at", "gte.2026-07-31T17:00:00+00:00") in prediction_params
    assert ("created_at", "lt.2026-08-02T17:00:00+00:00") in prediction_params
    assert ("deleted_at", "is.null") in prediction_params


def test_user_date_filters_use_jakarta_boundaries_for_all_lists(monkeypatch):
    # Pending: follow-up, prediction, validation, worker.
    pending_client = FakeClient(service_read_responses())
    get_client = Mock(return_value=pending_client)
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client", get_client
    )
    list_pending_validations(
        date_from=date(2026, 8, 2), date_to=date(2026, 8, 2)
    )
    pending_prediction_params = pending_client.calls[1][2]["params"]

    # History: validation, follow-up, prediction, worker.
    history_client = FakeClient(
        [
            FakeResponse(200, [validation()]),
            FakeResponse(200, [followup()]),
            FakeResponse(200, [prediction()]),
            FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
        ]
    )
    get_client.return_value = history_client
    list_validation_history(
        veterinarian_id="vet-1",
        date_from=date(2026, 8, 2),
        date_to=date(2026, 8, 2),
    )
    history_prediction_params = history_client.calls[2][2]["params"]

    # Follow-ups: follow-up, prediction, validation, worker.
    followup_client = FakeClient(service_read_responses())
    get_client.return_value = followup_client
    list_followups(date_from=date(2026, 8, 2), date_to=date(2026, 8, 2))
    followup_prediction_params = followup_client.calls[1][2]["params"]

    for params in (
        pending_prediction_params,
        history_prediction_params,
        followup_prediction_params,
    ):
        assert ("created_at", "gte.2026-08-01T17:00:00+00:00") in params
        assert ("created_at", "lt.2026-08-02T17:00:00+00:00") in params


def test_dependent_reads_chunk_more_than_100_ids(monkeypatch):
    ids = [f"prediction-{index}" for index in range(205)]
    client = FakeClient(
        [FakeResponse(200, []), FakeResponse(200, []), FakeResponse(200, [])]
    )

    assert _read_in_chunks(
        client,
        "/prediction_validations",
        id_column="prediction_id",
        ids=ids,
        select="id,prediction_id",
    ) == []

    assert len(client.calls) == 3
    chunk_sizes = []
    for _, _, kwargs in client.calls:
        params = kwargs["params"]
        in_value = params["prediction_id"]
        chunk_sizes.append(len(in_value.removeprefix("in.(").removesuffix(")").split(",")))
        assert params["limit"] == "100"
    assert chunk_sizes == [100, 100, 5]


def test_pending_scan_fills_page_after_full_validated_batch(monkeypatch):
    first_ids = [f"validated-{index}" for index in range(100)]
    pending_ids = ["pending-1", "pending-2"]
    first_followups = [followup(prediction_id) for prediction_id in first_ids]
    first_predictions = [prediction(prediction_id) for prediction_id in first_ids]
    first_validations = [validation(prediction_id) for prediction_id in first_ids]
    second_followups = [followup(prediction_id) for prediction_id in pending_ids]
    second_predictions = [prediction(prediction_id) for prediction_id in pending_ids]
    client = FakeClient(
        [
            FakeResponse(200, first_followups),
            FakeResponse(200, first_predictions),
            FakeResponse(200, first_validations),
            FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
            FakeResponse(200, second_followups),
            FakeResponse(200, second_predictions),
            FakeResponse(200, []),
            FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
        ]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    result = list_pending_validations(limit=2, offset=0)

    assert {item["prediction_id"] for item in result} == set(pending_ids)
    driving_calls = [call for call in client.calls if call[1] == "/prediction_followups"]
    assert driving_calls[0][2]["params"][-2:] == [
        ("limit", "100"),
        ("offset", "0"),
    ]
    assert driving_calls[1][2]["params"][-2:] == [
        ("limit", "100"),
        ("offset", "100"),
    ]


def test_default_list_query_has_explicit_bounded_driver_pagination(monkeypatch):
    client = FakeClient(service_read_responses())
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    list_followups()

    driver_params = client.calls[0][2]["params"]
    assert ("limit", "100") in driver_params
    assert ("offset", "0") in driver_params


def test_pending_query_removes_predictions_with_existing_validation(monkeypatch):
    client = FakeClient(service_read_responses(validation_rows=[validation()]))
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    assert list_pending_validations() == []


def test_history_queries_only_current_veterinarian_and_sorts_updated(monkeypatch):
    own = validation(updated_at="2026-08-02T13:00:00+00:00")
    client = FakeClient(
        [
            FakeResponse(200, [own]),
            FakeResponse(200, [followup()]),
            FakeResponse(200, [prediction()]),
            FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
        ]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    result = list_validation_history(
        veterinarian_id="vet-current", verdict="matching"
    )

    validation_params = client.calls[0][2]["params"]
    assert ("veterinarian_id", "eq.vet-current") in validation_params
    assert ("verdict", "eq.matching") in validation_params
    assert ("order", "updated_at.desc") in validation_params
    assert result[0]["validation_id"] == own["id"]
    assert result[0]["treatment_started"] is False
    assert result[0]["editable"] is True


def test_history_filters_effective_correction_and_flattens_validation_fields(
    monkeypatch,
):
    corrected = validation(
        verdict="incorrect",
        corrected_prediction="Healthy",
        note="false positive",
        updated_at="2026-08-02T13:00:00+00:00",
    )
    client = FakeClient(
        [
            FakeResponse(200, [corrected]),
            FakeResponse(
                200,
                [
                    followup(
                        closed_at="2026-08-02T13:00:00+00:00",
                        close_reason="corrected_healthy",
                        closed_by="vet-current",
                    )
                ],
            ),
            FakeResponse(200, [prediction()]),
            FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
        ]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    result = list_validation_history(
        veterinarian_id="vet-current", disease="Healthy"
    )

    assert len(result) == 1
    assert result[0]["effective_class"] == "Healthy"
    assert result[0]["validation_note"] == "false positive"
    assert result[0]["validation_updated_at"] == "2026-08-02T13:00:00+00:00"
    prediction_params = client.calls[2][2]["params"]
    assert ("prediction", "eq.Healthy") not in prediction_params


@pytest.mark.parametrize(
    ("verdict", "corrected"),
    [("matching", "Healthy"), ("uncertain", "Coccidiosis"), ("incorrect", None)],
)
def test_create_validation_rejects_invalid_correction_shape_before_rest(
    monkeypatch, verdict, corrected
):
    get_client = Mock()
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client", get_client
    )

    with pytest.raises(WorkflowSemanticError):
        create_validation(
            prediction_id=PREDICTION_ID,
            veterinarian_id="vet-1",
            verdict=verdict,
            corrected_prediction=corrected,
            note=None,
        )

    get_client.assert_not_called()


def test_create_validation_sets_actor_and_maps_first_writer_conflict(monkeypatch):
    monkeypatch.setattr(
        "app.services.workflow_service._load_case",
        Mock(return_value=dict(merged_case(), validation=None, verdict=None)),
    )
    client = FakeClient(
        [FakeResponse(409, {"code": "23505", "message": "duplicate key"})]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    with pytest.raises(WorkflowConflictError):
        create_validation(
            prediction_id=PREDICTION_ID,
            veterinarian_id="vet-from-token",
            verdict="matching",
            corrected_prediction=None,
            note="ok",
        )

    assert client.calls[0][2]["json"]["veterinarian_id"] == "vet-from-token"


def test_create_validation_maps_database_semantic_failure(monkeypatch):
    monkeypatch.setattr(
        "app.services.workflow_service._load_case",
        Mock(return_value=dict(merged_case(), validation=None, verdict=None)),
    )
    client = FakeClient(
        [
            FakeResponse(
                400,
                {
                    "code": "23514",
                    "message": "An incorrect verdict must correct the AI prediction",
                },
            )
        ]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    with pytest.raises(WorkflowSemanticError):
        create_validation(
            prediction_id=PREDICTION_ID,
            veterinarian_id="vet-1",
            verdict="incorrect",
            corrected_prediction="Coccidiosis",
            note=None,
        )


def test_create_validation_rejects_nonworkflow_or_deleted_case_before_insert(
    monkeypatch,
):
    monkeypatch.setattr(
        "app.services.workflow_service._load_case",
        Mock(side_effect=WorkflowNotFoundError("not active workflow")),
    )
    get_client = Mock()
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client", get_client
    )

    with pytest.raises(WorkflowNotFoundError):
        create_validation(
            prediction_id=PREDICTION_ID,
            veterinarian_id="vet-1",
            verdict="matching",
            corrected_prediction=None,
            note=None,
        )

    get_client.assert_not_called()


def test_update_validation_filters_original_veterinarian_and_returns_404(monkeypatch):
    client = FakeClient([FakeResponse(200, [])])
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    with pytest.raises(WorkflowNotFoundError):
        update_validation(
            validation_id="validation-1",
            veterinarian_id="vet-current",
            verdict="matching",
            corrected_prediction=None,
            note=None,
        )

    params = client.calls[0][2]["params"]
    assert params["id"] == "eq.validation-1"
    assert params["veterinarian_id"] == "eq.vet-current"


def test_update_validation_maps_treatment_lock_to_conflict(monkeypatch):
    client = FakeClient(
        [
            FakeResponse(200, [validation()]),
            FakeResponse(
                400,
                {
                    "code": "23514",
                    "message": "validation cannot be changed after treatment has started",
                },
            ),
        ]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    with pytest.raises(WorkflowConflictError):
        update_validation(
            validation_id="validation-1",
            veterinarian_id="vet-current",
            verdict="matching",
            corrected_prediction=None,
            note=None,
        )


def test_list_followups_filters_derived_status_and_effective_disease(monkeypatch):
    corrected = validation(verdict="incorrect", corrected_prediction="Salmonellosis")
    client = FakeClient(service_read_responses(validation_rows=[corrected]))
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    result = list_followups(
        status_filter="pending_isolation", disease="Salmonellosis"
    )

    assert len(result) == 1
    assert result[0]["effective_class"] == "Salmonellosis"


def test_get_dashboard_uses_today_filter(monkeypatch):
    legacy_id = "legacy-no-followup"
    client = FakeClient(
        [
            FakeResponse(200, [prediction(), prediction(legacy_id)]),
            FakeResponse(200, [followup()]),
            FakeResponse(200, []),
            FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
        ]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )
    historical_scanner = Mock(
        side_effect=AssertionError("dashboard must not scan historical follow-ups")
    )
    monkeypatch.setattr(
        "app.services.workflow_service._scan_followup_items", historical_scanner
    )

    result = get_dashboard(today=date(2026, 8, 2))

    assert result["counts"]["total_disease_cases"] == 1
    assert [item["prediction_id"] for item in result["latest_cases"]] == [
        PREDICTION_ID
    ]
    assert client.calls[0][1] == "/predictions"
    prediction_params = client.calls[0][2]["params"]
    assert ("deleted_at", "is.null") in prediction_params
    assert ("prediction", "neq.Healthy") in prediction_params
    assert ("created_at", "gte.2026-08-01T17:00:00+00:00") in prediction_params
    assert ("created_at", "lt.2026-08-02T17:00:00+00:00") in prediction_params
    assert ("limit", "100") in prediction_params
    assert ("offset", "0") in prediction_params
    followup_calls = [call for call in client.calls if call[1] == "/prediction_followups"]
    assert len(followup_calls) == 1
    assert "legacy-no-followup" in followup_calls[0][2]["params"]["prediction_id"]
    historical_scanner.assert_not_called()


def test_dashboard_pages_only_date_filtered_predictions_and_keeps_latest_five(
    monkeypatch,
):
    first_ids = [f"today-{index:03d}" for index in range(100)]
    second_id = "today-100"
    first_predictions = [
        prediction(
            prediction_id,
            created_at=f"2026-08-02T{16 - (index // 60):02d}:{59 - (index % 60):02d}:00Z",
        )
        for index, prediction_id in enumerate(first_ids)
    ]
    second_prediction = prediction(
        second_id, created_at="2026-08-01T17:30:00Z"
    )
    client = FakeClient(
        [
            FakeResponse(200, first_predictions),
            FakeResponse(200, [followup(value) for value in first_ids]),
            FakeResponse(200, []),
            FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
            FakeResponse(200, [second_prediction]),
            FakeResponse(200, [followup(second_id)]),
            FakeResponse(200, []),
            FakeResponse(200, [{"id": WORKER_ID, "name": "Budi"}]),
        ]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    dashboard = get_dashboard(today=date(2026, 8, 2))

    prediction_calls = [call for call in client.calls if call[1] == "/predictions"]
    assert len(prediction_calls) == 2
    assert prediction_calls[0][2]["params"][-2:] == [
        ("limit", "100"),
        ("offset", "0"),
    ]
    assert prediction_calls[1][2]["params"][-2:] == [
        ("limit", "100"),
        ("offset", "100"),
    ]
    assert dashboard["counts"]["total_disease_cases"] == 101
    assert len(dashboard["latest_cases"]) == 5
    assert dashboard["latest_cases"][0]["prediction_id"] == "today-000"


def merged_case(**followup_overrides):
    return merge_workflow_rows(
        predictions=[prediction()],
        followups=[followup(**followup_overrides)],
        validations=[validation()],
        workers=[{"id": WORKER_ID, "name": "Budi"}],
    )[0]


@pytest.mark.parametrize(
    ("action", "case"),
    [
        ("isolate", merged_case(isolated_at="2026-08-02T11:00:00Z", isolated_by="h")),
        (
            "treatment_start",
            merged_case(
                isolated_at="2026-08-02T11:00:00Z",
                isolated_by="h",
                treatment_started_at="2026-08-02T12:00:00Z",
                treatment_started_by="h",
            ),
        ),
        (
            "treatment_complete",
            merged_case(
                isolated_at="2026-08-02T11:00:00Z",
                isolated_by="h",
                treatment_started_at="2026-08-02T12:00:00Z",
                treatment_started_by="h",
                treatment_completed_at="2026-08-02T13:00:00Z",
                treatment_completed_by="h",
            ),
        ),
    ],
)
def test_transition_is_idempotent_at_or_after_requested_state(
    monkeypatch, action, case
):
    load_case = Mock(return_value=case)
    client = FakeClient([])
    monkeypatch.setattr("app.services.workflow_service._load_case", load_case)
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    result = transition_followup(
        prediction_id=PREDICTION_ID, actor_id="head-1", action=action
    )

    assert result["prediction_id"] == PREDICTION_ID
    assert client.calls == []


def test_transition_start_blocks_uncertain_validation(monkeypatch):
    case = merged_case(isolated_at="2026-08-02T11:00:00Z", isolated_by="h")
    case["validation"] = validation(verdict="uncertain")
    case["verdict"] = "uncertain"
    monkeypatch.setattr(
        "app.services.workflow_service._load_case", Mock(return_value=case)
    )

    with pytest.raises(WorkflowConflictError):
        transition_followup(
            prediction_id=PREDICTION_ID,
            actor_id="head-1",
            action="treatment_start",
        )


def test_transition_writes_token_actor_and_returns_refreshed_case(monkeypatch):
    before = merged_case()
    after = dict(before, isolated_at="2026-08-02T14:00:00+00:00")
    load_case = Mock(side_effect=[before, after])
    client = FakeClient([FakeResponse(200, [followup(isolated_at="now", isolated_by="head-1")])])
    monkeypatch.setattr("app.services.workflow_service._load_case", load_case)
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    result = transition_followup(
        prediction_id=PREDICTION_ID, actor_id="head-from-token", action="isolate"
    )

    assert result["isolated_at"] == "2026-08-02T14:00:00+00:00"
    assert client.calls[0][2]["json"]["isolated_by"] == "head-from-token"
    assert client.calls[0][2]["params"] == {
        "prediction_id": f"eq.{PREDICTION_ID}",
        "isolated_at": "is.null",
        "closed_at": "is.null",
    }


@pytest.mark.parametrize(
    ("action", "timestamp_field", "actor_field"),
    [
        ("isolate", "isolated_at", "isolated_by"),
        ("treatment_start", "treatment_started_at", "treatment_started_by"),
        ("treatment_complete", "treatment_completed_at", "treatment_completed_by"),
    ],
)
def test_transition_losing_cas_reloads_and_preserves_winning_actor(
    monkeypatch, action, timestamp_field, actor_field
):
    before = merged_case()
    if action != "isolate":
        before.update(isolated_at="2026-08-02T11:00:00Z", isolated_by="head-0")
    if action == "treatment_complete":
        before.update(
            treatment_started_at="2026-08-02T12:00:00Z",
            treatment_started_by="head-0",
        )
    after = dict(before)
    after[timestamp_field] = "2026-08-02T14:00:00Z"
    after[actor_field] = "winning-head"
    load_case = Mock(side_effect=[before, after])
    client = FakeClient([FakeResponse(200, [])])
    monkeypatch.setattr("app.services.workflow_service._load_case", load_case)
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    result = transition_followup(
        prediction_id=PREDICTION_ID, actor_id="losing-head", action=action
    )

    assert result[actor_field] == "winning-head"
    assert client.calls[0][2]["params"][timestamp_field] == "is.null"
    assert client.calls[0][2]["params"]["closed_at"] == "is.null"


def test_transition_losing_cas_without_reached_state_is_conflict(monkeypatch):
    before = merged_case()
    load_case = Mock(side_effect=[before, before])
    client = FakeClient([FakeResponse(200, [])])
    monkeypatch.setattr("app.services.workflow_service._load_case", load_case)
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    with pytest.raises(WorkflowConflictError):
        transition_followup(
            prediction_id=PREDICTION_ID, actor_id="head-1", action="isolate"
        )

    assert load_case.call_count == 2


@pytest.mark.parametrize(
    ("action", "reached_field"),
    [
        ("isolate", "isolated_at"),
        ("treatment_start", "treatment_started_at"),
        ("treatment_complete", "treatment_completed_at"),
    ],
)
def test_auto_closed_case_conflicts_when_requested_state_was_never_reached(
    monkeypatch, action, reached_field
):
    case = merged_case()
    case.update(
        closed_at="2026-08-02T13:00:00Z",
        close_reason="corrected_healthy",
        closed_by="vet-1",
    )
    case[reached_field] = None
    monkeypatch.setattr(
        "app.services.workflow_service._load_case", Mock(return_value=case)
    )

    with pytest.raises(WorkflowConflictError):
        transition_followup(
            prediction_id=PREDICTION_ID, actor_id="head-1", action=action
        )


def test_transition_maps_unknown_case_and_database_state_failure(monkeypatch):
    monkeypatch.setattr(
        "app.services.workflow_service._load_case",
        Mock(side_effect=WorkflowNotFoundError("not found")),
    )
    with pytest.raises(WorkflowNotFoundError):
        transition_followup(
            prediction_id=PREDICTION_ID, actor_id="head-1", action="isolate"
        )

    monkeypatch.setattr(
        "app.services.workflow_service._load_case", Mock(return_value=merged_case())
    )
    client = FakeClient(
        [FakeResponse(400, {"code": "23514", "message": "invalid transition"})]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )
    with pytest.raises(WorkflowConflictError):
        transition_followup(
            prediction_id=PREDICTION_ID, actor_id="head-1", action="isolate"
        )


def test_transition_maps_upstream_server_failure_separately_from_state_conflict(
    monkeypatch,
):
    monkeypatch.setattr(
        "app.services.workflow_service._load_case", Mock(return_value=merged_case())
    )
    client = FakeClient(
        [FakeResponse(503, {"code": "PGRST000", "message": "database unavailable"})]
    )
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )

    with pytest.raises(WorkflowUpstreamError):
        transition_followup(
            prediction_id=PREDICTION_ID, actor_id="head-1", action="isolate"
        )


def test_rest_network_and_malformed_payload_map_to_upstream(monkeypatch):
    client = FakeClient([FakeResponse(200, {"not": "a list"})])
    monkeypatch.setattr(
        "app.services.workflow_service.supabase_service._get_client",
        Mock(return_value=client),
    )
    with pytest.raises(WorkflowUpstreamError):
        list_pending_validations()
