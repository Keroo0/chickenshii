# ERD (Entity Relationship Diagram) — ChickenShii

## Tujuan
Menggambarkan struktur tabel database Supabase (PostgreSQL) dan relasi antar tabel yang digunakan sistem.

## Tabel

### `workers` — Daftar Pekerja Kandang
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | Primary key, auto-generate |
| `name` | TEXT | Nama pekerja kandang, Not Null |
| `is_active` | BOOLEAN | Status aktif/nonaktif, default `true` |
| `created_at` | TIMESTAMPTZ | Waktu pendaftaran, default `NOW()` |

### `predictions` — Riwayat Prediksi
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | Primary key, auto-generate |
| `image_url` | TEXT | URL foto feses di Supabase Storage |
| `prediction` | TEXT | Kelas penyakit hasil deteksi |
| `confidence` | FLOAT8 | Skor kepercayaan (0.0–100.0) |
| `all_predictions` | JSONB | Probabilitas lengkap 4 kelas |
| `worker_id` | UUID (FK) | Referensi ke `workers.id`, Not Null |
| `deleted_at` | TIMESTAMPTZ | Penanda soft delete, nullable |
| `created_at` | TIMESTAMPTZ | Waktu prediksi disimpan |

## Relasi
- `workers` **1 : banyak** `predictions` (via `worker_id`)
- Satu pekerja dapat memiliki banyak riwayat prediksi
- Jika pekerja dinonaktifkan, riwayat lamanya tetap utuh (tidak dihapus)

## Storage Bucket
- **`feses-images`**: Menyimpan foto feses yang diupload. Akses read publik, write hanya via backend menggunakan Service Role Key.
