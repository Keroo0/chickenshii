# Penjelasan Diagram Activity Dokter Hewan

## Tujuan

Diagram ini menjelaskan kegiatan Dokter Hewan pada dua tab saja, yaitu `Validasi` dan `Riwayat`, termasuk aturan satu validator, koreksi label, dan batas waktu pengeditan.

## Jenis Diagram

Gunakan **UML Activity Diagram** dengan swimlane `Dokter Hewan`, `Aplikasi Mobile`, `Backend API`, dan `Database`.

## Elemen

- Initial Node dan Final Node.
- Action: `Login bersama`, `Buka tab Validasi`, `Ambil antrean penyakit belum divalidasi`, `Buka detail modal`, `Pilih verdict`, `Isi label koreksi`, `Isi catatan opsional`, `Kirim request simpan`, `Insert validasi unik`, `Refresh antrean`, `Buka tab Riwayat`, dan `Edit validasi sendiri`.
- Decision: `Role veterinarian?`, `Verdict?`, `Respons insert?`, dan `Penanganan sudah dimulai?`.
- Verdict: `Sesuai`, `Tidak sesuai`, `Tidak dapat dipastikan`.

## Langkah Pembuatan di Visual Paradigm Online

1. Buat **Activity Diagram** dan empat swimlane vertikal.
2. Gambar `Mulai` → `Login bersama` → `Validasi token dan role`.
3. Dari decision `Role veterinarian?`, arahkan `[tidak]` ke penolakan akses dan logout; `[ya]` ke area Dokter.
4. Buat decision `Pilih tab?` dengan dua cabang: Validasi dan Riwayat.
5. Pada cabang Validasi, susun `Ambil antrean bersama` → `Buka detail modal` → `Pilih verdict`.
6. Pecah verdict: `Sesuai` langsung menuju merge, `Tidak sesuai` wajib melewati `Pilih label koreksi`, dan `Tidak dapat dipastikan` langsung menuju merge. Catatan bersifat opsional pada ketiganya. Dari merge, gambar satu kali `Kirim request simpan` → `Insert validasi unik`.
7. Setelah percobaan insert, buat decision `Respons insert?`; `[201 tersimpan]` menuju `Tampilkan sukses` → `Refresh antrean`, sedangkan `[409 sudah divalidasi]` menuju `Tampilkan konflik: penyimpanan pertama menang` → `Refresh antrean`. Jangan menggambar proses simpan kedua pada cabang sukses.
8. Pada cabang Riwayat, tampilkan hanya validasi dokter yang login. `Edit` diizinkan hanya jika decision `Penanganan sudah dimulai?` bernilai `[tidak]`.

## Konektor dan Relasi

- Gunakan Control Flow dan tulis guard pada setiap keluaran decision.
- Gunakan Merge Node untuk menyatukan tiga verdict sebelum satu request simpan.
- Hubungkan verdict `Tidak sesuai` ke `Pilih label koreksi` dengan guard `[wajib]`.
- Tambahkan Note bahwa koreksi `Healthy` menutup kasus otomatis dan `Tidak dapat dipastikan` mengunci penanganan.

## Saran Tata Letak

Letakkan dua cabang tab berdampingan. Buat tiga pilihan verdict berjajar horizontal di tengah, dengan jalur konflik dan edit terkunci pada sisi kanan.

## Penjelasan Diagram untuk Laporan

Dokter Hewan hanya menangani prediksi penyakit baru. Pada tab Validasi, dokter mengambil kasus dari antrean bersama dan memilih verdict Sesuai, Tidak sesuai, atau Tidak dapat dipastikan. Label koreksi wajib untuk verdict Tidak sesuai, sedangkan catatan opsional. Satu prediksi hanya dapat memiliki satu validator sehingga validasi pertama yang tersimpan menang. Tab Riwayat hanya menampilkan validasi milik dokter tersebut dan validasi masih dapat diedit selama penanganan belum dimulai.

## Checklist

- [ ] Area Dokter memiliki tepat dua tab.
- [ ] Tiga verdict tergambar.
- [ ] Label koreksi wajib hanya untuk Tidak sesuai.
- [ ] Satu percobaan insert bercabang ke respons 201 atau 409; aturan penyimpanan pertama terlihat.
- [ ] Riwayat milik sendiri serta penguncian edit tercantum.
