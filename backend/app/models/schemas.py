from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator
from typing import Dict, Literal, Optional


class RecommendationData(BaseModel):
    description: str = Field(..., description="Penjelasan medis penyakit")
    cause: str = Field(..., description="Penyebab penyakit")
    immediate_action: str = Field(..., description="Tindakan penanganan awal")


class PredictionResponse(BaseModel):
    prediction: str = Field(..., alias="class_name", description="Nama penyakit yang terdeteksi")
    confidence: float = Field(..., description="Persentase tingkat keyakinan AI (0-100)")
    confidence_threshold: float = Field(..., description="Batas minimal keyakinan sebelum memunculkan peringatan (Low Confidence)")
    all_predictions: Dict[str, float] = Field(..., alias="probabilities", description="Distribusi probabilitas dari keempat kelas")
    recommendation_data: RecommendationData = Field(..., description="Data referensi statis untuk panduan pengguna")
    note: str = Field(default="Hasil ini merupakan dugaan awal dari model AI dan bukan diagnosis final dokter hewan. Segera konsultasikan dengan dokter hewan untuk pemeriksaan lebih lanjut.", description="Catatan disclaimer")

    model_config = {"populate_by_name": True}


class PredictionSaveData(BaseModel):
    id: str
    image_url: str
    worker_id: str
    worker_name: str
    created_at: str


class PredictionSaveResponse(BaseModel):
    status: str = "success"
    data: PredictionSaveData


class StatsRange(BaseModel):
    start: str
    end: str


class StatsData(BaseModel):
    period: str
    range: StatsRange
    total: int
    by_class: Dict[str, int]


class StatsResponse(BaseModel):
    status: str = "success"
    data: StatsData


class StaffAccountCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=8)
    role: Literal["veterinarian", "head_worker"]

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("full_name tidak boleh kosong")
        return normalized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        local, separator, domain = normalized.partition("@")
        if not separator or not local or "." not in domain or domain.startswith("."):
            raise ValueError("email tidak valid")
        return normalized


class StaffAccountResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: Literal["veterinarian", "head_worker"]
    created_at: datetime
