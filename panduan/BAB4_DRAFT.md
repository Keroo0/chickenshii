# BAB 4
# HASIL DAN PEMBAHASAN

Bab ini memuat implementasi sistem, eksperimen model, pengujian fungsional, evaluasi kebergunaan, dan pembahasan. Teks dalam tanda `[Isi setelah bukti tersedia]` adalah placeholder dan tidak boleh ditulis sebagai hasil empiris sebelum pengujian dilakukan.

## 4.1 Implementasi lingkungan dan antarmuka

ChickenShii menggunakan aplikasi mobile React Native/Expo, backend FastAPI, model MobileNetV2, dan Supabase. Arsitektur akhir membedakan empat aktor: Pekerja Kandang tanpa login, Admin, Dokter Hewan, serta Kepala Pekerja.

### A. Alur Pekerja Kandang

Pekerja dapat mengambil atau memilih citra feses, melakukan crop, menjalankan deteksi, melihat confidence/probabilitas/rekomendasi, dan menyimpan hasil dengan identitas pekerja aktif. Pekerja tidak memerlukan akun.

`[Sisipkan screenshot beranda, crop/loading, hasil, dan modal simpan pada build yang diuji.]`

### B. Login bersama dan Admin

Seluruh staf memakai halaman `/login`. Sistem membaca role aman pada `app_metadata` lalu mengarahkan Admin ke `/admin`, Dokter ke `/doctor`, atau Kepala Pekerja ke `/head-worker`. Tab Admin `Pengguna` menggabungkan pengelolaan pekerja kandang dan pembuatan akun staf.

`[Sisipkan screenshot login, Dashboard Admin, Riwayat, dan dua segmen Pengguna.]`

### C. Antarmuka Dokter Hewan

Area Dokter dibatasi pada dua tab: `Validasi` untuk antrean bersama kasus penyakit baru dan `Riwayat` untuk validasi milik dokter login. Form modal menyediakan keputusan Sesuai, Tidak sesuai, dan Tidak dapat dipastikan. Koreksi wajib pada pilihan Tidak sesuai.

`[Sisipkan screenshot kedua tab, modal tiga verdict, error koreksi, empty/loading/error, dan edit terkunci setelah treatment.]`

Status implementasi: kedua tab, kartu kasus, modal detail/form, state loading/empty/error, retry, dan refresh telah tersedia pada kode mobile. Bukti uji perangkat serta screenshot masih harus diisi setelah pengujian manual.

### D. Antarmuka Kepala Pekerja

Area Kepala Pekerja memiliki dua tab: `Dashboard` dan `Tindak Lanjut`. Pemisahan dapat dicatat segera; treatment baru dapat dimulai setelah pemisahan dan validasi definitif. Koreksi Healthy menutup kasus, sedangkan hasil tidak pasti memerlukan pemeriksaan lanjutan.

`[Sisipkan screenshot ringkasan, daftar tindak lanjut, modal isolate/start/complete, uncertain, dan auto-closed.]`

Status implementasi: kedua tab, empat ringkasan dashboard, filter status, modal detail, konfirmasi pemisahan/mulai/selesai, dan state antarmuka telah tersedia pada kode mobile. Bukti uji perangkat serta screenshot masih harus diisi setelah pengujian manual.

### E. Backend dan basis data

Backend menyediakan endpoint publik deteksi/simpan serta endpoint terlindungi berdasarkan role. Migration menambahkan `staff_profiles`, `prediction_validations`, dan `prediction_followups`, RLS deny-by-default, serta trigger urutan workflow. Hanya prediksi penyakit yang disimpan setelah migration yang masuk workflow.

`[Sisipkan bukti health check, log request tanpa secret/token, migration applied, dan contoh penolakan lintas role.]`

## 4.2 Hasil eksperimen model deep learning

Eksperimen membandingkan Baseline CNN, MobileNetV2 Feature Extraction, dan MobileNetV2 Fine-Tuning.

### A. Perbandingan tiga skenario

`[Masukkan tabel accuracy, precision, recall, dan F1-score dari artefak eksperimen final; cantumkan sumber file.]`

### B. Kurva konvergensi

`[Masukkan kurva training/validation loss dan accuracy. Jelaskan konvergensi serta indikasi overfitting/underfitting berdasarkan grafik, bukan asumsi.]`

### C. Confusion matrix

`[Masukkan confusion matrix model terpilih. Jelaskan TP/FP/FN per kelas dan dampak imbalance, khususnya NCD.]`

Penambahan role tidak mengubah dataset, arsitektur model, preprocessing, atau pipeline inferensi; perubahan berlangsung setelah hasil prediksi disimpan.

## 4.3 Hasil pengujian fungsional

### A. Pengujian otomatis

Pada 2 Agustus 2026, suite backend lengkap dijalankan setelah implementasi role baru selesai dengan perintah:

```text
.venv/bin/python -m pytest -q
```

Hasilnya adalah **163 pengujian backend lulus**. Suite mencakup fungsi lama, pembatasan label simpan ke empat kelas model, autentikasi/role, provisioning akun staf, penolakan email duplikat, validasi dokter, transisi tindak lanjut, perlindungan terhadap soft delete, dan empat pengujian kontrak dokumentasi diagram.

Suite mobile yang dijalankan dengan `npm test` menghasilkan **26 pengujian lulus, 0 gagal**. Cakupannya meliputi mapping role dari `app_metadata`, validasi form akun staf, aturan validasi Dokter, format/status workflow, gating aksi Kepala Pekerja, sanitasi error API, serta pemisahan client API anonim dan staf agar token tidak dikirim ke URL khusus. Pemeriksaan `npx tsc --noEmit` juga selesai dengan exit code 0 tanpa diagnostic setelah UI Dokter dan Kepala Pekerja selesai diimplementasikan.

Empat pengujian kontrak dokumentasi Visual Paradigm termasuk dalam total suite backend tersebut. `[Lampirkan log final backend, TypeScript, dan mobile pada lampiran.]`

### B. Pengujian black-box

Skenario lengkap tersedia pada `panduan/HASIL_PENGUJIAN.md`. Skenario minimum meliputi login/redirect tiga role, penolakan lintas role, tiga verdict dokter, kompetisi validator, pemisahan sebelum validasi, gating treatment, koreksi Healthy, uncertain, selesai treatment, serta regresi pekerja/Admin.

Status hasil manual: **belum boleh disimpulkan** sampai bukti pada perangkat dan environment target tersedia.

`[Masukkan tabel ID skenario, hasil aktual, status, tanggal, perangkat, dan referensi bukti.]`

## 4.4 Evaluasi kebergunaan

Evaluasi dapat memakai System Usability Scale (SUS) terhadap kelompok pengguna yang relevan. Karena workflow kini mempunyai Pekerja, Admin, Dokter, dan Kepala Pekerja, responden dan tugas uji perlu dipisahkan menurut role.

`[Masukkan jumlah responden, teknik sampling, instrumen, jawaban mentah, perhitungan SUS, dan interpretasi setelah data dikumpulkan.]`

Jangan menyatakan aplikasi mudah digunakan atau mencantumkan skor SUS sebelum kuesioner aktual dianalisis.

## 4.5 Pembahasan

### A. Dampak validasi manusia

Dokter Hewan mengubah keluaran model dari dugaan tunggal menjadi keputusan yang dapat dikonfirmasi, dikoreksi, atau ditunda untuk pemeriksaan. Namun, karena hanya prediksi penyakit yang masuk antrean, data validasi ini tidak merepresentasikan evaluasi akurasi terhadap seluruh kelas, terutama true negative Healthy.

### B. Pemisahan sebelum validasi

Pemisahan segera merupakan keputusan preventif: tindakan operasional tidak menunggu kepastian dokter, sementara pemberian penanganan tetap dikunci sampai ada validasi definitif. Desain ini membedakan mitigasi risiko awal dari keputusan treatment.

### C. Integritas dan akuntabilitas

First-write-wins mencegah dua diagnosis aktif untuk satu prediksi. Riwayat milik sendiri, pencatatan aktor/waktu, edit lock setelah treatment, dan urutan database menjaga audit trail walaupun request bersamaan atau client bermasalah.

### D. Knowledge base tanpa LLM

Rekomendasi statis dipertahankan untuk latensi, determinisme, dan mengurangi risiko halusinasi medis. Setelah koreksi dokter, rekomendasi menggunakan label efektif agar konten tidak bertentangan dengan hasil validasi.

### E. Batas penelitian

Sistem tidak mengidentifikasi ayam/kandang, tidak mengirim push notification, tidak menyediakan profil staf, dan tidak melakukan backfill. Keterbatasan tersebut menjaga scope, tetapi membatasi pelacakan epidemiologis dan evaluasi longitudinal; hal ini dapat dicatat sebagai peluang penelitian selanjutnya.
