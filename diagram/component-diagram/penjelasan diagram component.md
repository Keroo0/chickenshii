# Penjelasan Diagram Component ChickenShii

## Tujuan

Diagram ini memperlihatkan komponen perangkat lunak yang menyediakan fitur bagi Pekerja Kandang, Admin, Dokter Hewan, dan Kepala Pekerja beserta dependensinya.

## Jenis Diagram

Gunakan **UML Component Diagram** dengan Component, Provided Interface, Required Interface, Dependency, dan Package.

## Elemen

- Package `Mobile App`: Public Detection UI, Shared Login, Auth Provider/Role Guard, Admin UI, Doctor UI, Head Worker UI, dan API Client.
- Package `Backend FastAPI`: Detection Router, Admin Router, Workflow Router, ML Service, Workflow Service, Supabase Service, dan Role Authorization.
- Package `Supabase`: Auth, PostgreSQL, Storage.
- Komponen data PostgreSQL: workers, predictions, staff_profiles, prediction_validations, prediction_followups.
- Aktor pemakai: Pekerja Kandang, Admin, Dokter Hewan, Kepala Pekerja.
- Provided interface: Detection REST (Detection Router), Admin REST (Admin Router), Workflow REST (Workflow Router), Auth API (Supabase Auth), Database API (PostgreSQL), dan Storage API (Storage).
- Required interface: API Client membutuhkan ketiga REST interface; Auth Provider dan Role Authorization membutuhkan Auth API; Supabase Service membutuhkan Database API serta Storage API; Workflow Service membutuhkan Database API.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > UML > Component Diagram**.
2. Buat tiga package: Mobile App, Backend FastAPI, dan Supabase.
3. Tambahkan komponen Mobile. Gambar association Pekerja Kandang → Public Detection UI, Admin → Shared Login dan Admin UI, Dokter Hewan → Shared Login dan Doctor UI, serta Kepala Pekerja → Shared Login dan Head Worker UI.
4. Hubungkan Shared Login → Auth Provider dengan dependency `signIn/session`. Hubungkan Auth Provider → Role Guard dengan `currentSession/role`, lalu Role Guard → Admin UI, Doctor UI, dan Head Worker UI dengan dependency `izinkan rute`.
5. Hubungkan Public Detection UI → API Client `deteksi/simpan`; Admin UI → API Client `administrasi`; Doctor UI dan Head Worker UI → API Client `workflow`.
6. Pada Backend, hubungkan Detection Router → ML Service dan Supabase Service; Workflow Router → Role Authorization dan Workflow Service; Admin Router → Role Authorization dan Supabase Service.
7. Tempelkan lollipop **provided** `Detection REST`, `Admin REST`, dan `Workflow REST` pada router terkait. Tempelkan tiga socket **required** pada API Client, lalu hubungkan masing-masing: Detection ke Detection Router, Admin ke Admin Router, Workflow ke Workflow Router.
8. Tempelkan lollipop provided `Auth API` pada Supabase Auth dan socket required pada Auth Provider serta Role Authorization. Hubungkan Auth Provider → Auth API untuk login/session, dan Role Authorization → Auth API untuk verifikasi token/user. Pembuatan akun staf oleh Admin Router dapat diberi dependency ke Auth API melalui Supabase Service.
9. Tempelkan lollipop provided `Database API` pada PostgreSQL. Tempelkan socket required pada Supabase Service dan Workflow Service; hubungkan Supabase Service ke workers/predictions/staff_profiles dan Workflow Service ke predictions/staff_profiles/prediction_validations/prediction_followups.
10. Tempelkan lollipop provided `Storage API` pada Storage dan socket required pada Supabase Service, kemudian sambungkan keduanya.
11. Tambahkan note: Pekerja Kandang tanpa login; Admin membuat akun staf; Dokter Hewan memvalidasi; Kepala Pekerja memisahkan dan menangani.

## Konektor dan Relasi

- Gunakan **Dependency** berpanah putus-putus dari pengguna layanan menuju penyedia.
- Gunakan simbol bola (*lollipop*) pada komponen penyedia dan simbol soket setengah lingkaran pada komponen pemakai; satukan bola dan soket dengan assembly connector.
- Doctor UI dan Head Worker UI tidak bergantung langsung pada PostgreSQL; keduanya harus melalui Backend.
- Admin UI tidak bergantung pada Workflow Service.
- API Client memetakan tiga jalur secara eksplisit: Public Detection UI→Detection REST, Admin UI→Admin REST, dan Doctor/Head Worker UI→Workflow REST.

## Saran Tata Letak

Tempatkan aktor di kiri, komponen Mobile di kolom kedua, Backend di kolom ketiga, dan Supabase di kanan. Susun Doctor UI dan Head Worker UI sejajar agar batas peran mudah dibandingkan.

## Penjelasan Diagram untuk Laporan

Component Diagram memisahkan presentasi, layanan bisnis, inferensi, dan infrastruktur. Pekerja Kandang menggunakan Public Detection UI, sedangkan tiga staf berbagi komponen login dan dipisahkan oleh Role Guard. Endpoint workflow hanya diakses Doctor UI atau Head Worker UI sesuai role. Workflow Service menjadi satu-satunya pengelola validasi dan tindak lanjut melalui backend service role; Admin UI tetap terpisah dari data tersebut.

## Checklist

- [ ] Empat peran disebutkan beserta fungsi utamanya.
- [ ] Shared Login dan Role Guard terlihat.
- [ ] Komponen Mobile, Backend, dan Supabase dipisahkan.
- [ ] Doctor/Head Worker melewati Workflow Router.
- [ ] Admin tidak terhubung ke Workflow Service.
