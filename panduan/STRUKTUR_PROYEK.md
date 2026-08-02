# Struktur Proyek ChickenShii

Dokumen ini menjelaskan arsitektur folder dan fungsi dari setiap file utama penyusun sistem **ChickenShii**, baik dari sisi *Backend* (server pemroses data & AI) maupun *Frontend* (aplikasi mobile).

---

## 1. Backend (FastAPI + Python)
Terletak di direktori `backend/`. Modul ini bertugas menerima permintaan HTTP, melakukan prapemrosesan citra, menjalankan inferensi model Deep Learning, serta berinteraksi dengan layanan cloud Supabase.

```text
backend/
├── app/                      # Source code utama aplikasi Backend
│   ├── api/
│   │   └── routes.py         # Endpoint API (misal: POST /predict, POST /predictions, GET /stats)
│   ├── core/
│   │   └── config.py         # Konfigurasi sistem dan env variables (Settings menggunakan Pydantic v2)
│   ├── models/
│   │   └── schemas.py        # Definisi struktur data (Schema) untuk request dan response JSON (Pydantic Models)
│   ├── services/
│   │   ├── ml_service.py     # Logika Machine Learning: Load model .keras, preprocessing gambar, dan inferensi
│   │   └── supabase_service.py # Logika komunikasi dengan Supabase (Auth admin, CRUD tabel predictions & workers)
│   ├── utils/
│   │   └── knowledge_base.py # Basis pengetahuan statis yang memuat info penyakit, penyebab, dan penanganan
│   └── main.py               # Entry point FastAPI, inisialisasi aplikasi, dan konfigurasi middleware CORS
├── model/
│   └── mobilenetv2_finetuned_best.keras # File model Deep Learning yang sudah dilatih (Pre-trained Model)
├── tests/
│   └── test_whitebox.py      # Script unit testing untuk pengujian struktural (White Box Testing)
├── .env                      # File kredensial lokal (Supabase URL, API Keys)
├── requirements.txt          # Daftar dependensi library Python yang dibutuhkan
├── run.py                    # Script runner alternatif untuk menjalankan server Uvicorn
└── Dockerfile                # Konfigurasi containerization untuk deployment (opsional)
```

---

## 2. Frontend / Mobile (React Native + Expo + NativeWind)
Terletak di direktori `mobile/`. Modul ini merupakan aplikasi *client-side* yang dipasang di perangkat HP pengguna (peternak & admin). Dibangun menggunakan *Expo Router* untuk navigasi berbasis file.

```text
mobile/
├── app/                      # Direktori utama routing (Expo Router)
│   ├── admin/                # Routing khusus untuk fitur Admin Dasbor
│   │   ├── (tabs)/           # Navigasi tab bawah untuk Admin (Overview, Riwayat, Pekerja)
│   │   │   ├── _layout.tsx   # Konfigurasi ikon dan warna bottom tabs admin
│   │   │   ├── history.tsx   # Halaman riwayat deteksi (menampilkan daftar lengkap dengan fitur hapus)
│   │   │   ├── index.tsx     # Halaman Dasbor utama (menampilkan LineChart dan metrik agregat penyakit)
│   │   │   └── workers.tsx   # Halaman manajemen daftar pekerja lapangan
│   │   ├── _layout.tsx       # Konfigurasi stack layout khusus rute admin
│   │   └── login.tsx         # Halaman autentikasi Admin menggunakan Supabase Auth
│   ├── _layout.tsx           # Entry point Root Layout untuk seluruh aplikasi mobile
│   ├── index.tsx             # Halaman Beranda Pekerja (Kamera/Galeri, Deteksi, Error Modal)
│   ├── result.tsx            # Halaman Hasil Prediksi (menampilkan Chart, informasi klinis, simpan data)
│   └── settings.tsx          # Halaman pengaturan preferensi aplikasi
├── components/               # Komponen UI modular yang dapat digunakan kembali (Reusable Components)
│   ├── ErrorModal.tsx        # Modal pop-up pesan galat dengan gaya desain modern (shadcn-ui style)
│   ├── ConfidenceBarChart.tsx# Komponen diagram batang untuk distribusi persentase kelas penyakit
│   ├── HistoryListItem.tsx   # Komponen kartu item tunggal pada daftar riwayat admin
│   ├── UploadedImageCard.tsx # Komponen pratinjau gambar feses yang diunggah
│   └── ...                   # Komponen visual lainnya (Banner, Cards, Overlays)
├── constants/
│   └── colors.ts             # Definisi token warna desain (Palet warna identitas merek & penyakit)
├── services/
│   ├── api.ts                # Konfigurasi Axios/Fetch untuk menembak endpoint Backend FastAPI
│   └── supabase.ts           # Inisialisasi client Supabase untuk otentikasi di aplikasi mobile
├── types/
│   └── index.ts              # Definisi interface TypeScript (tipe data HistoryItem, Worker, dll)
├── utils/
│   ├── compressImage.ts      # Helper function untuk mengecilkan ukuran gambar sebelum dikirim
│   └── diseaseInfo.ts        # Duplikasi frontend untuk data referensi klinis penyakit
├── assets/                   # Aset statis (Logo ChickenShii, gambar placeholder, ikon)
├── global.css                # File import utama Tailwind CSS / NativeWind
├── tailwind.config.js        # Konfigurasi styling Tailwind (mendefinisikan custom colors/fonts)
└── app.json                  # Konfigurasi manifest proyek Expo (Nama aplikasi, versi, orientasi layar)
```
