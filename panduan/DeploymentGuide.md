# Deployment Guide — ChickenShii

Panduan ini mencakup backend FastAPI, migration workflow staf, dan build Expo. Jangan menyalin nilai token/key ke dokumentasi, log publik, screenshot, atau source control.

## 1. Prasyarat

- Project Supabase dan akses untuk menjalankan migration.
- Environment backend berisi URL Supabase, anon key yang diperlukan, dan service role key.
- Python 3.11/dependency backend atau Docker.
- Node.js, dependency mobile, akun Expo/EAS untuk build perangkat.
- Backup database dan rencana rollback sebelum migration production.

## 2. Urutan deployment yang aman

1. Backup database dan catat jumlah akun Auth/prediksi sebelum migration.
2. Terapkan skema dasar bila environment baru.
3. Terapkan `supabase/migrations/20260802090000_add_staff_workflow.sql`.
4. Verifikasi tabel, trigger, index, RLS, privilege, role existing user, dan `staff_profiles`.
5. Deploy backend baru dan jalankan smoke test endpoint per role.
6. Deploy/build mobile yang memakai `/login` bersama dan route guards.
7. Buat akun uji Dokter/Kepala Pekerja melalui UI Admin, bukan dengan menulis role dari client.
8. Jalankan matriks regresi sebelum membuka akses pengguna.

Backend harus didahulukan agar aplikasi mobile tidak memanggil endpoint/tabel yang belum tersedia.

## 3. Migration Supabase

File migration:

```text
supabase/migrations/20260802090000_add_staff_workflow.sql
```

Migration melakukan hal berikut:

- membuat `staff_profiles`, `prediction_validations`, dan `prediction_followups`;
- menambahkan trigger follow-up hanya untuk insert prediksi penyakit setelah migration;
- memasang constraint validasi dan urutan treatment;
- mencabut akses `anon`/`authenticated` ke tabel workflow dan memberi privilege `service_role`;
- mengganti policy lama dengan policy Admin pada data sensitif;
- menambahkan `app_metadata.role=admin` pada seluruh akun Auth yang sudah ada dan membuat profil Admin.

Tidak ada backfill follow-up untuk prediksi lama. Verifikasi ini dengan membandingkan timestamp prediksi lama dan isi `prediction_followups`.

Checklist pascamigration:

- ketiga tabel ada dan RLS aktif;
- role existing Auth user adalah `admin` tanpa menghapus key app metadata lain;
- jumlah profil existing sesuai jumlah akun Auth sebelum migration;
- insert `Healthy` baru tidak membuat follow-up;
- insert penyakit baru membuat tepat satu follow-up;
- direct Data API sebagai `anon`/`authenticated` tidak dapat membaca tabel workflow.

## 4. Backend

### Lokal

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

Isi `.env` secara lokal/deployment secret manager. Jangan gunakan placeholder nyata di commit.

### Docker

```bash
cd backend
docker build -t chikenshii-api .
docker run --env-file .env -p 8000:8000 chikenshii-api
```

Health check tersedia pada `/` dan `/api/v1/health`.

### Smoke test role

Gunakan akun uji terpisah dan token sementara melalui client yang aman. Verifikasi:

- Admin berhasil mengakses statistik/pembuatan staf tetapi ditolak endpoint Doctor/Head Worker.
- Dokter berhasil membuka pending/history dan ditolak endpoint Admin/Head Worker.
- Kepala Pekerja berhasil membuka dashboard/follow-ups dan ditolak endpoint Admin/Doctor.
- Request tanpa token menghasilkan 401; role salah menghasilkan 403.

Jangan menaruh Bearer token pada command yang akan disalin ke laporan.

## 5. Mobile Expo

Buat `mobile/.env` lokal:

```text
EXPO_PUBLIC_API_URL=https://alamat-backend
EXPO_PUBLIC_SUPABASE_URL=https://project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Service role key tidak boleh menggunakan prefix `EXPO_PUBLIC_` dan tidak boleh berada di mobile.

Verifikasi sebelum build:

```bash
cd mobile
npm test -- --runInBand
npx tsc --noEmit
```

Build:

```bash
eas build --platform android --profile preview
eas build --platform android --profile production
```

## 6. Checklist rilis

- Shared `/login` mengarahkan tiga role dengan benar; role tidak dikenal logout.
- Pekerja anonim tetap dapat deteksi dan simpan.
- Dokter dan Kepala Pekerja masing-masing hanya memiliki dua tab.
- Admin Pengguna dapat membuat akun; email duplikat ditolak.
- Data lama/Healthy tidak masuk workflow.
- Isolasi, tiga verdict, correction, uncertain, treatment gating, auto-close, dan complete berfungsi.
- Admin tidak melihat/mengekspor validasi atau tindak lanjut.
- Seluruh test otomatis lulus dan black-box manual memiliki bukti.
- CORS production dibatasi ke origin yang benar bila deployment membutuhkannya.

## 7. Demo sidang

Gunakan dataset demo khusus dan akun uji untuk setiap role. Siapkan urutan: pekerja simpan kasus penyakit → Kepala Pekerja isolate → Dokter validasi → Kepala Pekerja start/complete. Siapkan pula satu kasus uncertain dan satu koreksi Healthy. Jangan memakai akun production atau menampilkan token/key di layar.
