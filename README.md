<div align="center">

# 🐔 ChickenShii

### Sistem Deteksi Dini Penyakit Ayam Petelur Berbasis AI

**Aplikasi mobile & backend AI untuk klasifikasi penyakit ayam petelur
melalui analisis foto feses menggunakan deep learning (MobileNetV2)**

*Skripsi — Program Studi Informatika*

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue?logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo%20SDK-54-000020?logo=expo)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-FF6F00?logo=tensorflow)](https://www.tensorflow.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

</div>

---

## 📋 Ringkasan

ChickenShii adalah **Decision Support System** (DSS) yang membantu peternak
ayam petelur mendeteksi penyakit secara dini melalui foto feses. Sistem ini
menggunakan model **MobileNetV2** yang telah di-*fine-tuning* untuk mengklasifikasikan
feses ayam ke dalam 4 kelas: **Coccidiosis**, **Healthy**, **New Castle Disease**,
dan **Salmonellosis**.

> ⚠️ **Disclaimer**: Sistem ini bukan alat diagnosis medis. Hasil prediksi
> bersifat dugaan awal dan harus dikonfirmasi oleh dokter hewan.

---

## 📊 Performa Model

| Kelas | Precision | Recall | F1-Score |
|-------|:---------:|:------:|:--------:|
| Coccidiosis | 97.4% | 96.0% | **96.7%** |
| Healthy | 91.0% | 94.0% | **92.5%** |
| New Castle Disease | 89.3% | 87.9% | **88.6%** |
| Salmonellosis | 95.4% | 96.4% | **95.9%** |
| **Overall Accuracy** | | | **94.5%** |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Mobile** | React Native · Expo SDK 54 · Expo Router · NativeWind (Tailwind CSS) |
| **Backend** | FastAPI · Python 3.11 · Uvicorn · Pydantic v2 |
| **Machine Learning** | TensorFlow/Keras · MobileNetV2 (Fine-Tuned) · Pillow · NumPy |
| **Database** | Supabase (PostgreSQL) · Supabase Auth · Supabase Storage |
| **Infra** | Docker · EAS Build |

---

## ✨ Fitur Utama

### 👨‍🌾 Pekerja Kandang
- 📷 Upload foto feses via kamera atau galeri dengan crop tool
- 🔍 Deteksi AI instan dengan confidence score & bar chart probabilitas
- 💡 Deskripsi penyakit, penyebab, dan rekomendasi penanganan
- 💾 Simpan hasil prediksi ke riwayat

### 👨‍💼 Admin / Pemilik Farm
- 📊 Dashboard statistik dengan grafik tren (mingguan/bulanan/tahunan)
- 📜 Riwayat prediksi lengkap dengan pencarian & filter
- 👥 Manajemen pekerja (tambah, nonaktifkan)
- 📥 Export data ke CSV
- 🔐 Login aman via Supabase Auth + enkripsi session

---

## 🏗️ Arsitektur Sistem

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Mobile App │────▶│  FastAPI      │────▶│  Supabase        │
│  (Expo)     │◀────│  Backend     │◀────│  PostgreSQL +    │
│             │     │  + ML Model  │     │  Auth + Storage  │
└─────────────┘     └──────────────┘     └─────────────────┘
```

```
┌─────────────────────────────────────────────────┐
│                Inference Pipeline                │
├─────────────────────────────────────────────────┤
│  Image → Preprocess (224×224) → MobileNetV2     │
│        → Softmax (4 classes) → JSON Response    │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 & **npm**
- **Python** ≥ 3.11
- **Supabase** project ([supabase.com](https://supabase.com))
- **EAS CLI** (untuk build): `npm install -g eas-cli`

### 1. Clone Repository

```bash
git clone git@github.com:Keroo0/chickenshii.git
cd chickenshii
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Konfigurasi environment
cp .env.example .env
# Edit .env dengan credentials Supabase kamu

# Jalankan server
python run.py
```

Backend akan berjalan di `http://localhost:8000`

### 3. Setup Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Konfigurasi environment
cp .env.example .env
# Edit .env dengan URL backend & Supabase kamu

# Jalankan di development
npx expo start
```

### 4. Setup Database

Jalankan migration SQL di Supabase SQL Editor:

```bash
# Lihat schema di panduan/schema.sql
cat panduan/schema.sql
```

---

## 📁 Struktur Proyek

```
chikenshii/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── api/routes.py        # API endpoints
│   │   ├── core/config.py       # Configuration
│   │   ├── services/            # ML & Supabase services
│   │   ├── models/schemas.py    # Pydantic models
│   │   └── utils/knowledge_base.py
│   ├── model/                   # Trained model (.keras)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py
│
├── mobile/
│   ├── app/                     # Expo Router pages
│   │   ├── index.tsx            # Home: upload & detect
│   │   ├── result.tsx           # Hasil prediksi
│   │   └── admin/               # Admin panel
│   ├── components/              # 16 reusable components
│   ├── services/                # API & Supabase clients
│   ├── types/                   # TypeScript types
│   ├── constants/               # Colors, env config
│   └── utils/                   # Helpers
│
├── diagram/                     # Mermaid & drawio diagrams
├── panduan/                     # Dokumentasi (PRD, SRS, SDD)
└── result/                      # Training results & charts
```

---

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/` | Health check + model status |
| `POST` | `/api/v1/predict` | Inference (tanpa simpan) |
| `POST` | `/api/v1/predictions` | Simpan prediksi + upload gambar |
| `GET` | `/api/v1/stats` | Statistik agregat (admin) |

### Contoh Request

```bash
# Prediksi
curl -X POST http://localhost:8000/api/v1/predict \
  -F "file=@foto_feses.jpg"
```

### Contoh Response

```json
{
  "prediction": "Coccidiosis",
  "confidence": 96.7,
  "all_predictions": {
    "Coccidiosis": 96.7,
    "Healthy": 1.2,
    "New Castle Disease": 0.8,
    "Salmonellosis": 1.3
  }
}
```

---

## 🗄️ Database Schema

| Tabel | Deskripsi |
|-------|-----------|
| `workers` | Data pekerja kandang (nama, status aktif) |
| `predictions` | Riwayat prediksi (gambar, hasil, confidence, pekerja) |

**Storage Bucket**: `feses-images` — penyimpanan foto feses (public read)

**Security**: Row Level Security (RLS) aktif. Mobile tidak bisa INSERT langsung;
semua write melalui backend dengan Service Role Key.

---

## 🧠 Pipeline Pelatihan

Model dilatih dalam 3 tahap perbandingan:

| Tahap | Metode | Epoch | LR | Hasil |
|-------|--------|:-----:|:--:|-------|
| 1 | Baseline Custom CNN | 30 | 0.001 | Baseline |
| 2 | MobileNetV2 Feature Extraction | 10 | 0.001 | +5-8% |
| 3 | MobileNetV2 Fine-Tuning | 15 | 1e-5 | **94.5%** |

**Dataset**: 8.276 gambar (8.066 Kaggle + 210 lapangan PT Nirwana Farm)

---

## 🐳 Deployment

### Docker (Backend)

```bash
cd backend
docker build -t chickenshii-api .
docker run -p 8000:8000 --env-file .env chickenshii-api
```

### EAS Build (Mobile)

```bash
cd mobile
eas build --platform android
eas build --platform ios
```

---

## 📄 Dokumentasi

| Dokumen | Lokasi |
|---------|--------|
| PRD (Product Requirements) | `panduan/PRD.md` |
| SRS (Software Requirements) | `panduan/SRS.md` |
| SDD (System Design) | `panduan/SDD.md` |
| Deployment Guide | `panduan/DeploymentGuide.md` |
| Database Schema | `panduan/schema.sql` |

---

## 👥 Kontributor

**PT Nirwana Farm** — Partner penelitian & penyedia data lapangan

---

<div align="center">

**Built with ❤️ for Indonesian poultry farming**

</div>
