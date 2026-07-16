# 🔬 Analisis Dokumen Spesifikasi Sistem (ChickenShii)

Berdasarkan pembacaan mendalam terhadap 4 dokumen utama proyek Anda (`PRD.md`, `SDD.md`, `SRS.md`, dan `TaskBreakdown.md`), berikut adalah hasil analisis komprehensif mengenai arah pengembangan perangkat lunak (Software Development) yang akan kita lakukan selanjutnya.

---

## 1. Kesimpulan Arsitektur (*High-Level Design*)
Sistem ini menganut pola **Client-Server terpisah murni**.
* **Frontend (Mobile):** React Native + Expo. Bertugas semata-mata sebagai antarmuka pengguna (UI/UX) dan gerbang validasi awal.
* **Backend (FastAPI):** Bertindak sebagai "otak" utama. Semua proses berat (Resize gambar, Normalisasi piksel, Evaluasi Model AI) dan interaksi tulis ke *Database/Storage* wajib melalui backend ini.
* **BaaS (Supabase):** Bertindak sebagai *Database* (PostgreSQL), manajemen *Auth* Admin, dan penyimpanan file foto (*Storage Bucket*).

---

## 2. Analisis Konstrain & Aturan Ketat (*Business Rules*)
Dokumen `SRS.md` dan `SDD.md` menetapkan batasan (*guardrails*) yang sangat ketat untuk memastikan aplikasi aman saat *production*:
1. **Validasi 2 Lapis (Two-Layer Validation):** Aplikasi *mobile* dan *backend* sama-sama harus menolak gambar di atas 5MB. Jika ada *bypass* dari mobile, *backend* akan langsung memblokir dengan status `413 Payload Too Large`.
2. **Preprocessing Aman (Backend-Safe):** Dilarang keras menaruh `preprocess_input` (Lambda) di model AI, dan dilarang me- *resize* gambar di aplikasi *mobile*. Semua *resize* (224x224) harus dilakukan oleh Python (Pillow) di *backend* agar hasilnya konsisten di HP apapun.
3. **Penyimpanan Terisolasi (RLS):** Pekerja Kandang dilarang melempar data langsung ke Supabase. Aplikasi *mobile* harus menembak *backend*, lalu *backend* yang akan menggunakan kredensial tingkat tinggi (*Service Role Key*) untuk menyimpan gambar dan riwayat ke Supabase.
4. **Knowledge Base Statis (No LLM):** Sistem dilarang menggunakan AI ChatGPT/Gemini API untuk merangkum hasil penyakit. Penjelasan medis wajib diambil dari kamus statis (teks terprogram) untuk menghindari salah diagnosa (*halusinasi AI*).

---

## 3. Peta Jalan Eksekusi (*Task Breakdown Analysis*)
Dokumen `TaskBreakdown.md` membagi pekerjaan menjadi 5 fase besar yang berurutan. Saat ini kita berada di garis *start* pengembangan perangkat lunak.

### 🟡 Fase 1: Backend Refactoring & Core API (Prioritas: P0) - *Fokus Kita Saat Ini*
* Membuat struktur *Clean Architecture* di folder `backend/`.
* Mengamankan model `.keras` ke dalam *memory* server menggunakan `services/ml_service.py`.
* Membangun Endpoint Utama `POST /api/v1/predict` yang sanggup menerima gambar, me- *resize*, dan mengembalikan JSON probabilitas 4 penyakit beserta teks penanganannya.

### 🟡 Fase 2: Database & Storage Integration (Prioritas: P1)
* Mengaktifkan Supabase.
* Menjalankan `schema.sql`.
* Membangun Endpoint `POST /api/v1/predictions` untuk tombol "Simpan" (Menyimpan foto ke *bucket* + menulis riwayat ke tabel `predictions`).
* Membangun Endpoint `GET /api/v1/stats` untuk dasbor Admin.

### 🟡 Fase 3 & 4: Mobile App & Admin Panel
* Menginisialisasi proyek React Native (Expo).
* Membangun UI/UX Kamera, Layar Hasil, dan Autentikasi Admin.
* Menyambungkan aplikasi dengan *backend* FastAPI kita.

### 🟡 Fase 5: Deployment
* Membungkus *backend* ke dalam Docker dan meluncurkannya ke *cloud* (Render/Railway).
* Melakukan proses *build* aplikasi Android (APK/AAB) via Expo Application Services (EAS).

---

## 💡 Rekomendasi Langkah Selanjutnya
Dari analisis di atas, pondasi absolut dari sistem ini adalah **Fase 1 (Backend ML Service)**. Jika *backend* belum bisa melakukan deteksi penyakit, aplikasi *mobile* tidak akan ada gunanya.

Saya merekomendasikan kita mulai menulis kode untuk **Task 1.2 dan 1.3** terlebih dahulu:
1. Membangun kelas `MLService` di `backend/app/services/ml_service.py`.
2. Menulis fungsi `predict()` yang sanggup memuat gambar, me-*resize* ke `224x224`, melakukan *inference* ke model `mobilenetv2_finetuned_best.keras`, dan menyusun *output* JSON-nya.
