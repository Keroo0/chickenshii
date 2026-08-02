import uuid
import json
import logging
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
logger = logging.getLogger(__name__)
CHICKENSHII_STAFF_NAMESPACE = uuid.UUID("47ac95eb-a81e-5f08-9af0-bfd326b90b1e")
STAFF_PROFILE_FIELDS = "user_id,full_name,email,role,created_at"


class AuthenticationError(ValueError):
    """The supplied Supabase access token is absent, expired, or invalid."""


class AuthorizationError(ValueError):
    """The authenticated Supabase user lacks the required application role."""


class DuplicateEmailError(ValueError):
    """Supabase Auth already contains an account for the requested email."""


class UpstreamServiceError(RuntimeError):
    """A required Supabase service failed or returned an invalid response."""


class StaffProvisioningError(RuntimeError):
    """Staff profile provisioning failed after its Auth user was removed."""


class StaffCompensationError(StaffProvisioningError):
    """Staff provisioning and Auth cleanup both failed, risking an orphan user."""


class StaffProfileConflictError(ValueError):
    """A deterministic staff identity already has a different profile."""


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


def get_auth_user(token: str) -> dict:
    if not token or not token.strip():
        raise AuthenticationError("token tidak valid")

    try:
        resp = httpx.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": f"Bearer {token}",
            },
            timeout=10,
        )
    except httpx.RequestError as exc:
        raise UpstreamServiceError("layanan autentikasi tidak tersedia") from exc

    if resp.status_code in (401, 403):
        raise AuthenticationError("token tidak valid")
    if resp.status_code != 200:
        raise UpstreamServiceError("layanan autentikasi tidak tersedia")

    try:
        user = resp.json()
    except (TypeError, ValueError) as exc:
        raise UpstreamServiceError("respons autentikasi tidak valid") from exc
    if not isinstance(user, dict):
        raise UpstreamServiceError("respons autentikasi tidak valid")
    return user


def require_role(token: str, required_role: str) -> dict:
    user = get_auth_user(token)
    app_metadata = user.get("app_metadata") or {}
    if app_metadata.get("role") != required_role:
        raise AuthorizationError("pengguna tidak memiliki akses")
    return user


def verify_admin_token(token: str) -> dict:
    """Backward-compatible admin guard for existing callers."""
    resp = httpx.post(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
        headers={
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {token}",
        },
        timeout=10,
    )
    if resp.status_code != 200:
        raise AuthenticationError("token tidak valid")
    user = resp.json()
    if (user.get("app_metadata") or {}).get("role") != "admin":
        raise AuthorizationError("pengguna tidak memiliki akses")
    return user


def _service_role_headers() -> dict[str, str]:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }


def _is_duplicate_email_response(response: httpx.Response) -> bool:
    try:
        payload = response.json()
    except (TypeError, ValueError):
        payload = {}

    duplicate_code = str(payload.get("code") or "").lower()
    message = " ".join(
        str(value)
        for value in (
            payload.get("message"),
            payload.get("msg"),
            payload.get("error_description"),
            getattr(response, "text", ""),
        )
        if value
    ).lower()
    return response.status_code in (400, 409, 422) and (
        duplicate_code == "user_already_exists"
        or "already" in message
        or "registered" in message
        or "exists" in message
    )


def deterministic_staff_user_id(email: str) -> str:
    normalized_email = email.strip().casefold()
    return str(uuid.uuid5(CHICKENSHII_STAFF_NAMESPACE, normalized_email))


def _extract_auth_user(payload) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("respons Auth bukan object")
    auth_user = payload.get("user", payload)
    if not isinstance(auth_user, dict) or not auth_user.get("id"):
        raise ValueError("respons Auth tidak memiliki user id")
    return auth_user


def _auth_user_matches(auth_user: dict, user_id: str, email: str, role: str) -> bool:
    app_metadata = auth_user.get("app_metadata") or {}
    return (
        str(auth_user.get("id")) == user_id
        and str(auth_user.get("email") or "").strip().casefold() == email
        and isinstance(app_metadata, dict)
        and app_metadata.get("role") == role
    )


def _get_admin_user_by_id(user_id: str) -> Optional[dict]:
    try:
        response = httpx.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}",
            headers=_service_role_headers(),
            timeout=30,
        )
    except httpx.RequestError as exc:
        raise UpstreamServiceError("rekonsiliasi akun Auth gagal") from exc

    if response.status_code == 404:
        return None
    if response.status_code != 200:
        raise UpstreamServiceError("rekonsiliasi akun Auth gagal")
    try:
        return _extract_auth_user(response.json())
    except (TypeError, ValueError) as exc:
        raise UpstreamServiceError("respons rekonsiliasi Auth tidak valid") from exc


def _reconcile_auth_user(*, user_id: str, email: str, role: str) -> dict:
    auth_user = _get_admin_user_by_id(user_id)
    if auth_user is not None and _auth_user_matches(auth_user, user_id, email, role):
        return auth_user
    raise UpstreamServiceError("hasil pembuatan akun tidak dapat direkonsiliasi")


def _validate_profile_response(
    payload, expected_user_id: str, *, allow_empty: bool = False
) -> Optional[dict]:
    if isinstance(payload, list):
        if not payload and allow_empty:
            return None
        if len(payload) != 1:
            raise ValueError("respons staff_profiles tidak valid")
        profile = payload[0]
    elif isinstance(payload, dict):
        profile = payload
    else:
        profile = None

    required_fields = {"user_id", "full_name", "email", "role", "created_at"}
    if not isinstance(profile, dict) or not required_fields.issubset(profile):
        raise ValueError("respons staff_profiles tidak lengkap")
    if any(profile[field] is None or profile[field] == "" for field in required_fields):
        raise ValueError("respons staff_profiles tidak lengkap")
    if str(profile["user_id"]) != str(expected_user_id):
        raise ValueError("respons staff_profiles memiliki user_id yang tidak sesuai")
    return profile


def _profile_matches(
    profile: dict, *, user_id: str, full_name: str, email: str, role: str
) -> bool:
    return (
        str(profile["user_id"]) == user_id
        and str(profile["full_name"]).strip() == full_name
        and str(profile["email"]).strip().casefold() == email
        and profile["role"] == role
    )


def _load_staff_profile(client: httpx.Client, user_id: str) -> Optional[dict]:
    response = client.get(
        "/staff_profiles",
        params={
            "user_id": f"eq.{user_id}",
            "select": STAFF_PROFILE_FIELDS,
            "limit": "1",
        },
    )
    response.raise_for_status()
    return _validate_profile_response(
        response.json(), user_id, allow_empty=True
    )


def _compensate_failed_profile(user_id: str, provisioning_error: Exception):
    try:
        rollback_response = httpx.delete(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}",
            headers=_service_role_headers(),
            timeout=30,
        )
        rollback_response.raise_for_status()
    except Exception as compensation_error:
        logger.exception(
            "Failed to delete Auth user %s after staff profile provisioning failed; orphan risk",
            user_id,
        )
        raise StaffCompensationError(
            "staff provisioning compensation failed; orphan Auth user risk"
        ) from compensation_error
    raise StaffProvisioningError(
        "staff profile provisioning failed; Auth user was removed"
    ) from provisioning_error


def _ensure_staff_profile(
    *, user_id: str, full_name: str, email: str, role: str
) -> dict:
    client = _get_client()
    try:
        existing_profile = _load_staff_profile(client, user_id)
    except Exception as provisioning_error:
        _compensate_failed_profile(user_id, provisioning_error)

    if existing_profile is not None:
        if _profile_matches(
            existing_profile,
            user_id=user_id,
            full_name=full_name,
            email=email,
            role=role,
        ):
            return existing_profile
        raise StaffProfileConflictError(
            "staff profile for deterministic Auth user does not match request"
        )

    profile_payload = {
        "user_id": user_id,
        "full_name": full_name,
        "email": email,
        "role": role,
    }
    try:
        profile_response = client.post("/staff_profiles", json=profile_payload)
        profile_response.raise_for_status()
        profile = _validate_profile_response(profile_response.json(), user_id)
        if not _profile_matches(
            profile,
            user_id=user_id,
            full_name=full_name,
            email=email,
            role=role,
        ):
            raise ValueError("respons staff_profiles tidak sesuai dengan permintaan")
        return profile
    except Exception as provisioning_error:
        _compensate_failed_profile(user_id, provisioning_error)


def create_staff_account(
    *, full_name: str, email: str, password: str, role: str
) -> dict:
    if role not in ("veterinarian", "head_worker"):
        raise ValueError("role harus veterinarian atau head_worker")

    normalized_email = email.strip().casefold()
    normalized_full_name = full_name.strip()
    user_id = deterministic_staff_user_id(normalized_email)

    try:
        auth_response = httpx.post(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users",
            headers=_service_role_headers(),
            json={
                "id": user_id,
                "email": normalized_email,
                "password": password,
                "email_confirm": True,
                "app_metadata": {"role": role},
                "user_metadata": {"full_name": normalized_full_name},
            },
            timeout=30,
        )
    except httpx.RequestError as exc:
        auth_user = _reconcile_auth_user(
            user_id=user_id,
            email=normalized_email,
            role=role,
        )
    else:
        duplicate_failure = _is_duplicate_email_response(auth_response)
        if duplicate_failure:
            raise DuplicateEmailError("email sudah terdaftar")
        elif 500 <= auth_response.status_code:
            auth_user = _reconcile_auth_user(
                user_id=user_id,
                email=normalized_email,
                role=role,
            )
        elif auth_response.status_code < 200 or auth_response.status_code >= 300:
            raise UpstreamServiceError("layanan pembuatan akun gagal")
        else:
            try:
                auth_user = _extract_auth_user(auth_response.json())
            except (TypeError, ValueError):
                auth_user = _reconcile_auth_user(
                    user_id=user_id,
                    email=normalized_email,
                    role=role,
                )
            else:
                if not _auth_user_matches(
                    auth_user, user_id, normalized_email, role
                ):
                    auth_user = _reconcile_auth_user(
                        user_id=user_id,
                        email=normalized_email,
                        role=role,
                    )

    profile = _ensure_staff_profile(
        user_id=user_id,
        full_name=normalized_full_name,
        email=normalized_email,
        role=role,
    )

    return {
        "id": profile["user_id"],
        "full_name": profile["full_name"],
        "email": profile["email"],
        "role": profile["role"],
        "created_at": profile["created_at"],
    }
