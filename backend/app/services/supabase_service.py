import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Optional
from io import BytesIO

import httpx
from PIL import Image

from app.core.config import settings

STORAGE_BUCKET = "feses-images"

MAX_DIMENSION = 1024
JPEG_QUALITY = 75

_client: Optional[httpx.Client] = None


def _get_client() -> httpx.Client:
    global _client
    if _client is None:
        _client = httpx.Client(
            base_url=settings.supabase_url.rstrip("/") + "/rest/v1",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            timeout=30,
        )
    return _client


def upload_image(file_bytes: bytes, filename: str) -> str:
    img = Image.open(BytesIO(file_bytes))
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    compressed = buf.getvalue()

    path = f"{uuid.uuid4().hex}.jpg"
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{STORAGE_BUCKET}/{path}"
    resp = httpx.post(
        url,
        headers={
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "image/jpeg",
        },
        content=compressed,
        timeout=60,
    )
    resp.raise_for_status()

    public_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"
    return public_url


def validate_worker_id(worker_id: str) -> dict:
    if not worker_id or not worker_id.strip():
        raise ValueError("worker_id tidak boleh kosong")

    client = _get_client()
    resp = client.get(
        "/workers",
        params={
            "id": f"eq.{worker_id}",
            "select": "id,name,is_active",
        },
    )
    resp.raise_for_status()
    rows = resp.json()

    if not rows:
        raise ValueError("worker_id tidak ditemukan")
    if not rows[0]["is_active"]:
        raise ValueError("pekerja sudah nonaktif")
    return rows[0]


def insert_prediction(
    image_url: str,
    prediction: str,
    confidence: float,
    all_predictions: dict,
    worker_id: str,
) -> dict:
    payload = {
        "image_url": image_url,
        "prediction": prediction,
        "confidence": confidence,
        "all_predictions": json.dumps(all_predictions),
        "worker_id": worker_id,
    }
    client = _get_client()
    resp = client.post("/predictions", json=payload)
    resp.raise_for_status()
    return resp.json()[0]


def compute_date_range(period: str, reference_date: Optional[str] = None) -> tuple[str, str]:
    if reference_date:
        ref = datetime.strptime(reference_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        ref = datetime.now(timezone.utc)

    if period == "week":
        start = ref - timedelta(days=ref.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=7)
    elif period == "month":
        start = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
    elif period == "year":
        start = ref.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(year=start.year + 1)
    else:
        raise ValueError("period harus salah satu dari: week, month, year")

    return start.isoformat(), end.isoformat()


def get_stats(period: str, reference_date: Optional[str] = None) -> dict:
    start, end = compute_date_range(period, reference_date)
    client = _get_client()
    resp = client.get(
        "/predictions",
        params=[
            ("select", "prediction"),
            ("created_at", f"gte.{start}"),
            ("created_at", f"lt.{end}"),
            ("deleted_at", "is.null"),
        ],
    )
    resp.raise_for_status()
    rows = resp.json()

    by_class: dict[str, int] = {}
    for row in rows:
        cls = row["prediction"]
        by_class[cls] = by_class.get(cls, 0) + 1

    return {
        "period": period,
        "range": {"start": start.split("T")[0], "end": (end - timedelta(days=1)).split("T")[0]},
        "total": len(rows),
        "by_class": by_class,
    }


def verify_admin_token(token: str) -> dict:
    resp = httpx.post(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
        headers={
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {token}",
        },
        timeout=10,
    )
    if resp.status_code != 200:
        raise ValueError("token tidak valid")
    return resp.json()
