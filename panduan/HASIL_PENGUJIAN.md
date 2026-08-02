# Hasil Pengujian Sistem ChickenShii

Dokumen ini memisahkan hasil otomatis yang benar-benar sudah dieksekusi dari skenario manual yang masih membutuhkan bukti. Status `Belum diuji` tidak boleh diubah menjadi `Pass` sebelum ada tanggal, perangkat/environment, tester, dan bukti screenshot/log.

## 1. Pengujian otomatis

Catatan status: hasil pada bagian ini merupakan eksekusi terbaru setelah penyelesaian layar Dokter dan Kepala Pekerja. Hasil otomatis tidak menggantikan pengujian manual/E2E pada perangkat dan project Supabase target.

### 1.1 Backend

Perintah verifikasi:

```bash
cd backend
.venv/bin/python -m pytest -q
```

Hasil eksekusi 2 Agustus 2026: **163 passed**. Jumlah ini mencakup alur inferensi/simpan/statistik, penolakan label simpan di luar empat kelas model, autentikasi dan role, provisioning akun staf beserta konflik email duplikat, workflow service/API, invariant soft delete, serta empat pengujian kontrak dokumentasi.

Pengujian baru memverifikasi antara lain:

- token tidak ada/tidak valid menghasilkan 401 dan role silang menghasilkan 403;
- hanya Admin dapat membuat akun staf, validasi request, konflik email, serta penanganan kegagalan upstream;
- antrean Dokter hanya berisi kasus penyakit belum tervalidasi dan riwayat dibatasi ke validator login;
- validasi `matching`, `incorrect`, `uncertain`, koreksi wajib, kompetisi first-write-wins, ownership, dan edit lock;
- dashboard/filter follow-up Kepala Pekerja;
- pemisahan sebelum validasi, penolakan treatment sebelum syarat, uncertain, koreksi Healthy, start, dan complete;
- pagination/filter dan mapping error workflow.

Empat pengujian kontrak dokumentasi yang termasuk dalam total tersebut memastikan sumber Mermaid dan nama penjelasan generik telah dihapus, setiap folder mempunyai satu panduan lengkap, enam diagram tambahan tersedia, dan diagram inti memuat empat role.

### 1.2 Mobile

Perintah:

```bash
cd mobile
npm test
```

Hasil eksekusi 2 Agustus 2026: **26 passed, 0 failed**. Suite menguji mapping `admin`/`veterinarian`/`head_worker`, penolakan role tidak dikenal, pengambilan role hanya dari `app_metadata`, validasi/normalisasi form akun staf, format data workflow, aturan input validasi, label/status terminal, ketersediaan aksi tindak lanjut, sanitasi error API, dan pemisahan client API anonim/staf agar token tidak pernah mengikuti URL backend khusus.

Pemeriksaan TypeScript dijalankan dengan:

```bash
cd mobile
npx tsc --noEmit
```

Hasil eksekusi 2 Agustus 2026: **lulus tanpa diagnostic TypeScript** (exit code 0) setelah implementasi UI role baru selesai.

## 2. Matriks black-box manual

| ID | Aktor/skenario | Langkah ringkas | Hasil yang diharapkan | Status bukti |
|---|---|---|---|---|
| BB-01 | Pekerja tanpa login | Buka aplikasi, crop, deteksi, simpan | Alur lama tetap selesai tanpa login | Belum diuji |
| BB-02 | Login Admin | Masuk via `/login` | Redirect `/admin` | Belum diuji |
| BB-03 | Login Dokter | Masuk via `/login` | Redirect `/doctor` | Belum diuji |
| BB-04 | Login Kepala Pekerja | Masuk via `/login` | Redirect `/head-worker` | Belum diuji |
| BB-05 | Role tidak dikenal | Login dengan role di luar daftar | Sesi diakhiri dan akses ditolak | Belum diuji |
| BB-06 | Akses lintas role | Uji seluruh pasangan area asing: Admin → Doctor/Head Worker, Dokter → Admin/Head Worker, dan Kepala Pekerja → Admin/Doctor, masing-masing melalui route mobile serta endpoint API role tujuan | Setiap route mengarahkan kembali ke area role yang benar dan setiap endpoint API asing menolak akses | Belum diuji |
| BB-07 | Admin buat staf | Nama, email, role, password sementara valid | Akun dapat login sesuai role | Belum diuji |
| BB-08 | Email duplikat | Buat akun dengan email terdaftar | Pesan konflik, tidak ada akun ganda | Belum diuji |
| BB-09 | Healthy baru | Simpan prediksi Healthy | Tidak muncul di Validasi/Tindak Lanjut | Belum diuji |
| BB-10 | Data historis | Periksa prediksi sebelum migration | Tidak masuk workflow | Belum diuji |
| BB-11 | Validasi sesuai | Dokter pilih Sesuai | Tersimpan dan masuk riwayat sendiri | Belum diuji |
| BB-12 | Validasi tidak sesuai | Simpan tanpa/dengan koreksi | Tanpa koreksi ditolak; koreksi valid diterima | Belum diuji |
| BB-13 | Validasi tidak pasti | Pilih Tidak dapat dipastikan | Status perlu pemeriksaan; treatment terkunci | Belum diuji |
| BB-14 | Kompetisi dokter | Dua dokter simpan kasus sama | Penyimpanan pertama menang; kedua konflik/refresh | Belum diuji |
| BB-15 | Edit validasi | Pembuat edit sebelum/sesudah treatment | Sebelum boleh; sesudah ditolak | Belum diuji |
| BB-16 | Riwayat dokter | Bandingkan akun dokter A/B | Masing-masing hanya melihat miliknya | Belum diuji |
| BB-17 | Pemisahan cepat | Kepala Pekerja isolate sebelum dokter | Berhasil dan audit aktor/waktu terisi | Belum diuji |
| BB-18 | Treatment terlalu awal | Start sebelum isolate/validasi | Ditolak dengan alasan yang jelas | Belum diuji |
| BB-19 | Treatment valid | Isolate + validasi penyakit + start | Status active treatment | Belum diuji |
| BB-20 | Koreksi Healthy | Dokter koreksi menjadi Healthy | Kasus auto closed, treatment tidak tersedia | Belum diuji |
| BB-21 | Selesai treatment | Complete setelah start | Status treatment completed | Belum diuji |
| BB-22 | Rekomendasi koreksi | Koreksi ke penyakit lain | Rekomendasi mengikuti label dokter | Belum diuji |
| BB-23 | Visibilitas Admin | Buka riwayat/export CSV | Tidak ada field validasi/tindak lanjut | Belum diuji |
| BB-24 | State antarmuka | Putus koneksi/empty/refresh/modal | Loading, empty, error, retry, refresh, modal bekerja | Belum diuji |

## 3. Template bukti uji manual

Untuk setiap ID, lampirkan:

- tanggal dan nama tester;
- role dan akun uji (tanpa menulis password/token);
- perangkat/OS serta versi build;
- kondisi awal data;
- screenshot sebelum/sesudah atau rekaman layar;
- request ID/log backend bila relevan;
- hasil aktual dan status Pass/Fail;
- catatan bug beserta retest.

## 4. Regresi wajib

Sebelum menyatakan rilis siap, ulangi dashboard/riwayat Admin, manajemen pekerja, soft delete, statistik, export CSV, deteksi pekerja anonim, upload invalid/lebih dari 5 MB, retry simpan, dan disclaimer medis. Penambahan workflow tidak boleh mengubah pipeline model atau memasukkan data validasi ke statistik/CSV Admin.
