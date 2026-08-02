# Penjelasan Diagram Arsitektur Sistem

## Tujuan

Diagram ini menunjukkan penempatan aplikasi, backend, model AI, Supabase, serta batas akses Pekerja Kandang, Admin, Dokter Hewan, dan Kepala Pekerja.

## Jenis Diagram

Gunakan **UML Deployment Diagram** di Visual Paradigm Online dengan Node, Artifact, Component, dan Communication Path.

## Elemen

- Node `Perangkat Android` berisi artifact `ChickenShii Mobile (Expo/React Native)`.
- Empat pengguna: Pekerja Kandang, Admin, Dokter Hewan, Kepala Pekerja.
- Node `Backend Server` berisi `FastAPI`, `Role Authorization`, `Workflow Service`, `Supabase Service`, dan `Model MobileNetV2` in-process.
- Cloud Node `Supabase` berisi `Auth`, `PostgreSQL`, dan `Storage feses-images`.
- Data: `workers`, `predictions`, `staff_profiles`, `prediction_validations`, dan `prediction_followups`.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > UML > Deployment Diagram**.
2. Letakkan `Perangkat Android`, `Backend Server`, dan `Supabase Cloud` dari kiri ke kanan.
3. Masukkan artifact aplikasi mobile ke perangkat dan komponen FastAPI/model ke backend.
4. Masukkan Auth, Database, dan Storage ke node Supabase.
5. Letakkan Pekerja Kandang di dekat layar publik; letakkan Admin, Dokter Hewan, dan Kepala Pekerja di dekat layar login bersama.
6. Hubungkan Mobile ke Backend dengan `HTTPS REST API`. Beri catatan bahwa endpoint staf membawa `Bearer JWT`.
7. Hubungkan Mobile ke Supabase Auth untuk login dan sesi; hubungkan Backend ke Auth untuk verifikasi token/role.
8. Hubungkan Backend ke PostgreSQL dan Storage memakai `service_role`; model AI tetap di dalam Backend.
9. Tambahkan Note bahwa tabel workflow memakai RLS deny-by-default dan hanya backend yang membaca/menulisnya.

## Konektor dan Relasi

- Communication Path Mobile–Backend: `HTTPS/JSON + multipart`.
- Communication Path Mobile–Auth: `Supabase Auth SDK`.
- Communication Path Backend–Supabase: `HTTPS dengan service_role`.
- Dependency FastAPI → Model AI untuk inferensi dan Workflow Service → tabel workflow.

## Saran Tata Letak

Gunakan tiga kolom deployment. Tempatkan pengguna di atas Mobile, komponen bisnis di tengah Backend, dan layanan Supabase bertumpuk di kanan. Beri legenda untuk koneksi publik, terautentikasi, dan service role.

## Penjelasan Diagram untuk Laporan

Keempat peran memakai aplikasi mobile yang sama. Pekerja Kandang mengakses deteksi secara anonim, sedangkan Admin, Dokter Hewan, dan Kepala Pekerja melakukan login melalui Supabase Auth. Backend memverifikasi JWT dan role pada setiap endpoint staf. Inferensi MobileNetV2 berjalan di dalam proses FastAPI. Data workflow hanya diakses backend dengan service role, sementara RLS mencegah akses langsung dari role `anon` dan `authenticated`.

## Checklist

- [ ] Mobile, Backend, Model AI, Auth, Database, dan Storage tergambar.
- [ ] Empat peran dan perbedaan aksesnya jelas.
- [ ] JWT/role diverifikasi Backend.
- [ ] Model AI digambar in-process.
- [ ] Tabel workflow dan RLS deny-by-default dicantumkan.

