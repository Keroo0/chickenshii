# ChickenShii

ChickenShii adalah sistem pendukung keputusan untuk deteksi dini penyakit ayam petelur melalui citra feses. Model MobileNetV2 mengklasifikasikan citra ke dalam `Coccidiosis`, `Healthy`, `New Castle Disease`, atau `Salmonellosis`. Hasil AI merupakan dugaan awal, bukan diagnosis final; kasus penyakit baru diteruskan ke dokter hewan dan kepala pekerja melalui workflow operasional.

## Peran dan akses

| Peran | Autentikasi | Area | Kewenangan utama |
|---|---|---|---|
| Pekerja Kandang | Tidak login | `/` dan `/result` | Mengambil/memilih foto, menjalankan deteksi, melihat rekomendasi, dan menyimpan hasil dengan memilih nama pekerja aktif. |
| Admin/Pemilik | Login bersama | `/admin` | Melihat statistik dan riwayat prediksi, soft delete, export CSV prediksi, serta mengelola pekerja dan membuat akun staf. |
| Dokter Hewan (`veterinarian`) | Login bersama | `/doctor` | Dua tab: `Validasi` dan `Riwayat`. Memvalidasi kasus penyakit serta melihat riwayat miliknya sendiri. |
| Kepala Pekerja (`head_worker`) | Login bersama | `/head-worker` | Dua tab: `Dashboard` dan `Tindak Lanjut`. Mengonfirmasi pemisahan, memulai penanganan, dan menyelesaikan penanganan. |

Semua akun staf menggunakan `/login`. Role dibaca dari `app_metadata` Supabase Auth, lalu pengguna diarahkan ke area yang sesuai. Role kosong/tidak dikenal ditolak dan sesinya diakhiri. Pekerja kandang tetap dapat menggunakan alur deteksi tanpa login.

Tidak ada halaman profil untuk role staf. Sistem juga tidak menyimpan identitas ayam atau kandang dan tidak menyediakan notifikasi push.

## Workflow kasus penyakit

Endpoint simpan hanya menerima empat kelas model. Trigger membuat workflow secara eksplisit untuk baris `predictions` baru berlabel `Coccidiosis`, `New Castle Disease`, atau `Salmonellosis`; `Healthy` tidak masuk antrean, label lain ditolak `422` sebelum insert, dan prediksi lama tidak di-*backfill*.

1. AI mendeteksi penyakit dan hasil disimpan.
2. Kepala pekerja segera memisahkan ayam yang terindikasi, tanpa menunggu dokter.
3. Dokter memilih `Sesuai` (`matching`), `Tidak sesuai` (`incorrect`), atau `Tidak dapat dipastikan` (`uncertain`). `Tidak sesuai` wajib menyertakan label koreksi yang berbeda dari label AI; catatan opsional.
4. Satu prediksi hanya memiliki satu validasi. Penyimpanan pertama menang saat dua dokter membuka kasus yang sama. Riwayat dokter hanya berisi validasi buatannya, dan hanya pembuat yang boleh mengedit sebelum penanganan dimulai.
5. Penanganan baru dapat dimulai setelah pemisahan tercatat dan validasi memastikan suatu penyakit: `matching` atau `incorrect` dengan koreksi selain `Healthy`.
6. Koreksi ke `Healthy` menutup kasus otomatis. `uncertain` mengunci penanganan dengan status perlu pemeriksaan lebih lanjut.
7. Rekomendasi tetap ditampilkan; setelah koreksi, rekomendasi mengikuti label dokter.

Admin tidak melihat data validasi/tindak lanjut dan export CSV Admin tetap hanya berisi data prediksi.

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Mobile | React Native, Expo SDK 54, Expo Router, NativeWind |
| Backend | FastAPI, Python 3.11, Pydantic v2, Uvicorn |
| Machine Learning | TensorFlow/Keras, MobileNetV2, Pillow, NumPy |
| Data | Supabase PostgreSQL, Auth, Storage |
| Build/deploy | Docker, EAS Build |

## Arsitektur ringkas

```text
Mobile App
  ├─ Pekerja anonim ── predict/save ─────────────┐
  └─ Staf login ── JWT + role-protected API ─────┤
                                                  v
                                      FastAPI + MobileNetV2
                                                  |
                                                  v
                               Supabase Auth + PostgreSQL + Storage
```

Mobile hanya menyimpan token sesi staf secara aman. Backend memverifikasi token dan role untuk setiap endpoint terlindungi. Tabel workflow mengaktifkan RLS deny-by-default; akses Data API `anon` dan `authenticated` dicabut, sedangkan backend menggunakan `service_role`.

## Menjalankan proyek

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

### Mobile

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

### Database

Jalankan skema dasar `panduan/schema.sql`, kemudian migration `supabase/migrations/20260802090000_add_staff_workflow.sql`. Migration tersebut membuat tabel workflow, trigger transisi, policy berbasis role, dan melakukan bootstrap seluruh akun Auth yang sudah ada sebagai Admin. Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` di aplikasi mobile atau repository.

## Endpoint API

Endpoint publik:

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/` atau `/api/v1/health` | Status API/model |
| `POST` | `/api/v1/predict` | Inferensi tanpa menyimpan |
| `POST` | `/api/v1/predictions` | Simpan gambar dan hasil prediksi |

Endpoint terlindungi:

| Role | Method | Endpoint | Fungsi |
|---|---|---|---|
| Admin | `GET` | `/api/v1/stats` | Statistik prediksi |
| Admin | `POST` | `/api/v1/staff-accounts` | Membuat akun `veterinarian` atau `head_worker` |
| Dokter | `GET` | `/api/v1/doctor/validations/pending` | Antrean penyakit belum tervalidasi |
| Dokter | `GET` | `/api/v1/doctor/validations/history` | Riwayat validator yang login |
| Dokter | `POST` | `/api/v1/doctor/validations` | Membuat validasi |
| Dokter | `PATCH` | `/api/v1/doctor/validations/{validation_id}` | Mengubah validasi sebelum penanganan |
| Kepala Pekerja | `GET` | `/api/v1/head-worker/dashboard` | Ringkasan kasus hari ini |
| Kepala Pekerja | `GET` | `/api/v1/head-worker/follow-ups` | Daftar tindak lanjut |
| Kepala Pekerja | `POST` | `/api/v1/head-worker/follow-ups/{prediction_id}/isolate` | Menandai sudah dipisahkan |
| Kepala Pekerja | `POST` | `/api/v1/head-worker/follow-ups/{prediction_id}/treatment/start` | Memulai penanganan |
| Kepala Pekerja | `POST` | `/api/v1/head-worker/follow-ups/{prediction_id}/treatment/complete` | Menyelesaikan penanganan |

Semua endpoint terlindungi menggunakan `Authorization: Bearer <access_token>`.

## Skema data

| Tabel | Isi |
|---|---|
| `workers` | Identitas pekerja kandang untuk dropdown penyimpanan; bukan akun login. |
| `predictions` | Citra, kelas AI, confidence, probabilitas, pekerja, timestamp, dan soft delete. |
| `staff_profiles` | Nama tampilan, email, dan role staf yang terhubung ke `auth.users`. |
| `prediction_validations` | Satu validasi dokter per prediksi, verdict, koreksi, catatan, dan timestamp. |
| `prediction_followups` | Aktor/waktu pemisahan, mulai/selesai penanganan, dan penutupan otomatis. |

Bucket `feses-images` menyimpan foto. Rekomendasi berasal dari knowledge base statis untuk menghindari halusinasi LLM.

## Struktur proyek

```text
chikenshii/
├── backend/app/
│   ├── api/routes.py                 # deteksi, simpan, statistik, akun staf
│   ├── api/workflow_routes.py        # API dokter dan kepala pekerja
│   ├── models/                       # skema Pydantic
│   └── services/                     # ML, Supabase, workflow
├── mobile/
│   ├── app/login.tsx                 # login bersama
│   ├── app/admin/                    # dashboard, riwayat, pengguna
│   ├── app/doctor/                   # Validasi dan Riwayat
│   └── app/head-worker/              # Dashboard dan Tindak Lanjut
├── supabase/migrations/              # perubahan skema dan policy
├── diagram/                          # panduan Visual Paradigm Online
└── panduan/                          # PRD, SRS, SDD, pengujian, deployment
```

## Model

Dataset penelitian berisi 8.276 gambar (8.066 data publik dan 210 data lapangan). Model akhir MobileNetV2 fine-tuned membedakan empat kelas. Metrik eksperimen dan pembahasannya dicatat di `panduan/BAB4_DRAFT.md`; perubahan workflow staf tidak mengubah pipeline pelatihan maupun inferensi model.

| Kelas | Precision | Recall | F1-Score |
|---|---:|---:|---:|
| Coccidiosis | 97,4% | 96,0% | 96,7% |
| Healthy | 91,0% | 94,0% | 92,5% |
| New Castle Disease | 89,3% | 87,9% | 88,6% |
| Salmonellosis | 95,4% | 96,4% | 95,9% |
| **Overall Accuracy** |  |  | **94,5%** |

Angka tersebut merupakan ringkasan artefak eksperimen model, bukan hasil validasi dokter dalam aplikasi.

## Dokumentasi

- `panduan/PRD.md`: ruang lingkup produk dan user flow.
- `panduan/SRS.md`: kebutuhan fungsional, aturan, keamanan, dan status.
- `panduan/SDD.md`: desain data, API, komponen, dan transisi.
- `panduan/DeploymentGuide.md`: konfigurasi dan urutan deployment.
- `diagram/`: satu panduan pembuatan Visual Paradigm Online untuk setiap diagram.

## Disclaimer

ChickenShii tidak menggantikan pemeriksaan dokter hewan. Hasil AI dan rekomendasi awal harus dipakai sebagai dukungan tindakan preventif dan tetap memerlukan validasi profesional.
