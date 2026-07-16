Product Requirements Document (PRD)

Sistem Deteksi Dini Penyakit Ayam Petelur Berbasis Citra Feses (ChickenShii)

1. Tujuan Produk

Sistem ini adalah aplikasi mobile yang dibangun menggunakan React Native (Expo), difungsikan untuk deteksi dini penyakit ayam petelur (layer) di PT Nirwana Farm menggunakan citra kotoran (feses). Sistem memanfaatkan model deep learning MobileNetV2 fine-tuned (akurasi target/baseline 95%).

Nilai Utama (Core Value): Sistem ini bertindak sebagai alat bantu (Decision Support System) untuk memberikan dugaan awal guna mempercepat tindakan preventif peternak. Sistem ini bukan sebagai pengganti diagnosis dokter hewan.

2. Batasan Teknologi (Tech Stack Constraints)

Frontend: React Native, dikembangkan menggunakan Expo (managed workflow). Navigasi menggunakan Expo Router (file-based routing). Styling menggunakan NativeWind (Tailwind CSS untuk React Native). Dilarang eject dari Expo (bare workflow) tanpa alasan teknis yang kuat, guna menjaga kemudahan build lintas platform (Android/iOS).

Backend: FastAPI (Python), digunakan murni sebagai REST API.

Database & Storage: Supabase.

3. Pengguna (User Roles)

Sistem ini membatasi akses pada dua jenis pengguna untuk menjaga scope proyek:

Pekerja Kandang:

Tidak memerlukan autentikasi (login). Role ini merepresentasikan staf kandang di PT Nirwana Farm yang menjalankan pengecekan harian.

Dapat mengunggah foto feses ayam (single image) via kamera atau galeri perangkat.

Melihat hasil prediksi kelas penyakit, confidence score, dan probabilitas seluruh kelas.

Membaca deskripsi singkat penyakit dan rekomendasi awal (berbasis static knowledge base).

Melihat disclaimer medis.

Admin (Pemilik Farm):

Memerlukan autentikasi (login) via Supabase Auth.

Memiliki seluruh kapabilitas Pekerja Kandang.

Mengakses dashboard statistik — menampilkan total prediksi serta jumlah/distribusi hasil per kelas penyakit (Coccidiosis, Healthy, New Castle Disease, Salmonellosis), dengan filter periode Mingguan, Bulanan, atau Tahunan.

Meninjau riwayat prediksi di tabel database, dengan kemampuan mencari dan memfilter (berdasarkan nama Pekerja Kandang, kelas penyakit, dan rentang tanggal), serta menghapus entri riwayat (soft delete — entri disembunyikan dari tampilan, bukan dihapus permanen dari database).

Mengelola daftar Pekerja Kandang — menambahkan nama pekerja baru dan menonaktifkan pekerja yang sudah tidak bertugas, agar nama yang dipilih saat proses Simpan selalu konsisten dan tidak diketik bebas.

Mengunduh (export) data prediksi dalam format CSV untuk keperluan penelitian lanjutan.

4. Fitur Utama (Core Features)

P0 (Wajib Ada - Core Flow)

Upload & Crop Foto: Fungsionalitas bagi Pekerja Kandang untuk mengambil/memilih satu gambar feses via expo-image-picker (kamera atau galeri). Setelah foto dipilih, sistem langsung membuka native crop tool (allowsEditing: true) agar pengguna bisa mengotak-kan sendiri bagian feses yang relevan sebelum lanjut — pola interaksi yang sama seperti saat memasang foto profil. Validasi format JPG/PNG/JPEG dan maksimal 5MB tetap dilakukan terhadap hasil crop.

Indikator Loading: UI wajib memblokir interaksi (modal/overlay) dan menampilkan status loading yang jelas saat inference model berjalan (mengingat potensi cold start server).

Layar Hasil Prediksi: Setelah inference selesai, sistem menampilkan hasil dalam susunan kartu berikut secara berurutan:

1. Foto hasil crop yang diupload.

2. Akurasi/Confidence prediksi penyakit — nama kelas penyakit terprediksi (Coccidiosis, Healthy, New Castle Disease, Salmonellosis) beserta persentase confidence, dan bar chart distribusi probabilitas keempat kelas (menggunakan library chart yang kompatibel React Native, contoh react-native-chart-kit atau victory-native — Recharts tidak kompatibel di RN). Jika confidence utama berada di bawah ambang batas 60%, tampilkan catatan tambahan yang mengingatkan bahwa hasil kurang meyakinkan dan disarankan mengambil ulang foto dengan pencahayaan/framing yang lebih baik.

3. Card Penjelasan Penyakit — deskripsi singkat penyakit yang terdeteksi, bersumber dari data statis (diseaseInfo.ts).

4. Card Penyebab Penyakit — etiologi/faktor penyebab penyakit tersebut, juga dari data statis.

5. Card Rekomendasi Penanganan Awal — langkah-langkah tindakan awal yang disarankan.

Seluruh isi knowledge base (deskripsi, penyebab, rekomendasi) bersumber dari data statis. Dilarang menggunakan LLM generatif untuk fitur ini guna menghindari latensi dan halusinasi informasi medis.

Tombol Reset/Ulangi: Mengosongkan state hasil prediksi dan foto, mengembalikan pengguna ke layar upload untuk mencoba foto lain.

Tombol Simpan: Memicu modal pilih nama pengambil gambar, berupa dropdown berisi daftar Pekerja Kandang aktif (bukan input teks bebas). Setelah nama dipilih dan dikonfirmasi, sistem mengirim gambar, hasil prediksi, dan referensi pekerja tersebut ke backend untuk disimpan permanen. Tanpa menekan tombol ini, hasil prediksi bersifat sementara dan tidak tercatat ke riwayat. Apabila proses simpan gagal (misal koneksi terputus), sistem menampilkan pesan error beserta tombol "Coba Lagi" yang mengulang pengiriman tanpa perlu mengulang proses crop maupun deteksi dari awal.

Disclaimer Medis: Peringatan permanen yang tegas di UI bahwa hasil adalah dugaan awal AI, bukan diagnosis final dokter hewan. Selalu tampil di Layar Hasil Prediksi, tidak boleh disembunyikan.

P1 (Sebaiknya Ada - Data & Admin)

Pencatatan Riwayat (Database): Penyimpanan gambar ke Storage dan pencatatan hasil prediksi ke Database (Supabase) terjadi hanya ketika Pekerja Kandang menekan tombol Simpan dan memilih nama pengambil gambar dari dropdown. Setiap entri riwayat menyimpan referensi ke pekerja tersebut sebagai atribut worker_id (relasi ke tabel workers), bukan teks bebas.

Dashboard Admin: Layar tertutup (protected screen) yang menampilkan daftar riwayat seluruh prediksi (FlatList) beserta thumbnail gambar, hasil, nama pekerja, dan timestamp.

Pencarian & Filter Riwayat: Pada daftar riwayat di Dashboard Admin, tersedia kolom pencarian dan filter — berdasarkan nama Pekerja Kandang, kelas penyakit, dan rentang tanggal. Fitur ini terpisah dari filter periode pada Statistik (lihat di bawah); yang satu memfilter isi daftar/tabel, yang satu mengagregasi jumlah untuk chart.

Hapus Riwayat Prediksi: Admin dapat menghapus entri riwayat dari daftar. Penghapusan bersifat soft delete — entri ditandai tersembunyi (tidak tampil lagi di daftar riwayat, statistik, maupun export CSV) tanpa benar-benar menghapus barisnya dari database, sehingga masih bisa dipulihkan bila diperlukan.

Manajemen Pekerja Kandang: Admin dapat menambahkan nama Pekerja Kandang baru dan menonaktifkan pekerja yang sudah tidak bertugas. Pekerja yang dinonaktifkan tidak lagi muncul di dropdown pemilihan nama saat Pekerja Kandang menekan Simpan, namun riwayat prediksi miliknya di masa lalu tetap utuh dan tetap menampilkan namanya.

Statistik Jumlah Penyakit Terdeteksi: Menampilkan jumlah kasus per kelas penyakit (Coccidiosis, Healthy, New Castle Disease, Salmonellosis) dalam bentuk chart, dengan filter periode: Mingguan (7 hari terakhir dari minggu berjalan), Bulanan (per bulan kalender), dan Tahunan (per tahun kalender). Admin dapat berpindah periode lewat segmented control/dropdown, dan (untuk Bulanan/Tahunan) memilih bulan atau tahun spesifik.

P2 (Nice to Have)

Export CSV Admin: Fitur untuk mengunduh seluruh data riwayat prediksi, memanfaatkan expo-file-system untuk generate file dan expo-sharing untuk membagikan/menyimpan file tersebut di perangkat (tidak ada mekanisme "download browser" di mobile).

Dark Mode: Dukungan tema gelap untuk aplikasi, memanfaatkan dukungan dark mode bawaan NativeWind.

5. Alur Pengguna (User Flow)

Flow Pekerja Kandang:

Akses & Upload: User membuka aplikasi (screen Home / app/index.tsx). Sistem menampilkan area upload dengan opsi kamera atau galeri.

Crop & Validasi: User memilih/mengambil foto, lalu native crop tool otomatis terbuka agar user bisa mengotak-kan bagian feses yang ingin dianalisis. Aplikasi memvalidasi format dan ukuran hasil crop. Jika valid, preview ditampilkan. Jika tidak, munculkan error toast/alert.

Proses Inference: User menekan tombol "Deteksi". Sistem menampilkan overlay loading. Data gambar hasil crop dikirim melalui POST /api/v1/predict ke backend (khusus inference, belum tersimpan).

Layar Hasil: Backend merespons dengan JSON. Aplikasi merender: foto yang diupload, akurasi/confidence prediksi, Card Penjelasan Penyakit, Card Penyebab Penyakit, Card Rekomendasi Penanganan Awal, dan Disclaimer — diikuti tombol Reset/Ulangi dan Simpan di bagian bawah.

Reset atau Simpan:

Jika user menekan Reset/Ulangi, state dikosongkan dan user kembali ke layar upload.

Jika user menekan Simpan, muncul modal berisi dropdown daftar Pekerja Kandang aktif. Setelah nama dipilih dan dikonfirmasi, aplikasi mengirim gambar, hasil prediksi, dan worker_id terpilih melalui POST /api/v1/predictions ke backend untuk disimpan ke Storage dan Database. Data ini kemudian akan muncul di halaman Riwayat pada Dashboard Admin. Jika pengiriman gagal, aplikasi menampilkan tombol "Coba Lagi" tanpa mengembalikan user ke layar upload — gambar dan hasil prediksi yang sudah ada tetap dipertahankan di state.

Flow Admin:

Login: Admin membuka screen app/admin/login.tsx dan memasukkan kredensial.

Dashboard: Setelah sukses, navigasi mengarahkan ke screen app/admin/index.tsx (protected) yang secara otomatis memuat (fetch) data statistik dan riwayat dari Supabase.

Manajemen Riwayat: Admin dapat mencari/memfilter baris data riwayat (nama pekerja, kelas penyakit, rentang tanggal), menekan gambar untuk memperbesar (modal), menghapus entri riwayat tertentu (soft delete, dengan konfirmasi sebelum eksekusi), dan menekan tombol Export CSV untuk membagikan/menyimpan log data ke perangkat.

Manajemen Pekerja Kandang: Dari Dashboard, Admin dapat membuka layar/section pengelolaan daftar Pekerja Kandang untuk menambahkan nama baru atau menonaktifkan pekerja yang sudah tidak bertugas.
