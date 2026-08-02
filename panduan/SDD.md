# System Design Document (SDD)

## 1. Arsitektur sistem

```text
Expo Mobile
├─ Pekerja Kandang: alur anonim deteksi/simpan
└─ Staf: Supabase Auth + RoleGuard
       │ Authorization: Bearer JWT
       v
FastAPI
├─ routes.py: health, predict, save, stats, staff accounts
├─ workflow_routes.py: doctor/head-worker API
├─ ml_service.py: preprocessing + MobileNetV2
├─ supabase_service.py: Auth/Admin/Data API
└─ workflow_service.py: query, status, dan transisi workflow
       │ service_role
       v
Supabase
├─ Auth: app_metadata.role
├─ PostgreSQL: workers, predictions, staff/workflow
└─ Storage: feses-images
```

Pekerja tidak memiliki sesi. Ketiga role staf menggunakan form `/login` yang sama. Mobile mengendalikan pengalaman navigasi, tetapi backend dan database tetap menjadi sumber penegakan keamanan/transisi.

## 2. Model data

### 2.1 `workers`

Menyimpan identitas pekerja kandang non-login untuk standarisasi `worker_id` saat menyimpan prediksi.

| Kolom | Keterangan |
|---|---|
| `id` | UUID primary key. |
| `name` | Nama pekerja. |
| `is_active` | Menentukan kemunculan pada dropdown. |
| `created_at` | Waktu dibuat. |

### 2.2 `predictions`

Menyimpan hasil AI yang dipilih pengguna untuk disimpan.

| Kolom penting | Keterangan |
|---|---|
| `id` | UUID primary key. |
| `image_url` | URL foto pada Storage. |
| `prediction` | Label AI. |
| `confidence` | Confidence kelas utama. |
| `all_predictions` | Distribusi empat kelas. |
| `worker_id` | Foreign key ke `workers`. |
| `deleted_at` | Penanda soft delete Admin. |
| `created_at` | Waktu penyimpanan. |

### 2.3 `staff_profiles`

Identitas tampilan akun staf yang mereferensikan `auth.users`.

| Kolom | Keterangan |
|---|---|
| `user_id` | UUID primary/foreign key ke Auth. |
| `full_name` | Nama staf. |
| `email` | Email login. |
| `role` | `admin`, `veterinarian`, atau `head_worker`. |
| `created_at` | Waktu profil dibuat. |

Role otorisasi tetap di `auth.users.raw_app_meta_data.role`; `staff_profiles.role` adalah representasi relasional yang dijaga saat provisioning.

### 2.4 `prediction_validations`

| Kolom | Keterangan |
|---|---|
| `id` | UUID primary key. |
| `prediction_id` | Unique FK; satu validasi per prediksi. |
| `veterinarian_id` | FK ke `staff_profiles`. |
| `verdict` | `matching`, `incorrect`, atau `uncertain`. |
| `corrected_prediction` | Wajib hanya untuk `incorrect`. |
| `note` | Catatan opsional. |
| `created_at`, `updated_at` | Audit waktu. |

Validasi tidak dapat dihapus. Edit mengunci `prediction_id`, validator, dan berhenti diperbolehkan setelah treatment mulai.

### 2.5 `prediction_followups`

| Kolom | Keterangan |
|---|---|
| `prediction_id` | Primary/foreign key ke `predictions`. |
| `isolated_at`, `isolated_by` | Waktu dan Kepala Pekerja yang memisahkan. |
| `treatment_started_at`, `treatment_started_by` | Audit mulai penanganan. |
| `treatment_completed_at`, `treatment_completed_by` | Audit selesai. |
| `closed_at`, `close_reason`, `closed_by` | Penutupan otomatis koreksi Healthy. |
| `created_at`, `updated_at` | Audit waktu. |

Setiap pasangan waktu/aktor harus sama-sama null atau sama-sama terisi.

## 3. Trigger dan konsistensi transaksi

1. Endpoint simpan membatasi label ke empat kelas model dan mengembalikan `422` untuk label lain. `predictions_create_followup` berjalan setelah insert dan hanya membuat follow-up untuk `Coccidiosis`, `New Castle Disease`, atau `Salmonellosis`; `Healthy` dilewati. Karena tidak ada perintah backfill, data sebelum migration tetap di luar workflow.
2. `prediction_validations_enforce_workflow` memastikan target punya follow-up, validator adalah `veterinarian`, koreksi valid dan berbeda, serta edit belum terkunci.
3. Unique constraint menjadikan validasi pertama pemenang saat dua dokter menyimpan bersamaan.
4. `prediction_validations_sync_followup` menutup kasus ketika koreksi `Healthy` dan dapat membuka kembali penutupan tersebut bila koreksi diedit sebelum treatment.
5. `prediction_followups_enforce_ordering` mensyaratkan pemisahan dan validasi definitif sebelum treatment, lalu treatment start sebelum complete.

Status API dihitung dari kombinasi kolom tersebut: `pending_isolation`, `pending_validation`, `requires_examination`, `ready_for_treatment`, `active_treatment`, `treatment_completed`, atau `auto_closed`.

## 4. Autentikasi dan otorisasi

`_require_role()` mengambil Bearer token, memverifikasi user ke Supabase, lalu membandingkan role dengan exact role endpoint. Mapping mobile:

| `app_metadata.role` | Route |
|---|---|
| `admin` | `/admin` |
| `veterinarian` | `/doctor` |
| `head_worker` | `/head-worker` |

Role tidak dikenal tidak mempunyai mapping dan session diakhiri. Existing Auth users diberi role Admin dan `staff_profiles` saat migration agar akses lama tetap berfungsi.

Mobile memisahkan dua client HTTP. `services/api.ts` hanya digunakan alur pekerja anonim dan `baseURL`-nya boleh mengikuti URL khusus dari Pengaturan; client ini tidak membaca sesi Supabase maupun memasang Bearer token. Seluruh endpoint staf memakai `services/staffApi.ts` dengan `baseURL` tetap `API_URL`. Interceptor `staffApi` memasang token hanya bila origin tujuan sama persis dengan origin bawaan dan menghapus `Authorization` untuk tujuan asing atau URL tidak valid.

## 5. API contract

### 5.1 Publik/anonim

| Method | Endpoint | Input/hasil |
|---|---|---|
| `GET` | `/`, `/api/v1/health` | Status model. |
| `POST` | `/api/v1/predict` | Multipart `file`; menghasilkan kelas, confidence, threshold, probabilitas, rekomendasi, disclaimer. |
| `POST` | `/api/v1/predictions` | Multipart `file`, `prediction`, `confidence`, `all_predictions`, `worker_id`; menyimpan foto/prediksi. |

### 5.2 Admin

| Method | Endpoint | Kontrak |
|---|---|---|
| `GET` | `/api/v1/stats?period=week|month|year&reference_date=YYYY-MM-DD` | Statistik kelas pada rentang backend. |
| `POST` | `/api/v1/staff-accounts` | JSON `full_name`, `email`, `password`, `role`; role hanya `veterinarian`/`head_worker`. |

Response akun staf memuat `id`, `full_name`, `email`, `role`, dan `created_at`. Provisioning membuat Auth user dengan role di app metadata dan baris `staff_profiles`. Respons duplikat eksplisit dari Supabase selalu menghasilkan konflik HTTP `409` tanpa rekonsiliasi. Rekonsiliasi identitas deterministik hanya dipakai saat hasil pembuatan tidak pasti, seperti timeout, respons `5xx`, atau respons sukses yang tidak dapat dibaca.

### 5.3 Dokter Hewan

| Method | Endpoint | Kontrak |
|---|---|---|
| `GET` | `/api/v1/doctor/validations/pending` | Filter opsional `disease`, `date_from`, `date_to`, `limit`, `offset`. |
| `GET` | `/api/v1/doctor/validations/history` | Filter opsional `verdict`, penyakit/tanggal/pagination; scope user token. |
| `POST` | `/api/v1/doctor/validations` | `prediction_id`, `verdict`, `corrected_prediction?`, `note?`. |
| `PATCH` | `/api/v1/doctor/validations/{validation_id}` | Memperbarui verdict/koreksi/catatan milik sendiri. |

### 5.4 Kepala Pekerja

| Method | Endpoint | Kontrak |
|---|---|---|
| `GET` | `/api/v1/head-worker/dashboard` | Empat count hari ini dan `latest_cases`. |
| `GET` | `/api/v1/head-worker/follow-ups` | Filter opsional `status`, `disease`, tanggal, limit, offset. |
| `POST` | `/api/v1/head-worker/follow-ups/{prediction_id}/isolate` | Isi audit pemisahan dari token. |
| `POST` | `/api/v1/head-worker/follow-ups/{prediction_id}/treatment/start` | Memulai bila syarat terpenuhi. |
| `POST` | `/api/v1/head-worker/follow-ups/{prediction_id}/treatment/complete` | Menyelesaikan treatment aktif. |

Response workflow memakai envelope `status` dan `data`. Item dapat memuat data AI, validasi, label efektif, status, rekomendasi, audit follow-up, serta flag `editable`.

## 6. RLS dan Data API

- Ketiga tabel staf/workflow mengaktifkan RLS dan mencabut semua privilege dari `anon`/`authenticated`.
- Privilege eksplisit diberikan kepada `service_role`; akses workflow selalu melalui backend.
- `workers`: anonim hanya membaca pekerja aktif, authenticated dapat membaca daftar, Admin saja yang melakukan mutasi.
- `predictions`: policy client authenticated dibatasi Admin. Jalur pekerja menyimpan melalui backend.
- Secret service role hanya berada pada environment backend.

## 7. Desain navigasi mobile

```text
/
├─ result
├─ login
├─ admin
│  └─ tabs: Dashboard | Riwayat | Pengguna
├─ doctor
│  └─ tabs: Validasi | Riwayat
└─ head-worker
   └─ tabs: Dashboard | Tindak Lanjut
```

`RoleGuard` membungkus area terlindungi. Detail dan formulir Dokter/Kepala Pekerja adalah modal, bukan route/tab tambahan. `/admin/login` hanya redirect ke `/login` untuk kompatibilitas.

## 8. Data flow utama

### Deteksi

`Foto → validasi client → POST /predict → validasi/preprocess backend → MobileNetV2 → hasil + knowledge base → mobile`.

### Simpan dan workflow

`Simpan + worker_id → backend → Storage → predictions → trigger penyakit? → prediction_followups`.

### Validasi dan tindak lanjut

`Dokter POST/PATCH validation → constraint/trigger → label efektif/status → Kepala Pekerja isolate/start/complete → constraint urutan → audit trail`.

## 9. Keputusan desain tetap

- Rekomendasi tidak dihapus dan mengikuti koreksi dokter.
- Admin tidak mendapat halaman/data workflow dan CSV tidak berubah menjadi export workflow.
- Tidak ada halaman profil, push notification, identitas ayam, atau identitas kandang.
- Validasi hanya menilai prediksi penyakit, sehingga tidak dipakai sebagai matriks akurasi seluruh kelas model.
