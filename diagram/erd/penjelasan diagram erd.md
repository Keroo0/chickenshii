# Penjelasan Diagram ERD ChickenShii

## Tujuan

Diagram ini menjelaskan struktur data untuk deteksi Pekerja Kandang, administrasi oleh Admin, validasi Dokter Hewan, dan tindak lanjut Kepala Pekerja.

## Jenis Diagram

Gunakan **Entity Relationship Diagram** dengan notasi Crow's Foot di Visual Paradigm Online.

## Elemen

### `workers`

`id UUID PK NOT NULL`, `name TEXT NOT NULL`, `is_active BOOLEAN NOT NULL`, `created_at TIMESTAMPTZ NOT NULL`.

### `predictions`

`id UUID PK NOT NULL`, `worker_id UUID FK NOT NULL → workers.id`, `image_url TEXT NOT NULL`, `prediction TEXT NOT NULL`, `confidence FLOAT8 NOT NULL`, `all_predictions JSONB NOT NULL`, `deleted_at TIMESTAMPTZ NULL`, `created_at TIMESTAMPTZ NOT NULL`.

### `auth.users` (referensi eksternal)

`id UUID PK NOT NULL`, `email VARCHAR NULL`, `raw_app_meta_data JSONB NULL` yang memuat `role`. Pada JWT, nilai aman ini dibaca sebagai `app_metadata.role`. Tiga role login: `admin`, `veterinarian`, `head_worker`; Pekerja Kandang tidak mempunyai akun.

### `staff_profiles`

`user_id UUID PK/FK NOT NULL → auth.users.id`, `full_name TEXT NOT NULL`, `email TEXT NULL`, `role TEXT NOT NULL`, `created_at TIMESTAMPTZ NOT NULL`.

### `prediction_validations`

`id UUID PK NOT NULL`, `prediction_id UUID FK NOT NULL UNIQUE → predictions.id`, `veterinarian_id UUID FK NOT NULL → staff_profiles.user_id`, `verdict TEXT NOT NULL`, `corrected_prediction TEXT NULL`, `note TEXT NULL`, `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`.

### `prediction_followups`

| Kolom | Tipe dan aturan |
|---|---|
| `prediction_id` | UUID PK/FK NOT NULL → predictions.id |
| `isolated_at` | TIMESTAMPTZ NULL |
| `isolated_by` | UUID FK NULL → staff_profiles.user_id |
| `treatment_started_at` | TIMESTAMPTZ NULL |
| `treatment_started_by` | UUID FK NULL → staff_profiles.user_id |
| `treatment_completed_at` | TIMESTAMPTZ NULL |
| `treatment_completed_by` | UUID FK NULL → staff_profiles.user_id |
| `closed_at` | TIMESTAMPTZ NULL |
| `close_reason` | TEXT NULL; bila terisi hanya `corrected_healthy` |
| `closed_by` | UUID FK NULL → staff_profiles.user_id |
| `created_at` | TIMESTAMPTZ NOT NULL |
| `updated_at` | TIMESTAMPTZ NOT NULL |

Setiap pasangan waktu/aktor harus sama-sama NULL atau sama-sama terisi. Ketiga kolom aktor Kepala Pekerja adalah `isolated_by`, `treatment_started_by`, dan `treatment_completed_by`; `closed_by` diisi Dokter Hewan saat koreksi Healthy.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > Entity Relationship Diagram** dan notasi Crow's Foot.
2. Buat enam entitas di atas; tandai PK, FK, UNIQUE, NULL, dan tipe data.
3. Hubungkan workers `1` ke predictions `0..*` melalui worker_id.
4. Hubungkan auth.users `1` ke staff_profiles `0..1` melalui user_id.
5. Hubungkan predictions `1` ke prediction_validations `0..1`; constraint UNIQUE pada prediction_id menunjukkan **satu record validasi per prediksi**, sehingga record tersebut hanya mencatat satu veterinarian_id.
6. Hubungkan staff_profiles `1` ke prediction_validations `0..*` melalui veterinarian_id.
7. Hubungkan predictions `1` ke prediction_followups `0..1`. Gambar empat relasi bernama dari staff_profiles ke followups: `melakukan pemisahan (isolated_by)`, `memulai penanganan (treatment_started_by)`, `menyelesaikan penanganan (treatment_completed_by)`, dan `menutup otomatis (closed_by)`.
8. Tambahkan Note: endpoint menolak label di luar empat kelas model dengan `422`; trigger hanya membuat follow-up untuk prediksi baru `Coccidiosis`, `New Castle Disease`, atau `Salmonellosis`, sedangkan `Healthy` dilewati; tidak ada backfill data lama.
9. Tambahkan constraint notes untuk koreksi wajib pada verdict incorrect, penguncian edit setelah penanganan dimulai, urutan pemisahan–mulai–selesai, dan penutupan otomatis saat koreksi Healthy.

## Konektor dan Relasi

- Garis solid dengan Crow's Foot untuk FK.
- `predictions`–`prediction_validations` adalah `1 : 0..1`.
- `predictions`–`prediction_followups` adalah `1 : 0..1`, sebab Healthy dan data lama tidak memiliki follow-up.
- `staff_profiles`–`prediction_validations`: satu profil dapat membuat `0..*` validasi; setiap validasi wajib memiliki tepat `1` profil Dokter Hewan.
- Untuk masing-masing dari empat FK aktor, satu profil dapat muncul pada `0..*` follow-up dan satu follow-up memiliki `0..1` profil pada peran relasi tersebut. Aksi pemisahan/mulai/selesai memakai Kepala Pekerja; closed_by memakai Dokter Hewan saat koreksi Healthy.

## Saran Tata Letak

Letakkan predictions di tengah, workers di kiri, auth.users dan staff_profiles di atas, lalu validations dan followups di kanan. Tempelkan constraint note di dekat entitas terkait.

## Penjelasan Diagram untuk Laporan

Tabel workers dan predictions mempertahankan alur deteksi anonim Pekerja Kandang serta pengelolaan oleh Admin. Identitas akun staf disimpan dalam staff_profiles, sedangkan otorisasi bersumber dari app_metadata Supabase Auth. Satu prediksi paling banyak memiliki satu prediction_validations dari Dokter Hewan dan satu prediction_followups yang dikerjakan Kepala Pekerja. Follow-up hanya dibuat untuk prediksi penyakit baru; koreksi Healthy menutupnya otomatis.

## Checklist

- [ ] Enam entitas, PK, FK, UNIQUE, dan nullable terlihat.
- [ ] Pekerja Kandang, Admin, Dokter Hewan, dan Kepala Pekerja dijelaskan.
- [ ] Kardinalitas validasi dan follow-up adalah 1 ke 0..1.
- [ ] Tiga tabel baru tercantum: staff_profiles, prediction_validations, prediction_followups.
- [ ] Trigger dan constraint workflow diberi note.
