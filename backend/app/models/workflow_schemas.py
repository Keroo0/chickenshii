from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


DiseaseClass = Literal[
    "Coccidiosis", "Healthy", "New Castle Disease", "Salmonellosis"
]
ValidationVerdict = Literal["matching", "incorrect", "uncertain"]
WorkflowStatus = Literal[
    "pending_isolation",
    "pending_validation",
    "requires_examination",
    "ready_for_treatment",
    "active_treatment",
    "treatment_completed",
    "auto_closed",
]


class ValidationFields(BaseModel):
    verdict: ValidationVerdict
    corrected_prediction: Optional[DiseaseClass] = None
    note: Optional[str] = Field(default=None, max_length=5000)

    @model_validator(mode="after")
    def validate_correction_shape(self):
        if self.verdict == "incorrect" and self.corrected_prediction is None:
            raise ValueError("incorrect verdict requires corrected_prediction")
        if self.verdict != "incorrect" and self.corrected_prediction is not None:
            raise ValueError("corrected_prediction is only valid for incorrect verdict")
        return self


class ValidationCreateRequest(ValidationFields):
    prediction_id: UUID


class ValidationUpdateRequest(ValidationFields):
    pass


class WorkflowItemResponse(BaseModel):
    prediction_id: UUID
    image_url: Optional[str] = None
    ai_class: Optional[DiseaseClass] = None
    ai_confidence: Optional[float] = None
    ai_probabilities: Optional[Dict[str, float]] = None
    worker_id: Optional[UUID] = None
    worker_name: Optional[str] = None
    created_at: Optional[datetime] = None
    validation: Optional[Dict[str, Any]] = None
    validation_id: Optional[UUID] = None
    verdict: Optional[ValidationVerdict] = None
    corrected_prediction: Optional[DiseaseClass] = None
    veterinarian_id: Optional[UUID] = None
    validation_note: Optional[str] = None
    validation_created_at: Optional[datetime] = None
    validation_updated_at: Optional[datetime] = None
    effective_class: Optional[DiseaseClass] = None
    requires_examination: Optional[bool] = None
    status: Optional[WorkflowStatus] = None
    recommendation_data: Optional[Dict[str, str]] = None
    followup: Optional[Dict[str, Any]] = None
    isolated_at: Optional[datetime] = None
    isolated_by: Optional[UUID] = None
    treatment_started_at: Optional[datetime] = None
    treatment_started_by: Optional[UUID] = None
    treatment_completed_at: Optional[datetime] = None
    treatment_completed_by: Optional[UUID] = None
    closed_at: Optional[datetime] = None
    close_reason: Optional[Literal["corrected_healthy"]] = None
    closed_by: Optional[UUID] = None
    followup_created_at: Optional[datetime] = None
    followup_updated_at: Optional[datetime] = None
    treatment_started: Optional[bool] = None
    editable: Optional[bool] = None


class WorkflowListData(BaseModel):
    items: List[WorkflowItemResponse]
    limit: int = Field(..., ge=1, le=100)
    offset: int = Field(..., ge=0)


class WorkflowListResponse(BaseModel):
    status: Literal["success"] = "success"
    data: WorkflowListData


class WorkflowActionResponse(BaseModel):
    status: Literal["success"] = "success"
    data: WorkflowItemResponse


class ValidationRecordResponse(BaseModel):
    id: UUID
    prediction_id: Optional[UUID] = None
    veterinarian_id: Optional[UUID] = None
    verdict: Optional[ValidationVerdict] = None
    corrected_prediction: Optional[DiseaseClass] = None
    note: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ValidationMutationResponse(BaseModel):
    status: Literal["success"] = "success"
    data: ValidationRecordResponse


class DashboardCountsResponse(BaseModel):
    total_disease_cases: int = Field(..., ge=0)
    pending_isolation: int = Field(..., ge=0)
    pending_validation: int = Field(..., ge=0)
    active_treatment: int = Field(..., ge=0)


class DashboardDataResponse(BaseModel):
    counts: DashboardCountsResponse
    latest_cases: List[WorkflowItemResponse]


class DashboardResponse(BaseModel):
    status: Literal["success"] = "success"
    data: DashboardDataResponse
