# Task Breakdown ChickenShii

## 1. Fondasi deteksi pekerja — selesai

- Upload kamera/galeri, crop, validasi file, loading, hasil, confidence, rekomendasi, disclaimer.
- Penyimpanan dengan dropdown pekerja aktif dan retry.
- Backend preprocessing, MobileNetV2, Storage, dan `predictions`.

## 2. Admin lama — selesai/regresi wajib dijaga

- Login, dashboard statistik, riwayat, filter, soft delete, manajemen pekerja, export CSV.
- Export hanya mencakup data prediksi yang tidak dihapus.

## 3. Database dan keamanan role baru — selesai di kode

- [x] Tambah `staff_profiles` dengan role `admin`, `veterinarian`, `head_worker`.
- [x] Tambah `prediction_validations` dengan unique per prediksi dan tiga verdict.
- [x] Tambah `prediction_followups` dengan audit pemisahan/treatment/penutupan.
- [x] Trigger follow-up hanya untuk prediksi penyakit baru; tanpa backfill.
- [x] Trigger/constraint validasi, ownership, edit lock, koreksi Healthy, dan urutan treatment.
- [x] Bootstrap existing Auth users sebagai Admin.
- [x] Ganti policy authenticated luas dengan policy Admin dan deny-by-default workflow.
- [x] Grant eksplisit untuk service role.

## 4. Backend API role baru — selesai di kode

- [x] Verifikasi Bearer token dan exact role per endpoint.
- [x] `POST /api/v1/staff-accounts` khusus Admin.
- [x] Antrean, riwayat milik sendiri, create, dan update validasi Dokter.
- [x] Dashboard, daftar follow-up, isolate, treatment start, treatment complete Kepala Pekerja.
- [x] Pagination, filter kelas/tanggal/status, label efektif, rekomendasi koreksi, zona Asia/Jakarta.
- [x] Mapping error 401/403/404/409/422/502/503.

## 5. Shared login dan Admin Pengguna — fondasi selesai

- [x] Form `/login` bersama dan redirect role.
- [x] Role hanya diambil dari `app_metadata`.
- [x] Route guard untuk area staf.
- [x] Bearer token pada API client.
- [x] Redirect kompatibilitas `/admin/login`.
- [x] Ubah label tab menjadi `Pengguna`.
- [x] Tambah form akun staf dengan validasi nama/email/password/role.
- [ ] Verifikasi end-to-end akun sementara terhadap project Supabase target.

## 6. UI Dokter Hewan — selesai di kode dan pengujian otomatis lulus

- [x] Buat tepat dua tab: `Validasi` dan `Riwayat`.
- [x] Antrean bersama hanya kasus penyakit belum tervalidasi.
- [x] Modal detail menampilkan gambar, label AI, confidence, probabilitas, pekerja, waktu, dan rekomendasi.
- [x] Form tiga verdict; koreksi wajib dan berbeda untuk `Tidak sesuai`; catatan opsional.
- [x] Tangani first-write-wins dengan pesan konflik dan refresh antrean.
- [x] Riwayat hanya milik user; edit hanya saat `editable=true`.
- [x] Sediakan loading, empty, error, retry, pull-to-refresh, dan modal accessible.
- [x] Jalankan ulang pengujian otomatis mobile/TypeScript setelah seluruh implementasi selesai.
- [ ] Verifikasi manual pada perangkat dan project Supabase target.

## 7. UI Kepala Pekerja — selesai di kode dan pengujian otomatis lulus

- [x] Buat tepat dua tab: `Dashboard` dan `Tindak Lanjut`.
- [x] Dashboard memuat empat ringkasan dan kasus terbaru.
- [x] Filter daftar follow-up berdasarkan status.
- [x] Modal detail menampilkan status, label efektif, validasi, rekomendasi, dan audit waktu.
- [x] Aksi `Sudah dipisahkan` tersedia sebelum validasi.
- [x] Aksi mulai hanya tersedia untuk kasus dipisahkan + validasi definitif penyakit.
- [x] Tampilkan `Perlu pemeriksaan lebih lanjut` untuk uncertain.
- [x] Tangani auto-closed Healthy dan treatment completed.
- [x] Sediakan loading, empty, error, retry, refresh, dan konfirmasi tindakan.
- [x] Jalankan ulang pengujian otomatis mobile/TypeScript setelah seluruh implementasi selesai.
- [ ] Verifikasi manual pada perangkat dan project Supabase target.

## 8. Dokumentasi dan diagram — selesai

- [x] Sinkronkan PRD, SRS, SDD, README, preview, dan analisis dengan empat role.
- [x] Tambah skenario laporan/pengujian tanpa mengklaim hasil UI yang belum diuji.
- [x] Selesaikan satu panduan Visual Paradigm Online per diagram.
- [x] Hapus seluruh sumber Mermaid dan referensi nama generik lama.
- [x] Reader test instruksi diagram.

## 9. Pengujian penerimaan

Implementasi layar role baru sudah tersedia. Seluruh perintah pengujian otomatis terbaru telah dijalankan setelah pekerjaan implementasi selesai. Pengujian manual/E2E tetap membutuhkan perangkat, akun nyata, environment target, dan bukti aktual.

### Otomatis

- [x] Backend: **163 passed**, termasuk auth/role, staff provisioning, workflow service/API, invariant soft delete, ML/simpan/statistik, dan empat contract dokumentasi.
- [x] Mobile: **26 passed, 0 failed**, termasuk mapping role, validasi form akun staf/validasi dokter, format data/error workflow, gating aksi tindak lanjut, dan keamanan routing client API.
- [x] TypeScript: `npx tsc --noEmit` selesai dengan exit code 0 tanpa diagnostic.

### Manual/E2E

- Login/redirect setiap role dan penolakan lintas role.
- Alur tiga verdict, konflik dua dokter, ownership history, dan edit lock.
- Pemisahan sebelum validasi; gating treatment; uncertain; koreksi penyakit/Healthy; complete.
- Regresi worker anonymous, Admin dashboard/history/users, soft delete, statistik, CSV.
- Loading, empty state, error, retry, refresh, dan modal setiap area.

## 10. Definition of done

Fitur dianggap selesai bila migration diterapkan pada environment target, UI dua role baru tersedia dengan tepat dua tab, seluruh pengujian otomatis lulus, skenario manual memiliki bukti, dan dokumen/diagram tidak lagi memuat model dua-aktor atau login Admin terpisah.
