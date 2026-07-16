# Class Diagram — Backend FastAPI

## Tujuan
Menggambarkan struktur kelas utama pada backend FastAPI: service layer, schema Pydantic, dan router.

## Kelas

### `MLService` (`services/ml_service.py`)
- Memuat model `.keras` ke memori saat startup
- Fungsi `predict()`: resize gambar → normalisasi → inferensi → return dict hasil

### `SupabaseService` (`services/supabase_service.py`)
- `validate_worker_id()`: cek keberadaan worker dan `is_active = true`
- `upload_image()`: upload bytes gambar ke bucket Supabase Storage
- `insert_prediction()`: INSERT riwayat ke tabel `predictions`
- `get_stats()`: agregasi jumlah prediksi per kelas berdasarkan periode
- `verify_admin_token()`: validasi JWT Admin via Supabase Auth

### `Router` (`api/routes.py`)
- Mendelegasikan semua request ke `MLService` dan `SupabaseService`
- Empat endpoint: `GET /health`, `POST /predict`, `POST /predictions`, `GET /stats`

### Pydantic Schemas (`models/schemas.py`)
- `PredictionResponse`: struktur respons hasil deteksi
- `PredictionSaveResponse`: struktur respons setelah riwayat tersimpan
- `StatsResponse`: struktur respons statistik Dashboard Admin

## Hubungan
- `Router` menggunakan `MLService` dan `SupabaseService`
- `Router` mengembalikan respons dalam bentuk Pydantic schemas
