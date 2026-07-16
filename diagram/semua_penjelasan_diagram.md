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

---

# Sequence Diagram — Login Admin

## Tujuan
Menggambarkan alur autentikasi Admin dari form login hingga masuk ke Dashboard. Disajikan secara **garis besar**.

## Komponen yang Terlibat
| Komponen | Peran |
|----------|-------|
| **Mobile App** | Menampilkan form dan meneruskan kredensial |
| **Supabase Auth** | Memverifikasi email & password, menerbitkan JWT |
| **Secure Store** | Menyimpan token terenkripsi di level OS |

## Alur
1. Admin membuka `app/admin/login.tsx` dan mengisi email & password
2. Mobile mengirim kredensial ke Supabase Auth
3. Supabase Auth memvalidasi dan mengembalikan JWT token
4. Mobile menyimpan JWT ke `expo-secure-store` (Keychain/Keystore)
5. Mobile redirect ke Dashboard `app/admin/(tabs)/index.tsx`

## Catatan
- Setiap screen admin melakukan pengecekan sesi via `expo-secure-store` sebelum merender.
- Jika token kedaluwarsa atau tidak valid, sistem redirect otomatis ke `login.tsx`.
- Token **tidak pernah** disimpan sebagai plain text.

---

# Sequence Diagram — Proses Deteksi Penyakit

## Tujuan
Menggambarkan interaksi antar komponen saat Pekerja Kandang melakukan proses deteksi penyakit. Disajikan secara **garis besar**.

## Komponen yang Terlibat
| Komponen | Peran |
|----------|-------|
| **Mobile App** | Mengirim gambar dan menampilkan hasil |
| **Backend FastAPI** | Menerima gambar, validasi, preprocessing |
| **Model AI** | Melakukan inferensi MobileNetV2 |

## Alur
1. Mobile mengirim gambar hasil crop via `POST /api/v1/predict`
2. Backend memvalidasi tipe & ukuran file
3. Backend meneruskan gambar ke Model AI untuk inferensi
4. Model mengembalikan probabilitas 4 kelas penyakit
5. Backend melengkapi data dari Knowledge Base statis
6. Backend mengembalikan JSON hasil ke Mobile
7. Mobile menampilkan hasil prediksi ke pengguna

## Catatan
- Endpoint ini **tidak menyimpan** data apapun ke database.
- `confidence_threshold` (default 60.0) disertakan dalam respons agar Mobile dapat menentukan perlu tidaknya menampilkan peringatan confidence rendah.

---

# Activity Diagram — Admin

## Tujuan
Menggambarkan alur aktivitas Admin (pemilik farm) dari proses login hingga pengelolaan data. Disajikan secara **garis besar**.

## Alur Utama
1. Buka halaman login → masukkan email & password
2. Jika berhasil → masuk Dashboard
3. Dari Dashboard, Admin dapat memilih berbagai aksi manajemen

## Aksi yang Tersedia
| Aksi | Keterangan |
|------|------------|
| Lihat Statistik | Filter mingguan/bulanan/tahunan via `GET /api/v1/stats` |
| Filter Riwayat | Cari riwayat berdasarkan nama pekerja, kelas, atau tanggal |
| Hapus Riwayat | Soft delete — entri ditandai, tidak dihapus permanen |
| Kelola Pekerja | Tambah pekerja baru atau nonaktifkan pekerja |
| Export CSV | Unduh data riwayat ke file CSV |

## Catatan
- Sesi Admin divalidasi setiap kali screen admin dibuka.
- Jika token kedaluwarsa, sistem redirect otomatis ke halaman login.

---

# Flowchart — Pipeline Pelatihan Model AI

## Tujuan
Menggambarkan alur keseluruhan proses pelatihan model deep learning dari pengumpulan dataset hingga menghasilkan model terbaik.

## Dataset
| Sumber | Jumlah | Keterangan |
|--------|--------|------------|
| Kaggle (publik) | 8.066 gambar | 4 kelas penyakit |
| PT Nirwana Farm (lapangan) | 210 gambar | Foto feses kondisi asli kandang |
| **Total** | **8.276 gambar** | Gabungan kedua sumber |

## Distribusi Kelas
| Kelas | Jumlah |
|-------|--------|
| Coccidiosis | 2.566 |
| Healthy | 2.404 |
| Salmonellosis | 2.625 |
| New Castle Disease | 681 |

## Split Data
- **70%** Training, **15%** Validation, **15%** Testing (Stratified Split)

## Tiga Skenario Model
| Model | Metode | Epoch |
|-------|--------|-------|
| **Baseline CNN** | Custom 3 block Conv2D | — |
| **MobileNetV2 FE** | Feature Extraction (layer dibekukan) | 10 |
| **MobileNetV2 FT** | Fine-Tuning (30 layer terakhir dibuka) | 15 |

## Callbacks
- `EarlyStopping(patience=5)` — hentikan jika tidak ada peningkatan selama 5 epoch
- `ReduceLROnPlateau(factor=0.2, patience=3)` — kurangi LR saat stagnan

---

# Flowchart — Inference Pipeline (Proses Prediksi Backend)

## Tujuan
Menggambarkan langkah-langkah teknis yang dilakukan backend dari saat menerima gambar hingga menghasilkan JSON respons prediksi.

## Langkah Pipeline

| Langkah | Keterangan |
|---------|------------|
| **1. Terima Gambar** | File bytes diterima dari `POST /api/v1/predict` |
| **2. Validasi** | Cek MIME type (jpg/png) dan ukuran file (maks 5MB) |
| **3. Baca Bytes** | Buka gambar menggunakan Pillow |
| **4. Resize** | Ubah dimensi menjadi 224×224 piksel (syarat MobileNetV2) |
| **5. Konversi RGB** | Pastikan gambar 3 channel (RGB), bukan RGBA atau Grayscale |
| **6. Normalisasi** | Konversi nilai piksel dari [0–255] menjadi [0.0–1.0] |
| **7. Inferensi** | Model MobileNetV2 memproses array gambar |
| **8. Output Softmax** | Model menghasilkan probabilitas untuk 4 kelas penyakit |
| **9. Ambil Kelas Tertinggi** | Tentukan `class_name` dan `confidence` dari probabilitas tertinggi |
| **10. Lookup Knowledge Base** | Ambil `description`, `cause`, `immediate_action` dari kamus statis |
| **11. Return JSON** | Kembalikan respons lengkap ke Mobile App |

## Catatan Teknis
- Preprocessing dilakukan **di luar** arsitektur model (tidak ada Lambda layer di dalam `.keras`).
- Normalisasi menggunakan NumPy: `array / 255.0`.
- `confidence_threshold` (60.0) disertakan dalam respons agar Mobile dapat menentukan tampil tidaknya peringatan.

---

# Activity Diagram — Pekerja Kandang

## Tujuan
Menggambarkan alur aktivitas Pekerja Kandang dari membuka aplikasi hingga menyimpan hasil deteksi. Disajikan secara **garis besar**.

## Alur Utama
1. Buka aplikasi → pilih foto dari kamera atau galeri
2. Crop foto (wajib diselesaikan)
3. Tekan tombol **Deteksi** → sistem memproses gambar
4. Lihat hasil prediksi
5. Pilih: **Reset** (ulangi dari awal) atau **Simpan** (pilih nama pekerja → konfirmasi)

## Catatan
- Jika crop dibatalkan, pengguna harus memilih ulang foto.
- Jika proses simpan gagal, banner "Coba Lagi" muncul tanpa mengulang proses deteksi.

---

# Sequence Diagram — Simpan Hasil Prediksi

## Tujuan
Menggambarkan interaksi antar komponen saat Pekerja Kandang menekan tombol **Simpan** setelah deteksi berhasil. Disajikan secara **garis besar**.

## Komponen yang Terlibat
| Komponen | Peran |
|----------|-------|
| **Mobile App** | Mengirim gambar + data prediksi + worker_id |
| **Backend FastAPI** | Memvalidasi, mengupload, dan menyimpan ke DB |
| **Supabase** | Menyimpan gambar (Storage) dan riwayat (PostgreSQL) |

## Alur
1. Mobile mengirim gambar + data prediksi + `worker_id` via `POST /api/v1/predictions`
2. Backend memvalidasi `worker_id` (harus ada & `is_active = true`)
3. Backend mengupload gambar ke Supabase Storage bucket `feses-images`
4. Backend melakukan INSERT ke tabel `predictions`
5. Backend mengembalikan response `201 Created`
6. Mobile menampilkan notifikasi sukses

## Error Cases
| Kondisi | Response |
|---------|----------|
| `worker_id` tidak valid / nonaktif | `400 Bad Request` |
| Gambar gagal diupload | `500 Internal Server Error` |
| Gagal insert ke DB | `500 Internal Server Error` |
| Network timeout | Tampilkan `RetrySaveBanner` di Mobile |

---

# Use Case Diagram — ChickenShii

## Tujuan
Menggambarkan semua aksi yang dapat dilakukan oleh dua aktor utama sistem terhadap fitur-fitur aplikasi ChickenShii.

## Aktor
| Aktor | Keterangan |
|-------|------------|
| **Pekerja Kandang** | Staf kandang PT Nirwana Farm. Tidak memerlukan login. Fokus pada deteksi harian. |
| **Admin** | Pemilik farm. Memerlukan login via Supabase Auth. Mengakses semua fitur termasuk manajemen data. |

## Use Case

| No | Use Case | Aktor |
|----|----------|-------|
| UC1 | Upload Foto Feses | Pekerja, Admin |
| UC2 | Deteksi Penyakit AI | Pekerja, Admin |
| UC3 | Lihat Hasil Prediksi | Pekerja, Admin |
| UC4 | Simpan Riwayat | Pekerja, Admin |
| UC5 | Login | Admin |
| UC6 | Lihat Dashboard Statistik | Admin |
| UC7 | Filter & Cari Riwayat | Admin |
| UC8 | Hapus Riwayat (Soft Delete) | Admin |
| UC9 | Kelola Daftar Pekerja | Admin |
| UC10 | Export CSV | Admin |

## Catatan
- Pekerja Kandang mengakses UC1–UC4 **tanpa autentikasi**.
- Admin memiliki semua akses Pekerja ditambah fitur manajemen (UC5–UC10).
- UC4 (Simpan Riwayat) memerlukan pemilihan nama dari dropdown pekerja aktif — bukan input teks bebas.

---

# Navigation Diagram — Mobile App (Expo Router)

## Tujuan
Menggambarkan struktur navigasi layar aplikasi mobile menggunakan Expo Router (file-based routing).

## Struktur Layar

| File | Jenis | Keterangan |
|------|-------|------------|
| `app/_layout.tsx` | Root Provider | Setup context Auth dan Theme global |
| `app/index.tsx` | Public Screen | Home Pekerja Kandang — 2 state: Upload & Hasil |
| `app/admin/_layout.tsx` | Guard | Pengecekan sesi sebelum merender screen admin |
| `app/admin/login.tsx` | Public Screen | Form login Admin |
| `app/admin/(tabs)/index.tsx` | Protected Screen | Dashboard statistik & riwayat |
| `app/admin/(tabs)/history.tsx` | Protected Screen | Daftar riwayat + filter + soft delete |
| `app/admin/(tabs)/workers.tsx` | Protected Screen | Manajemen daftar Pekerja Kandang |

## Alur Navigasi
- **Pekerja Kandang**: Hanya mengakses `index.tsx` (bolak-balik antara state Upload dan state Hasil)
- **Admin**: Login di `login.tsx` → masuk ke grup `(tabs)` → navigasi antar tab
- Jika sesi Admin tidak valid → redirect otomatis ke `login.tsx`

## Catatan
- Navigasi menggunakan file-based routing Expo Router.
- Grup `admin/(tabs)` dilindungi oleh `_layout.tsx` (route guard).

---

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

---

# Arsitektur Sistem (Deployment Diagram) — ChickenShii

## Tujuan
Menggambarkan komponen-komponen sistem dan bagaimana mereka terhubung satu sama lain secara **garis besar**.

## Komponen

| Komponen | Teknologi | Lokasi |
|----------|-----------|--------|
| **Mobile App** | React Native + Expo | Perangkat Android pengguna (APK) |
| **Backend API** | FastAPI + Uvicorn | Mesin lokal pengembang |
| **Model AI** | MobileNetV2 `.keras` | Di-load ke memori Backend saat startup |
| **Database** | Supabase PostgreSQL | Supabase Cloud |
| **Storage** | Supabase Storage Bucket | Supabase Cloud |

## Alur Komunikasi
- **Mobile → Backend**: REST API (HTTPS), untuk proses deteksi dan simpan riwayat
- **Mobile → Supabase**: Supabase JS SDK (langsung), untuk baca riwayat di Dashboard Admin
- **Backend → Supabase**: Supabase Python client + Service Role Key, untuk upload gambar & insert data
- **Model AI**: Tidak terpisah, berjalan **in-process** di dalam Backend FastAPI

## Catatan
- Model AI **tidak** diekspos sebagai endpoint terpisah; seluruh akses ke model melewati Backend.
- Mobile tidak pernah menulis data langsung ke Supabase tanpa melalui Backend (kecuali operasi baca Dashboard Admin yang dilindungi RLS).
