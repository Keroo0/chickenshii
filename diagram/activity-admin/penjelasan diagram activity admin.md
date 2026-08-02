# Penjelasan Diagram Activity Admin

## Tujuan

Diagram ini memperlihatkan aktivitas Admin setelah masuk melalui login bersama. Fokusnya adalah melihat statistik dan riwayat, mengelola pekerja kandang, serta membuat akun staf untuk Dokter Hewan dan Kepala Pekerja. Admin tidak mengakses data validasi dokter maupun tindak lanjut penanganan.

## Jenis Diagram

Gunakan **UML Activity Diagram** di Visual Paradigm Online. Pakai *swimlane* `Admin`, `Aplikasi Mobile`, `Backend API`, dan `Supabase` agar tanggung jawab setiap pihak terlihat.

## Elemen

- Initial Node: `Mulai`.
- Action: `Buka halaman login`, `Isi email dan password`, `Validasi kredensial dan role`, `Tampilkan area Admin`, `Lihat Dashboard`, `Kelola Riwayat`, `Kelola Pengguna`, `Buat akun staf`, `Export CSV`, dan `Logout`.
- Decision Node: `Login valid dan role admin?` serta `Menu yang dipilih?`.
- Cabang `Kelola Pengguna`: `Kelola pekerja` atau `Buat akun staf` dengan nama, email, role, dan password sementara.
- Final Node: `Selesai`.

## Langkah Pembuatan di Visual Paradigm Online

1. Buat diagram baru melalui **New Diagram > UML > Activity Diagram**.
2. Tambahkan empat swimlane vertikal sesuai daftar pada bagian Elemen.
3. Pada lane Admin, susun `Mulai` → `Buka halaman login` → `Isi email dan password`.
4. Pada lane Aplikasi, tambahkan `Kirim kredensial`; pada Backend/Supabase tambahkan `Validasi kredensial dan role`.
5. Buat decision `Login valid dan role admin?`. Cabang `[tidak]` menuju `Tampilkan pesan gagal`, `Akhiri sesi`, lalu kembali ke login. Cabang `[ya]` menuju `Tampilkan area Admin`.
6. Tambahkan decision `Menu yang dipilih?` dengan cabang Dashboard, Riwayat, dan Pengguna.
7. Dari Dashboard, gambar `Lihat statistik`; dari Riwayat, gambar `Filter/cari`, `Soft delete`, dan `Export CSV`.
8. Dari Pengguna, buat decision `Jenis data?`; arahkan ke pengelolaan pekerja lama atau `Buat akun staf`.
9. Setelah setiap aksi, hubungkan kembali ke pilihan menu. Tambahkan `Logout` → `Hapus sesi` → `Selesai`.

## Konektor dan Relasi

- Gunakan **Control Flow** berpanah penuh untuk urutan aktivitas.
- Tulis guard `[ya]`, `[tidak]`, `[Dashboard]`, `[Riwayat]`, dan `[Pengguna]` pada keluaran decision.
- Hubungkan `Buat akun staf` ke `Supabase Auth membuat user`, lalu `Simpan staff_profiles dan app_metadata.role`.
- Jangan hubungkan Admin ke validasi atau tindak lanjut; batas akses ini harus tampak pada diagram.

## Saran Tata Letak

Susun alur dari atas ke bawah. Letakkan alur gagal login di kiri, alur utama di tengah, dan tiga cabang menu sejajar. Gunakan warna konsisten per lane dan hindari garis yang saling memotong.

## Penjelasan Diagram untuk Laporan

Activity Diagram Admin menunjukkan bahwa seluruh staf menggunakan halaman login yang sama, tetapi sistem hanya membuka area Admin apabila JWT memuat role `admin`. Setelah berhasil masuk, Admin dapat melihat dashboard dan riwayat prediksi, melakukan soft delete, mengekspor CSV prediksi, mengelola pekerja kandang, serta membuat akun staf. Data validasi Dokter Hewan dan tindak lanjut Kepala Pekerja sengaja tidak tersedia bagi Admin dan tidak ikut diekspor.

## Checklist

- [ ] Terdapat empat swimlane dan satu initial/final node.
- [ ] Login gagal mengakhiri sesi dan kembali ke login.
- [ ] Menu Admin mencakup Dashboard, Riwayat, dan Pengguna.
- [ ] Pengguna mencakup pekerja lama dan pembuatan akun staf.
- [ ] Validasi serta tindak lanjut tidak digambarkan sebagai akses Admin.

