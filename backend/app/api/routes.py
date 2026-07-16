from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query, Header
from typing import Optional
from app.services.ml_service import ml_service
from app.services import supabase_service
from app.models.schemas import (
    PredictionResponse,
    PredictionSaveResponse,
    PredictionSaveData,
    StatsResponse,
    StatsData,
    StatsRange,
    RecommendationData,
)
from app.utils.knowledge_base import KNOWLEDGE_BASE
from app.core.config import settings
import json

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"]

@router.get("/api/v1/health")
def health():
    return {"status": "ok", "model_loaded": ml_service.model is not None}

@router.post("/api/v1/predict")
async def predict_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tipe file tidak didukung. Harap unggah gambar JPG atau PNG."
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Ukuran gambar melebihi batas maksimal 5MB."
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File gambar kosong."
        )

    try:
        prediction_result = ml_service.predict(file_bytes)
        predicted_class = prediction_result["class_name"]

        knowledge = KNOWLEDGE_BASE.get(predicted_class)
        if not knowledge:
            raise ValueError(f"Kelas {predicted_class} tidak ditemukan di Knowledge Base.")

        recommendation = RecommendationData(
            description=knowledge["description"],
            cause=knowledge["cause"],
            immediate_action=knowledge["immediate_action"]
        )

        return {
            "status": "success",
            "data": PredictionResponse(
                class_name=predicted_class,
                confidence=prediction_result["confidence"],
                confidence_threshold=settings.confidence_threshold,
                probabilities=prediction_result["probabilities"],
                recommendation_data=recommendation
            ).model_dump(by_alias=True)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses gambar: {str(e)}"
        )


@router.post("/api/v1/predictions", response_model=PredictionSaveResponse, status_code=status.HTTP_201_CREATED)
async def save_prediction(
    file: UploadFile = File(...),
    prediction: str = File(...),
    confidence: float = File(...),
    all_predictions: str = File(...),
    worker_id: str = File(...),
):
    if not worker_id or not worker_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="worker_id tidak boleh kosong")

    try:
        worker = supabase_service.validate_worker_id(worker_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File gambar kosong")

    try:
        image_url = supabase_service.upload_image(file_bytes, file.filename or "image.jpg")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Gagal mengunggah gambar")

    try:
        preds_dict = json.loads(all_predictions) if all_predictions else {}
    except json.JSONDecodeError:
        preds_dict = {}

    try:
        saved = supabase_service.insert_prediction(
            image_url=image_url,
            prediction=prediction,
            confidence=confidence,
            all_predictions=preds_dict,
            worker_id=worker_id,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Gagal menyimpan prediksi: {str(e)}")

    return PredictionSaveResponse(
        data=PredictionSaveData(
            id=saved["id"],
            image_url=saved["image_url"],
            worker_id=saved["worker_id"],
            worker_name=worker["name"],
            created_at=saved["created_at"],
        )
    )


@router.get("/api/v1/stats", response_model=StatsResponse)
async def get_stats(
    period: str = Query(..., description="week, month, atau year"),
    reference_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    authorization: Optional[str] = Header(None),
):
    if period not in ("week", "month", "year"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="period harus salah satu dari: week, month, year")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak diberikan")

    token = authorization.split(" ", 1)[1]
    try:
        supabase_service.verify_admin_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")

    try:
        stats = supabase_service.get_stats(period, reference_date)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return StatsResponse(
        data=StatsData(
            period=stats["period"],
            range=StatsRange(**stats["range"]),
            total=stats["total"],
            by_class=stats["by_class"],
        )
    )
