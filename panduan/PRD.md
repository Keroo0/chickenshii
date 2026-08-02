# Product Requirements Document (PRD)

## 1. Tujuan produk

ChickenShii adalah aplikasi mobile untuk deteksi dini penyakit ayam petelur dari citra feses. Model MobileNetV2 menghasilkan dugaan awal empat kelas, sedangkan manusia menjalankan validasi dan tindak lanjut. Produk merupakan Decision Support System dan tidak menggantikan diagnosis dokter hewan.

Nilai utama produk:

- membantu Pekerja Kandang melakukan pemeriksaan rutin dengan cepat;
- memastikan ayam yang terindikasi penyakit segera dipisahkan;
- memberi ruang validasi profesional kepada Dokter Hewan;
- mencatat progres penanganan oleh Kepala Pekerja;
- mempertahankan fungsi pengawasan data bagi Admin tanpa membuka data medis/operasional lintas role.

## 2. Batasan teknologi

- Mobile memakai React Native, Expo managed workflow, Expo Router, dan NativeWind.
- Backend memakai FastAPI sebagai REST API serta menjalankan preprocessing dan MobileNetV2.
- Supabase dipakai untuk PostgreSQL, Auth, dan Storage.
- Role otorisasi disimpan di `app_metadata` Supabase Auth.
- Rekomendasi berasal dari knowledge base statis; tidak menggunakan LLM generatif.
- Foto JPG/JPEG/PNG maksimal 5 MB dan preprocessing 224×224 dilakukan backend.

## 3. Pengguna dan hak akses

### 3.1 Pekerja Kandang

Tidak login. Dapat mengambil/memilih satu foto, melakukan crop, menjalankan deteksi, melihat kelas/confidence/probabilitas, deskripsi, penyebab, rekomendasi, disclaimer, dan menyimpan hasil dengan memilih pekerja aktif dari dropdown.

### 3.2 Admin/Pemilik

Login melalui `/login` lalu diarahkan ke `/admin`. Dapat:

- melihat dashboard statistik;
- mencari, memfilter, dan soft delete riwayat prediksi;
- export CSV prediksi;
- mengelola pekerja kandang lama;
- membuat akun staf dengan nama, email, role, dan password sementara.

Tab `Pekerja` berubah menjadi `Pengguna` dan menggabungkan pengelolaan pekerja dengan pembuatan akun `veterinarian`/`head_worker`. Admin tidak melihat validasi atau tindak lanjut dan data tersebut tidak masuk export CSV.

### 3.3 Dokter Hewan

Login melalui `/login` lalu diarahkan ke `/doctor`. Area Dokter memiliki tepat dua tab:

1. `Validasi`: antrean bersama prediksi penyakit yang belum divalidasi.
2. `Riwayat`: hanya validasi milik dokter yang sedang login.

Dokter memilih `Sesuai`, `Tidak sesuai`, atau `Tidak dapat dipastikan`. Pilihan tidak sesuai wajib menyertakan label koreksi yang berbeda dari label AI, sedangkan catatan opsional. Dokter pembuat dapat mengedit sebelum penanganan dimulai. Detail/form tampil sebagai modal.

### 3.4 Kepala Pekerja

Login melalui `/login` lalu diarahkan ke `/head-worker`. Area Kepala Pekerja memiliki tepat dua tab:

1. `Dashboard`: kasus hari ini, belum dipisahkan, masih menunggu validasi, dan penanganan aktif.
2. `Tindak Lanjut`: konfirmasi `Sudah dipisahkan`, `Mulai penanganan`, dan `Penanganan selesai`.

Detail dan konfirmasi tampil melalui modal.

## 4. Fitur produk

### P0 — deteksi dan penyimpanan

- Kamera/galeri, crop, preview, dan validasi file.
- Loading yang memblokir submit ganda.
- Hasil berisi foto, kelas, confidence, probabilitas, deskripsi, penyebab, rekomendasi, low-confidence warning, dan disclaimer.
- Reset untuk mengulang.
- Simpan melalui modal pekerja aktif; kegagalan menyimpan mempertahankan state dan menyediakan retry.

### P0 — autentikasi dan otorisasi staf

- Satu form `/login` untuk seluruh staf.
- Redirect berbasis `app_metadata.role`: `admin` → `/admin`, `veterinarian` → `/doctor`, `head_worker` → `/head-worker`.
- Role kosong/tidak dikenal ditolak dan logout.
- Route guard dan backend menolak akses lintas role.
- Token dikirim sebagai Bearer token pada API terlindungi.

### P0 — workflow penyakit

- Endpoint simpan menolak label di luar empat kelas model dengan `422`. Trigger hanya membuat follow-up untuk `predictions` baru berlabel `Coccidiosis`, `New Castle Disease`, atau `Salmonellosis`; `Healthy` tidak membuat follow-up.
- Data lama tidak di-backfill.
- Kepala Pekerja boleh dan wajib mencatat pemisahan segera setelah deteksi penyakit, tanpa menunggu dokter.
- Satu prediksi hanya memiliki satu validasi; request pertama menang saat terjadi kompetisi.
- Validasi `matching` memastikan label AI; `incorrect` memakai label koreksi; `uncertain` menandai perlu pemeriksaan lebih lanjut.
- Penanganan hanya bisa dimulai setelah ayam dipisahkan dan validasi definitif memastikan penyakit.
- Koreksi menjadi `Healthy` menutup kasus otomatis.
- Penanganan tidak dapat dimulai untuk `uncertain`.
- Rekomendasi selalu tersedia dan mengikuti label efektif dokter setelah koreksi.

### P1 — Admin dan data

- Statistik mingguan, bulanan, dan tahunan.
- Riwayat dengan pencarian/filter, soft delete, serta preview gambar.
- Manajemen pekerja aktif/nonaktif.
- Pembuatan akun staf; email duplikat ditolak.
- CSV hanya untuk prediksi yang terlihat bagi Admin.

## 5. User flow

### Pekerja Kandang

`Home → pilih/crop foto → Deteksi → Hasil → Reset atau Simpan → pilih nama pekerja → tersimpan`.

Jika prediksi tersimpan merupakan penyakit baru, trigger database otomatis membuat follow-up. Jika hasil `Healthy`, alur berhenti tanpa workflow.

### Login staf

`/login → Supabase Auth → baca app_metadata.role → redirect area role`. Kegagalan token atau role mengakhiri sesi dan menampilkan error.

### Dokter Hewan

`Validasi → buka modal kasus → pilih verdict/koreksi/catatan → simpan → kasus hilang dari antrean → muncul pada Riwayat dokter pembuat`.

Edit dari Riwayat hanya tersedia bagi pembuat dan sebelum `treatment_started_at` terisi.

### Kepala Pekerja

`Dashboard/Tindak Lanjut → buka modal kasus → Sudah dipisahkan → tunggu validasi definitif → Mulai penanganan → Penanganan selesai`.

Jika dokter mengoreksi ke `Healthy`, kasus tertutup otomatis. Jika dokter memilih tidak pasti, tombol mulai dinonaktifkan dan UI menampilkan kebutuhan pemeriksaan lanjutan.

### Admin

`Dashboard/Riwayat/Pengguna → analisis prediksi, kelola pekerja, atau buat akun staf`. Admin tidak memiliki alur untuk membuka validasi/tindak lanjut.

## 6. Aturan tetap dan di luar scope

- Tidak ada halaman profil untuk role baru.
- Tidak ada notifikasi push.
- Tidak ada identitas ayam atau identitas kandang.
- Admin tidak menyediakan reset password maupun aktivasi/nonaktivasi akun staf, sistem tidak mewajibkan penggantian password sementara, dan halaman login tidak menyediakan alur reset password mandiri.
- Workflow tidak mengevaluasi akurasi seluruh kelas karena hanya prediksi penyakit yang divalidasi.
- Rekomendasi penanganan awal tetap ada seperti sebelum penambahan role.

## 7. Kriteria penerimaan

- Pekerja anonim tetap dapat menyelesaikan alur deteksi lama.
- Ketiga role staf diarahkan dengan benar dan akses lintas role ditolak.
- Dokter dan Kepala Pekerja masing-masing hanya mempunyai dua tab.
- Admin saja yang dapat membuat akun staf.
- Healthy dan data lama tidak muncul di workflow.
- Aturan validasi, pemisahan, gating penanganan, ketidakpastian, koreksi Healthy, dan penyelesaian ditegakkan backend/database, bukan hanya UI.
- Admin tidak melihat atau mengekspor data workflow.
