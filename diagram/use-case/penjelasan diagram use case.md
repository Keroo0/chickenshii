# Penjelasan Diagram Use Case ChickenShii

## Tujuan

Diagram ini memetakan fungsi ChickenShii terhadap empat aktor: Pekerja Kandang, Admin, Dokter Hewan, dan Kepala Pekerja.

## Jenis Diagram

Gunakan **UML Use Case Diagram**. Buat satu *system boundary* bernama `ChickenShii` dan letakkan seluruh use case di dalamnya.

## Elemen

| Aktor | Use case utama |
|---|---|
| Pekerja Kandang | Ambil/Pilih Foto, Deteksi Penyakit, Lihat Rekomendasi, Simpan Hasil |
| Admin | Login, Lihat Dashboard, Kelola Riwayat, Export CSV, Kelola Pekerja, Membuat akun staf |
| Dokter Hewan | Login, Lihat Antrean Validasi, Memvalidasi Hasil, Beri Label Koreksi, Lihat Riwayat Sendiri, Edit Validasi |
| Kepala Pekerja | Login, Lihat Dashboard Tindak Lanjut, Tandai Sudah dipisahkan, Mulai penanganan, Penanganan selesai |

Tambahkan use case pendukung `Validasi Role`, `Tutup Kasus Otomatis`, `Tampilkan Perlu Pemeriksaan Lebih Lanjut`, `Verifikasi Status Pemisahan`, dan `Verifikasi Validasi Penyakit`.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > UML > Use Case Diagram**.
2. Buat boundary `ChickenShii`; letakkan Pekerja Kandang di kiri dan tiga aktor terautentikasi di kanan.
3. Tambahkan use case sesuai tabel, dikelompokkan menjadi Deteksi, Administrasi, Validasi Medis, dan Tindak Lanjut.
4. Hubungkan Pekerja Kandang hanya ke alur deteksi tanpa Login.
5. Hubungkan Admin, Dokter Hewan, dan Kepala Pekerja ke use case `Login`; tambahkan `<<include>>` dari Login ke `Validasi Role`.
6. Gambar panah `<<extend>> [Tidak sesuai]` **dari** `Beri Label Koreksi` **menuju** use case dasar `Memvalidasi Hasil`.
7. Gambar panah `<<extend>> [koreksi Healthy]` dari `Tutup Kasus Otomatis` menuju `Memvalidasi Hasil`, serta panah `<<extend>> [Tidak dapat dipastikan]` dari `Tampilkan Perlu Pemeriksaan Lebih Lanjut` menuju `Memvalidasi Hasil`.
8. Gambar dua panah `<<include>>` dari `Mulai penanganan` menuju perilaku wajib `Verifikasi Status Pemisahan` dan `Verifikasi Validasi Penyakit`. Keduanya merupakan pemeriksaan oleh sistem, bukan status pasif.

## Konektor dan Relasi

- Pakai **Association** antara aktor dan use case yang boleh dijalankan.
- Pakai `<<include>>` untuk pemeriksaan wajib; arah panah dari use case utama menuju use case yang disertakan.
- Pakai `<<extend>>` untuk kondisi bersyarat; arah panah dari use case ekstensi menuju use case dasar `Memvalidasi Hasil`.
- Jangan menghubungkan Admin ke validasi/tindak lanjut, Dokter ke aksi Kepala Pekerja, atau Kepala Pekerja ke pengubahan validasi.

## Saran Tata Letak

Susun empat kelompok use case secara vertikal di dalam boundary. Tempatkan Login dan Validasi Role di bagian atas sebagai fungsi bersama. Hindari garis silang dengan menempatkan aktor dekat kelompok fungsinya.

## Penjelasan Diagram untuk Laporan

Use Case Diagram memperlihatkan pemisahan kewenangan empat peran. Pekerja Kandang menggunakan deteksi tanpa login. Admin mengelola data prediksi, pekerja, dan akun staf. Dokter Hewan memvalidasi prediksi penyakit melalui tiga verdict serta riwayat miliknya sendiri. Kepala Pekerja melakukan pemisahan dan penanganan sesuai validasi. Admin tidak melihat data workflow, dan hanya prediksi penyakit baru yang masuk ke proses validasi serta tindak lanjut.

## Checklist

- [ ] Empat aktor tergambar dengan batas akses yang berbeda.
- [ ] Pekerja Kandang tidak terkait dengan Login.
- [ ] Membuat akun staf menjadi kewenangan Admin.
- [ ] Memvalidasi dan koreksi menjadi kewenangan Dokter Hewan.
- [ ] Sudah dipisahkan, Mulai penanganan, dan Penanganan selesai menjadi kewenangan Kepala Pekerja.
