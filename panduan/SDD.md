System Design Document (SDD)

Sistem Deteksi Dini Penyakit Ayam Petelur Berbasis Citra Feses (ChickenShii)

1. Arsitektur Sistem (High-Level Architecture)

Sistem menggunakan pola arsitektur Client-Server (terpisah) berbasis REST API.

Client (Mobile App): Aplikasi mobile dibangun menggunakan React Native + Expo (managed workflow), navigasi dengan Expo Router (file-based routing), dan styling menggunakan NativeWind (Tailwind CSS untuk React Native). Bertugas mengelola UI/UX, validasi input, akses kamera/galeri, dan state management.

Server (Backend): REST API dibangun menggunakan FastAPI (Python 3.11). Bertugas sebagai mesin utama untuk memproses request, melakukan operasi gambar, dan menjalankan inferensi machine learning. Backend bersifat platform-agnostic terhadap client yang mengaksesnya.

AI Model Engine: Model MobileNetV2 fine-tuned format .keras yang di-load via TensorFlow 2.16+. (Note: Preprocessing dilakukan di luar model grafis).

Database & Storage: Supabase (PostgreSQL) digunakan untuk menyimpan log prediksi, dan Supabase Storage untuk menyimpan aset gambar feses.

2. Skema Database (Supabase)

DDL lengkap (CREATE TABLE, index, RLS policy, dan setup storage bucket) tersedia di file schema.sql, siap dijalankan langsung di Supabase SQL Editor. Bagian di bawah ini adalah deskripsi naratifnya.

2.1 Tabel workers
Digunakan untuk menyimpan daftar Pekerja Kandang yang terdaftar dan dikelola oleh Admin, sebagai sumber dropdown saat proses Simpan.

Kolom

Tipe Data

Keterangan

Atribut

id

UUID

Primary Key unik setiap pekerja.

PK, Default uuid_generate_v4()

name

TEXT

Nama Pekerja Kandang.

Not Null

is_active

BOOLEAN

Menentukan apakah pekerja masih muncul di dropdown pemilihan nama.

Not Null, Default true

created_at

TIMESTAMPTZ

Waktu pekerja didaftarkan.

Default NOW()

2.2 Tabel predictions
Digunakan untuk menyimpan riwayat setiap prediksi yang berhasil dilakukan oleh sistem.

Kolom

Tipe Data

Keterangan

Atribut

id

UUID

Primary Key unik setiap prediksi.

PK, Default uuid_generate_v4()

image_url

TEXT

URL gambar yang disimpan di bucket Supabase.

Not Null

prediction

TEXT

Hasil kelas utama (contoh: "Salmonellosis").

Not Null

confidence

FLOAT8

Skor akurasi utama (0.0 - 100.0).

Not Null

all_predictions

JSONB

Data probabilitas keempat kelas penyakit.

Not Null

worker_id

UUID

Referensi ke Pekerja Kandang yang mengambil gambar.

FK -> workers.id, Not Null

deleted_at

TIMESTAMPTZ

Penanda soft delete. NULL berarti entri masih aktif/tampil.

Nullable, Default NULL

created_at

TIMESTAMPTZ

Waktu prediksi disimpan.

Default NOW()

Relasi: satu workers dapat memiliki banyak predictions (one-to-many via worker_id). Seluruh query riwayat, statistik, dan export CSV wajib menyertakan kondisi WHERE deleted_at IS NULL agar entri yang sudah dihapus (soft delete) tidak ikut ditampilkan/dihitung.

2.3 Storage Bucket

Nama Bucket: feses-images

Visibilitas: Publik (untuk read image URL di dashboard admin).

Policy: Hanya backend terotorisasi yang dapat melakukan INSERT (upload) ke bucket ini.

2.4 Row Level Security (RLS)

Tabel workers: role anon (Pekerja Kandang, tanpa login) hanya bisa SELECT baris dengan is_active = true — cukup untuk mengisi dropdown saat Simpan. Role authenticated (Admin yang sudah login) bisa SELECT seluruh baris (termasuk yang nonaktif) serta INSERT dan UPDATE (untuk menambah/menonaktifkan pekerja).

Tabel predictions: SELECT dan UPDATE (dipakai untuk soft delete, mengubah kolom deleted_at) hanya diizinkan untuk role authenticated. INSERT ke tabel ini tidak dilakukan langsung oleh client manapun — selalu melalui backend (endpoint POST /api/v1/predictions) yang memakai service role key, sehingga proses insert tidak bergantung pada RLS.

Pembacaan riwayat, pencarian/filter, dan soft delete pada dashboard Admin dilakukan lewat pemanggilan langsung ke Supabase (Supabase JS SDK) dari aplikasi mobile, bukan lewat endpoint FastAPI tambahan — konsisten dengan pola yang sama dipakai untuk membaca tabel predictions pada Dashboard Admin.

3. API Contract (Spesifikasi Endpoint Backend)

Selain endpoint di bawah ini, operasi baca/tulis pada tabel workers dan predictions untuk kebutuhan Dashboard Admin (riwayat, pencarian/filter, soft delete, manajemen pekerja) dilakukan langsung lewat Supabase JS SDK dari aplikasi mobile, mengikuti RLS pada bagian 2.4. Backend FastAPI hanya menangani proses yang memerlukan ML inference dan penulisan ke Storage.

3.1. GET / (Health Check)

Fungsi: Memastikan API menyala dan model berhasil di-load ke dalam memori.

Response (200 OK):

{
  "status": "online",
  "model_loaded": true,
  "classes": ["Coccidiosis", "Healthy", "New Castle Disease", "Salmonellosis"]
}


3.2. POST /api/v1/predict (Inference Only — Tidak Menyimpan)

Fungsi: Menerima unggahan gambar hasil crop, memprosesnya, dan mengembalikan hasil prediksi beserta knowledge base terkait. Endpoint ini murni inference — tidak melakukan upload ke Storage maupun insert ke Database.

Request: multipart/form-data

file: (File image hasil crop: jpg/png/jpeg)

Response (200 OK):

{
  "status": "success",
  "data": {
    "prediction": "Salmonellosis",
    "confidence": 96.42,
    "all_predictions": {
      "Coccidiosis": 0.12,
      "Healthy": 2.31,
      "New Castle Disease": 1.15,
      "Salmonellosis": 96.42
    },
    "recommendation_data": {
      "description": "...",
      "cause": "...",
      "immediate_action": ["..."]
    },
    "confidence_threshold": 60.0,
    "note": "Hasil ini merupakan dugaan awal AI..."
  }
}

Catatan: confidence_threshold dikirim dari backend (bukan di-hardcode di client) agar ambang batas peringatan "hasil kurang meyakinkan" mudah diubah tanpa perlu rilis ulang aplikasi mobile. Aplikasi menampilkan catatan tambahan pada Layar Hasil apabila confidence < confidence_threshold.


3.3. POST /api/v1/predictions (Simpan Hasil ke Riwayat)

Fungsi: Dipanggil hanya ketika Pekerja Kandang menekan tombol "Simpan" pada Layar Hasil. Mengunggah gambar ke Storage dan mencatat hasil prediksi beserta referensi pekerja ke tabel predictions.

Request: multipart/form-data

file: (File image yang sama dengan yang dipakai saat /predict)

prediction: (string, hasil kelas dari respons /predict)

confidence: (float)

all_predictions: (JSON string)

worker_id: (UUID, hasil pilihan dropdown Pekerja Kandang — wajib diisi)

Backend memvalidasi worker_id benar-benar ada di tabel workers dan is_active = true sebelum melakukan insert. Jika tidak ditemukan/nonaktif, backend mengembalikan 400 Bad Request agar client meminta pengguna memilih ulang dari dropdown (menghindari kondisi race, misal pekerja baru saja dinonaktifkan Admin di waktu yang bersamaan).

Response (201 Created):

{
  "status": "success",
  "data": {
    "id": "uuid-generated",
    "image_url": "https://.../feses-images/xxx.jpg",
    "worker_id": "uuid-worker",
    "worker_name": "Budi",
    "created_at": "2026-07-10T10:00:00Z"
  }
}

400 Bad Request: Dikembalikan jika worker_id kosong, tidak valid, tidak ditemukan, atau merujuk ke pekerja yang sudah dinonaktifkan.


3.4. GET /api/v1/stats (Statistik Dashboard Admin — Protected)

Fungsi: Mengembalikan jumlah prediksi per kelas penyakit dalam rentang periode tertentu. Endpoint ini memerlukan header Authorization: Bearer <supabase_jwt> dan hanya bisa diakses oleh Admin yang sudah login.

Request: GET /api/v1/stats?period=week|month|year&reference_date=YYYY-MM-DD

period: wajib, salah satu dari week, month, year.

reference_date: opsional (default: tanggal hari ini) — dipakai untuk menentukan minggu/bulan/tahun mana yang dihitung. Contoh: period=month&reference_date=2026-03-15 menghitung seluruh data pada bulan Maret 2026.

Response (200 OK):

{
  "status": "success",
  "data": {
    "period": "month",
    "range": { "start": "2026-03-01", "end": "2026-03-31" },
    "total": 128,
    "by_class": {
      "Coccidiosis": 34,
      "Healthy": 52,
      "New Castle Disease": 12,
      "Salmonellosis": 30
    }
  }
}

Catatan: Agregasi wajib mengecualikan baris dengan deleted_at IS NOT NULL (entri yang sudah di-soft-delete Admin).


401 Unauthorized: Dikembalikan jika token tidak ada/tidak valid/kedaluwarsa.

400 Bad Request: Dikembalikan jika period bukan salah satu dari week/month/year, atau reference_date tidak valid.


Struktur utama (root) proyek dibagi menjadi tiga bagian utama. Dilarang keras menumpuk seluruh logika di main.py. Gunakan pemisahan peran (separation of concerns) berikut:

/
├── panduan/       # Dokumen spesifikasi (PRD, SRS, SDD, Task Breakdown)
├── mobile/        # Proyek React Native (Expo)
└── backend/       # Proyek FastAPI
    ├── app/
    │   ├── main.py                  # Entry point (Uvicorn), setup FastAPI & CORS.
    │   ├── api/
    │   │   └── routes.py            # Definisi endpoint (GET /, POST /predict, POST /predictions, GET /stats).
    │   ├── core/
    │   │   └── config.py            # Konfigurasi env (Supabase keys, model path).
    │   ├── services/
    │   │   ├── ml_service.py        # Logika load model, resize Pillow, inferensi TF.
    │   │   └── supabase_service.py  # Logika upload gambar, validasi worker_id, insert log ke DB, & agregasi statistik per periode.
    │   └── utils/
    │       └── knowledge_base.py    # Dictionary statis informasi penyakit (diseaseInfo).
    ├── models/
    │   └── mobilenetv2_finetuned.keras # File bobot model (TANPA Lambda layer).
    └── requirements.txt

4.1 Struktur Direktori mobile/ (Expo Router)

mobile/
├── app/
│   ├── _layout.tsx               # Root layout, provider (auth context, theme)
│   ├── index.tsx                 # Home screen Pekerja Kandang (upload & result)
│   └── admin/
│       ├── _layout.tsx           # Guard/layout khusus grup admin (cek sesi)
│       ├── login.tsx             # Screen login Admin
│       ├── index.tsx             # Dashboard Admin (protected) — statistik & riwayat
│       └── workers.tsx           # Manajemen Pekerja Kandang (protected) — tambah/nonaktifkan
├── components/
│   ├── ImagePickerArea.tsx       # Pilih kamera/galeri + trigger native crop (allowsEditing)
│   ├── LoadingOverlay.tsx        # Modal + ActivityIndicator (cold start aware)
│   ├── UploadedImageCard.tsx     # Kartu preview foto yang diupload di Layar Hasil
│   ├── ConfidenceBarChart.tsx    # Chart probabilitas (react-native-chart-kit / victory-native)
│   ├── LowConfidenceWarning.tsx  # Catatan tambahan saat confidence < confidence_threshold
│   ├── DiseaseInfoCard.tsx       # Kartu penjelasan penyakit
│   ├── DiseaseCauseCard.tsx      # Kartu penyebab penyakit
│   ├── RecommendationCard.tsx    # Kartu rekomendasi penanganan awal
│   ├── ResultActions.tsx         # Tombol Reset/Ulangi & Simpan
│   ├── SaveWorkerModal.tsx       # Modal dropdown pilih Pekerja Kandang aktif sebelum submit simpan
│   ├── RetrySaveBanner.tsx       # Muncul saat POST /predictions gagal, tombol "Coba Lagi"
│   ├── DisclaimerBanner.tsx      # Disclaimer medis permanen
│   ├── StatsPeriodFilter.tsx     # Segmented control/dropdown filter Mingguan/Bulanan/Tahunan
│   ├── StatsSummaryChart.tsx     # Chart jumlah kasus per kelas penyakit sesuai periode terpilih
│   ├── HistorySearchFilterBar.tsx # Input pencarian + filter (nama pekerja, kelas penyakit, rentang tanggal)
│   ├── HistoryListItem.tsx       # Baris riwayat dengan aksi hapus (soft delete + konfirmasi)
│   └── WorkerListManager.tsx     # Form tambah pekerja + toggle is_active per baris
├── services/
│   ├── api.ts                    # Axios instance ke backend FastAPI
│   └── supabase.ts               # Supabase client (Auth + query langsung) untuk mobile
├── utils/
│   └── diseaseInfo.ts            # Knowledge base statis (versi TypeScript)
├── constants/
│   └── env.ts                    # Baca EXPO_PUBLIC_API_URL, dsb.
├── app.json / app.config.ts      # Konfigurasi Expo
├── eas.json                      # Konfigurasi build (EAS Build)
└── package.json

5. Frontend UI/UX Flow (Expo Router)

Sistem navigasi diimplementasikan secara file-based menggunakan Expo Router:

app/index.tsx (Public Screen): Halaman Home untuk Pekerja Kandang. Mengelola 2 state utama secara berurutan dalam satu screen: (1) state upload — area pilih/ambil foto via ImagePickerArea.tsx yang otomatis membuka native crop tool, lalu tombol "Deteksi" memicu LoadingOverlay.tsx dan panggilan POST /predict; (2) state hasil — merender UploadedImageCard.tsx, ConfidenceBarChart.tsx (dengan LowConfidenceWarning.tsx apabila confidence < confidence_threshold dari respons), DiseaseInfoCard.tsx, DiseaseCauseCard.tsx, RecommendationCard.tsx, DisclaimerBanner.tsx, dan ResultActions.tsx (tombol Reset/Ulangi mengembalikan ke state upload; tombol Simpan membuka SaveWorkerModal.tsx yang mengambil daftar Pekerja Kandang aktif langsung dari Supabase, lalu setelah dikonfirmasi memanggil POST /predictions). Jika POST /predictions gagal, tampilkan RetrySaveBanner.tsx tanpa mengubah state hasil yang sudah ada.

app/admin/login.tsx (Public Screen): Halaman form masuk Admin (Email & Password). Menyimpan token sesi Supabase menggunakan expo-secure-store, yang memanfaatkan Keychain (iOS) dan Keystore (Android) agar token tersimpan terenkripsi di level OS.

app/admin/index.tsx (Protected Screen): Halaman Dashboard yang digerbangi lewat _layout.tsx pada grup admin — melakukan pengecekan sesi (via expo-secure-store) sebelum merender. Terdiri dari: (1) StatsPeriodFilter.tsx untuk memilih periode Mingguan/Bulanan/Tahunan (plus pilihan bulan/tahun spesifik), yang memanggil GET /api/v1/stats dan menampilkan hasilnya lewat StatsSummaryChart.tsx; (2) HistorySearchFilterBar.tsx untuk mencari/memfilter riwayat berdasarkan nama pekerja, kelas penyakit, dan rentang tanggal; (3) daftar riwayat prediksi (FlatList dari HistoryListItem.tsx) yang mengambil data langsung dari tabel predictions di Supabase (WHERE deleted_at IS NULL, ditambah kondisi hasil pencarian/filter), dengan aksi hapus (soft delete, dengan dialog konfirmasi) pada tiap baris. Terdapat tautan menuju app/admin/workers.tsx.

app/admin/workers.tsx (Protected Screen): Halaman manajemen Pekerja Kandang, berisi WorkerListManager.tsx — form tambah nama pekerja baru, dan daftar pekerja terdaftar dengan toggle is_active per baris untuk menonaktifkan/mengaktifkan kembali.
