"""Role workflow domain logic and Supabase REST access.

The merge/status helpers are deliberately pure.  HTTP routes use the small
service functions lower in this module so list requests remain bounded batch
reads instead of one query per prediction.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Iterable, Optional
from zoneinfo import ZoneInfo

import httpx

from app.services import supabase_service
from app.utils.knowledge_base import KNOWLEDGE_BASE


DISEASE_CLASSES = (
    "Coccidiosis",
    "Healthy",
    "New Castle Disease",
    "Salmonellosis",
)
VERDICTS = ("matching", "incorrect", "uncertain")
JAKARTA_TIMEZONE = ZoneInfo("Asia/Jakarta")
DEFAULT_PAGE_LIMIT = 50
MAX_PAGE_LIMIT = 100
DEPENDENT_QUERY_CHUNK_SIZE = 100


class WorkflowError(RuntimeError):
    """Base error for workflow operations."""


class WorkflowNotFoundError(WorkflowError):
    """A visible, active workflow case was not found."""


class WorkflowConflictError(WorkflowError):
    """A concurrent writer or invalid workflow transition won the race."""


class WorkflowSemanticError(WorkflowError):
    """The requested validation shape is semantically invalid."""


class WorkflowUpstreamError(WorkflowError):
    """Supabase REST could not complete a workflow operation."""


def effective_class(ai_class: str, validation: Optional[dict]) -> str:
    if validation and validation.get("verdict") == "incorrect":
        return validation.get("corrected_prediction") or ai_class
    return ai_class


def derive_status(followup: dict, validation: Optional[dict]) -> str:
    if followup.get("closed_at"):
        return "auto_closed"
    if followup.get("treatment_completed_at"):
        return "treatment_completed"
    if followup.get("treatment_started_at"):
        return "active_treatment"
    if validation and validation.get("verdict") == "uncertain":
        return "requires_examination"
    if not followup.get("isolated_at"):
        return "pending_isolation"
    if not validation:
        return "pending_validation"
    return "ready_for_treatment"


def _probabilities(value: Any) -> dict:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        import json

        try:
            parsed = json.loads(value)
        except (TypeError, ValueError):
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def _recommendation(class_name: str) -> dict:
    knowledge = KNOWLEDGE_BASE.get(class_name) or {}
    return {
        "description": knowledge.get("description", ""),
        "cause": knowledge.get("cause", ""),
        "immediate_action": knowledge.get("immediate_action", ""),
    }


def merge_workflow_rows(
    *,
    predictions: Iterable[dict],
    followups: Iterable[dict],
    validations: Iterable[dict],
    workers: Iterable[dict],
) -> list[dict]:
    followup_by_prediction = {
        str(row["prediction_id"]): row for row in followups if row.get("prediction_id")
    }
    validation_by_prediction = {
        str(row["prediction_id"]): row
        for row in validations
        if row and row.get("prediction_id")
    }
    worker_names = {
        str(row["id"]): row.get("name") for row in workers if row.get("id")
    }
    items: list[dict] = []

    for prediction in predictions:
        prediction_id = str(prediction.get("id") or "")
        followup = followup_by_prediction.get(prediction_id)
        ai_class = prediction.get("prediction")
        if (
            not prediction_id
            or not followup
            or prediction.get("deleted_at") is not None
            or ai_class == "Healthy"
        ):
            continue

        validation = validation_by_prediction.get(prediction_id)
        resolved_class = effective_class(ai_class, validation)
        status = derive_status(followup, validation)
        followup_summary = {
            key: followup.get(key)
            for key in (
                "isolated_at",
                "isolated_by",
                "treatment_started_at",
                "treatment_started_by",
                "treatment_completed_at",
                "treatment_completed_by",
                "closed_at",
                "close_reason",
                "closed_by",
                "created_at",
                "updated_at",
            )
        }
        item = {
            "prediction_id": prediction_id,
            "image_url": prediction.get("image_url"),
            "ai_class": ai_class,
            "ai_confidence": prediction.get("confidence"),
            "ai_probabilities": _probabilities(prediction.get("all_predictions")),
            "worker_id": prediction.get("worker_id"),
            "worker_name": worker_names.get(str(prediction.get("worker_id"))),
            "created_at": prediction.get("created_at"),
            "validation": validation,
            "validation_id": validation.get("id") if validation else None,
            "verdict": validation.get("verdict") if validation else None,
            "corrected_prediction": (
                validation.get("corrected_prediction") if validation else None
            ),
            "veterinarian_id": (
                validation.get("veterinarian_id") if validation else None
            ),
            "validation_note": validation.get("note") if validation else None,
            "validation_created_at": (
                validation.get("created_at") if validation else None
            ),
            "validation_updated_at": (
                validation.get("updated_at") if validation else None
            ),
            "effective_class": resolved_class,
            "requires_examination": bool(
                validation and validation.get("verdict") == "uncertain"
            ),
            "status": status,
            "recommendation_data": _recommendation(resolved_class),
            "followup": followup_summary,
            **{
                key: value
                for key, value in followup_summary.items()
                if key not in ("created_at", "updated_at")
            },
            "followup_created_at": followup.get("created_at"),
            "followup_updated_at": followup.get("updated_at"),
            "treatment_started": bool(followup.get("treatment_started_at")),
            "editable": not bool(followup.get("treatment_started_at")),
        }
        items.append(item)

    items.sort(key=lambda row: row.get("created_at") or "", reverse=True)
    return items


def _as_datetime(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        parsed = value
    elif not isinstance(value, str) or not value:
        return None
    else:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def local_day_utc_bounds(local_date: date) -> tuple[str, str]:
    local_start = datetime.combine(local_date, time.min, tzinfo=JAKARTA_TIMEZONE)
    local_end = datetime.combine(
        local_date + timedelta(days=1), time.min, tzinfo=JAKARTA_TIMEZONE
    )
    return (
        local_start.astimezone(timezone.utc).isoformat(),
        local_end.astimezone(timezone.utc).isoformat(),
    )


def build_dashboard(
    items: Iterable[dict], *, today: date, latest_limit: int = 5
) -> dict:
    start_iso, end_iso = local_day_utc_bounds(today)
    start = datetime.fromisoformat(start_iso)
    end = datetime.fromisoformat(end_iso)
    todays_items = [
        row
        for row in items
        if (created_at := _as_datetime(row.get("created_at"))) is not None
        and start <= created_at < end
    ]
    counts = {
        "total_disease_cases": len(todays_items),
        "pending_isolation": sum(
            1
            for row in todays_items
            if not row.get("isolated_at") and not row.get("closed_at")
        ),
        "pending_validation": sum(
            1
            for row in todays_items
            if not row.get("validation") and not row.get("closed_at")
        ),
        "active_treatment": sum(
            1
            for row in todays_items
            if row.get("treatment_started_at")
            and not row.get("treatment_completed_at")
            and not row.get("closed_at")
        ),
    }
    return {"counts": counts, "latest_cases": todays_items[:latest_limit]}


FOLLOWUP_FIELDS = (
    "prediction_id,isolated_at,isolated_by,treatment_started_at,"
    "treatment_started_by,treatment_completed_at,treatment_completed_by,"
    "closed_at,close_reason,closed_by,created_at,updated_at"
)
PREDICTION_FIELDS = (
    "id,image_url,prediction,confidence,all_predictions,worker_id,created_at,deleted_at"
)
VALIDATION_FIELDS = (
    "id,prediction_id,veterinarian_id,verdict,corrected_prediction,note,"
    "created_at,updated_at"
)


def _json_list(response: Any) -> list[dict]:
    try:
        payload = response.json()
    except (TypeError, ValueError) as exc:
        raise WorkflowUpstreamError("invalid Supabase response") from exc
    if not isinstance(payload, list) or any(not isinstance(row, dict) for row in payload):
        raise WorkflowUpstreamError("invalid Supabase response")
    return payload


def _read(client: httpx.Client, path: str, *, params: Any) -> list[dict]:
    try:
        response = client.get(path, params=params)
    except httpx.HTTPError as exc:
        raise WorkflowUpstreamError("Supabase request failed") from exc
    if response.status_code < 200 or response.status_code >= 300:
        raise WorkflowUpstreamError("Supabase request failed")
    return _json_list(response)


def _error_payload(response: Any) -> dict:
    try:
        payload = response.json()
    except (TypeError, ValueError):
        return {}
    return payload if isinstance(payload, dict) else {}


def _write(
    client: httpx.Client,
    method: str,
    path: str,
    *,
    payload: dict,
    params: Any = None,
    operation: str,
) -> list[dict]:
    try:
        response = getattr(client, method)(path, json=payload, params=params)
    except httpx.HTTPError as exc:
        raise WorkflowUpstreamError("Supabase request failed") from exc
    if 200 <= response.status_code < 300:
        return _json_list(response)

    error = _error_payload(response)
    code = str(error.get("code") or "")
    message = str(error.get("message") or "").casefold()
    if operation == "validation_create":
        if response.status_code == 409 or code == "23505":
            raise WorkflowConflictError("prediction already validated")
        if code == "23514" or response.status_code in (400, 422):
            raise WorkflowSemanticError("invalid validation")
    elif operation == "validation_update":
        if "treatment" in message and ("started" in message or "start" in message):
            raise WorkflowConflictError("validation is locked")
        if response.status_code == 409:
            raise WorkflowConflictError("validation update conflict")
        if code == "23514" or response.status_code in (400, 422):
            raise WorkflowSemanticError("invalid validation")
    elif operation == "transition":
        if response.status_code in (400, 409, 422) or code.startswith("23"):
            raise WorkflowConflictError("invalid workflow transition")
    raise WorkflowUpstreamError("Supabase request failed")


def _date_bounds(date_from: Optional[date], date_to: Optional[date]) -> list[tuple[str, str]]:
    params: list[tuple[str, str]] = []
    if date_from:
        start = local_day_utc_bounds(date_from)[0]
        params.append(("created_at", f"gte.{start}"))
    if date_to:
        exclusive_end = local_day_utc_bounds(date_to)[1]
        params.append(("created_at", f"lt.{exclusive_end}"))
    return params


def _in_filter(values: Iterable[Any]) -> str:
    return "in.(" + ",".join(str(value) for value in values) + ")"


def _read_in_chunks(
    client: httpx.Client,
    path: str,
    *,
    id_column: str,
    ids: Iterable[Any],
    select: str,
    extra_params: Optional[list[tuple[str, str]]] = None,
) -> list[dict]:
    values = list(dict.fromkeys(str(value) for value in ids))
    rows: list[dict] = []
    for start in range(0, len(values), DEPENDENT_QUERY_CHUNK_SIZE):
        chunk = values[start : start + DEPENDENT_QUERY_CHUNK_SIZE]
        if extra_params:
            params: Any = [
                ("select", select),
                (id_column, _in_filter(chunk)),
                *extra_params,
                ("limit", str(DEPENDENT_QUERY_CHUNK_SIZE)),
            ]
        else:
            params = {
                "select": select,
                id_column: _in_filter(chunk),
                "limit": str(DEPENDENT_QUERY_CHUNK_SIZE),
            }
        rows.extend(_read(client, path, params=params))
    return rows


def _prediction_extra_params(
    *,
    ai_disease: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    created_at_bounds: Optional[tuple[str, str]] = None,
) -> list[tuple[str, str]]:
    params: list[tuple[str, str]] = [
        ("deleted_at", "is.null"),
        ("prediction", "neq.Healthy"),
        ("order", "created_at.desc"),
    ]
    if ai_disease:
        params.append(("prediction", f"eq.{ai_disease}"))
    if created_at_bounds:
        params.extend(
            [
                ("created_at", f"gte.{created_at_bounds[0]}"),
                ("created_at", f"lt.{created_at_bounds[1]}"),
            ]
        )
    else:
        params.extend(_date_bounds(date_from, date_to))
    return params


def _load_followup_batch(
    client: httpx.Client,
    followups: list[dict],
    *,
    ai_disease: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    created_at_bounds: Optional[tuple[str, str]] = None,
) -> list[dict]:
    prediction_ids = [row["prediction_id"] for row in followups]
    predictions = _read_in_chunks(
        client,
        "/predictions",
        id_column="id",
        ids=prediction_ids,
        select=PREDICTION_FIELDS,
        extra_params=_prediction_extra_params(
            ai_disease=ai_disease,
            date_from=date_from,
            date_to=date_to,
            created_at_bounds=created_at_bounds,
        ),
    )
    visible_ids = [row["id"] for row in predictions]
    if not visible_ids:
        return []
    validations = _read_in_chunks(
        client,
        "/prediction_validations",
        id_column="prediction_id",
        ids=visible_ids,
        select=VALIDATION_FIELDS,
    )
    workers = _read_in_chunks(
        client,
        "/workers",
        id_column="id",
        ids=[row["worker_id"] for row in predictions if row.get("worker_id")],
        select="id,name",
    )
    visible_id_set = {str(value) for value in visible_ids}
    return merge_workflow_rows(
        predictions=predictions,
        followups=[
            row
            for row in followups
            if str(row["prediction_id"]) in visible_id_set
        ],
        validations=validations,
        workers=workers,
    )


def _load_prediction_batch(
    client: httpx.Client, predictions: list[dict]
) -> list[dict]:
    prediction_ids = [row["id"] for row in predictions]
    followups = _read_in_chunks(
        client,
        "/prediction_followups",
        id_column="prediction_id",
        ids=prediction_ids,
        select=FOLLOWUP_FIELDS,
    )
    workflow_ids = {str(row["prediction_id"]) for row in followups}
    workflow_predictions = [
        row for row in predictions if str(row["id"]) in workflow_ids
    ]
    if not workflow_predictions:
        return []
    visible_ids = [row["id"] for row in workflow_predictions]
    validations = _read_in_chunks(
        client,
        "/prediction_validations",
        id_column="prediction_id",
        ids=visible_ids,
        select=VALIDATION_FIELDS,
    )
    workers = _read_in_chunks(
        client,
        "/workers",
        id_column="id",
        ids=[
            row["worker_id"]
            for row in workflow_predictions
            if row.get("worker_id")
        ],
        select="id,name",
    )
    return merge_workflow_rows(
        predictions=workflow_predictions,
        followups=followups,
        validations=validations,
        workers=workers,
    )


def _validate_page(limit: int, offset: int) -> None:
    if limit < 1 or limit > MAX_PAGE_LIMIT or offset < 0:
        raise WorkflowSemanticError("invalid pagination")


def _scan_followup_items(
    *,
    limit: int,
    offset: int,
    predicate,
    ai_disease: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    created_at_bounds: Optional[tuple[str, str]] = None,
    collect_all: bool = False,
) -> list[dict]:
    _validate_page(limit, offset)
    client = supabase_service._get_client()
    target_count = offset + limit
    matched: list[dict] = []
    scan_offset = 0
    while collect_all or len(matched) < target_count:
        params = [
            ("select", FOLLOWUP_FIELDS),
            ("order", "created_at.desc"),
            ("limit", str(MAX_PAGE_LIMIT)),
            ("offset", str(scan_offset)),
        ]
        followups = _read(client, "/prediction_followups", params=params)
        if not followups:
            break
        items = _load_followup_batch(
            client,
            followups,
            ai_disease=ai_disease,
            date_from=date_from,
            date_to=date_to,
            created_at_bounds=created_at_bounds,
        )
        matched.extend(item for item in items if predicate(item))
        if len(followups) < MAX_PAGE_LIMIT:
            break
        scan_offset += len(followups)
    return matched if collect_all else matched[offset:target_count]


def _load_workflow_rows(
    *,
    prediction_id: Optional[str] = None,
    ai_disease: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    created_at_bounds: Optional[tuple[str, str]] = None,
) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    client = supabase_service._get_client()
    followup_params: list[tuple[str, str]] = [
        ("select", FOLLOWUP_FIELDS),
        ("limit", "1" if prediction_id else str(MAX_PAGE_LIMIT)),
    ]
    if prediction_id:
        followup_params.append(("prediction_id", f"eq.{prediction_id}"))
    followups = _read(client, "/prediction_followups", params=followup_params)
    prediction_ids = [row["prediction_id"] for row in followups]
    if not prediction_ids:
        return [], [], [], []

    predictions = _read_in_chunks(
        client,
        "/predictions",
        id_column="id",
        ids=prediction_ids,
        select=PREDICTION_FIELDS,
        extra_params=_prediction_extra_params(
            ai_disease=ai_disease,
            date_from=date_from,
            date_to=date_to,
            created_at_bounds=created_at_bounds,
        ),
    )
    visible_ids = [row["id"] for row in predictions]
    if not visible_ids:
        return [], [], [], []

    validations = _read_in_chunks(
        client,
        "/prediction_validations",
        id_column="prediction_id",
        ids=visible_ids,
        select=VALIDATION_FIELDS,
    )
    worker_ids = sorted(
        {row.get("worker_id") for row in predictions if row.get("worker_id")}
    )
    workers = (
        _read_in_chunks(
            client,
            "/workers",
            id_column="id",
            ids=worker_ids,
            select="id,name",
        )
        if worker_ids
        else []
    )
    visible_id_set = {str(value) for value in visible_ids}
    return (
        predictions,
        [row for row in followups if str(row["prediction_id"]) in visible_id_set],
        validations,
        workers,
    )


def list_pending_validations(
    *,
    disease: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = DEFAULT_PAGE_LIMIT,
    offset: int = 0,
) -> list[dict]:
    return _scan_followup_items(
        limit=limit,
        offset=offset,
        predicate=lambda item: item.get("validation") is None,
        ai_disease=disease,
        date_from=date_from,
        date_to=date_to,
    )


def list_validation_history(
    *,
    veterinarian_id: str,
    verdict: Optional[str] = None,
    disease: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = DEFAULT_PAGE_LIMIT,
    offset: int = 0,
) -> list[dict]:
    _validate_page(limit, offset)
    client = supabase_service._get_client()
    target_count = offset + limit
    matched: list[dict] = []
    scan_offset = 0
    while len(matched) < target_count:
        validation_params: list[tuple[str, str]] = [
            ("select", VALIDATION_FIELDS),
            ("veterinarian_id", f"eq.{veterinarian_id}"),
            ("order", "updated_at.desc"),
        ]
        if verdict:
            validation_params.append(("verdict", f"eq.{verdict}"))
        validation_params.extend(
            [
                ("limit", str(MAX_PAGE_LIMIT)),
                ("offset", str(scan_offset)),
            ]
        )
        validations = _read(
            client, "/prediction_validations", params=validation_params
        )
        if not validations:
            break
        prediction_ids = [row["prediction_id"] for row in validations]
        followups = _read_in_chunks(
            client,
            "/prediction_followups",
            id_column="prediction_id",
            ids=prediction_ids,
            select=FOLLOWUP_FIELDS,
        )
        predictions = _read_in_chunks(
            client,
            "/predictions",
            id_column="id",
            ids=prediction_ids,
            select=PREDICTION_FIELDS,
            extra_params=_prediction_extra_params(
                date_from=date_from, date_to=date_to
            ),
        )
        workers = _read_in_chunks(
            client,
            "/workers",
            id_column="id",
            ids=[row["worker_id"] for row in predictions if row.get("worker_id")],
            select="id,name",
        )
        items = merge_workflow_rows(
            predictions=predictions,
            followups=followups,
            validations=validations,
            workers=workers,
        )
        items.sort(
            key=lambda row: (row.get("validation") or {}).get("updated_at") or "",
            reverse=True,
        )
        matched.extend(
            item
            for item in items
            if not disease or item["effective_class"] == disease
        )
        if len(validations) < MAX_PAGE_LIMIT:
            break
        scan_offset += len(validations)
    return matched[offset:target_count]


def _validate_validation_shape(verdict: str, corrected_prediction: Optional[str]) -> None:
    if verdict not in VERDICTS:
        raise WorkflowSemanticError("invalid verdict")
    if verdict == "incorrect":
        if corrected_prediction not in DISEASE_CLASSES:
            raise WorkflowSemanticError("incorrect verdict requires correction")
    elif corrected_prediction is not None:
        raise WorkflowSemanticError("correction is only allowed when incorrect")


def create_validation(
    *,
    prediction_id: str,
    veterinarian_id: str,
    verdict: str,
    corrected_prediction: Optional[str],
    note: Optional[str],
) -> dict:
    _validate_validation_shape(verdict, corrected_prediction)
    case = _load_case(prediction_id)
    if case.get("validation"):
        raise WorkflowConflictError("prediction already validated")
    client = supabase_service._get_client()
    rows = _write(
        client,
        "post",
        "/prediction_validations",
        payload={
            "prediction_id": prediction_id,
            "veterinarian_id": veterinarian_id,
            "verdict": verdict,
            "corrected_prediction": corrected_prediction,
            "note": note,
        },
        operation="validation_create",
    )
    if len(rows) != 1:
        raise WorkflowUpstreamError("invalid Supabase response")
    return rows[0]


def update_validation(
    *,
    validation_id: str,
    veterinarian_id: str,
    verdict: str,
    corrected_prediction: Optional[str],
    note: Optional[str],
) -> dict:
    _validate_validation_shape(verdict, corrected_prediction)
    client = supabase_service._get_client()
    owned = _read(
        client,
        "/prediction_validations",
        params={
            "select": VALIDATION_FIELDS,
            "id": f"eq.{validation_id}",
            "veterinarian_id": f"eq.{veterinarian_id}",
            "limit": "1",
        },
    )
    if not owned:
        raise WorkflowNotFoundError("validation not found")
    rows = _write(
        client,
        "patch",
        "/prediction_validations",
        payload={
            "verdict": verdict,
            "corrected_prediction": corrected_prediction,
            "note": note,
        },
        params={
            "id": f"eq.{validation_id}",
            "veterinarian_id": f"eq.{veterinarian_id}",
        },
        operation="validation_update",
    )
    if not rows:
        raise WorkflowNotFoundError("validation not found")
    return rows[0]


def list_followups(
    *,
    status_filter: Optional[str] = None,
    disease: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = DEFAULT_PAGE_LIMIT,
    offset: int = 0,
) -> list[dict]:
    return _scan_followup_items(
        limit=limit,
        offset=offset,
        predicate=lambda item: (
            (not status_filter or item["status"] == status_filter)
            and (not disease or item["effective_class"] == disease)
        ),
        date_from=date_from,
        date_to=date_to,
    )


def get_dashboard(*, today: date) -> dict:
    client = supabase_service._get_client()
    start, end = local_day_utc_bounds(today)
    items: list[dict] = []
    scan_offset = 0
    while True:
        params = [
            ("select", PREDICTION_FIELDS),
            ("deleted_at", "is.null"),
            ("prediction", "neq.Healthy"),
            ("created_at", f"gte.{start}"),
            ("created_at", f"lt.{end}"),
            ("order", "created_at.desc"),
            ("limit", str(MAX_PAGE_LIMIT)),
            ("offset", str(scan_offset)),
        ]
        predictions = _read(client, "/predictions", params=params)
        if not predictions:
            break
        items.extend(_load_prediction_batch(client, predictions))
        if len(predictions) < MAX_PAGE_LIMIT:
            break
        scan_offset += len(predictions)
    return build_dashboard(items, today=today, latest_limit=5)


def _load_case(prediction_id: str) -> dict:
    predictions, followups, validations, workers = _load_workflow_rows(
        prediction_id=prediction_id
    )
    items = merge_workflow_rows(
        predictions=predictions,
        followups=followups,
        validations=validations,
        workers=workers,
    )
    if not items:
        raise WorkflowNotFoundError("workflow case not found")
    return items[0]


def transition_followup(
    *, prediction_id: str, actor_id: str, action: str
) -> dict:
    case = _load_case(prediction_id)
    transition_fields = {
        "isolate": ("isolated_at", "isolated_by"),
        "treatment_start": ("treatment_started_at", "treatment_started_by"),
        "treatment_complete": (
            "treatment_completed_at",
            "treatment_completed_by",
        ),
    }
    if action not in transition_fields:
        raise WorkflowSemanticError("unknown transition")
    timestamp_field, actor_field = transition_fields[action]
    if case.get(timestamp_field):
        return case
    if case.get("closed_at"):
        raise WorkflowConflictError("closed workflow cannot advance")
    if action == "treatment_start" and case.get("verdict") == "uncertain":
        raise WorkflowConflictError("uncertain validation requires examination")

    now = datetime.now(timezone.utc).isoformat()
    cas_params = {
        "prediction_id": f"eq.{prediction_id}",
        timestamp_field: "is.null",
        "closed_at": "is.null",
    }
    if action == "treatment_start":
        cas_params["treatment_completed_at"] = "is.null"
    client = supabase_service._get_client()
    rows = _write(
        client,
        "patch",
        "/prediction_followups",
        payload={timestamp_field: now, actor_field: actor_id},
        params=cas_params,
        operation="transition",
    )
    if not rows:
        refreshed = _load_case(prediction_id)
        if refreshed.get(timestamp_field):
            return refreshed
        raise WorkflowConflictError("workflow transition conflict")
    return _load_case(prediction_id)
