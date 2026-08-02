# Preview Proyek ChickenShii

## Gambaran umum

ChickenShii adalah aplikasi mobile dan REST API untuk deteksi dini penyakit ayam petelur dari citra feses. MobileNetV2 menghasilkan dugaan kelas dan confidence, sedangkan workflow manusia memastikan hasil penyakit ditindaklanjuti secara operasional. Sistem merupakan Decision Support System, bukan pengganti diagnosis dokter hewan.

## Aktor sistem

1. **Pekerja Kandang (tanpa login):** mengambil/memilih foto, melakukan crop, menjalankan deteksi, melihat detail serta rekomendasi awal, lalu menyimpan hasil dengan memilih nama pekerja aktif.
2. **Admin/Pemilik (login):** membuka Dashboard, Riwayat, dan Pengguna; mengelola pekerja lama, membuat akun Dokter/Kepala Pekerja, serta mengekspor data prediksi tanpa data workflow.
3. **Dokter Hewan (login):** memiliki tepat dua tab, `Validasi` dan `Riwayat`. Dokter memvalidasi kasus penyakit dan hanya melihat riwayat validasinya sendiri.
4. **Kepala Pekerja (login):** memiliki tepat dua tab, `Dashboard` dan `Tindak Lanjut`. Kepala pekerja mencatat pemisahan serta status penanganan.

`/login` dipakai bersama oleh seluruh staf. Setelah token diverifikasi, role `admin`, `veterinarian`, atau `head_worker` dari `app_metadata` menentukan redirect ke `/admin`, `/doctor`, atau `/head-worker`. Role lain ditolak. Tidak ada halaman profil staf.

## Alur operasional baru

- Hanya prediksi penyakit baru yang menghasilkan `prediction_followups`; `Healthy` dan data sebelum migration tidak masuk workflow.
- Ayam yang terindikasi penyakit wajib segera dipisahkan oleh Kepala Pekerja, bahkan sebelum validasi dokter.
- Dokter memilih `Sesuai`, `Tidak sesuai`, atau `Tidak dapat dipastikan`. Koreksi wajib untuk `Tidak sesuai`; catatan opsional.
- Satu prediksi hanya dapat dimenangkan oleh satu validator. Dokter hanya dapat mengedit validasinya sendiri sebelum penanganan dimulai.
- Penanganan membutuhkan status sudah dipisahkan dan hasil dokter yang memastikan penyakit.
- Koreksi menjadi `Healthy` menutup kasus otomatis. Hasil tidak pasti menampilkan kebutuhan pemeriksaan lebih lanjut dan memblokir penanganan.
- Rekomendasi lama tetap tampil dan mengikuti label hasil koreksi dokter.

## Teknologi dan batas sistem

- **Mobile:** React Native, Expo, Expo Router, NativeWind.
- **Backend:** FastAPI, Pydantic, TensorFlow/Keras, MobileNetV2.
- **Data:** Supabase PostgreSQL, Auth, Storage.
- **Keamanan:** JWT, role pada `app_metadata`, validasi role di backend, RLS deny-by-default untuk tabel workflow.
- **Batas ruang lingkup:** tanpa notifikasi push, identitas ayam, identitas kandang, fitur Admin untuk reset/aktivasi akun staf, kewajiban mengganti password sementara, maupun alur reset password mandiri pada halaman login.

## Dataset dan model

Dataset berjumlah 8.276 citra: 8.066 citra publik dan 210 citra lapangan PT Nirwana Farm. Kelas akhir adalah Coccidiosis, Healthy, New Castle Disease, dan Salmonellosis. Pipeline training/inference tidak berubah karena penambahan role hanya memperluas validasi dan tindak lanjut setelah prediksi disimpan.

Distribusi gabungan adalah 2.566 citra Coccidiosis, 2.404 Healthy, 2.625 Salmonellosis, dan 681 New Castle Disease. Dataset dibagi secara stratified menjadi 70% training, 15% validation, dan 15% testing.

Eksperimen tetap membandingkan tiga skenario:

1. Baseline Custom CNN sebagai pembanding dasar.
2. MobileNetV2 Feature Extraction dengan backbone beku.
3. MobileNetV2 Fine-Tuning dengan 30 layer terakhir dibuka dan learning rate `1e-5`.

Konfigurasi utama memakai citra 224×224, batch 32, optimizer Adam, EarlyStopping, dan ReduceLROnPlateau. Seluruh angka evaluasi model harus bersumber dari artefak eksperimen, bukan dari tabel validasi dokter karena workflow hanya mencakup prediksi penyakit.

## Skema data

| Entitas | Fungsi |
|---|---|
| `workers` | Daftar pekerja kandang non-login. |
| `predictions` | Riwayat hasil AI dan gambar. |
| `staff_profiles` | Identitas tampilan dan role akun staf. |
| `prediction_validations` | Satu keputusan dokter untuk setiap prediksi penyakit. |
| `prediction_followups` | Jejak pemisahan, penanganan, selesai, atau penutupan otomatis. |
| `feses-images` | Bucket foto feses. |

Existing Auth users dibootstrap sebagai Admin saat migration. Admin tidak memperoleh akses ke isi `prediction_validations` atau `prediction_followups`; workflow hanya diakses melalui backend sesuai role.

## Antarmuka ringkas

- Pekerja: Home deteksi dan layar hasil.
- Admin: Dashboard, Riwayat, Pengguna. Tab Pengguna menggabungkan pengelolaan pekerja dengan formulir akun staf.
- Dokter: dua tab dan modal detail/form validasi.
- Kepala Pekerja: dua tab dan modal detail/konfirmasi tindakan.

Modal tidak dihitung sebagai halaman. Keputusan dua tab menjaga scope mobile tetap sederhana.

## Nilai penelitian

Penambahan Dokter Hewan memisahkan dugaan AI dari keputusan profesional. Penambahan Kepala Pekerja membuat tindakan preventif dapat dilacak tanpa menunda pemisahan ayam. Dengan demikian, keluaran model bukan hanya ditampilkan, tetapi masuk ke rangkaian keputusan yang memiliki pembatas otorisasi dan urutan status yang jelas.
