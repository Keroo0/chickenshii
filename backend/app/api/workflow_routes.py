from datetime import date, datetime
from typing import Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Header, HTTPException, Query, status

from app.api.routes import _require_role
from app.models.workflow_schemas import (
    DashboardResponse,
    DiseaseClass,
    ValidationCreateRequest,
    ValidationMutationResponse,
    ValidationUpdateRequest,
    ValidationVerdict,
    WorkflowActionResponse,
    WorkflowListResponse,
    WorkflowStatus,
)
from app.services import workflow_service


router = APIRouter()


def _success(data: dict) -> dict:
    return {"status": "success", "data": data}


def _validate_date_range(date_from: Optional[date], date_to: Optional[date]) -> None:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="date_from tidak boleh setelah date_to",
        )


def _raise_workflow_http_error(exc: Exception) -> None:
    if isinstance(exc, workflow_service.WorkflowNotFoundError):
        raise HTTPException(status_code=404, detail="Data workflow tidak ditemukan") from exc
    if isinstance(exc, workflow_service.WorkflowConflictError):
        raise HTTPException(status_code=409, detail="Konflik status workflow") from exc
    if isinstance(exc, workflow_service.WorkflowSemanticError):
        raise HTTPException(status_code=422, detail="Data workflow tidak valid") from exc
    if isinstance(exc, workflow_service.WorkflowUpstreamError):
        raise HTTPException(
            status_code=503, detail="Layanan workflow tidak tersedia"
        ) from exc
    raise exc


@router.get(
    "/api/v1/doctor/validations/pending",
    response_model=WorkflowListResponse,
    response_model_exclude_none=True,
)
def get_pending_validations(
    disease: Optional[DiseaseClass] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    authorization: Optional[str] = Header(None),
):
    _require_role(authorization, "veterinarian")
    _validate_date_range(date_from, date_to)
    try:
        items = workflow_service.list_pending_validations(
            disease=disease,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success({"items": items, "limit": limit, "offset": offset})


@router.get(
    "/api/v1/doctor/validations/history",
    response_model=WorkflowListResponse,
    response_model_exclude_none=True,
)
def get_validation_history(
    verdict: Optional[ValidationVerdict] = Query(None),
    disease: Optional[DiseaseClass] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    authorization: Optional[str] = Header(None),
):
    user = _require_role(authorization, "veterinarian")
    _validate_date_range(date_from, date_to)
    try:
        items = workflow_service.list_validation_history(
            veterinarian_id=str(user["id"]),
            verdict=verdict,
            disease=disease,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success({"items": items, "limit": limit, "offset": offset})


@router.post(
    "/api/v1/doctor/validations",
    status_code=status.HTTP_201_CREATED,
    response_model=ValidationMutationResponse,
    response_model_exclude_none=True,
)
def post_validation(
    request: ValidationCreateRequest,
    authorization: Optional[str] = Header(None),
):
    user = _require_role(authorization, "veterinarian")
    try:
        created = workflow_service.create_validation(
            prediction_id=str(request.prediction_id),
            veterinarian_id=str(user["id"]),
            verdict=request.verdict,
            corrected_prediction=request.corrected_prediction,
            note=request.note,
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success(created)


@router.patch(
    "/api/v1/doctor/validations/{validation_id}",
    response_model=ValidationMutationResponse,
    response_model_exclude_none=True,
)
def patch_validation(
    validation_id: UUID,
    request: ValidationUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    user = _require_role(authorization, "veterinarian")
    try:
        updated = workflow_service.update_validation(
            validation_id=str(validation_id),
            veterinarian_id=str(user["id"]),
            verdict=request.verdict,
            corrected_prediction=request.corrected_prediction,
            note=request.note,
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success(updated)


@router.get(
    "/api/v1/head-worker/dashboard",
    response_model=DashboardResponse,
    response_model_exclude_none=True,
)
def get_head_worker_dashboard(authorization: Optional[str] = Header(None)):
    _require_role(authorization, "head_worker")
    today = datetime.now(ZoneInfo("Asia/Jakarta")).date()
    try:
        dashboard = workflow_service.get_dashboard(today=today)
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success(dashboard)


@router.get(
    "/api/v1/head-worker/follow-ups",
    response_model=WorkflowListResponse,
    response_model_exclude_none=True,
)
def get_followups(
    status_filter: Optional[WorkflowStatus] = Query(None, alias="status"),
    disease: Optional[DiseaseClass] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    authorization: Optional[str] = Header(None),
):
    _require_role(authorization, "head_worker")
    _validate_date_range(date_from, date_to)
    try:
        items = workflow_service.list_followups(
            status_filter=status_filter,
            disease=disease,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success({"items": items, "limit": limit, "offset": offset})


def _transition(prediction_id: UUID, authorization: Optional[str], action: str) -> dict:
    user = _require_role(authorization, "head_worker")
    try:
        item = workflow_service.transition_followup(
            prediction_id=str(prediction_id), actor_id=str(user["id"]), action=action
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success(item)


@router.post(
    "/api/v1/head-worker/follow-ups/{prediction_id}/isolate",
    response_model=WorkflowActionResponse,
    response_model_exclude_none=True,
)
def isolate_case(
    prediction_id: UUID, authorization: Optional[str] = Header(None)
):
    return _transition(prediction_id, authorization, "isolate")


@router.post(
    "/api/v1/head-worker/follow-ups/{prediction_id}/treatment/start",
    response_model=WorkflowActionResponse,
    response_model_exclude_none=True,
)
def start_treatment(
    prediction_id: UUID, authorization: Optional[str] = Header(None)
):
    return _transition(prediction_id, authorization, "treatment_start")


@router.post(
    "/api/v1/head-worker/follow-ups/{prediction_id}/treatment/complete",
    response_model=WorkflowActionResponse,
    response_model_exclude_none=True,
)
def complete_treatment(
    prediction_id: UUID, authorization: Optional[str] = Header(None)
):
    return _transition(prediction_id, authorization, "treatment_complete")
