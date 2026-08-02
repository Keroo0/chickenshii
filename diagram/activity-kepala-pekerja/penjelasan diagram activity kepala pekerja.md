# Penjelasan Diagram Activity Kepala Pekerja

## Tujuan

Diagram ini menggambarkan aktivitas Kepala Pekerja pada dua tab, `Dashboard` dan `Tindak Lanjut`, dari pemisahan ayam sampai penyelesaian penanganan.

## Jenis Diagram

Gunakan **UML Activity Diagram** dengan swimlane `Kepala Pekerja`, `Aplikasi Mobile`, `Backend API`, dan `Database`.

## Elemen

- Action: `Login bersama`, `Lihat ringkasan kasus hari ini`, `Buka tab Tindak Lanjut`, `Buka detail modal`, `Tandai Sudah dipisahkan`, `Mulai penanganan`, dan `Penanganan selesai`.
- Decision: `Role head_worker?`, `Ayam sudah dipisahkan?`, `Validasi dokter sudah pasti penyakit?`, `Hasil tidak dapat dipastikan?`, dan `Dikoreksi Healthy?`.
- Status: `Menunggu pemisahan`, `Menunggu validasi`, `Perlu pemeriksaan lebih lanjut`, `Siap ditangani`, `Penanganan aktif`, `Selesai`, dan `Ditutup otomatis`.

## Langkah Pembuatan di Visual Paradigm Online

1. Buat **Activity Diagram** dan empat swimlane.
2. Susun `Mulai` → `Login bersama` → `Validasi token dan role` → decision `Role head_worker?`.
3. Cabang valid menuju decision `Pilih tab?`. Dashboard menampilkan empat ringkasan: kasus hari ini, belum dipisahkan, menunggu validasi, dan penanganan aktif.
4. Cabang Tindak Lanjut menuju daftar kasus dan `Buka detail modal`.
5. Bila belum dipisahkan, izinkan `Tandai Sudah dipisahkan` segera tanpa menunggu dokter.
6. Sebelum `Mulai penanganan`, buat dua decision berurutan: `Sudah dipisahkan?` dan `Validasi dokter sudah pasti penyakit?`.
7. Jika verdict tidak pasti, arahkan ke `Perlu pemeriksaan lebih lanjut`. Jika koreksi Healthy, arahkan ke `Ditutup otomatis`.
8. Jika kedua syarat terpenuhi, arahkan ke `Mulai penanganan` → `Penanganan aktif` → `Penanganan selesai` → `Selesai`.

## Konektor dan Relasi

- Gunakan Control Flow dengan guard yang eksplisit.
- `Sudah dipisahkan` dapat terjadi sebelum atau sesudah validasi, tetapi harus mendahului `Mulai penanganan`.
- Gunakan Note pada status tidak pasti: `Penanganan dikunci`.
- Gunakan garis langsung dari koreksi Healthy ke `Ditutup otomatis`, tanpa aksi manual Kepala Pekerja.

## Saran Tata Letak

Tempatkan Dashboard sebagai cabang pendek di kiri dan workflow Tindak Lanjut sebagai alur utama di tengah. Tampilkan jalur `Tidak pasti` dan `Healthy` sebagai jalur akhir terpisah agar tidak disalahartikan sebagai penanganan.

## Penjelasan Diagram untuk Laporan

Kepala Pekerja dapat segera mengonfirmasi pemisahan ketika AI mendeteksi penyakit. Namun, penanganan baru dapat dimulai setelah pemisahan tercatat dan Dokter Hewan memberikan hasil pasti berupa Sesuai atau koreksi ke kelas penyakit. Verdict Tidak dapat dipastikan menampilkan status Perlu pemeriksaan lebih lanjut, sedangkan koreksi ke Healthy menutup kasus otomatis. Setelah penanganan dimulai, Kepala Pekerja menandai penyelesaiannya melalui modal detail.

## Checklist

- [ ] Area Kepala Pekerja memiliki tepat dua tab.
- [ ] Empat angka ringkasan Dashboard dicantumkan.
- [ ] Pemisahan dapat dilakukan sebelum validasi.
- [ ] Dua prasyarat mulai penanganan terlihat.
- [ ] Jalur tidak pasti, Healthy, dan selesai dibedakan.

