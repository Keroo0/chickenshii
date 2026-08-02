import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def migration_sql() -> str:
    matches = sorted(
        (ROOT / "supabase" / "migrations").glob("*_add_staff_workflow.sql")
    )
    assert len(matches) == 1, "expected exactly one add_staff_workflow migration"
    return matches[0].read_text().lower()


def test_migration_defines_staff_workflow_tables_and_constraints():
    sql = migration_sql()

    assert "create table public.staff_profiles" in sql
    assert "create table public.prediction_validations" in sql
    assert "create table public.prediction_followups" in sql
    assert "references auth.users" in sql
    assert "references public.predictions" in sql
    assert "unique" in sql
    assert "corrected_prediction is not null" in sql
    assert all(role in sql for role in ("admin", "veterinarian", "head_worker"))
    assert all(verdict in sql for verdict in ("matching", "incorrect", "uncertain"))


def test_migration_has_triggered_workflow_invariants():
    sql = migration_sql()

    assert "after insert on public.predictions" in sql
    followup_function = sql.split(
        "create or replace function private.create_prediction_followup()", 1
    )[1].split("create trigger predictions_create_followup", 1)[0]
    assert all(
        disease in followup_function
        for disease in ("coccidiosis", "new castle disease", "salmonellosis")
    )
    assert "unknown disease" not in followup_function
    assert "new.prediction <> 'healthy'" not in followup_function
    assert "veterinarian_id" in sql
    assert (
        "role <> 'veterinarian'" in sql
        or "role is distinct from 'veterinarian'" in sql
    )
    assert "treatment_started_at" in sql
    assert "corrected_prediction" in sql
    assert "close_reason" in sql and "corrected_healthy" in sql
    assert "isolation" in sql
    assert "definitive" in sql
    assert "treatment_completed_at" in sql
    assert "updated_at" in sql
    assert "create schema if not exists private" in sql


def test_followup_closure_is_atomic_and_owned_by_correcting_veterinarian():
    sql = migration_sql()

    assert "closed_by uuid references public.staff_profiles(user_id)" in sql
    assert "prediction_followups_close_fields" in sql
    assert re.search(
        r"closed_at\s+is\s+null\s+and\s+close_reason\s+is\s+null\s+and\s+closed_by\s+is\s+null",
        sql,
    )
    assert re.search(
        r"closed_at\s+is\s+not\s+null\s+and\s+close_reason\s+is\s+not\s+null\s+and\s+closed_by\s+is\s+not\s+null",
        sql,
    )
    assert "closed_by = new.veterinarian_id" in sql
    assert re.search(
        r"set\s+closed_at\s*=\s*null,\s*close_reason\s*=\s*null,\s*closed_by\s*=\s*null",
        sql,
    )


def test_followup_audit_stages_are_immutable_after_being_recorded():
    sql = migration_sql()
    followup_function = sql.split(
        "create or replace function private.validate_prediction_followup_ordering()", 1
    )[1].split("create trigger prediction_followups_enforce_ordering", 1)[0]

    immutable_pairs = (
        ("isolated_at", "isolated_by"),
        ("treatment_started_at", "treatment_started_by"),
        ("treatment_completed_at", "treatment_completed_by"),
    )
    for timestamp, actor in immutable_pairs:
        assert f"old.{timestamp} is not null" in followup_function
        assert f"new.{timestamp} is distinct from old.{timestamp}" in followup_function
        assert f"new.{actor} is distinct from old.{actor}" in followup_function

    assert "old.closed_at is not null" in followup_function
    for field in ("closed_at", "close_reason", "closed_by"):
        assert f"new.{field} is distinct from old.{field}" in followup_function
    assert "recorded closure audit fields cannot be changed" in followup_function

    # The guards compare only audit columns, so an unrelated-field update keeps
    # passing as long as every previously recorded audit value remains identical.
    assert "new.updated_at is distinct from old.updated_at" not in followup_function


def test_corrected_healthy_closure_can_only_reopen_for_a_changed_validation():
    sql = migration_sql()
    followup_function = sql.split(
        "create or replace function private.validate_prediction_followup_ordering()", 1
    )[1].split("create trigger prediction_followups_enforce_ordering", 1)[0]

    assert "old.close_reason = 'corrected_healthy'" in followup_function
    assert "old.treatment_started_at is null" in followup_function
    assert all(
        f"new.{field} is null" in followup_function
        for field in ("closed_at", "close_reason", "closed_by")
    )
    assert "from public.prediction_validations" in followup_function
    assert "v.prediction_id = new.prediction_id" in followup_function
    assert "v.verdict = 'incorrect'" in followup_function
    assert "v.corrected_prediction = 'healthy'" in followup_function
    assert "can_reopen_corrected_healthy" in followup_function


def test_validation_identity_is_immutable_and_delete_is_forbidden():
    sql = migration_sql()

    assert "new.prediction_id is distinct from old.prediction_id" in sql
    assert "prediction_id cannot be changed" in sql
    assert "before insert or update or delete on public.prediction_validations" in sql
    assert "prediction validations cannot be deleted" in sql


def test_validation_update_locks_against_old_prediction_followup():
    sql = migration_sql()

    assert "workflow_prediction_id := old.prediction_id" in sql
    assert "where p.id = workflow_prediction_id" in sql
    assert "where prediction_id = old.prediction_id" in sql


def test_validation_and_treatment_transitions_share_followup_row_lock():
    sql = migration_sql()

    validation_function = sql.split(
        "create or replace function private.validate_prediction_validation()", 1
    )[1].split("create trigger prediction_validations_enforce_workflow", 1)[0]
    followup_function = sql.split(
        "create or replace function private.validate_prediction_followup_ordering()", 1
    )[1].split("create trigger prediction_followups_enforce_ordering", 1)[0]

    assert "for update of f" in validation_function
    assert validation_function.index("for update of f") < validation_function.index(
        "followup_treatment_started_at is not null"
    )
    assert "from public.prediction_followups" in followup_function
    assert "for update" in followup_function


def test_workflow_transitions_lock_then_reject_soft_deleted_predictions():
    sql = migration_sql()
    validation_function = sql.split(
        "create or replace function private.validate_prediction_validation()", 1
    )[1].split("create trigger prediction_validations_enforce_workflow", 1)[0]
    followup_function = sql.split(
        "create or replace function private.validate_prediction_followup_ordering()", 1
    )[1].split("create trigger prediction_followups_enforce_ordering", 1)[0]

    for function_sql in (validation_function, followup_function):
        assert "select p.deleted_at" in function_sql
        assert "from public.predictions p" in function_sql
        assert "for update" in function_sql
        assert "prediction_deleted_at is not null" in function_sql
        assert "soft-deleted prediction" in function_sql

    assert validation_function.index("for update of f") < validation_function.index(
        "select p.deleted_at"
    )
    assert followup_function.index("from public.prediction_followups f") < (
        followup_function.index("select p.deleted_at")
    )


def test_migration_does_not_backfill_followups():
    sql = migration_sql()

    assert not re.search(
        r"insert\s+into\s+(?:public\.)?prediction_followups(?:(?!;).)*\bselect\b",
        sql,
        re.DOTALL,
    )


def test_migration_locks_down_new_tables_and_replaces_broad_policies():
    sql = migration_sql()

    for table in ("staff_profiles", "prediction_validations", "prediction_followups"):
        assert f"alter table public.{table} enable row level security" in sql
        assert re.search(
            rf"grant\s+all\s+on\s+table\s+public\.{table}\s+to\s+service_role",
            sql,
        )
        assert re.search(
            rf"revoke\s+all\s+on\s+table\s+public\.{table}\s+from\s+anon,\s*authenticated",
            sql,
        )

    assert "anon_select_active_workers" in sql
    assert 'create policy "authenticated_select_all_workers"' not in sql
    assert re.search(
        r'create\s+policy\s+"admin_select_workers"(?:(?!;).)*for\s+select'
        r'(?:(?!;).)*to\s+authenticated(?:(?!;).)*app_metadata'
        r"(?:(?!;).)*role'\)\s*=\s*'admin'",
        sql,
        re.DOTALL,
    )
    assert "app_metadata" in sql
    assert "role' = 'admin'" in sql or "role') = 'admin'" in sql
    assert "drop policy if exists \"authenticated_insert_workers\"" in sql
    assert "drop policy if exists \"authenticated_update_workers\"" in sql
    assert "drop policy if exists \"authenticated_select_predictions\"" in sql
    assert "drop policy if exists \"authenticated_update_predictions\"" in sql


def test_migration_bootstraps_existing_users_without_erasing_metadata():
    sql = migration_sql()

    assert "update auth.users" in sql
    assert "raw_app_meta_data" in sql
    assert "coalesce(raw_app_meta_data" in sql
    assert "jsonb_build_object('role', 'admin')" in sql
    assert "insert into public.staff_profiles" in sql
    assert "from auth.users" in sql
    assert "on conflict (user_id) do nothing" in sql
