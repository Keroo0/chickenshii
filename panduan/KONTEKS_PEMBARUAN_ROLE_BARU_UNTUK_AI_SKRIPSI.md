# Konteks Pembaruan Role ChickenShii untuk AI Penulis Skripsi

## Instruksi Penggunaan Dokumen

Dokumen ini merupakan sumber konteks utama untuk memperbarui penulisan skripsi ChickenShii setelah penambahan role **Dokter Hewan** dan **Kepala Pekerja**. Gunakan informasi di dalam dokumen ini sebagai acuan ketika menulis atau merevisi Bab 1, Bab 2, Bab 3, Bab 4, kebutuhan sistem, rancangan sistem, penjelasan diagram, dan skenario pengujian.

Ketentuan untuk AI penulis:

1. Gunakan bahasa Indonesia akademik yang jelas dan konsisten.
2. Bedakan dengan tegas antara fitur yang sudah diimplementasikan, fitur yang baru menjadi rancangan, dan pengujian manual yang belum dilakukan.
3. Jangan mengarang hasil pengujian, screenshot, wawancara, nilai usability, hasil validasi dokter, atau data operasional peternakan.
4. Jangan menyebut hasil AI sebagai diagnosis final. ChickenShii adalah **sistem pendukung keputusan** untuk deteksi dini.
5. Jangan mengubah keputusan produk yang telah ditetapkan dalam dokumen ini tanpa instruksi baru dari pemilik proyek.
6. Apabila informasi yang diperlukan tidak tersedia, tuliskan sebagai kebutuhan data atau placeholder, bukan sebagai fakta.

## 1. Gambaran Umum Sistem

ChickenShii adalah aplikasi mobile dan backend untuk mendeteksi dugaan penyakit ayam petelur berdasarkan citra feses. Model MobileNetV2 mengklasifikasikan citra ke dalam empat kelas:

- `Coccidiosis`;
- `Healthy`;
- `New Castle Disease`;
- `Salmonellosis`.

Hasil model berisi label prediksi, confidence, probabilitas setiap kelas, deskripsi, penyebab, dan rekomendasi penanganan awal dari knowledge base statis. Rekomendasi tersebut tetap dipertahankan setelah penambahan role baru. Jika Dokter Hewan mengoreksi label, rekomendasi mengikuti label hasil koreksi.

Penambahan role baru bertujuan memisahkan tiga tanggung jawab:

- deteksi awal oleh Pekerja Kandang;
- validasi profesional oleh Dokter Hewan;
- pelaksanaan tindak lanjut oleh Kepala Pekerja.

Admin tetap berfokus pada pengelolaan sistem dan data prediksi, bukan pada keputusan validasi atau penanganan kasus.

## 2. Aktor dan Kewenangan

### 2.1 Pekerja Kandang

Pekerja Kandang tetap menggunakan aplikasi **tanpa login**. Pekerja dapat:

- mengambil foto menggunakan kamera atau memilih foto dari galeri;
- melakukan crop dan mengirim gambar untuk deteksi;
- melihat label AI, confidence, probabilitas, penjelasan, dan rekomendasi;
- menyimpan hasil prediksi dengan memilih nama pekerja aktif.

Pekerja Kandang tidak mempunyai akses ke halaman Admin, validasi Dokter Hewan, atau tindak lanjut Kepala Pekerja. Data pada tabel `workers` hanya dipakai untuk standarisasi nama saat menyimpan prediksi dan bukan merupakan akun autentikasi.

### 2.2 Admin atau Pemilik

Istilah **Pemilik** adalah sebutan bisnis untuk aktor yang sama dengan role teknis `admin`, bukan aktor atau role kelima.

Admin menggunakan login staf dan diarahkan ke `/admin`. Admin dapat:

- melihat dashboard statistik prediksi;
- melihat, mencari, dan memfilter riwayat prediksi;
- melakukan soft delete terhadap riwayat;
- mengekspor data prediksi ke CSV;
- mengelola daftar Pekerja Kandang;
- membuat akun Dokter Hewan atau Kepala Pekerja menggunakan nama, email, role, dan password sementara.

Tab Admin yang sebelumnya bernama `Pekerja` diubah menjadi `Pengguna`. Tab tersebut memuat pengelolaan Pekerja Kandang yang sudah ada dan formulir pembuatan akun staf.

Admin **tidak dapat melihat data validasi dokter atau data tindak lanjut**, dan kedua data tersebut tidak dimasukkan ke export CSV. Admin juga tidak mempunyai fitur untuk mengaktifkan, menonaktifkan, atau mereset akun staf. Sistem tidak menyediakan alur reset password mandiri pada halaman login.

### 2.3 Dokter Hewan

Kode role autentikasi Dokter Hewan adalah `veterinarian`. Setelah login, Dokter diarahkan ke `/doctor` dan hanya mempunyai dua tab:

1. **Validasi**, yaitu antrean bersama prediksi penyakit yang belum divalidasi.
2. **Riwayat**, yaitu daftar validasi yang dibuat oleh Dokter Hewan yang sedang login.

Detail kasus dan formulir validasi ditampilkan melalui modal sehingga tidak menambah jumlah halaman. Dokter dapat memilih salah satu verdict:

- **Sesuai** atau `matching`: label dokter sesuai dengan label AI.
- **Tidak sesuai** atau `incorrect`: dokter wajib memilih label koreksi yang berbeda dari label AI.
- **Tidak dapat dipastikan** atau `uncertain`: kasus memerlukan pemeriksaan lebih lanjut.

Catatan dokter bersifat opsional. Satu prediksi hanya boleh mempunyai satu validasi. Apabila dua dokter menyimpan validasi untuk kasus yang sama, penyimpanan pertama berhasil dan penyimpanan berikutnya menerima konflik. Dokter hanya dapat melihat riwayat miliknya sendiri dan hanya dapat mengedit validasi yang dibuatnya selama penanganan belum dimulai.

Detail kasus Dokter dapat menampilkan gambar, label AI, confidence, probabilitas, nama pekerja, waktu prediksi, dan rekomendasi awal. Sistem tidak menyediakan fitur bagi Dokter untuk menulis resep, memilih obat, atau mencatat dosis. Keputusan dokter yang direkam hanya verdict, label koreksi apabila diperlukan, dan catatan opsional.

### 2.4 Kepala Pekerja

Kode role autentikasi Kepala Pekerja adalah `head_worker`. Setelah login, pengguna diarahkan ke `/head-worker` dan hanya mempunyai dua tab:

1. **Dashboard**, berisi jumlah kasus penyakit hari ini, kasus yang belum dipisahkan, validasi yang masih menunggu, penanganan aktif, dan kasus terbaru.
2. **Tindak Lanjut**, berisi daftar kasus serta aksi operasional.

Detail kasus dan konfirmasi tindakan ditampilkan melalui modal. Kepala Pekerja dapat:

- menandai `Sudah dipisahkan`;
- menandai `Mulai penanganan`;
- menandai `Penanganan selesai`.

Pemisahan dapat dilakukan segera setelah AI mendeteksi penyakit dan tidak perlu menunggu validasi Dokter Hewan. Penanganan hanya dapat dimulai setelah ayam ditandai sudah dipisahkan dan dokter memberikan hasil yang secara pasti menunjukkan penyakit.

Detail Kepala Pekerja dapat menampilkan data prediksi, status, label efektif, hasil validasi, rekomendasi, serta audit waktu tindakan. Sistem hanya mencatat bahwa pemisahan, mulai penanganan, dan selesai penanganan telah dilakukan beserta aktor dan waktunya. Sistem tidak mencatat identitas ayam tertentu, nama obat, dosis, atau prosedur terapi rinci.

## 3. Login dan Otorisasi

Sistem menggunakan satu halaman login bersama di `/login` untuk Admin, Dokter Hewan, dan Kepala Pekerja. Pekerja Kandang tidak menggunakan login.

Alur login staf:

1. Pengguna memasukkan email dan password pada `/login`.
2. Supabase Auth memverifikasi kredensial dan memberikan sesi/JWT.
3. Aplikasi membaca `app_metadata.role` dari sesi.
4. Role `admin` diarahkan ke `/admin`.
5. Role `veterinarian` diarahkan ke `/doctor`.
6. Role `head_worker` diarahkan ke `/head-worker`.
7. Role kosong atau tidak dikenal ditolak dan sesi diakhiri.

Role otorisasi bersumber dari `app_metadata`, bukan `user_metadata` yang dapat diedit pengguna. Tabel `staff_profiles` menyediakan identitas tampilan dan representasi relasional, tetapi bukan sumber utama keputusan otorisasi.

Frontend menggunakan route guard untuk mencegah akses lintas role. Backend tetap memverifikasi Bearer token dan exact role pada setiap endpoint terlindungi sehingga keamanan tidak hanya bergantung pada antarmuka.

## 4. Alur Workflow Kasus Penyakit

Workflow hanya berlaku pada prediksi baru yang disimpan setelah migration fitur diterapkan. Endpoint simpan hanya menerima empat kelas model dan menolak label lain dengan status `422`.

Trigger membuat `prediction_followups` hanya untuk tiga label penyakit:

- `Coccidiosis`;
- `New Castle Disease`;
- `Salmonellosis`.

Prediksi `Healthy` tidak masuk antrean validasi atau tindak lanjut. Data prediksi lama tidak di-backfill ke workflow.

Urutan proses utama:

1. Pekerja Kandang melakukan deteksi dan menyimpan hasil prediksi.
2. Jika hasil termasuk salah satu dari tiga penyakit, database membuat satu follow-up.
3. Kepala Pekerja dapat segera memisahkan ayam yang terindikasi.
4. Dokter Hewan membuka antrean dan memberikan verdict.
5. Sistem menentukan label efektif dan status kasus berdasarkan verdict.
6. Penanganan hanya dapat dimulai apabila pemisahan sudah tercatat dan validasi dokter memastikan penyakit.
7. Kepala Pekerja menyelesaikan penanganan setelah penanganan dimulai.

Cabang khusus:

- `matching`: label efektif tetap mengikuti label AI.
- `incorrect` dengan koreksi ke penyakit lain: label efektif dan rekomendasi mengikuti koreksi dokter.
- `incorrect` dengan koreksi ke `Healthy`: kasus ditutup otomatis dengan alasan `corrected_healthy` dan tidak dapat ditangani.
- `uncertain`: status menjadi `requires_examination`, antarmuka menampilkan `Perlu pemeriksaan lebih lanjut`, dan penanganan dikunci.

Status workflow yang digunakan backend:

- `pending_isolation`;
- `pending_validation`;
- `requires_examination`;
- `ready_for_treatment`;
- `active_treatment`;
- `treatment_completed`;
- `auto_closed`.

Status tersebut merupakan hasil turunan backend dari data validasi dan timestamp follow-up, bukan kolom status yang disimpan langsung. Pemetaan utamanya adalah sebagai berikut:

| Kondisi kasus | Status turunan |
|---|---|
| Ditutup karena koreksi `Healthy` | `auto_closed` |
| Penanganan telah selesai | `treatment_completed` |
| Penanganan telah dimulai | `active_treatment` |
| Verdict `uncertain`, sebelum atau setelah pemisahan | `requires_examination` |
| Belum dipisahkan dan tidak termasuk kondisi di atas | `pending_isolation` |
| Sudah dipisahkan tetapi belum divalidasi | `pending_validation` |
| Sudah dipisahkan dan validasi memastikan penyakit | `ready_for_treatment` |

Apabila dokter memvalidasi penyakit sebelum pemisahan, status tetap `pending_isolation`. Apabila Kepala Pekerja memisahkan lebih dahulu, status menjadi `pending_validation` sampai dokter memberi hasil pasti penyakit.

Selama penanganan belum dimulai, dokter pembuat dapat mengubah validasinya. Perubahan dari koreksi `Healthy` ke verdict lain dapat membuka kembali kasus dengan membersihkan penutupan otomatis, sedangkan perubahan ke `uncertain` membuat status menjadi `requires_examination`. Untuk verdict `uncertain`, label efektif dan rekomendasi tetap mengikuti label AI karena dokter belum menetapkan label koreksi.

Label koreksi harus merupakan salah satu dari empat kelas model dan berbeda dari label AI. Konflik ketika kasus sudah dimenangkan validator lain dikembalikan sebagai HTTP `409`. Dokumen ini tidak menetapkan perilaku idempotensi untuk pengulangan aksi operasional; jangan membuat klaim tentang request berulang tanpa memeriksa kode dan pengujian aktual.

## 5. Perubahan Struktur Data

Tabel lama yang tetap digunakan:

- `workers`: nama Pekerja Kandang dan status aktif;
- `predictions`: gambar, label AI, confidence, probabilitas, pekerja, waktu, dan soft delete.

Tabel baru:

### 5.1 `staff_profiles`

Menyimpan identitas tampilan akun staf, seperti `user_id`, nama lengkap, email, role, dan waktu pembuatan. `user_id` terhubung ke `auth.users`.

### 5.2 `prediction_validations`

Menyimpan satu validasi untuk setiap prediksi, meliputi:

- `prediction_id` yang bersifat unik;
- `veterinarian_id`;
- verdict;
- label koreksi apabila diperlukan;
- catatan opsional;
- waktu pembuatan dan perubahan.

### 5.3 `prediction_followups`

Menyimpan jejak operasional kasus, meliputi:

- `prediction_id` sebagai primary key sekaligus foreign key ke `predictions`;
- waktu dan aktor pemisahan;
- waktu dan aktor mulai penanganan;
- waktu dan aktor penyelesaian penanganan;
- waktu, alasan, dan aktor penutupan otomatis. Aktor penutupan otomatis adalah Dokter Hewan yang mengoreksi hasil menjadi `Healthy`.

Constraint dan trigger database menegakkan satu validasi per prediksi, role validator, bentuk koreksi, penguncian setelah penanganan dimulai, urutan pemisahan–mulai–selesai, serta penutupan otomatis ketika dokter mengoreksi hasil menjadi `Healthy`. Backend membatasi riwayat ke dokter yang login dan hanya mengizinkan pembuat memperbarui validasinya. Status workflow dihitung oleh service dan tidak disimpan sebagai kolom `prediction_followups`.

Bagian ini adalah ringkasan konseptual untuk penulisan skripsi, bukan spesifikasi SQL lengkap. Untuk menyebut tipe data, nullability, index, payload, filter, pagination, atau kode error lain secara presisi, periksa `panduan/SDD.md`, migration, schema Pydantic, dan route aktual.

## 6. Endpoint Backend Baru

Semua endpoint berikut membutuhkan `Authorization: Bearer <access_token>` dan pemeriksaan role.

### Admin

- `POST /api/v1/staff-accounts`: membuat akun Dokter Hewan atau Kepala Pekerja.

### Dokter Hewan

- `GET /api/v1/doctor/validations/pending`: mengambil antrean validasi.
- `GET /api/v1/doctor/validations/history`: mengambil riwayat milik dokter yang login.
- `POST /api/v1/doctor/validations`: menyimpan validasi baru.
- `PATCH /api/v1/doctor/validations/{validation_id}`: memperbarui validasi milik sendiri sebelum penanganan dimulai.

### Kepala Pekerja

- `GET /api/v1/head-worker/dashboard`: mengambil ringkasan kasus hari ini.
- `GET /api/v1/head-worker/follow-ups`: mengambil daftar tindak lanjut.
- `POST /api/v1/head-worker/follow-ups/{prediction_id}/isolate`: menandai kasus sudah dipisahkan.
- `POST /api/v1/head-worker/follow-ups/{prediction_id}/treatment/start`: memulai penanganan.
- `POST /api/v1/head-worker/follow-ups/{prediction_id}/treatment/complete`: menyelesaikan penanganan.

## 7. Keamanan Sistem

Perubahan keamanan yang wajib dijelaskan dalam skripsi:

- role aman disimpan pada `app_metadata` Supabase Auth;
- backend memverifikasi JWT dan role pada setiap endpoint staf;
- tabel `staff_profiles`, `prediction_validations`, dan `prediction_followups` menggunakan RLS deny-by-default;
- akses tabel workflow untuk role Data API `anon` dan `authenticated` dicabut;
- backend mengakses tabel tersebut menggunakan `service_role` yang hanya disimpan di environment backend;
- policy lama yang memberikan akses luas kepada seluruh pengguna `authenticated` diganti dengan policy khusus Admin;
- pada migration satu kali ini, seluruh akun Auth yang sudah ada diasumsikan sebagai akun Admin lama, lalu diberi role `admin` dan baris `staff_profiles`. Aturan tersebut bukan berarti setiap akun Auth baru otomatis menjadi Admin.

Admin tidak otomatis memperoleh hak melihat tabel workflow hanya karena mempunyai akun terautentikasi.

## 8. Keputusan Ruang Lingkup yang Tidak Boleh Diubah

Fitur berikut tidak termasuk ruang lingkup pembaruan:

- halaman profil untuk role baru;
- notifikasi push;
- identitas individual ayam;
- identitas kandang;
- aktivasi atau nonaktivasi akun staf oleh Admin;
- reset akun staf oleh Admin;
- kewajiban mengganti password sementara;
- evaluasi akurasi seluruh kelas melalui workflow validasi.

Validasi dokter hanya dilakukan terhadap prediksi penyakit yang masuk workflow. Oleh sebab itu, data validasi tidak boleh langsung ditafsirkan sebagai evaluasi akurasi model untuk seluruh kelas, terutama kelas `Healthy`.

## 9. Dampak terhadap Penulisan Skripsi

### Bab 1 — Pendahuluan

Latar belakang dapat diperbarui dengan masalah lanjutan setelah deteksi AI, yaitu kebutuhan validasi profesional dan pencatatan tindakan operasional. Tujuan sistem tidak lagi hanya menghasilkan prediksi, tetapi juga mendukung pemisahan tanggung jawab antara deteksi awal, validasi dokter, dan tindak lanjut pekerja.

Jangan mengubah fokus utama penelitian klasifikasi citra menjadi sistem diagnosis medis. Penambahan role merupakan penguatan workflow DSS.

### Bab 2 — Landasan Teori

Topik yang dapat dijelaskan apabila relevan dengan struktur skripsi:

- Decision Support System;
- klasifikasi citra dan MobileNetV2;
- autentikasi dan Role-Based Access Control;
- validasi profesional terhadap hasil sistem pendukung keputusan;
- workflow atau transisi status;
- REST API, PostgreSQL, trigger, constraint, dan Row Level Security.

Gunakan referensi ilmiah atau dokumentasi resmi yang benar. Dokumen ini tidak menyediakan sumber kutipan akademik dan tidak boleh dijadikan satu-satunya dasar sitasi teori.

### Bab 3 — Metodologi dan Perancangan

Bab perancangan harus menggunakan empat aktor: Pekerja Kandang, Admin, Dokter Hewan, dan Kepala Pekerja. Perbarui:

- analisis kebutuhan fungsional dan nonfungsional;
- use case dan deskripsinya;
- activity diagram setiap aktor;
- sequence login bersama, validasi dokter, dan tindak lanjut;
- ERD dengan tiga tabel baru;
- arsitektur dan component diagram;
- navigasi role;
- flowchart sistem end-to-end;
- rancangan pengujian akses role dan transisi workflow.

Pipeline training dan inference model tidak berubah secara konseptual akibat penambahan role. Perubahan terjadi setelah hasil prediksi disimpan.

### Bab 4 — Hasil dan Pembahasan

Bagian implementasi dapat menjelaskan migration database, endpoint role, shared login, route guard, tab Admin `Pengguna`, serta antarmuka dua tab Dokter Hewan dan Kepala Pekerja yang telah tersedia pada kode. Status implementasi kode dan pengujian otomatis harus tetap dipisahkan dari pengujian manual/E2E yang belum memiliki bukti perangkat.

Skenario black-box role baru boleh ditulis sebagai rancangan atau `Belum diuji` sampai terdapat tanggal, perangkat/environment, tester, serta screenshot atau log aktual. Jangan mengubah status menjadi `Pass` berdasarkan asumsi.

Hasil otomatis berikut merupakan snapshot yang terverifikasi pada 2 Agustus 2026, bukan jaminan kondisi repository setelah perubahan berikutnya:

- 163 pengujian backend lulus, termasuk 4 pengujian kontrak dokumentasi diagram;
- 26 pengujian mobile lulus tanpa kegagalan;
- pemeriksaan TypeScript `npx tsc --noEmit` lulus tanpa diagnostic.

Jika kode berubah setelah tanggal tersebut, jalankan ulang pengujian sebelum menggunakan jumlah di atas.

### Bab 5 — Kesimpulan dan Saran

Kesimpulan dapat menyebut bahwa penambahan role memperluas ChickenShii dari deteksi awal menjadi workflow pendukung keputusan dengan pemisahan kewenangan. Keterbatasan harus tetap mencakup belum adanya identitas ayam/kandang, belum adanya pencatatan obat atau dosis, validasi yang hanya mencakup prediksi penyakit, serta pengujian manual role baru yang masih belum tersedia. Jangan menyatakan dampak operasional, peningkatan akurasi, atau keberhasilan penggunaan oleh role baru tanpa data penelitian.

## 10. Dampak terhadap Diagram

Diagram lama yang perlu menampilkan pembaruan empat role:

- Use Case Diagram;
- Activity Diagram Admin dan Pekerja Kandang;
- Sequence Login dan Sequence Simpan;
- ERD;
- Diagram Arsitektur;
- Diagram Class Backend;
- Diagram Navigasi.

Diagram tambahan:

- Activity Diagram Dokter Hewan;
- Activity Diagram Kepala Pekerja;
- Sequence Diagram Validasi Dokter;
- Sequence Diagram Tindak Lanjut;
- Flowchart Sistem;
- Component Diagram.

Diagram pipeline training dan inference tetap dipertahankan karena logika ML tidak berubah, tetapi penjelasannya harus konsisten dengan implementasi terbaru.

Seluruh petunjuk pembuatan diagram berada di folder `diagram/`. Setiap diagram mempunyai satu file bernama `penjelasan diagram <nama>.md` yang berisi langkah pembuatan di Visual Paradigm Online.

## 11. Status Implementasi yang Harus Ditulis Secara Jujur

Sudah tersedia pada kode:

- migration tabel, trigger, constraint, RLS, policy, dan bootstrap akun lama;
- autentikasi serta otorisasi backend berbasis role;
- endpoint pembuatan akun staf;
- endpoint workflow Dokter Hewan dan Kepala Pekerja;
- shared login dan pemetaan role pada mobile;
- route guard dan Bearer token API client;
- perubahan tab Admin menjadi `Pengguna` beserta formulir akun staf;
- tepat dua tab `/doctor`: `Validasi` dan `Riwayat`, lengkap dengan daftar, detail/form modal, tiga verdict, konflik refresh, riwayat sendiri, dan edit berdasarkan flag backend;
- tepat dua tab `/head-worker`: `Dashboard` dan `Tindak Lanjut`, lengkap dengan empat ringkasan, filter status, detail modal, serta konfirmasi pemisahan/mulai/selesai;
- komponen workflow bersama untuk kartu/detail kasus, status, rekomendasi, audit waktu, state loading/empty/error, retry, refresh, serta pemetaan error API;
- pembatasan endpoint simpan ke empat label model;
- dokumentasi dan panduan Visual Paradigm Online.

Sudah diverifikasi secara otomatis pada 2 Agustus 2026:

- backend **163 passed**, termasuk empat contract dokumentasi;
- mobile **26 passed, 0 failed**;
- TypeScript exit code 0 tanpa diagnostic.

Belum boleh diklaim lulus tanpa bukti baru:

- pengujian manual end-to-end memakai akun nyata pada project Supabase target;
- bukti screenshot seluruh loading, empty, error, retry, refresh, modal, dan konflik dua validator;
- hasil usability testing role baru.

## 12. Narasi Ringkas yang Dapat Diadaptasi

ChickenShii dikembangkan sebagai sistem pendukung keputusan untuk membantu deteksi dini penyakit ayam petelur berdasarkan citra feses. Pada rancangan awal, sistem berfokus pada Pekerja Kandang sebagai pengguna alur deteksi dan Admin sebagai pengelola data. Pengembangan berikutnya menambahkan Dokter Hewan dan Kepala Pekerja untuk membentuk alur tindak lanjut yang lebih jelas setelah model menghasilkan prediksi penyakit.

Dokter Hewan bertugas memvalidasi hasil prediksi melalui verdict sesuai, tidak sesuai, atau tidak dapat dipastikan. Sementara itu, Kepala Pekerja bertugas mencatat pemisahan ayam serta progres penanganan. Pemisahan dapat dilakukan segera setelah penyakit terdeteksi, tetapi penanganan hanya dapat dimulai setelah pemisahan tercatat dan dokter memastikan bahwa kasus tersebut merupakan penyakit. Koreksi dokter menjadi Healthy menutup kasus secara otomatis, sedangkan hasil yang tidak dapat dipastikan memerlukan pemeriksaan lebih lanjut.

Pemisahan kewenangan tersebut diterapkan melalui autentikasi berbasis role, endpoint backend yang terlindungi, serta constraint dan trigger pada PostgreSQL. Admin tetap mengelola statistik, riwayat prediksi, Pekerja Kandang, dan akun staf, tetapi tidak memperoleh akses ke data validasi maupun tindak lanjut. Dengan demikian, penambahan role tidak mengubah fungsi klasifikasi MobileNetV2, melainkan memperluas sistem dari deteksi awal menjadi workflow pendukung keputusan dan tindakan operasional.

## 13. Pernyataan yang Harus Dihindari

Jangan menulis pernyataan berikut:

- “ChickenShii mendiagnosis penyakit ayam secara pasti.”
- “Seluruh pengguna wajib login.”
- “Pekerja Kandang mempunyai akun Auth.”
- “Admin dapat memvalidasi atau menangani kasus.”
- “Admin dapat melihat atau mengekspor data validasi dokter.”
- “Dokter dapat memulai penanganan.”
- “Kepala Pekerja dapat mengubah validasi dokter.”
- “Semua prediksi, termasuk Healthy dan data lama, masuk antrean validasi.”
- “Penanganan dapat dimulai sebelum pemisahan atau sebelum validasi dokter.”
- “Tidak dapat dipastikan berarti kasus boleh ditangani.”
- “Validasi dokter mengukur akurasi model untuk seluruh kelas.”
- “Seluruh UI role baru telah lulus pengujian manual.” Pengujian otomatis terbaru sudah lulus, tetapi status manual tetap memerlukan bukti perangkat dan environment target.

## 14. Checklist Konsistensi untuk AI Penulis

Sebelum menghasilkan teks skripsi, pastikan:

- [ ] Terdapat empat aktor dengan kewenangan berbeda.
- [ ] Pekerja Kandang tetap tanpa login.
- [ ] Login staf menggunakan satu halaman `/login`.
- [ ] Role berasal dari `app_metadata`.
- [ ] Dokter Hewan dan Kepala Pekerja masing-masing mempunyai tepat dua tab.
- [ ] Pemisahan dapat dilakukan sebelum validasi dokter.
- [ ] Penanganan membutuhkan pemisahan dan validasi pasti penyakit.
- [ ] Koreksi `Healthy` menutup kasus otomatis.
- [ ] Verdict `uncertain` mengunci penanganan.
- [ ] Admin tidak melihat atau mengekspor data workflow.
- [ ] Healthy dan data lama tidak masuk workflow.
- [ ] Rekomendasi tetap tampil dan mengikuti label koreksi dokter.
- [ ] Tidak ada halaman profil, identitas ayam/kandang, atau notifikasi push.
- [ ] Status implementasi dibedakan dari rancangan dan pengujian yang belum dilakukan.
- [ ] Tidak ada hasil penelitian atau pengujian yang dibuat tanpa bukti.

## 15. Dokumen Referensi Internal

Apabila AI penulis diberi akses ke repository, gunakan dokumen berikut untuk rincian tambahan:

- `README.md` untuk ringkasan sistem dan endpoint;
- `panduan/PRD.md` untuk ruang lingkup produk;
- `panduan/SRS.md` untuk kebutuhan dan aturan bisnis;
- `panduan/SDD.md` untuk desain data, API, dan keamanan;
- `panduan/STRUKTUR_PROYEK.md` untuk struktur file aktual;
- `panduan/TaskBreakdown.md` untuk status pekerjaan;
- `panduan/HASIL_PENGUJIAN.md` untuk pemisahan bukti otomatis dan skenario manual;
- `diagram/` untuk petunjuk pembuatan setiap diagram di Visual Paradigm Online.

Jika terdapat perbedaan antara teks lama dan dokumen konteks ini, gunakan pembaruan empat role dalam dokumen ini serta periksa kode aktual sebelum menulis klaim implementasi.
