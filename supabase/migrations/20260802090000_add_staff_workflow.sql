create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (btrim(full_name) <> ''),
  email text,
  role text not null check (role in ('admin', 'veterinarian', 'head_worker')),
  created_at timestamptz not null default now()
);

create table public.prediction_validations (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null unique
    references public.predictions(id) on delete cascade,
  veterinarian_id uuid not null
    references public.staff_profiles(user_id),
  verdict text not null
    check (verdict in ('matching', 'incorrect', 'uncertain')),
  corrected_prediction text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prediction_validations_correction_shape check (
    (
      verdict = 'incorrect'
      and corrected_prediction is not null
      and corrected_prediction in (
        'Coccidiosis',
        'Healthy',
        'New Castle Disease',
        'Salmonellosis'
      )
    )
    or (verdict <> 'incorrect' and corrected_prediction is null)
  )
);

create table public.prediction_followups (
  prediction_id uuid primary key
    references public.predictions(id) on delete cascade,
  isolated_at timestamptz,
  isolated_by uuid references public.staff_profiles(user_id),
  treatment_started_at timestamptz,
  treatment_started_by uuid references public.staff_profiles(user_id),
  treatment_completed_at timestamptz,
  treatment_completed_by uuid references public.staff_profiles(user_id),
  closed_at timestamptz,
  close_reason text check (close_reason is null or close_reason = 'corrected_healthy'),
  closed_by uuid references public.staff_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prediction_followups_isolation_pair check (
    (isolated_at is null) = (isolated_by is null)
  ),
  constraint prediction_followups_treatment_start_pair check (
    (treatment_started_at is null) = (treatment_started_by is null)
  ),
  constraint prediction_followups_treatment_complete_pair check (
    (treatment_completed_at is null) = (treatment_completed_by is null)
  ),
  constraint prediction_followups_close_fields check (
    (closed_at is null and close_reason is null and closed_by is null)
    or (
      closed_at is not null
      and close_reason is not null
      and closed_by is not null
    )
  )
);

create index prediction_validations_veterinarian_history_idx
  on public.prediction_validations (veterinarian_id, created_at desc);
create index prediction_validations_created_at_idx
  on public.prediction_validations (created_at desc);
create index prediction_followups_open_queue_idx
  on public.prediction_followups (
    treatment_started_at,
    isolated_at,
    created_at
  )
  where closed_at is null;
create index prediction_followups_updated_at_idx
  on public.prediction_followups (updated_at desc);

alter table public.staff_profiles enable row level security;
alter table public.prediction_validations enable row level security;
alter table public.prediction_followups enable row level security;

revoke all on table public.staff_profiles from anon, authenticated;
revoke all on table public.prediction_validations from anon, authenticated;
revoke all on table public.prediction_followups from anon, authenticated;
grant all on table public.staff_profiles to service_role;
grant all on table public.prediction_validations to service_role;
grant all on table public.prediction_followups to service_role;

-- Existing users predate staff roles. Preserve every existing app-metadata key
-- while assigning those users the legacy-equivalent administrator role.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin');

insert into public.staff_profiles (user_id, full_name, email, role, created_at)
select
  id,
  coalesce(
    nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(email), ''),
    'Administrator'
  ),
  email,
  'admin',
  created_at
from auth.users
on conflict (user_id) do nothing;

-- Replace the original authenticated-wide policies. Anonymous users retain
-- read-only access to active workers. Only administrators can read or mutate the
-- full worker directory or access prediction rows directly from a client.
drop policy if exists "anon_select_active_workers" on public.workers;
drop policy if exists "authenticated_select_all_workers" on public.workers;
drop policy if exists "authenticated_insert_workers" on public.workers;
drop policy if exists "authenticated_update_workers" on public.workers;
drop policy if exists "admin_select_workers" on public.workers;
drop policy if exists "admin_insert_workers" on public.workers;
drop policy if exists "admin_update_workers" on public.workers;
drop policy if exists "admin_delete_workers" on public.workers;

create policy "anon_select_active_workers"
  on public.workers for select
  to anon
  using (is_active = true);

create policy "admin_select_workers"
  on public.workers for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_insert_workers"
  on public.workers for insert
  to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_update_workers"
  on public.workers for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_delete_workers"
  on public.workers for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "authenticated_select_predictions" on public.predictions;
drop policy if exists "authenticated_update_predictions" on public.predictions;
drop policy if exists "admin_select_predictions" on public.predictions;
drop policy if exists "admin_insert_predictions" on public.predictions;
drop policy if exists "admin_update_predictions" on public.predictions;
drop policy if exists "admin_delete_predictions" on public.predictions;

create policy "admin_select_predictions"
  on public.predictions for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_insert_predictions"
  on public.predictions for insert
  to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_update_predictions"
  on public.predictions for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_delete_predictions"
  on public.predictions for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function private.set_staff_workflow_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, private
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger prediction_validations_set_updated_at
before update on public.prediction_validations
for each row execute function private.set_staff_workflow_updated_at();

create trigger prediction_followups_set_updated_at
before update on public.prediction_followups
for each row execute function private.set_staff_workflow_updated_at();

create or replace function private.create_prediction_followup()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if new.prediction in (
    'Coccidiosis',
    'New Castle Disease',
    'Salmonellosis'
  ) then
    insert into public.prediction_followups (prediction_id)
    values (new.id);
  end if;
  return new;
end;
$$;

create trigger predictions_create_followup
after insert on public.predictions
for each row execute function private.create_prediction_followup();

create or replace function private.validate_prediction_validation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  ai_prediction text;
  followup_treatment_started_at timestamptz;
  prediction_deleted_at timestamptz;
  validator_role text;
  workflow_prediction_id uuid;
begin
  if tg_op = 'DELETE' then
    raise exception using
      errcode = '23514',
      message = 'Prediction validations cannot be deleted';
  end if;

  if tg_op = 'UPDATE' then
    if new.prediction_id is distinct from old.prediction_id then
      raise exception using
        errcode = '23514',
        message = 'prediction_id cannot be changed after validation is created';
    end if;
    workflow_prediction_id := old.prediction_id;
  else
    workflow_prediction_id := new.prediction_id;
  end if;

  select p.prediction, f.treatment_started_at
    into ai_prediction, followup_treatment_started_at
  from public.predictions p
  join public.prediction_followups f on f.prediction_id = p.id
  where p.id = workflow_prediction_id
  for update of f;

  if not found or ai_prediction = 'Healthy' then
    raise exception using
      errcode = '23514',
      message = 'Validation is only allowed for a non-Healthy prediction with a follow-up';
  end if;

  -- Keep the deadlock-safe row-lock order: follow-up first, prediction second.
  -- Re-read deleted_at while holding the prediction lock so a concurrent soft
  -- delete cannot race with validation creation or editing.
  select p.deleted_at
    into prediction_deleted_at
  from public.predictions p
  where p.id = workflow_prediction_id
  for update;

  if not found or prediction_deleted_at is not null then
    raise exception using
      errcode = '23514',
      message = 'Workflow cannot be changed for a soft-deleted prediction';
  end if;

  select sp.role
    into validator_role
  from public.staff_profiles sp
  where sp.user_id = new.veterinarian_id;

  if validator_role is distinct from 'veterinarian' then
    raise exception using
      errcode = '23514',
      message = 'veterinarian_id must reference a staff profile with the veterinarian role';
  end if;

  if tg_op = 'UPDATE' and followup_treatment_started_at is not null then
    raise exception using
      errcode = '23514',
      message = 'A validation cannot be changed after treatment has started';
  end if;

  if new.verdict = 'incorrect' and new.corrected_prediction = ai_prediction then
    raise exception using
      errcode = '23514',
      message = 'An incorrect verdict must correct the AI prediction to a different label';
  end if;

  return new;
end;
$$;

create trigger prediction_validations_enforce_workflow
before insert or update or delete on public.prediction_validations
for each row execute function private.validate_prediction_validation();

create or replace function private.sync_followup_with_validation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if new.verdict = 'incorrect' and new.corrected_prediction = 'Healthy' then
    update public.prediction_followups
    set closed_at = coalesce(closed_at, now()),
        close_reason = 'corrected_healthy',
        closed_by = new.veterinarian_id
    where prediction_id = new.prediction_id;
  elsif tg_op = 'UPDATE'
    and old.verdict = 'incorrect'
    and old.corrected_prediction = 'Healthy' then
    update public.prediction_followups
    set closed_at = null,
        close_reason = null,
        closed_by = null
    where prediction_id = old.prediction_id
      and close_reason = 'corrected_healthy';
  end if;

  return new;
end;
$$;

create trigger prediction_validations_sync_followup
after insert or update on public.prediction_validations
for each row execute function private.sync_followup_with_validation();

create or replace function private.validate_prediction_followup_ordering()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  has_definitive_disease_validation boolean;
  can_reopen_corrected_healthy boolean;
  prediction_deleted_at timestamptz;
begin
  -- UPDATE already locks its target tuple; repeat the lock explicitly so this
  -- transition and validation changes visibly serialize on the same row.
  if tg_op = 'UPDATE' then
    perform 1
    from public.prediction_followups f
    where f.prediction_id = new.prediction_id
    for update;
  end if;

  -- UPDATE already owns the follow-up row. Lock the parent prediction only
  -- afterward, then re-read deleted_at under that lock to serialize with a
  -- concurrent Admin soft delete.
  select p.deleted_at
    into prediction_deleted_at
  from public.predictions p
  where p.id = new.prediction_id
  for update;

  if not found or prediction_deleted_at is not null then
    raise exception using
      errcode = '23514',
      message = 'Workflow cannot be changed for a soft-deleted prediction';
  end if;

  if tg_op = 'UPDATE' then
    -- Workflow audit stages are append-only. A recorded timestamp and actor
    -- cannot be cleared or rewritten by later updates.
    if old.isolated_at is not null and (
      new.isolated_at is distinct from old.isolated_at
      or new.isolated_by is distinct from old.isolated_by
    ) then
      raise exception using
        errcode = '23514',
        message = 'Recorded isolation audit fields cannot be changed';
    end if;

    if old.treatment_started_at is not null and (
      new.treatment_started_at is distinct from old.treatment_started_at
      or new.treatment_started_by is distinct from old.treatment_started_by
    ) then
      raise exception using
        errcode = '23514',
        message = 'Recorded treatment start audit fields cannot be changed';
    end if;

    if old.treatment_completed_at is not null and (
      new.treatment_completed_at is distinct from old.treatment_completed_at
      or new.treatment_completed_by is distinct from old.treatment_completed_by
    ) then
      raise exception using
        errcode = '23514',
        message = 'Recorded treatment completion audit fields cannot be changed';
    end if;

    if old.closed_at is not null and (
      new.closed_at is distinct from old.closed_at
      or new.close_reason is distinct from old.close_reason
      or new.closed_by is distinct from old.closed_by
    ) then
      -- A doctor may edit a pre-treatment Healthy correction. The validation
      -- sync trigger then reopens that automatically closed case. This exact
      -- transition is the sole exception to immutable closure audit fields.
      select exists (
        select 1
        from public.prediction_validations v
        where v.prediction_id = new.prediction_id
          and not (
            v.verdict = 'incorrect'
            and v.corrected_prediction = 'Healthy'
          )
      ) into can_reopen_corrected_healthy;

      if not (
        old.close_reason = 'corrected_healthy'
        and old.treatment_started_at is null
        and new.closed_at is null
        and new.close_reason is null
        and new.closed_by is null
        and can_reopen_corrected_healthy
      ) then
        raise exception using
          errcode = '23514',
          message = 'Recorded closure audit fields cannot be changed';
      end if;
    end if;
  end if;

  if new.treatment_started_at is not null and new.isolated_at is null then
    raise exception using
      errcode = '23514',
      message = 'Isolation must be recorded before treatment can start';
  end if;

  if new.treatment_started_at is not null
    and new.isolated_at > new.treatment_started_at then
    raise exception using
      errcode = '23514',
      message = 'Isolation must occur before treatment starts';
  end if;

  if new.treatment_started_at is not null then
    select exists (
      select 1
      from public.prediction_validations v
      where v.prediction_id = new.prediction_id
        and v.created_at <= new.treatment_started_at
        and (
          v.verdict = 'matching'
          or (
            v.verdict = 'incorrect'
            and v.corrected_prediction <> 'Healthy'
          )
        )
    ) into has_definitive_disease_validation;

    if not has_definitive_disease_validation then
      raise exception using
        errcode = '23514',
        message = 'A definitive disease validation is required before treatment can start';
    end if;
  end if;

  if new.treatment_completed_at is not null
    and new.treatment_started_at is null then
    raise exception using
      errcode = '23514',
      message = 'Treatment must be started before it can be completed';
  end if;

  if new.treatment_completed_at is not null
    and new.treatment_completed_at < new.treatment_started_at then
    raise exception using
      errcode = '23514',
      message = 'Treatment completion cannot precede treatment start';
  end if;

  return new;
end;
$$;

create trigger prediction_followups_enforce_ordering
before insert or update on public.prediction_followups
for each row execute function private.validate_prediction_followup_ordering();

revoke all on function private.set_staff_workflow_updated_at() from public, anon, authenticated;
revoke all on function private.create_prediction_followup() from public, anon, authenticated;
revoke all on function private.validate_prediction_validation() from public, anon, authenticated;
revoke all on function private.sync_followup_with_validation() from public, anon, authenticated;
revoke all on function private.validate_prediction_followup_ordering() from public, anon, authenticated;
