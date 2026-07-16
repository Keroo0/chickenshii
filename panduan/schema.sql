-- ============================================================
-- ChickenShii — Database Schema (Supabase / PostgreSQL)
-- Jalankan file ini di Supabase SQL Editor secara berurutan.
-- Referensi: SDD.md bagian 2 (Skema Database)
-- ============================================================

-- Extension untuk generate UUID
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. Tabel: workers
-- Daftar Pekerja Kandang yang dikelola Admin, jadi sumber
-- dropdown saat Pekerja Kandang menekan tombol Simpan.
-- ------------------------------------------------------------
create table if not exists workers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table workers is 'Daftar Pekerja Kandang, dikelola Admin dari app/admin/workers.tsx';
comment on column workers.is_active is 'false = dinonaktifkan, tidak muncul lagi di dropdown Simpan';

-- ------------------------------------------------------------
-- 2. Tabel: predictions
-- Riwayat setiap prediksi yang disimpan (bukan setiap inference,
-- hanya yang ditekan tombol Simpan-nya).
-- ------------------------------------------------------------
create table if not exists predictions (
  id                uuid primary key default uuid_generate_v4(),
  image_url         text not null,
  prediction        text not null,
  confidence        float8 not null,
  all_predictions   jsonb not null,
  worker_id         uuid not null references workers(id),
  deleted_at        timestamptz,
  created_at        timestamptz not null default now()
);

comment on table predictions is 'Riwayat prediksi tersimpan. Selalu filter WHERE deleted_at IS NULL pada query baca.';
comment on column predictions.deleted_at is 'Soft delete marker. NULL = masih aktif/tampil.';
comment on column predictions.worker_id is 'FK ke workers.id — Pekerja Kandang yang mengambil gambar.';

-- ------------------------------------------------------------
-- 3. Index — buat mempercepat query yang sering dipakai
-- ------------------------------------------------------------
create index if not exists idx_predictions_worker_id  on predictions (worker_id);
create index if not exists idx_predictions_created_at on predictions (created_at);
create index if not exists idx_predictions_deleted_at on predictions (deleted_at);
create index if not exists idx_predictions_prediction  on predictions (prediction);
create index if not exists idx_workers_is_active       on workers (is_active);

-- ------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- Ref: SDD.md bagian 2.4
-- ------------------------------------------------------------
alter table workers     enable row level security;
alter table predictions enable row level security;

-- workers: Pekerja Kandang (anon, tanpa login) cuma boleh liat yang aktif
create policy "anon_select_active_workers"
  on workers for select
  to anon
  using (is_active = true);

-- workers: Admin (authenticated) boleh liat semua, termasuk yang nonaktif
create policy "authenticated_select_all_workers"
  on workers for select
  to authenticated
  using (true);

-- workers: Admin boleh tambah pekerja baru
create policy "authenticated_insert_workers"
  on workers for insert
  to authenticated
  with check (true);

-- workers: Admin boleh update (misal toggle is_active)
create policy "authenticated_update_workers"
  on workers for update
  to authenticated
  using (true);

-- predictions: Admin boleh baca riwayat (dashboard, search/filter, export CSV)
create policy "authenticated_select_predictions"
  on predictions for select
  to authenticated
  using (true);

-- predictions: Admin boleh update (dipakai khusus untuk soft delete via deleted_at)
create policy "authenticated_update_predictions"
  on predictions for update
  to authenticated
  using (true);

-- Catatan: sengaja TIDAK ada policy INSERT untuk anon/authenticated pada
-- predictions. Insert cuma boleh lewat backend FastAPI yang pakai
-- service_role key (otomatis bypass RLS). Ini mencegah Pekerja Kandang
-- atau Admin insert baris langsung dari client tanpa lewat validasi
-- backend (upload gambar ke Storage, cek worker_id valid & aktif, dst).

-- ------------------------------------------------------------
-- 5. Storage Bucket: feses-images
-- Ref: SDD.md bagian 2.3
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('feses-images', 'feses-images', true)
on conflict (id) do nothing;

-- Publik boleh baca gambar (buat nampilin thumbnail di dashboard admin)
create policy "public_read_feses_images"
  on storage.objects for select
  to public
  using (bucket_id = 'feses-images');

-- Catatan: sengaja TIDAK ada policy INSERT di sini juga. Upload gambar
-- cuma boleh lewat backend (service_role key), sesuai SRS 3.1 &
-- larangan di SDD 2.3 ("Hanya backend terotorisasi yang dapat
-- melakukan INSERT ke bucket ini").
