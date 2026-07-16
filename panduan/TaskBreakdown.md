Task Breakdown & Implementation Plan

Sistem Deteksi Dini Penyakit Ayam Petelur Berbasis Citra Feses (ChickenShii)

Gunakan daftar ini sebagai backlog kerja (seperti Jira/Trello). Jangan pindah ke fase selanjutnya sebelum fase saat ini selesai dan diuji secara menyeluruh.

Fase 1: Backend Refactoring & Core API (Prioritas: P0)

Fokus: Membersihkan tech debt dan membangun arsitektur FastAPI yang solid di dalam folder backend/.

[ ] Task 1.1: Setup Clean Architecture

Inisialisasi environment Python 3.11 di dalam folder backend/.

Buat struktur folder: app/api/, app/core/, app/services/, app/models/.

Konfigurasi core/config.py untuk environment variables (CORS, Supabase keys).

[ ] Task 1.2: Model Preparation & Loading

Ekspor ulang model MobileNetV2 menjadi file .keras murni tanpa Lambda layer (Hapus safe_mode=False dari kode).

Buat kelas MLService di services/ml_service.py yang memuat model ke dalam memori saat startup menggunakan parameter standar.

[ ] Task 1.3: Image Preprocessing Service

Di dalam MLService, buat fungsi untuk membaca bytes gambar.

Implementasikan resize ke 224x224, konversi ke RGB 3 channel, dan normalisasi piksel menggunakan Pillow dan NumPy.

[ ] Task 1.4: Endpoint Implementation & Validation

Buat Pydantic schemas (V2) untuk validasi request dan response.

Implementasikan endpoint GET / di api/routes.py.

Implementasikan endpoint POST /api/v1/predict (inference-only, tidak menyimpan apa pun) di api/routes.py lengkap dengan error handling (422 untuk file rusak, 413 untuk ukuran > 5MB).

Tambahkan field cause (penyebab penyakit) pada recommendation_data di utils/knowledge_base.py, selain description dan immediate_action yang sudah ada.

Tambahkan konstanta CONFIDENCE_THRESHOLD (default 60.0) di core/config.py, dan sertakan sebagai field confidence_threshold pada response POST /api/v1/predict.

Fase 2: Database & Storage Integration (Prioritas: P1)

Fokus: Mengamankan data riwayat prediksi.

[ ] Task 2.1: Supabase Setup

Buat proyek di dasbor Supabase.

Eksekusi SQL untuk membuat tabel workers (id, name, is_active, created_at) sesuai skema di SDD.

Eksekusi SQL untuk membuat tabel predictions sesuai skema di SDD, dengan kolom worker_id (FK -> workers.id) dan deleted_at (nullable, untuk soft delete) — bukan submitted_by.

Buat RLS policy pada tabel workers: role anon hanya boleh SELECT baris dengan is_active = true; role authenticated boleh SELECT semua baris serta INSERT/UPDATE.

Buat RLS policy pada tabel predictions: role authenticated boleh SELECT dan UPDATE (dipakai untuk soft delete); INSERT tidak diizinkan lewat RLS karena selalu lewat backend (service role key).

Buat storage bucket feses-images dan atur policy akses publik (read-only).

[ ] Task 2.2: Backend Database Service

Buat services/supabase_service.py.

Implementasikan fungsi untuk mengunggah gambar ke bucket Supabase.

Implementasikan fungsi untuk memvalidasi worker_id — cek keberadaan dan is_active = true di tabel workers sebelum insert dijalankan.

Implementasikan fungsi untuk melakukan INSERT log prediksi (termasuk worker_id) ke tabel predictions.

Implementasikan endpoint POST /api/v1/predictions di api/routes.py yang menerima gambar + hasil prediksi + worker_id dari client, lalu memanggil service ini untuk upload gambar dan insert log. Validasi worker_id tidak boleh kosong/tidak ditemukan/nonaktif (400 Bad Request jika demikian).

[ ] Task 2.3: Statistik & Filter Periode

Di services/supabase_service.py, buat fungsi untuk menghitung rentang tanggal (start/end) berdasarkan parameter period (week/month/year) dan reference_date.

Buat fungsi query ke tabel predictions dengan filter created_at pada rentang tersebut dan deleted_at IS NULL, lalu agregasi jumlah per kelas (GROUP BY prediction).

Implementasikan endpoint GET /api/v1/stats di api/routes.py — wajib memvalidasi token Admin (401 jika tidak valid), validasi param period (400 jika bukan week/month/year).

Fase 3: Mobile App Development (React Native / Expo) (Prioritas: P0)

Fokus: Membangun aplikasi mobile untuk Pekerja Kandang di dalam folder mobile/.

[ ] Task 3.1: Expo & NativeWind Initialization

Inisialisasi proyek dengan npx create-expo-app mobile di root repositori.

Install dan konfigurasi NativeWind (Tailwind CSS untuk React Native).

Setup Expo Router untuk navigasi (app/index.tsx, app/admin/login.tsx, app/admin/index.tsx).

Install dependency inti: expo-image-picker, axios, expo-secure-store, expo-file-system, expo-sharing.

[ ] Task 3.2: Static Knowledge Base

Buat file utils/diseaseInfo.ts yang berisi kamus data statis penyakit, mencakup tiga field per kelas: description (penjelasan), cause (penyebab), dan immediate_action (rekomendasi penanganan awal).

[ ] Task 3.3: UI Components - Upload & Crop

Buat komponen ImagePickerArea.tsx memakai expo-image-picker (opsi kamera & galeri) dengan allowsEditing: true agar native crop tool otomatis terbuka setelah gambar dipilih.

Implementasikan validasi frontend (MIME type dan Max Size 5MB) terhadap hasil crop sebelum state gambar disimpan.

Tangani kasus user membatalkan crop (asset null) — kembalikan ke state awal tanpa lanjut ke deteksi.

[ ] Task 3.4: API Integration & Layar Hasil

Buat instance axios di services/api.ts untuk menembak POST /api/v1/predict (inference) dan POST /api/v1/predictions (simpan) ke backend.

Buat komponen LoadingOverlay.tsx (Modal + ActivityIndicator, beri peringatan cold start ~30 detik).

Buat komponen UploadedImageCard.tsx (preview foto hasil crop), ConfidenceBarChart.tsx (distribusi probabilitas keempat kelas — pakai react-native-chart-kit atau victory-native), LowConfidenceWarning.tsx (tampil jika confidence < confidence_threshold dari respons /predict), DiseaseInfoCard.tsx (penjelasan penyakit), DiseaseCauseCard.tsx (penyebab penyakit), dan RecommendationCard.tsx (rekomendasi penanganan awal).

Buat komponen DisclaimerBanner.tsx yang selalu tampil, tidak collapsible, diletakkan setelah RecommendationCard.tsx.

Buat komponen ResultActions.tsx berisi tombol Reset/Ulangi (kembali ke state upload, clear semua state) dan Simpan (membuka SaveWorkerModal.tsx).

Buat komponen SaveWorkerModal.tsx — dropdown berisi daftar Pekerja Kandang aktif (fetch langsung dari tabel workers via Supabase JS SDK, WHERE is_active = true), tombol konfirmasi disabled sampai ada pekerja terpilih, memanggil POST /api/v1/predictions membawa gambar + hasil prediksi + worker_id terpilih, lalu tampilkan feedback sukses (toast/alert) setelah tersimpan.

Buat komponen RetrySaveBanner.tsx — muncul saat POST /api/v1/predictions gagal, mempertahankan state gambar & hasil prediksi yang ada, dengan tombol "Coba Lagi" yang mengulang request dengan payload yang sama.

Fase 4: Admin Panel (Mobile) (Prioritas: P1)

Fokus: Fitur monitoring dan manajemen data untuk Admin (pemilik farm), tetap di dalam aplikasi mobile yang sama.

[ ] Task 4.1: Auth & Protected Route

Buat screen app/admin/login.tsx dengan form email/password.

Integrasikan Supabase Auth (buat services/supabase.ts).

Simpan sesi/token memakai expo-secure-store (bukan localStorage — API tersebut tidak ada di React Native).

Buat _layout.tsx pada grup app/admin/ sebagai guard, agar screen di dalamnya tidak bisa diakses tanpa sesi valid (redirect ke login.tsx jika belum login).

[ ] Task 4.2: Admin Dashboard — Riwayat, Pencarian, Filter & Hapus

Buat antarmuka dasbor di screen app/admin/index.tsx.

Fetch data dari tabel predictions (Supabase) dengan kondisi WHERE deleted_at IS NULL.

Tampilkan data dalam bentuk daftar (FlatList dari HistoryListItem.tsx: thumbnail gambar, hasil, confidence, nama pekerja via join ke workers, tanggal).

Buat komponen HistorySearchFilterBar.tsx untuk mencari/memfilter riwayat berdasarkan nama pekerja, kelas penyakit, dan rentang tanggal — query langsung ke Supabase (bukan lewat backend FastAPI).

Tambahkan aksi hapus pada HistoryListItem.tsx: dialog konfirmasi, lalu UPDATE predictions SET deleted_at = now() lewat Supabase JS SDK (soft delete, bukan hard delete).

Tambahkan tombol "Export to CSV": generate string CSV (bisa pakai papaparse) dari data yang sedang tampil (hormati hasil pencarian/filter aktif), tulis ke file sementara dengan expo-file-system, lalu bagikan/simpan ke perangkat memakai expo-sharing (karena tidak ada mekanisme download browser di mobile).

[ ] Task 4.3: Statistik Jumlah Penyakit Terdeteksi

Buat komponen StatsPeriodFilter.tsx — segmented control/dropdown untuk memilih periode Mingguan/Bulanan/Tahunan, plus picker tambahan untuk memilih bulan/tahun spesifik saat periode Bulanan/Tahunan dipilih.

Buat komponen StatsSummaryChart.tsx yang memanggil GET /api/v1/stats (menyertakan token Admin) sesuai periode terpilih, dan menampilkan jumlah kasus per kelas penyakit dalam bentuk chart (react-native-chart-kit atau victory-native).

Tangani state loading & error (termasuk redirect ke login.tsx jika request mengembalikan 401).

Pasang StatsPeriodFilter.tsx dan StatsSummaryChart.tsx di bagian atas app/admin/index.tsx, sebelum daftar riwayat (FlatList).

[ ] Task 4.4: Manajemen Pekerja Kandang

Buat screen app/admin/workers.tsx (protected, di dalam grup admin sehingga otomatis ikut ter-guard oleh _layout.tsx).

Buat komponen WorkerListManager.tsx — form tambah nama pekerja baru (insert ke tabel workers via Supabase JS SDK), dan daftar pekerja terdaftar dengan toggle is_active per baris.

Tampilkan peringatan non-blocking (bukan validasi keras) apabila Admin menambahkan nama yang sudah ada di daftar pekerja aktif.

Tambahkan tautan/tombol navigasi ke app/admin/workers.tsx dari app/admin/index.tsx.

Fase 5: Deployment (Prioritas: P0)

Fokus: Meluncurkan sistem ke production.

[ ] Task 5.1: Backend Deployment

Buat Dockerfile untuk aplikasi FastAPI di dalam folder backend/.

Push repositori ke GitHub dan hubungkan backend/ ke Railway / Render.

Atur semua Environment Variables di platform cloud.

[ ] Task 5.2: Mobile App Build & Distribution

Konfigurasi eas.json (EAS Build) dengan profile development, preview, dan production.

Set environment variable API URL backend memakai prefix EXPO_PUBLIC_ (contoh: EXPO_PUBLIC_API_URL) agar terbaca di client saat runtime.

Jalankan eas build untuk menghasilkan APK/AAB (Android); IPA (iOS) bersifat opsional tergantung kebutuhan sidang.

Update CORS_ORIGINS di backend agar menerima request dari host/environment yang relevan untuk aplikasi mobile.

(Opsional, untuk keperluan demo sidang skripsi) Distribusikan build preview lewat Expo Go atau internal distribution (link EAS), tanpa perlu submit resmi ke Play Store/App Store.
