from typing import Literal, Optional
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
