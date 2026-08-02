# Penjelasan Diagram Navigasi Aplikasi

## Tujuan

Diagram ini menjelaskan jalur navigasi Pekerja Kandang, Admin, Dokter Hewan, dan Kepala Pekerja, termasuk satu halaman login bersama dan penjagaan rute berdasarkan role.

## Jenis Diagram

Gunakan **Navigation Diagram** atau **UML State Machine Diagram** di Visual Paradigm Online. Representasikan layar sebagai State dan perpindahan sebagai Transition.

## Elemen

- Layar publik: `/` untuk Pekerja Kandang, `/result`, dan `/login`.
- Area Admin: `/admin` dengan tab Dashboard, Riwayat, dan Pengguna.
- Area Dokter Hewan: `/doctor` dengan tepat dua tab, Validasi dan Riwayat.
- Area Kepala Pekerja: `/head-worker` dengan tepat dua tab, Dashboard dan Tindak Lanjut.
- Decision: `Ada sesi?`, `Role?`, dan `Role sesuai rute?`.
- Modal: Detail Validasi, Form Validasi/Edit, Detail Tindak Lanjut, dan Form Aksi.

## Langkah Pembuatan di Visual Paradigm Online

1. Buat **State Machine Diagram** baru.
2. Letakkan Initial State menuju `/` dan beri catatan `akses anonim Pekerja Kandang`.
3. Tambahkan state `/login` sebagai satu-satunya form login untuk Admin, Dokter Hewan, dan Kepala Pekerja.
4. Setelah `/login`, buat choice pseudostate `Role?` dengan transition `[admin]` ke `/admin`, `[veterinarian]` ke `/doctor`, dan `[head_worker]` ke `/head-worker`.
5. Tambahkan transition `[role tidak dikenal]` ke `Akhiri sesi` lalu kembali ke `/login`.
6. Di dalam composite state `/admin`, buat Dashboard, Riwayat, dan Pengguna.
7. Di dalam `/doctor`, buat Validasi dan Riwayat; detail/form digambar sebagai state modal, bukan tab tambahan.
8. Di dalam `/head-worker`, buat Dashboard dan Tindak Lanjut; detail/aksi juga berupa modal.
9. Pada setiap area protected, tambahkan choice `Role sesuai rute?`; kegagalan mengarah ke area yang benar atau logout bila role tidak dikenal.

## Konektor dan Relasi

- Gunakan Transition berlabel aksi atau guard, misalnya `login berhasil [admin]`.
- Gunakan panah dua arah antartab dalam area yang sama.
- Gunakan transition `logout` dari ketiga area protected ke `/login`.
- Modal kembali ke tab asal saat ditutup atau setelah data disimpan.

## Saran Tata Letak

Letakkan layar publik di kiri, `/login` di tengah atas, dan tiga area role sejajar di kanan. Gunakan *composite state* agar jumlah tab tiap area terlihat jelas.

## Penjelasan Diagram untuk Laporan

Navigasi ChickenShii mempertahankan halaman deteksi publik bagi Pekerja Kandang. Ketiga role staf memakai `/login` yang sama, kemudian diarahkan berdasarkan `app_metadata.role`: Admin ke `/admin`, Dokter Hewan ke `/doctor`, dan Kepala Pekerja ke `/head-worker`. Guard mencegah akses lintas role. Dokter dan Kepala Pekerja masing-masing hanya mempunyai dua tab, sedangkan detail serta formulir menggunakan modal.

## Checklist

- [ ] Empat peran disebutkan.
- [ ] Hanya ada satu halaman `/login` untuk staf.
- [ ] Tiga tujuan redirect role benar.
- [ ] Dokter dan Kepala Pekerja masing-masing tepat dua tab.
- [ ] Role tidak dikenal diakhiri sesinya.

