# Analisis Sistem ChickenShii

## 1. Kesimpulan arsitektur

ChickenShii menggunakan pola client-server dengan empat batas tanggung jawab:

- Aplikasi Expo menangani deteksi bagi Pekerja Kandang anonim dan antarmuka staf terautentikasi.
- FastAPI menjalankan validasi upload, preprocessing, inferensi, otorisasi berbasis role, dan orkestrasi workflow.
- Supabase menyediakan Auth, PostgreSQL, Storage, serta trigger/constraint untuk menjaga integritas transisi.
- MobileNetV2 memberi dugaan awal empat kelas; dokter hewan menentukan hasil validasi manusia.

Pekerja tidak memiliki akun. Admin, Dokter Hewan, dan Kepala Pekerja memakai `/login` yang sama. Role aman berasal dari `app_metadata`, bukan metadata yang dapat diedit pengguna.

## 2. Analisis aktor dan pemisahan kewenangan

| Aktor | Tanggung jawab | Data yang tidak boleh diakses |
|---|---|---|
| Pekerja Kandang | Deteksi dan penyimpanan prediksi | Dashboard staf dan data workflow |
| Admin | Statistik, riwayat, soft delete, CSV prediksi, pengguna | Validasi dokter dan tindak lanjut kasus |
| Dokter Hewan | Antrean validasi dan riwayat milik sendiri | Validasi dokter lain dan aksi penanganan |
| Kepala Pekerja | Ringkasan operasional dan transisi tindak lanjut | Mengubah keputusan dokter dan fungsi Admin |

Pemisahan ini mencegah satu role menguasai seluruh keputusan. Admin mengelola sistem, Dokter bertanggung jawab pada kepastian medis, dan Kepala Pekerja pada pelaksanaan operasional.

## 3. Analisis aturan workflow

1. Trigger hanya membuat follow-up setelah prediksi penyakit baru disimpan. Data lama dan kelas `Healthy` sengaja dikecualikan agar tidak muncul sebagai backlog palsu.
2. Pemisahan dapat dilakukan segera. Ini sesuai keputusan operasional bahwa ayam terindikasi wajib dipisahkan sebelum menunggu validasi.
3. Verdict dokter terdiri atas `matching`, `incorrect`, dan `uncertain`. Koreksi diperlukan hanya untuk `incorrect` dan harus berbeda dari label AI.
4. Unique constraint pada `prediction_id` menerapkan satu validasi per prediksi; transaksi pertama menang jika terjadi kompetisi.
5. Validasi hanya dapat diedit oleh dokter pembuatnya dan terkunci setelah penanganan dimulai.
6. Penanganan memerlukan pemisahan serta validasi definitif penyakit. `uncertain` menahan kasus untuk pemeriksaan lanjutan, sedangkan koreksi ke `Healthy` menutup kasus otomatis.
7. Rekomendasi tetap memakai knowledge base statis dan memilih label efektif dokter bila ada koreksi.

## 4. Analisis keamanan

- Backend memverifikasi JWT dan role pada setiap endpoint staf.
- Tabel `staff_profiles`, `prediction_validations`, dan `prediction_followups` menggunakan RLS serta pencabutan akses `anon`/`authenticated`; backend mengaksesnya dengan `service_role`.
- Policy lama yang terlalu luas pada `workers` dan `predictions` diganti dengan policy khusus Admin untuk mutasi/akses client yang sensitif.
- Existing Auth users dibootstrap sebagai Admin saat migration agar perilaku lama tidak terputus.
- Service role key hanya berada di lingkungan backend; tidak pernah dikirim ke aplikasi mobile.

## 5. Dampak pada desain

Perubahan role memengaruhi use-case, login, navigasi, ERD, arsitektur, class/component, sequence, activity, dan flowchart sistem. Pipeline training serta preprocessing/inference tidak berubah. Dokumen diagram karena itu membedakan diagram yang berubah total, diagram yang bertambah, dan diagram ML yang hanya diperbarui penjelasannya.

Setiap role baru dibatasi tepat dua tab. Detail dan formulir menggunakan modal sehingga penambahan workflow tidak memperbanyak halaman. Scope tetap mengecualikan profil, notifikasi push, identitas ayam, dan identitas kandang.
