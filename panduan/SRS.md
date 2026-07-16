Software Requirements Specification (SRS)

Sistem Deteksi Dini Penyakit Ayam Petelur Berbasis Citra Feses (ChickenShii)

1. Validasi Input & Keamanan (Two-Layer Validation)

Sistem mewajibkan validasi ketat di sisi Client (React Native) dan Server (FastAPI) untuk mencegah crash dan payload berbahaya.

1.1. Validasi Frontend (React Native / Expo)

Sumber Gambar: Diambil melalui expo-image-picker, baik dari kamera (launchCameraAsync) maupun galeri (launchImageLibraryAsync), dengan opsi allowsEditing: true agar native crop tool otomatis terbuka setelah gambar dipilih.

Crop Wajib: Sistem tidak boleh melanjutkan ke tahap deteksi apabila proses crop dibatalkan oleh pengguna (asset kosong/null) — pengguna wajib menyelesaikan atau membatalkan crop untuk kembali memilih ulang.

Tipe File: Hanya menerima MIME type image/jpeg, image/png, dan image/jpg — dibaca dari properti mimeType/type pada asset hasil crop.

Ukuran File: Maksimal 5 MB (5.242.880 bytes) — dicek dari properti fileSize pada asset; jika tidak tersedia, fallback ke pengecekan ukuran file via expo-file-system sebelum upload.

Behavior: Jika file tidak memenuhi syarat, sistem wajib memblokir upload dan menampilkan pesan error (Alert/Toast native) seketika sebelum melakukan request ke backend.

1.2. Validasi Backend (FastAPI)

Tipe File: Harus memeriksa content-type dari header dan/atau menggunakan magic numbers untuk memastikan file benar-benar gambar, bukan sekadar ekstensi palsu.

Ukuran File: Menolak (reject) request jika ukuran UploadFile melebihi 5 MB. Server mengembalikan HTTP Status 413 Payload Too Large.

Validasi Respons: Semua struktur respons dari API harus divalidasi menggunakan skema Pydantic (V2) sebelum dikirimkan ke client.

1.3. Validasi Simpan Hasil (POST /api/v1/predictions)

Pekerja Kandang Terpilih: Field worker_id wajib diisi dengan nilai hasil pilihan dari dropdown (SaveWorkerModal.tsx) — bukan input teks bebas. Tombol konfirmasi pada modal wajib disabled selama belum ada pekerja yang dipilih.

Validasi Server: Backend memvalidasi worker_id benar-benar terdaftar di tabel workers dan berstatus is_active = true sebelum insert dijalankan. 400 Bad Request dikembalikan jika worker_id kosong, tidak ditemukan, atau merujuk ke pekerja yang sudah dinonaktifkan — mengantisipasi kondisi race saat Admin menonaktifkan pekerja di waktu yang hampir bersamaan dengan proses Simpan.

Idempotensi: Setiap penekanan tombol Simpan menghasilkan satu baris baru di tabel predictions; sistem tidak melakukan update terhadap entri yang sudah tersimpan sebelumnya.

1.4. Validasi Kegagalan Simpan & Percobaan Ulang

Jika POST /api/v1/predictions gagal (kegagalan jaringan, timeout, atau respons error dari server), aplikasi wajib mempertahankan state gambar hasil crop dan hasil prediksi yang sudah ada di memori — tidak mengembalikan pengguna ke layar upload maupun meminta ulang proses Deteksi.

Aplikasi menampilkan RetrySaveBanner.tsx berisi pesan kegagalan dan tombol "Coba Lagi" yang mengulang pemanggilan POST /predictions dengan payload (gambar, hasil prediksi, worker_id) yang sama persis seperti percobaan sebelumnya.

Apabila aplikasi ditutup/dibackground sebelum Simpan berhasil, state hasil yang belum tersimpan boleh hilang (tidak wajib dipertahankan lintas sesi aplikasi) — pengguna perlu mengulang dari proses Deteksi. Ini merupakan batasan yang disengaja untuk menjaga kesederhanaan implementasi pada P0/P1.

1.5. Validasi Manajemen Pekerja Kandang (Admin)

Nama Pekerja: Field name pada tabel workers wajib diisi, tidak boleh kosong/hanya spasi, dan divalidasi baik di WorkerListManager.tsx maupun lewat constraint Not Null di database.

Duplikasi Nama: Sistem tidak menegakkan keunikan nama secara ketat di level database (dua pekerja bisa kebetulan bernama sama), namun UI wajib menampilkan peringatan non-blocking apabila Admin menambahkan nama yang sudah ada di daftar aktif, untuk mengurangi risiko duplikasi tidak disengaja.

Nonaktifkan, Bukan Hapus: Admin hanya bisa mengubah is_active menjadi false, tidak tersedia opsi hapus permanen baris workers dari UI — mencegah hilangnya referensi pada riwayat prediksi yang sudah ada (FK worker_id akan menjadi tidak valid jika baris induknya dihapus).

1.6. Validasi Pencarian, Filter, dan Hapus Riwayat (Admin)

Pencarian & Filter: Query pada HistorySearchFilterBar.tsx (nama pekerja, kelas penyakit, rentang tanggal) wajib selalu disertai kondisi deleted_at IS NULL, agar entri yang sudah di-soft-delete tidak pernah muncul kembali lewat pencarian.

Hapus (Soft Delete): Aksi hapus pada HistoryListItem.tsx wajib menampilkan dialog konfirmasi sebelum mengeksekusi UPDATE predictions SET deleted_at = now(). Tidak tersedia mekanisme hard delete dari UI aplikasi.

1.7. Validasi Statistik Dashboard (GET /api/v1/stats)

Autentikasi: Endpoint ini wajib disertai token sesi Admin yang valid (Authorization: Bearer <jwt>). 401 Unauthorized dikembalikan jika token tidak ada, tidak valid, atau kedaluwarsa.

Parameter period: Wajib salah satu dari week, month, atau year. 400 Bad Request jika diisi nilai lain.

Parameter reference_date: Opsional, format YYYY-MM-DD. Jika tidak diisi, backend menggunakan tanggal hari ini sebagai acuan. 400 Bad Request jika format tidak valid.

Perhitungan Rentang: Backend yang bertanggung jawab menentukan rentang tanggal (start/end) sesuai period dan reference_date — bukan frontend — agar konsisten dengan zona waktu server dan definisi awal minggu/bulan/tahun.

2. Behavior Sistem & Error Handling

2.1. Manajemen State Loading & Latensi

Cold Start Awareness: Karena backend menggunakan layanan cloud tier gratis (Railway/Render), cold start dapat memakan waktu hingga ~30 detik. Aplikasi wajib memiliki state loading interaktif (Modal/overlay dengan ActivityIndicator) yang mengunci tombol submit (disabled state) agar pengguna tidak melakukan spam tap.

Warm Inference: Setelah server aktif, proses prediksi (inference) ditargetkan selesai dalam 1-3 detik.

2.2. Standarisasi Error Handling

422 Unprocessable Entity: Dikembalikan jika file rusak, tidak terbaca oleh Pillow/OpenCV, atau format salah.

413 Payload Too Large: Dikembalikan jika file melebihi batas 5MB di sisi server.

500 Internal Server Error: Dikembalikan jika terjadi kegagalan saat load model Keras atau saat proses inferensi. Aplikasi harus menangkap pesan ini dengan anggun ("Terjadi kesalahan pada server, coba beberapa saat lagi") tanpa mengekspos stack trace ke pengguna.

Konektivitas: Karena aplikasi berjalan di perangkat mobile, aplikasi wajib menangani kondisi tanpa koneksi internet/timeout secara eksplisit (pesan berbeda dari error server) sebelum request sempat dikirim.

2.3. Peringatan Confidence Rendah

Ambang Batas: Backend mengembalikan nilai confidence_threshold (default 60.0) pada respons POST /predict. Aplikasi wajib membandingkan confidence utama terhadap nilai ini — bukan meng-hardcode angka ambang batas di kode client — agar nilai bisa disesuaikan dari sisi backend tanpa rilis ulang aplikasi.

Tampilan: Apabila confidence < confidence_threshold, LowConfidenceWarning.tsx wajib tampil di antara ConfidenceBarChart.tsx dan DiseaseInfoCard.tsx, berisi anjuran mengambil ulang foto dengan pencahayaan/framing yang lebih baik. Peringatan ini tidak menghalangi pengguna untuk tetap melanjutkan (melihat rekomendasi maupun menyimpan hasil) apabila mereka memilih demikian.

3. Aturan Aplikasi & Konstrain Bisnis

3.1. Preprocessing Gambar

Tanggung Jawab: Proses normalisasi dan resize gambar ke resolusi 224x224x3 piksel harus dilakukan di Service Layer pada backend (menggunakan Pillow/NumPy), bukan di dalam arsitektur model AI (Lambda layer), dan bukan di sisi client.

Alasan: Memisahkan preprocessing dari grafis komputasi model memastikan portabilitas file .keras dan menghindari isu deserialize function saat deployment. Melakukan preprocessing di backend juga memastikan hasil konsisten terlepas dari perangkat mobile yang dipakai.

3.2. Knowledge Base Statis

Informasi penyakit — mencakup deskripsi, penyebab (cause), dan rekomendasi penanganan awal — diikat langsung di dalam kode (diseaseInfo.ts di React Native atau recommendations.py di FastAPI). Ketiga jenis informasi ini masing-masing dirender sebagai card terpisah di Layar Hasil.

Larangan: Sistem dilarang keras melakukan panggilan API ke Large Language Models (LLM) eksternal untuk melakukan inferensi teks guna mencegah misinformasi medis dan menghindari beban biaya/latensi.

3.3. Penegakan Disclaimer Medis

UI/UX wajib mengunci teks disclaimer ("Hasil ini adalah dugaan awal dari sistem AI. Segera konsultasikan dengan dokter hewan...") pada DisclaimerBanner.tsx, diletakkan setelah Card Rekomendasi Penanganan Awal dan sebelum tombol Reset/Simpan, selalu terlihat (fully rendered), tidak boleh disembunyikan di dalam accordion/collapsible section yang tertutup secara default, dan tidak boleh hilang saat scroll tanpa disengaja.

3.4. Penyimpanan Sesi Autentikasi (Mobile-specific)

Token sesi/JWT hasil login Admin dari Supabase Auth wajib disimpan menggunakan expo-secure-store, yang memanfaatkan Keychain di iOS dan Keystore di Android. Ini memastikan token tersimpan terenkripsi di level OS, bukan sebagai plain text.

Session harus divalidasi ulang (cek expiry) setiap kali screen admin/*.tsx dibuka, dan sistem wajib melakukan redirect otomatis ke login.tsx apabila sesi tidak valid atau sudah kedaluwarsa.
