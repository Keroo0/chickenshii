# 🐔 ChickenShii - Sistem Deteksi Dini Penyakit Ayam Petelur Berbasis AI

**ChickenShii** adalah aplikasi *mobile* dan *sistem pakar cerdas* berbasis *Computer Vision* (Deep Learning) untuk mendeteksi penyakit pada kotoran (feses) ayam petelur (layer) di **PT Nirwana Farm**. Sistem ini bertindak sebagai alat bantu (*Decision Support System*) untuk memberikan dugaan awal guna mempercepat tindakan preventif peternak.

---

## 🎯 1. Deskripsi & Aktor Sistem

Sistem ini membatasi akses pada dua jenis pengguna utama:

### 👨‍🌾 A. Pekerja Kandang (Non-Login)
Role ini merepresentasikan staf kandang yang melakukan pengecekan harian.
- Mengunggah foto feses ayam (*single image*) via kamera atau galeri.
- Melihat hasil prediksi kelas penyakit, *confidence score*, dan probabilitas.
- Membaca deskripsi singkat penyakit dan rekomendasi awal penanganan.
- Menyimpan hasil prediksi ke dalam *history* (disertai nama pekerja).

### 👨‍💼 B. Admin / Pemilik Farm (Login)
Admin mengelola operasional farm secara menyeluruh melalui Dashboard khusus.
- Akses ke **Dashboard Statistik** (Total prediksi, distribusi kelas, filter mingguan/bulanan/tahunan).
- Manajemen **Riwayat Prediksi** (Mencari, memfilter, dan *soft delete* histori).
- Manajemen **Daftar Pekerja** (Menambah/menonaktifkan pekerja untuk standarisasi nama).
- Mengunduh (*export*) data prediksi dalam format **CSV**.

---

## 🛠️ 2. Teknologi (Tech Stack)

Aplikasi dibangun menggunakan teknologi modern lintas-platform dengan batasan ekosistem yang terkelola dengan baik:

* **Frontend (Mobile App):** React Native, dikembangkan dengan Expo (*Managed Workflow*). Navigasi menggunakan *Expo Router*, dan UI Styling menggunakan *NativeWind* (Tailwind CSS untuk React Native).
* **Backend API:** FastAPI (Python) dengan server Uvicorn, bertugas menangani pembacaan model AI dan *request* dari aplikasi *Frontend*.
* **Database & Storage:** Supabase (PostgreSQL untuk riwayat, *Supabase Auth* untuk Admin, dan *Supabase Storage* untuk foto feses).
* **AI & Machine Learning:** TensorFlow/Keras untuk lingkungan pelatihan dan arsitektur model klasifikasi gambar (*MobileNetV2*).

---

## 📊 3. Detail Dataset (Sumber: Kaggle & Lapangan)

Proyek ini memadukan dataset publik (*Open Source*) dan dataset riil yang dikumpulkan langsung dari peternakan. Penggabungan ini krusial untuk memastikan model dapat mengenali kondisi asli di lapangan secara akurat (mengatasi masalah "Domain Shift").

* **Dataset Publik (Sumber: Kaggle):** 
  - Mencakup **8.066 gambar** utama yang terdistribusi ke dalam 4 kelas klasifikasi penyakit.
* **Dataset Lapangan (Sumber: Observasi PT Nirwana Farm):**
  - Mencakup **210 gambar** yang diambil secara langsung dari kotoran ayam petelur di lingkungan kandang PT Nirwana Farm untuk melengkapi variasi pencahayaan, tekstur, dan sudut pandang asli.
* **Distribusi Keseluruhan Dataset (Total: 8.276 Gambar):**
  - Kombinasi kedua sumber tersebut menghasilkan komposisi akhir dataset sebagai berikut:
    - **Coccidiosis:** 2.566 gambar
    - **Healthy (Sehat):** 2.404 gambar
    - **Salmonella:** 2.625 gambar
    - **New Castle Disease (NCD):** 681 gambar
  - Saat *training*, dataset gabungan ini otomatis dipecah secara proporsional menggunakan *Stratified Split* menjadi **70% Training**, **15% Validation**, dan **15% Testing**.

---

## 🏗️ 4. Arsitektur & Pipeline Pelatihan (AI)

Pelatihan dilakukan menggunakan **TensorFlow/Keras** di lingkungan Google Colab dengan skenario perbandingan 3 tahap (untuk kebutuhan Bab 4 Skripsi):

### A. Model 1: Baseline Custom CNN
* **Tujuan:** Sebagai pembanding dasar (performa tanpa *transfer learning*).
* **Arsitektur:** 3 *block* (Conv2D + MaxPooling2D) -> Flatten -> Dense (128) -> Dropout (0.5) -> Softmax (4 kelas).

### B. Model 2: MobileNetV2 (Feature Extraction)
* **Tujuan:** Memanfaatkan bobot *ImageNet* untuk ekstraksi fitur yang jauh lebih canggih.
* **Metode:** Semua *layer* bawaan MobileNetV2 **dibekukan** (*frozen*), melatih hanya *classifier head* dengan *Learning Rate* normal.

### C. Model 3: MobileNetV2 (Fine-Tuning)
* **Tujuan:** Mengadaptasi model secara penuh terhadap tekstur spesifik kotoran ayam peternakan asli.
* **Metode:** Membuka (*unfreeze*) **30 layer terakhir** MobileNetV2 dan melatih ulang dengan *Learning Rate* sangat kecil (`1e-5`).

### D. Konfigurasi Training & Alasan Teknis
* **Image Size & Batch Size:** `224x224` piksel (ukuran optimal yang disyaratkan arsitektur MobileNetV2) dengan `Batch Size: 32` (keseimbangan terbaik antara penggunaan memori GPU dan kestabilan pembaruan *gradient*).
* **Optimizer:** Adam (*Adaptive Moment Estimation*) karena mampu beradaptasi secara otomatis pada kecepatan konvergensi (pembelajaran) di dataset gambar.
* **Epoch (Durasi Pelatihan):**
  * **Tahap 1 - Feature Extraction (10 Epoch):** Jumlah layer yang dilatih sangat sedikit (hanya kepala klasifikasi) dengan LR yang besar. Model akan belajar dengan sangat cepat dan biasanya konvergen di bawah 10 putaran. Jika dipaksakan lebih lama, model akan rentan *overfitting*.
  * **Tahap 2 - Fine-Tuning (15 Epoch):** Karena langkah belajarnya (*Learning Rate*) sengaja dibuat merayap sangat lambat (`1e-5`), maka model membutuhkan waktu (jumlah iterasi) yang jauh lebih panjang. 15 epoch memberikan kesempatan yang cukup bagi model untuk merayap menemukan titik akurasi tertinggi tanpa terpotong prematur di tengah jalan.
* **Learning Rate (LR) Dinamis:**
  * **Tahap 1 (Feature Extraction):** `LR = 0.001` (Cenderung besar. Alasannya agar layer *Classifier Head* baru yang kita bangun bisa belajar dengan cepat dari nol tanpa terhambat).
  * **Tahap 2 (Fine-Tuning):** `LR = 1e-5` (Sangat kecil. Alasannya agar kita tidak secara agresif "merusak" pengetahuan/bobot asli *ImageNet* yang sudah tertanam di MobileNetV2, melainkan hanya menggesernya sedikit demi sedikit agar beradaptasi dengan tekstur feses ayam).
* **Callbacks Khusus:**
  * **EarlyStopping (patience=5):** Jika akurasi *Validation* tidak meningkat selama 5 *epoch* berturut-turut, pelatihan otomatis dihentikan. Alasannya: Mencegah *Overfitting* (model hanya hafal mati data *training* tapi bodoh di dunia nyata) dan menghemat waktu.
  * **ReduceLROnPlateau (factor=0.2, patience=3):** Jika akurasi stagnan, *Learning Rate* diperkecil secara drastis (80%). Alasannya: Saat model hampir mencapai puncak akurasi, langkah pencariannya harus lebih kecil dan teliti agar bisa menemukan titik loss paling minimal.

---

## 🗄️ 6. Skema Database (Supabase PostgreSQL)

Sistem menggunakan **Supabase** sebagai *Backend-as-a-Service* untuk keperluan *Database* relasional dan penyimpanan file (*Storage Bucket*).

### Tabel Utama:
1. **`workers`** (Tabel Pekerja Kandang)
   - Digunakan untuk standarisasi nama saat pekerja menyimpan hasil prediksi (menghindari salah ketik).
   - *Kolom:* `id` (UUID), `name`, `is_active` (boolean), `created_at`.
2. **`predictions`** (Tabel Riwayat Prediksi)
   - Menyimpan seluruh histori deteksi yang dikonfirmasi oleh pengguna.
   - *Kolom:* `id` (UUID), `image_url` (link gambar), `prediction` (kelas utama), `confidence`, `all_predictions` (JSON data 4 kelas), `worker_id` (Foreign Key ke *workers*), `deleted_at` (Penanda *soft-delete* dari Admin), dan `created_at`.
3. **Storage Bucket: `feses-images`**
   - Tempat penyimpanan foto feses hasil *upload* dari aplikasi.

### Keamanan (Row Level Security / RLS)
- Aplikasi *mobile* (Pekerja) dilarang melakukan `INSERT` langsung ke tabel `predictions` maupun ke *Storage Bucket*.
- Seluruh penulisan riwayat dan gambar **wajib** melewati backend FastAPI menggunakan *Service Role Key*, untuk menjamin validasi keamanan dan integritas *foreign key* `worker_id`.

---

## 📑 7. Kesimpulan Spesifikasi Sistem (Ringkasan SRS & SDD)

Berdasarkan dokumen *Software Requirements Specification* (SRS) dan *System Design Document* (SDD), berikut adalah kaidah dan aturan inti ( *Business Rules* ) yang diterapkan di aplikasi ini:

* **Validasi Dua Lapis (Two-Layer Validation):** Aplikasi *Mobile* akan memblokir gambar > 5MB atau file non-gambar sebelum dikirim. *Backend* FastAPI kembali memvalidasi ulang ukuran file (*HTTP 413 Payload Too Large*) dan format tipe data sebelum diumpankan ke model AI.
* **Peringatan Kepercayaan Rendah (Low Confidence Warning):** Jika skor akurasi (confidence) di bawah ambang batas dinamis (`confidence_threshold` yang dikirim dari server), aplikasi akan memunculkan peringatan (warna kuning/merah) agar pengguna mengambil ulang foto dari jarak/cahaya yang lebih baik.
* **Tanpa LLM (Large Language Models):** Penjelasan medis penyakit (*Knowledge Base*) menggunakan kamus statis yang sudah divalidasi ahli, bukan memanggil API ChatGPT/AI Generatif. Ini demi menghindari halusinasi (kesalahan rekomendasi medis) dan mempercepat latensi.
* **Keamanan Sesi Admin:** Token login Admin disimpan di enkripsi perangkat (*Keychain/Keystore*) menggunakan `expo-secure-store`, tidak disimpan secara teks polos (*plain text*).
* **Integritas Riwayat (Soft Delete):** Admin tidak dapat menghapus riwayat secara permanen (*hard delete*) dari UI, melainkan hanya menandainya terhapus (`deleted_at = NOW()`), untuk mencegah rusaknya data analitik secara permanen.
