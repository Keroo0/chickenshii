import inspect
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.api import workflow_routes
from app.main import app
from app.services import supabase_service, workflow_service


client = TestClient(app)
PREDICTION_ID = "10000000-0000-0000-0000-000000000001"
VALIDATION_ID = "30000000-0000-0000-0000-000000000001"
VET_ID = "40000000-0000-0000-0000-000000000001"
HEAD_ID = "50000000-0000-0000-0000-000000000001"


def auth(role, user_id):
    return {"id": user_id, "app_metadata": {"role": role}}


ROLE_CASES = [
    ("GET", "/api/v1/doctor/validations/pending", None, "veterinarian"),
    ("GET", "/api/v1/doctor/validations/history", None, "veterinarian"),
    (
        "POST",
        "/api/v1/doctor/validations",
        {
            "prediction_id": PREDICTION_ID,
            "verdict": "matching",
            "corrected_prediction": None,
        },
        "veterinarian",
    ),
    (
        "PATCH",
        f"/api/v1/doctor/validations/{VALIDATION_ID}",
        {"verdict": "matching", "corrected_prediction": None},
        "veterinarian",
    ),
    ("GET", "/api/v1/head-worker/dashboard", None, "head_worker"),
    ("GET", "/api/v1/head-worker/follow-ups", None, "head_worker"),
    (
        "POST",
        f"/api/v1/head-worker/follow-ups/{PREDICTION_ID}/isolate",
        None,
        "head_worker",
    ),
    (
        "POST",
        f"/api/v1/head-worker/follow-ups/{PREDICTION_ID}/treatment/start",
        None,
        "head_worker",
    ),
    (
        "POST",
        f"/api/v1/head-worker/follow-ups/{PREDICTION_ID}/treatment/complete",
        None,
        "head_worker",
    ),
]


@pytest.mark.parametrize(("method", "path", "body", "required_role"), ROLE_CASES)
def test_every_workflow_endpoint_enforces_its_role(
    monkeypatch, method, path, body, required_role
):
    guard = Mock(
        side_effect=supabase_service.AuthorizationError("wrong role")
    )
    monkeypatch.setattr(supabase_service, "require_role", guard)

    response = client.request(
        method, path, headers={"Authorization": "Bearer wrong-role"}, json=body
    )

    assert response.status_code == 403
    guard.assert_called_once_with("wrong-role", required_role)


def test_pending_endpoint_forwards_whitelisted_filters(monkeypatch):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("veterinarian", VET_ID))
    )
    service = Mock(return_value=[{"prediction_id": PREDICTION_ID}])
    monkeypatch.setattr(workflow_service, "list_pending_validations", service)

    response = client.get(
        "/api/v1/doctor/validations/pending"
        "?disease=Coccidiosis&date_from=2026-08-01&date_to=2026-08-02",
        headers={"Authorization": "Bearer vet"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "success",
        "data": {"items": [{"prediction_id": PREDICTION_ID}]},
    }
    assert service.call_args.kwargs["disease"] == "Coccidiosis"
    assert str(service.call_args.kwargs["date_from"]) == "2026-08-01"


def test_history_uses_token_user_and_forwards_filters(monkeypatch):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("veterinarian", VET_ID))
    )
    service = Mock(return_value=[{"validation_id": VALIDATION_ID}])
    monkeypatch.setattr(workflow_service, "list_validation_history", service)

    response = client.get(
        "/api/v1/doctor/validations/history"
        "?verdict=matching&disease=Coccidiosis&date_from=2026-08-01&date_to=2026-08-02",
        headers={"Authorization": "Bearer vet"},
    )

    assert response.status_code == 200
    assert service.call_args.kwargs["veterinarian_id"] == VET_ID
    assert service.call_args.kwargs["verdict"] == "matching"


def test_create_validation_uses_actor_from_token_never_body(monkeypatch):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("veterinarian", VET_ID))
    )
    service = Mock(return_value={"id": VALIDATION_ID, "veterinarian_id": VET_ID})
    monkeypatch.setattr(workflow_service, "create_validation", service)

    response = client.post(
        "/api/v1/doctor/validations",
        headers={"Authorization": "Bearer vet"},
        json={
            "prediction_id": PREDICTION_ID,
            "verdict": "incorrect",
            "corrected_prediction": "Healthy",
            "note": "AI false positive",
            "veterinarian_id": "attacker-controlled",
        },
    )

    assert response.status_code == 201
    assert response.json()["data"]["veterinarian_id"] == VET_ID
    assert service.call_args.kwargs["veterinarian_id"] == VET_ID


@pytest.mark.parametrize(
    "body",
    [
        {"verdict": "incorrect", "corrected_prediction": None},
        {"verdict": "matching", "corrected_prediction": "Healthy"},
        {"verdict": "uncertain", "corrected_prediction": "Coccidiosis"},
    ],
)
def test_validation_schema_rejects_invalid_correction_shapes(monkeypatch, body):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("veterinarian", VET_ID))
    )
    service = Mock()
    monkeypatch.setattr(workflow_service, "update_validation", service)

    response = client.patch(
        f"/api/v1/doctor/validations/{VALIDATION_ID}",
        headers={"Authorization": "Bearer vet"},
        json=body,
    )

    assert response.status_code == 422
    service.assert_not_called()


def test_update_validation_uses_owned_actor(monkeypatch):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("veterinarian", VET_ID))
    )
    service = Mock(return_value={"id": VALIDATION_ID, "verdict": "uncertain"})
    monkeypatch.setattr(workflow_service, "update_validation", service)

    response = client.patch(
        f"/api/v1/doctor/validations/{VALIDATION_ID}",
        headers={"Authorization": "Bearer vet"},
        json={"verdict": "uncertain", "corrected_prediction": None, "note": "recheck"},
    )

    assert response.status_code == 200
    assert service.call_args.kwargs["veterinarian_id"] == VET_ID
    assert service.call_args.kwargs["validation_id"] == VALIDATION_ID


@pytest.mark.parametrize(
    ("error", "expected_status"),
    [
        (workflow_service.WorkflowNotFoundError("secret"), 404),
        (workflow_service.WorkflowConflictError("secret"), 409),
        (workflow_service.WorkflowSemanticError("secret"), 422),
        (workflow_service.WorkflowUpstreamError("secret"), 503),
    ],
)
def test_doctor_writes_map_service_failures_without_leaking_details(
    monkeypatch, error, expected_status
):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("veterinarian", VET_ID))
    )
    monkeypatch.setattr(
        workflow_service, "update_validation", Mock(side_effect=error)
    )

    response = client.patch(
        f"/api/v1/doctor/validations/{VALIDATION_ID}",
        headers={"Authorization": "Bearer vet"},
        json={"verdict": "matching", "corrected_prediction": None},
    )

    assert response.status_code == expected_status
    assert "secret" not in response.text


def test_duplicate_create_maps_to_409(monkeypatch):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("veterinarian", VET_ID))
    )
    monkeypatch.setattr(
        workflow_service,
        "create_validation",
        Mock(side_effect=workflow_service.WorkflowConflictError("duplicate")),
    )
    response = client.post(
        "/api/v1/doctor/validations",
        headers={"Authorization": "Bearer vet"},
        json={
            "prediction_id": PREDICTION_ID,
            "verdict": "matching",
            "corrected_prediction": None,
        },
    )
    assert response.status_code == 409


def test_dashboard_and_followups_happy_paths(monkeypatch):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("head_worker", HEAD_ID))
    )
    dashboard = Mock(
        return_value={
            "counts": {
                "total_disease_cases": 1,
                "pending_isolation": 1,
                "pending_validation": 1,
                "active_treatment": 0,
            },
            "latest_cases": [{"prediction_id": PREDICTION_ID}],
        }
    )
    followups = Mock(return_value=[{"prediction_id": PREDICTION_ID}])
    monkeypatch.setattr(workflow_service, "get_dashboard", dashboard)
    monkeypatch.setattr(workflow_service, "list_followups", followups)

    dashboard_response = client.get(
        "/api/v1/head-worker/dashboard",
        headers={"Authorization": "Bearer head"},
    )
    followup_response = client.get(
        "/api/v1/head-worker/follow-ups"
        "?status=pending_isolation&disease=Coccidiosis"
        "&date_from=2026-08-01&date_to=2026-08-02",
        headers={"Authorization": "Bearer head"},
    )

    assert dashboard_response.status_code == 200
    assert dashboard_response.json()["data"]["counts"]["total_disease_cases"] == 1
    assert followup_response.status_code == 200
    assert followups.call_args.kwargs["status_filter"] == "pending_isolation"
    assert followups.call_args.kwargs["disease"] == "Coccidiosis"


@pytest.mark.parametrize(
    ("suffix", "action"),
    [
        ("isolate", "isolate"),
        ("treatment/start", "treatment_start"),
        ("treatment/complete", "treatment_complete"),
    ],
)
def test_head_worker_actions_use_token_actor(monkeypatch, suffix, action):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("head_worker", HEAD_ID))
    )
    service = Mock(return_value={"prediction_id": PREDICTION_ID, "status": "ok"})
    monkeypatch.setattr(workflow_service, "transition_followup", service)

    response = client.post(
        f"/api/v1/head-worker/follow-ups/{PREDICTION_ID}/{suffix}",
        headers={"Authorization": "Bearer head"},
    )

    assert response.status_code == 200
    service.assert_called_once_with(
        prediction_id=PREDICTION_ID, actor_id=HEAD_ID, action=action
    )


@pytest.mark.parametrize(
    ("error", "expected_status"),
    [
        (workflow_service.WorkflowNotFoundError("secret"), 404),
        (workflow_service.WorkflowConflictError("secret"), 409),
        (workflow_service.WorkflowUpstreamError("secret"), 503),
    ],
)
def test_head_worker_actions_map_failures(monkeypatch, error, expected_status):
    monkeypatch.setattr(
        supabase_service, "require_role", Mock(return_value=auth("head_worker", HEAD_ID))
    )
    monkeypatch.setattr(
        workflow_service, "transition_followup", Mock(side_effect=error)
    )
    response = client.post(
        f"/api/v1/head-worker/follow-ups/{PREDICTION_ID}/treatment/start",
        headers={"Authorization": "Bearer head"},
    )
    assert response.status_code == expected_status
    assert "secret" not in response.text


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/doctor/validations/pending?disease=invalid",
        "/api/v1/doctor/validations/history?verdict=invalid",
        "/api/v1/head-worker/follow-ups?status=invalid",
        "/api/v1/head-worker/follow-ups?date_from=not-a-date",
    ],
)
def test_query_filters_are_schema_whitelisted(monkeypatch, path):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(return_value=auth("veterinarian", VET_ID)),
    )
    response = client.get(path, headers={"Authorization": "Bearer token"})
    assert response.status_code == 422


def test_workflow_handlers_are_sync_for_threadpool_execution():
    handlers = [
        workflow_routes.get_pending_validations,
        workflow_routes.get_validation_history,
        workflow_routes.post_validation,
        workflow_routes.patch_validation,
        workflow_routes.get_head_worker_dashboard,
        workflow_routes.get_followups,
        workflow_routes.isolate_case,
        workflow_routes.start_treatment,
        workflow_routes.complete_treatment,
    ]
    assert all(not inspect.iscoroutinefunction(handler) for handler in handlers)
