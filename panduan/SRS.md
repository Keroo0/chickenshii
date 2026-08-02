# Software Requirements Specification (SRS)

## 1. Ruang lingkup

Sistem menerima citra feses ayam, menjalankan klasifikasi MobileNetV2, menampilkan rekomendasi statis, menyimpan hasil yang dipilih pengguna, lalu mengelola validasi dan tindak lanjut untuk prediksi penyakit baru. Sistem mempunyai empat aktor: Pekerja Kandang anonim, Admin, Dokter Hewan, dan Kepala Pekerja.

## 2. Kebutuhan fungsional

### FR-01 — Input dan inferensi

- Client menerima JPG/JPEG/PNG maksimal 5 MB dari kamera/galeri dan menggunakan native crop.
- Backend memvalidasi ulang MIME, isi, ukuran, dan file kosong.
- Backend melakukan resize/normalisasi 224×224 dan mengembalikan kelas, confidence, threshold, probabilitas, rekomendasi, dan disclaimer.
- Confidence di bawah `confidence_threshold` memunculkan peringatan tetapi tidak memblokir simpan.

### FR-02 — Penyimpanan prediksi pekerja

- Pekerja memilih `worker_id` dari daftar pekerja aktif, bukan mengetik nama bebas.
- `POST /api/v1/predictions` memvalidasi pekerja, mengunggah foto, dan membuat satu baris baru.
- Kegagalan simpan mempertahankan foto/hasil di state dan memberi aksi retry.
- Endpoint simpan hanya menerima empat kelas model dan menolak label lain dengan `422`. Insert `Coccidiosis`, `New Castle Disease`, atau `Salmonellosis` otomatis membuat satu `prediction_followups`; insert `Healthy` tidak membuat follow-up.

### FR-03 — Login dan route role

- Admin, Dokter Hewan, dan Kepala Pekerja memakai `/login` yang sama.
- Role dibaca hanya dari `app_metadata.role` dengan nilai `admin`, `veterinarian`, atau `head_worker`.
- Redirect: `/admin`, `/doctor`, atau `/head-worker`.
- Role tidak ada/tidak dikenal menyebabkan logout dan penolakan akses.
- Setiap request API staf membawa `Authorization: Bearer <JWT>`; backend memverifikasi token dan exact role.
- Pekerja Kandang tetap anonim dan tidak mendapat route staf.

### FR-04 — Admin

- Admin dapat membuka statistik, riwayat prediksi, filter/search, soft delete, dan export CSV prediksi.
- Tab `Pengguna` memuat pengelolaan `workers` serta form akun staf.
- `POST /api/v1/staff-accounts` menerima nama, email, password sementara minimal delapan karakter, dan role `veterinarian`/`head_worker`.
- Email duplikat menghasilkan konflik. Admin tidak mendapat fungsi reset atau aktivasi/nonaktivasi akun, tidak ada forced password change, dan halaman login tidak menyediakan alur reset password mandiri.
- Admin tidak dapat membaca data validasi/tindak lanjut melalui UI maupun export CSV.

### FR-05 — Dokter Hewan

- `/doctor` mempunyai tepat dua tab: `Validasi` dan `Riwayat`.
- Antrean Validasi hanya memuat prediksi penyakit baru yang belum memiliki validasi.
- Dokter dapat memilih `matching`, `incorrect`, atau `uncertain`.
- `incorrect` wajib menyertakan `corrected_prediction` dari empat kelas dan harus berbeda dari label AI; verdict lain melarang field koreksi.
- `note` opsional, maksimal 5.000 karakter.
- Satu prediksi hanya dapat memiliki satu validasi; request pertama menang, kompetitor menerima konflik.
- Riwayat difilter oleh `veterinarian_id` token.
- Hanya dokter pembuat dapat mengedit validasi dan hanya selama penanganan belum dimulai. Validasi tidak dapat dihapus.

### FR-06 — Kepala Pekerja

- `/head-worker` mempunyai tepat dua tab: `Dashboard` dan `Tindak Lanjut`.
- Dashboard menampilkan jumlah kasus penyakit hari ini, belum dipisahkan, menunggu validasi, dan penanganan aktif, plus kasus terbaru.
- Kepala Pekerja dapat menandai pemisahan kapan saja setelah follow-up dibuat.
- Mulai penanganan mensyaratkan `isolated_at` dan validasi definitif penyakit (`matching`, atau `incorrect` dengan koreksi bukan `Healthy`).
- `uncertain` memunculkan status `requires_examination` dan memblokir mulai penanganan.
- Selesai penanganan mensyaratkan penanganan sudah dimulai.
- Setiap aksi mencatat timestamp dan aktor dari token, bukan input client.

### FR-07 — Label efektif dan rekomendasi

- Tanpa koreksi, label efektif adalah label AI.
- Dengan `incorrect`, label efektif adalah `corrected_prediction`.
- Rekomendasi mengikuti label efektif dan tetap tampil pada detail kasus.
- Koreksi ke `Healthy` mengisi penutupan otomatis dengan alasan `corrected_healthy`.

## 3. Status workflow

API dapat mengembalikan status berikut:

| Status | Makna |
|---|---|
| `pending_isolation` | Belum ditandai dipisahkan. |
| `pending_validation` | Sudah dipisahkan tetapi hasil dokter belum tersedia. |
| `requires_examination` | Dokter tidak dapat memastikan; penanganan terkunci. |
| `ready_for_treatment` | Sudah dipisahkan dan penyakit dipastikan. |
| `active_treatment` | Penanganan sedang berjalan. |
| `treatment_completed` | Penanganan selesai. |
| `auto_closed` | Dokter mengoreksi menjadi Healthy. |

## 4. Validasi dan error handling

- `401` untuk token tidak ada/tidak valid.
- `403` untuk role tidak sesuai.
- `404` jika kasus/validasi tidak ditemukan dalam scope pengguna.
- `409` untuk kompetisi validasi atau transisi state yang bertabrakan.
- `413` untuk file melebihi 5 MB.
- `422` untuk format, verdict, koreksi, tanggal, atau transisi semantik yang tidak valid.
- `502/503` untuk kegagalan provisioning/upstream Supabase sesuai endpoint.
- UI wajib menyediakan loading, empty state, error, retry, refresh, dan modal yang dapat ditutup aman.

## 5. Keamanan dan integritas data

### 5.1 Auth dan role

- Token sesi staf disimpan melalui mekanisme aman perangkat.
- Role keamanan hanya bersumber dari `app_metadata`; `user_metadata` tidak dipercaya.
- Existing Auth users diberi role `admin` saat migration dan dibuatkan `staff_profiles`.

### 5.2 RLS dan akses Data API

- `staff_profiles`, `prediction_validations`, dan `prediction_followups` mengaktifkan RLS.
- Seluruh privilege `anon`/`authenticated` pada ketiga tabel dicabut; `service_role` diberi privilege eksplisit.
- Backend adalah satu-satunya jalur baca/tulis workflow.
- Policy `workers` mempertahankan baca pekerja aktif untuk anonim dan membatasi mutasi pada Admin.
- Policy `predictions` membatasi akses client terautentikasi pada Admin; penyimpanan pekerja tetap melalui backend.

### 5.3 Constraint dan trigger

- Unique `prediction_validations.prediction_id` menegakkan satu validator.
- Constraint pasangan waktu/aktor mencegah audit trail setengah terisi.
- Trigger melarang validasi data non-workflow, label koreksi yang sama, delete validasi, dan edit setelah penanganan dimulai.
- Trigger follow-up menegakkan urutan isolasi → mulai → selesai dan validasi definitif sebelum mulai.
- Trigger sinkronisasi menutup kasus yang dikoreksi Healthy.

## 6. Kebutuhan nonfungsional

- Target inferensi hangat 1–3 detik; UI tetap menangani cold start lebih lama.
- Limit daftar workflow 1–100 item dengan default 50 dan offset untuk pagination.
- Filter tanggal memakai `date_from`/`date_to`; rentang terbalik ditolak.
- Dashboard Kepala Pekerja memakai tanggal Asia/Jakarta.
- Semua response workflow mengikuti envelope `{ "status": "success", "data": ... }`.
- Aplikasi harus tetap mudah digunakan satu tangan dan memiliki target sentuh minimal 44 px.

## 7. Batasan ruang lingkup

Tidak tersedia halaman profil, notifikasi push, identitas ayam, identitas kandang, validasi untuk kelas Healthy, backfill prediksi lama, akses workflow Admin, atau evaluasi akurasi semua kelas berdasarkan validasi dokter.
