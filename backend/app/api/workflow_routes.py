from datetime import date, datetime
from typing import Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Header, HTTPException, Query, status

from app.api.routes import _require_role
from app.models.workflow_schemas import (
    DiseaseClass,
    ValidationCreateRequest,
    ValidationUpdateRequest,
    ValidationVerdict,
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


@router.get("/api/v1/doctor/validations/pending")
def get_pending_validations(
    disease: Optional[DiseaseClass] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    authorization: Optional[str] = Header(None),
):
    _require_role(authorization, "veterinarian")
    _validate_date_range(date_from, date_to)
    try:
        items = workflow_service.list_pending_validations(
            disease=disease, date_from=date_from, date_to=date_to
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success({"items": items})


@router.get("/api/v1/doctor/validations/history")
def get_validation_history(
    verdict: Optional[ValidationVerdict] = Query(None),
    disease: Optional[DiseaseClass] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
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
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success({"items": items})


@router.post(
    "/api/v1/doctor/validations", status_code=status.HTTP_201_CREATED
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


@router.patch("/api/v1/doctor/validations/{validation_id}")
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


@router.get("/api/v1/head-worker/dashboard")
def get_head_worker_dashboard(authorization: Optional[str] = Header(None)):
    _require_role(authorization, "head_worker")
    today = datetime.now(ZoneInfo("Asia/Jakarta")).date()
    try:
        dashboard = workflow_service.get_dashboard(today=today)
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success(dashboard)


@router.get("/api/v1/head-worker/follow-ups")
def get_followups(
    status_filter: Optional[WorkflowStatus] = Query(None, alias="status"),
    disease: Optional[DiseaseClass] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
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
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success({"items": items})


def _transition(prediction_id: UUID, authorization: Optional[str], action: str) -> dict:
    user = _require_role(authorization, "head_worker")
    try:
        item = workflow_service.transition_followup(
            prediction_id=str(prediction_id), actor_id=str(user["id"]), action=action
        )
    except workflow_service.WorkflowError as exc:
        _raise_workflow_http_error(exc)
    return _success(item)


@router.post("/api/v1/head-worker/follow-ups/{prediction_id}/isolate")
def isolate_case(
    prediction_id: UUID, authorization: Optional[str] = Header(None)
):
    return _transition(prediction_id, authorization, "isolate")


@router.post("/api/v1/head-worker/follow-ups/{prediction_id}/treatment/start")
def start_treatment(
    prediction_id: UUID, authorization: Optional[str] = Header(None)
):
    return _transition(prediction_id, authorization, "treatment_start")


@router.post("/api/v1/head-worker/follow-ups/{prediction_id}/treatment/complete")
def complete_treatment(
    prediction_id: UUID, authorization: Optional[str] = Header(None)
):
    return _transition(prediction_id, authorization, "treatment_complete")
