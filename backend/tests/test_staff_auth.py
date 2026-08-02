from datetime import datetime, timezone
import inspect
import logging
from uuid import UUID
from unittest.mock import Mock

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api import routes
from app.models.schemas import StaffAccountResponse
from app.services import supabase_service


client = TestClient(app)
VET_STAFF_ID = supabase_service.deterministic_staff_user_id("vet@example.com")


class FakeResponse:
    def __init__(self, status_code: int, payload):
        self.status_code = status_code
        self._payload = payload
        self.text = str(payload)

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("POST", "https://example.test")
            response = httpx.Response(self.status_code, request=request)
            raise httpx.HTTPStatusError("request failed", request=request, response=response)


def test_get_auth_user_fetches_user_and_preserves_app_metadata(monkeypatch):
    response = FakeResponse(
        200,
        {"id": "user-1", "email": "admin@example.com", "app_metadata": {"role": "admin"}},
    )
    get = Mock(return_value=response)
    monkeypatch.setattr(supabase_service.httpx, "get", get)

    user = supabase_service.get_auth_user("valid-token")

    assert user["app_metadata"]["role"] == "admin"
    get.assert_called_once()
    assert get.call_args.args[0].endswith("/auth/v1/user")
    assert get.call_args.kwargs["headers"]["Authorization"] == "Bearer valid-token"


@pytest.mark.parametrize("status_code", [401, 403])
def test_get_auth_user_rejects_invalid_token(monkeypatch, status_code):
    monkeypatch.setattr(
        supabase_service.httpx,
        "get",
        Mock(return_value=FakeResponse(status_code, {"message": "invalid JWT"})),
    )

    with pytest.raises(supabase_service.AuthenticationError, match="token tidak valid"):
        supabase_service.get_auth_user("bad-token")


@pytest.mark.parametrize("status_code", [429, 500, 503])
def test_get_auth_user_classifies_upstream_http_failures(monkeypatch, status_code):
    monkeypatch.setattr(
        supabase_service.httpx,
        "get",
        Mock(return_value=FakeResponse(status_code, {"message": "upstream failure"})),
    )

    with pytest.raises(supabase_service.UpstreamServiceError):
        supabase_service.get_auth_user("valid-looking-token")


def test_get_auth_user_classifies_network_failure(monkeypatch):
    request = httpx.Request("GET", "https://example.test/auth/v1/user")
    monkeypatch.setattr(
        supabase_service.httpx,
        "get",
        Mock(side_effect=httpx.ConnectError("connection failed", request=request)),
    )

    with pytest.raises(supabase_service.UpstreamServiceError):
        supabase_service.get_auth_user("valid-looking-token")


@pytest.mark.parametrize("payload", [ValueError("bad json"), ["not", "a", "user"]])
def test_get_auth_user_classifies_malformed_response(monkeypatch, payload):
    monkeypatch.setattr(
        supabase_service.httpx,
        "get",
        Mock(return_value=FakeResponse(200, payload)),
    )

    with pytest.raises(supabase_service.UpstreamServiceError):
        supabase_service.get_auth_user("valid-looking-token")


def test_require_role_uses_app_metadata(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "get_auth_user",
        Mock(return_value={"id": "user-1", "app_metadata": {"role": "veterinarian"}}),
    )

    user = supabase_service.require_role("token", "veterinarian")
    assert user["id"] == "user-1"

    with pytest.raises(supabase_service.AuthorizationError, match="tidak memiliki akses"):
        supabase_service.require_role("token", "admin")


def test_stats_requires_admin_role(monkeypatch):
    role_guard = Mock(
        side_effect=supabase_service.AuthorizationError("pengguna tidak memiliki akses")
    )
    monkeypatch.setattr(supabase_service, "require_role", role_guard)

    response = client.get(
        "/api/v1/stats?period=week", headers={"Authorization": "Bearer vet-token"}
    )

    assert response.status_code == 403
    role_guard.assert_called_once_with("vet-token", "admin")


def test_stats_rejects_invalid_auth(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(side_effect=supabase_service.AuthenticationError("token tidak valid")),
    )

    response = client.get(
        "/api/v1/stats?period=week", headers={"Authorization": "Bearer expired"}
    )

    assert response.status_code == 401


def test_stats_allows_admin(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(return_value={"id": "admin-1", "app_metadata": {"role": "admin"}}),
    )
    monkeypatch.setattr(
        supabase_service,
        "get_stats",
        Mock(
            return_value={
                "period": "week",
                "range": {"start": "2026-07-27", "end": "2026-08-02"},
                "total": 2,
                "by_class": {"Healthy": 2},
            }
        ),
    )

    response = client.get(
        "/api/v1/stats?period=week", headers={"Authorization": "Bearer admin-token"}
    )

    assert response.status_code == 200
    assert response.json()["data"]["total"] == 2


def test_stats_maps_auth_upstream_failure_to_503(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(side_effect=supabase_service.UpstreamServiceError("auth unavailable")),
    )

    response = client.get(
        "/api/v1/stats?period=week",
        headers={"Authorization": "Bearer valid-looking-token"},
    )

    assert response.status_code == 503
    assert "auth unavailable" not in response.text


def test_bearer_scheme_is_case_insensitive(monkeypatch):
    guard = Mock(return_value={"id": "admin-1", "app_metadata": {"role": "admin"}})
    monkeypatch.setattr(supabase_service, "require_role", guard)
    monkeypatch.setattr(
        supabase_service,
        "get_stats",
        Mock(
            return_value={
                "period": "week",
                "range": {"start": "2026-07-27", "end": "2026-08-02"},
                "total": 0,
                "by_class": {},
            }
        ),
    )

    response = client.get(
        "/api/v1/stats?period=week", headers={"Authorization": "bearer admin-token"}
    )

    assert response.status_code == 200
    guard.assert_called_once_with("admin-token", "admin")


def test_sync_service_routes_are_not_coroutines():
    assert not inspect.iscoroutinefunction(routes.get_stats)
    assert not inspect.iscoroutinefunction(routes.create_staff_account)


def test_create_staff_account_creates_auth_user_and_profile(monkeypatch):
    auth_user = {
        "id": VET_STAFF_ID,
        "email": "vet@example.com",
        "app_metadata": {"role": "veterinarian"},
        "created_at": "2026-08-02T08:00:00Z",
    }
    auth_post = Mock(return_value=FakeResponse(200, auth_user))
    profile_client = Mock()
    profile_client.get.return_value = FakeResponse(200, [])
    profile_client.post.return_value = FakeResponse(
        201,
        [
            {
                "user_id": VET_STAFF_ID,
                "full_name": "Dr. Sari",
                "email": "vet@example.com",
                "role": "veterinarian",
                "created_at": "2026-08-02T08:00:00Z",
            }
        ],
    )
    monkeypatch.setattr(supabase_service.httpx, "post", auth_post)
    monkeypatch.setattr(supabase_service, "_get_client", Mock(return_value=profile_client))

    result = supabase_service.create_staff_account(
        full_name="Dr. Sari",
        email="vet@example.com",
        password="password123",
        role="veterinarian",
    )

    assert result["id"] == VET_STAFF_ID
    assert result["role"] == "veterinarian"
    assert auth_post.call_args.kwargs["json"]["app_metadata"] == {
        "role": "veterinarian"
    }
    assert auth_post.call_args.kwargs["json"]["id"] == VET_STAFF_ID
    profile_client.post.assert_called_once_with(
        "/staff_profiles",
        json={
            "user_id": VET_STAFF_ID,
            "full_name": "Dr. Sari",
            "email": "vet@example.com",
            "role": "veterinarian",
        },
    )


@pytest.mark.parametrize("role", ["admin", "worker", "", None])
def test_create_staff_account_rejects_unsupported_roles(role):
    with pytest.raises(ValueError, match="role"):
        supabase_service.create_staff_account(
            full_name="Name",
            email="staff@example.com",
            password="password123",
            role=role,
        )


def test_create_staff_account_maps_duplicate_email(monkeypatch):
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(
            return_value=FakeResponse(
                422, {"message": "A user with this email address has already been registered"}
            )
        ),
    )
    auth_get = Mock()
    monkeypatch.setattr(supabase_service.httpx, "get", auth_get)

    with pytest.raises(supabase_service.DuplicateEmailError):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )

    auth_get.assert_not_called()


def test_create_staff_account_maps_explicit_duplicate_code(monkeypatch):
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(return_value=FakeResponse(422, {"code": "user_already_exists"})),
    )
    auth_get = Mock()
    monkeypatch.setattr(supabase_service.httpx, "get", auth_get)

    with pytest.raises(supabase_service.DuplicateEmailError):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )

    auth_get.assert_not_called()


def test_create_staff_account_classifies_indeterminate_auth_timeout(monkeypatch):
    request = httpx.Request("POST", "https://example.test/auth/v1/admin/users")
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(side_effect=httpx.ReadTimeout("timed out", request=request)),
    )
    monkeypatch.setattr(
        supabase_service.httpx,
        "get",
        Mock(return_value=FakeResponse(404, {"message": "not found"})),
    )

    with pytest.raises(supabase_service.UpstreamServiceError):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )


def test_staff_auth_id_is_stable_for_normalized_email():
    first = supabase_service.deterministic_staff_user_id(" Vet@Example.com ")
    second = supabase_service.deterministic_staff_user_id("vet@example.com")

    assert first == second
    assert UUID(first).version == 5


def test_create_staff_account_recovers_timeout_after_auth_commit(monkeypatch):
    expected_id = supabase_service.deterministic_staff_user_id("vet@example.com")
    request = httpx.Request("POST", "https://example.test/auth/v1/admin/users")
    post = Mock(side_effect=httpx.ReadTimeout("timed out", request=request))
    get = Mock(
        return_value=FakeResponse(
            200,
            {
                "id": expected_id,
                "email": "vet@example.com",
                "app_metadata": {"role": "veterinarian"},
            },
        )
    )
    monkeypatch.setattr(supabase_service.httpx, "post", post)
    monkeypatch.setattr(supabase_service.httpx, "get", get)
    profile_client = Mock()
    profile_client.get.return_value = FakeResponse(200, [])
    profile_client.post.return_value = FakeResponse(
        201,
        [
            {
                "user_id": expected_id,
                "full_name": "Dr. Sari",
                "email": "vet@example.com",
                "role": "veterinarian",
                "created_at": "2026-08-02T08:00:00Z",
            }
        ],
    )
    monkeypatch.setattr(supabase_service, "_get_client", Mock(return_value=profile_client))

    result = supabase_service.create_staff_account(
        full_name="Dr. Sari",
        email="vet@example.com",
        password="password123",
        role="veterinarian",
    )

    assert result["id"] == expected_id
    assert post.call_args.kwargs["json"]["id"] == expected_id
    assert get.call_args.args[0].endswith(f"/auth/v1/admin/users/{expected_id}")


def test_create_staff_account_recovers_malformed_success_response(monkeypatch):
    expected_id = supabase_service.deterministic_staff_user_id("vet@example.com")
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(return_value=FakeResponse(200, ValueError("malformed json"))),
    )
    monkeypatch.setattr(
        supabase_service.httpx,
        "get",
        Mock(
            return_value=FakeResponse(
                200,
                {
                    "id": expected_id,
                    "email": "vet@example.com",
                    "app_metadata": {"role": "veterinarian"},
                },
            )
        ),
    )
    profile_client = Mock()
    profile_client.get.return_value = FakeResponse(200, [])
    profile_client.post.return_value = FakeResponse(
        201,
        [
            {
                "user_id": expected_id,
                "full_name": "Dr. Sari",
                "email": "vet@example.com",
                "role": "veterinarian",
                "created_at": "2026-08-02T08:00:00Z",
            }
        ],
    )
    monkeypatch.setattr(supabase_service, "_get_client", Mock(return_value=profile_client))

    result = supabase_service.create_staff_account(
        full_name="Dr. Sari",
        email="vet@example.com",
        password="password123",
        role="veterinarian",
    )

    assert result["id"] == expected_id


def test_create_staff_account_rejects_duplicate_at_deterministic_id_without_lookup(
    monkeypatch,
):
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(return_value=FakeResponse(422, {"code": "user_already_exists"})),
    )
    auth_get = Mock()
    monkeypatch.setattr(supabase_service.httpx, "get", auth_get)

    with pytest.raises(supabase_service.DuplicateEmailError):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )

    auth_get.assert_not_called()


def test_create_staff_account_keeps_unrelated_duplicate_as_duplicate(monkeypatch):
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(return_value=FakeResponse(422, {"code": "user_already_exists"})),
    )
    auth_get = Mock()
    monkeypatch.setattr(supabase_service.httpx, "get", auth_get)

    with pytest.raises(supabase_service.DuplicateEmailError):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )

    auth_get.assert_not_called()


def test_create_staff_account_recovers_5xx_at_deterministic_id(monkeypatch):
    expected_id = supabase_service.deterministic_staff_user_id("vet@example.com")
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(return_value=FakeResponse(503, {"message": "upstream unavailable"})),
    )
    monkeypatch.setattr(
        supabase_service.httpx,
        "get",
        Mock(
            return_value=FakeResponse(
                200,
                {
                    "id": expected_id,
                    "email": "vet@example.com",
                    "app_metadata": {"role": "veterinarian"},
                },
            )
        ),
    )
    profile = {
        "user_id": expected_id,
        "full_name": "Dr. Sari",
        "email": "vet@example.com",
        "role": "veterinarian",
        "created_at": "2026-08-02T08:00:00Z",
    }
    profile_client = Mock()
    profile_client.get.return_value = FakeResponse(200, [profile])
    monkeypatch.setattr(supabase_service, "_get_client", Mock(return_value=profile_client))

    assert supabase_service.create_staff_account(
        full_name="Dr. Sari",
        email="vet@example.com",
        password="password123",
        role="veterinarian",
    )["created_at"] == profile["created_at"]
    profile_client.post.assert_not_called()


def test_create_staff_account_rejects_mismatched_existing_profile_without_delete(
    monkeypatch,
):
    expected_id = supabase_service.deterministic_staff_user_id("vet@example.com")
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(return_value=FakeResponse(503, {"message": "upstream unavailable"})),
    )
    monkeypatch.setattr(
        supabase_service.httpx,
        "get",
        Mock(
            return_value=FakeResponse(
                200,
                {
                    "id": expected_id,
                    "email": "vet@example.com",
                    "app_metadata": {"role": "veterinarian"},
                },
            )
        ),
    )
    delete = Mock()
    monkeypatch.setattr(supabase_service.httpx, "delete", delete)
    profile_client = Mock()
    profile_client.get.return_value = FakeResponse(
        200,
        [
            {
                "user_id": expected_id,
                "full_name": "Different Person",
                "email": "vet@example.com",
                "role": "veterinarian",
                "created_at": "2026-08-02T08:00:00Z",
            }
        ],
    )
    monkeypatch.setattr(supabase_service, "_get_client", Mock(return_value=profile_client))

    with pytest.raises(supabase_service.StaffProfileConflictError):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )

    delete.assert_not_called()


@pytest.mark.parametrize(
    "profile_response",
    [
        [],
        {},
        [None],
        [{"user_id": VET_STAFF_ID, "full_name": "Dr. Sari"}],
    ],
)
def test_create_staff_account_compensates_for_malformed_profile_response(
    monkeypatch, profile_response
):
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(
            return_value=FakeResponse(
                200,
                {
                    "id": VET_STAFF_ID,
                    "email": "vet@example.com",
                    "app_metadata": {"role": "veterinarian"},
                    "created_at": "2026-08-02T08:00:00Z",
                },
            )
        ),
    )
    delete = Mock(return_value=FakeResponse(200, {}))
    monkeypatch.setattr(supabase_service.httpx, "delete", delete)
    profile_client = Mock()
    profile_client.get.return_value = FakeResponse(200, [])
    profile_client.post.return_value = FakeResponse(201, profile_response)
    monkeypatch.setattr(supabase_service, "_get_client", Mock(return_value=profile_client))

    with pytest.raises(supabase_service.StaffProvisioningError):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )

    delete.assert_called_once()


def test_create_staff_account_deletes_auth_user_when_profile_insert_fails(monkeypatch):
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(
            return_value=FakeResponse(
                200,
                {
                    "id": VET_STAFF_ID,
                    "email": "vet@example.com",
                    "app_metadata": {"role": "veterinarian"},
                    "created_at": "2026-08-02T08:00:00Z",
                },
            )
        ),
    )
    delete = Mock(return_value=FakeResponse(200, {}))
    monkeypatch.setattr(supabase_service.httpx, "delete", delete)
    profile_client = Mock()
    profile_client.get.return_value = FakeResponse(200, [])
    profile_client.post.return_value = FakeResponse(500, {"message": "profile failure"})
    monkeypatch.setattr(supabase_service, "_get_client", Mock(return_value=profile_client))

    with pytest.raises(supabase_service.StaffProvisioningError):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )

    delete.assert_called_once()
    assert delete.call_args.args[0].endswith(
        f"/auth/v1/admin/users/{VET_STAFF_ID}"
    )


def test_create_staff_account_reports_orphan_risk_when_compensation_fails(
    monkeypatch, caplog
):
    monkeypatch.setattr(
        supabase_service.httpx,
        "post",
        Mock(
            return_value=FakeResponse(
                200,
                {
                    "id": VET_STAFF_ID,
                    "email": "vet@example.com",
                    "app_metadata": {"role": "veterinarian"},
                    "created_at": "2026-08-02T08:00:00Z",
                },
            )
        ),
    )
    monkeypatch.setattr(
        supabase_service.httpx, "delete", Mock(return_value=FakeResponse(500, {}))
    )
    profile_client = Mock()
    profile_client.get.return_value = FakeResponse(200, [])
    profile_client.post.return_value = FakeResponse(500, {"message": "profile failure"})
    monkeypatch.setattr(supabase_service, "_get_client", Mock(return_value=profile_client))

    with caplog.at_level(logging.ERROR), pytest.raises(
        supabase_service.StaffCompensationError, match="orphan"
    ):
        supabase_service.create_staff_account(
            full_name="Dr. Sari",
            email="vet@example.com",
            password="password123",
            role="veterinarian",
        )

    assert VET_STAFF_ID in caplog.text


def test_staff_accounts_endpoint_requires_admin(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(side_effect=supabase_service.AuthorizationError("pengguna tidak memiliki akses")),
    )
    create = Mock()
    monkeypatch.setattr(supabase_service, "create_staff_account", create, raising=False)

    response = client.post(
        "/api/v1/staff-accounts",
        headers={"Authorization": "Bearer vet-token"},
        json={
            "full_name": "Head Worker",
            "email": "head@example.com",
            "password": "password123",
            "role": "head_worker",
        },
    )

    assert response.status_code == 403
    create.assert_not_called()


def test_staff_accounts_endpoint_rejects_invalid_auth(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(side_effect=supabase_service.AuthenticationError("token tidak valid")),
    )

    response = client.post(
        "/api/v1/staff-accounts",
        headers={"Authorization": "Bearer expired"},
        json={
            "full_name": "Head Worker",
            "email": "head@example.com",
            "password": "password123",
            "role": "head_worker",
        },
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    "field,value",
    [("password", "short"), ("role", "admin"), ("full_name", "   "), ("email", "bad-email")],
)
def test_staff_accounts_endpoint_validates_body(field, value):
    body = {
        "full_name": "Head Worker",
        "email": "head@example.com",
        "password": "password123",
        "role": "head_worker",
    }
    body[field] = value

    response = client.post(
        "/api/v1/staff-accounts",
        headers={"Authorization": "Bearer admin-token"},
        json=body,
    )

    assert response.status_code == 422


def test_staff_accounts_endpoint_returns_created_profile(monkeypatch):
    created_at = datetime(2026, 8, 2, 8, 0, tzinfo=timezone.utc).isoformat()
    staff_id = "00000000-0000-0000-0000-000000000001"
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(return_value={"id": "admin-1", "app_metadata": {"role": "admin"}}),
    )
    monkeypatch.setattr(
        supabase_service,
        "create_staff_account",
        Mock(
            return_value={
                "id": staff_id,
                "full_name": "Head Worker",
                "email": "head@example.com",
                "role": "head_worker",
                "created_at": created_at,
            }
        ),
        raising=False,
    )

    response = client.post(
        "/api/v1/staff-accounts",
        headers={"Authorization": "Bearer admin-token"},
        json={
            "full_name": "Head Worker",
            "email": "head@example.com",
            "password": "password123",
            "role": "head_worker",
        },
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": staff_id,
        "full_name": "Head Worker",
        "email": "head@example.com",
        "role": "head_worker",
        "created_at": "2026-08-02T08:00:00Z",
    }


def test_staff_accounts_endpoint_maps_duplicate_email(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(return_value={"id": "admin-1", "app_metadata": {"role": "admin"}}),
    )
    monkeypatch.setattr(
        supabase_service,
        "create_staff_account",
        Mock(side_effect=supabase_service.DuplicateEmailError("email sudah terdaftar")),
        raising=False,
    )

    response = client.post(
        "/api/v1/staff-accounts",
        headers={"Authorization": "Bearer admin-token"},
        json={
            "full_name": "Head Worker",
            "email": "head@example.com",
            "password": "password123",
            "role": "head_worker",
        },
    )

    assert response.status_code == 409


def test_staff_accounts_endpoint_maps_compensation_failure_without_details(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(return_value={"id": "admin-1", "app_metadata": {"role": "admin"}}),
    )
    monkeypatch.setattr(
        supabase_service,
        "create_staff_account",
        Mock(
            side_effect=supabase_service.StaffCompensationError(
                "orphan risk; secret-service-key-must-not-leak"
            )
        ),
    )

    response = client.post(
        "/api/v1/staff-accounts",
        headers={"Authorization": "Bearer admin-token"},
        json={
            "full_name": "Head Worker",
            "email": "head@example.com",
            "password": "password123",
            "role": "head_worker",
        },
    )

    assert response.status_code == 502
    assert "secret-service-key" not in response.text


def test_staff_accounts_endpoint_maps_upstream_failure_to_503(monkeypatch):
    monkeypatch.setattr(
        supabase_service,
        "require_role",
        Mock(return_value={"id": "admin-1", "app_metadata": {"role": "admin"}}),
    )
    monkeypatch.setattr(
        supabase_service,
        "create_staff_account",
        Mock(side_effect=supabase_service.UpstreamServiceError("secret detail")),
    )

    response = client.post(
        "/api/v1/staff-accounts",
        headers={"Authorization": "Bearer admin-token"},
        json={
            "full_name": "Head Worker",
            "email": "head@example.com",
            "password": "password123",
            "role": "head_worker",
        },
    )

    assert response.status_code == 503
    assert "secret detail" not in response.text


def test_staff_account_response_uses_uuid_and_datetime_types():
    assert StaffAccountResponse.model_fields["id"].annotation is UUID
    assert StaffAccountResponse.model_fields["created_at"].annotation is datetime
