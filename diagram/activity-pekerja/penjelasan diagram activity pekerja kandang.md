# Penjelasan Diagram Activity Pekerja Kandang

## Tujuan

Diagram ini menggambarkan alur Pekerja Kandang mengambil atau memilih foto feses, menjalankan deteksi AI, melihat rekomendasi, dan menyimpan hasil tanpa login.

## Jenis Diagram

Gunakan **UML Activity Diagram** dengan swimlane `Pekerja Kandang`, `Aplikasi Mobile`, dan `Backend API`.

## Elemen

- Initial Node: `Mulai`.
- Action: `Buka aplikasi tanpa login`, `Pilih kamera atau galeri`, `Crop foto`, `Tekan Deteksi`, `Validasi gambar`, `Jalankan inferensi`, `Tampilkan hasil dan rekomendasi`, `Reset`, `Pilih nama pekerja`, dan `Simpan hasil`.
- Decision: `Crop diselesaikan?`, `Deteksi berhasil?`, dan `Simpan atau reset?`.
- Final Node: `Selesai`.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > UML > Activity Diagram** dan buat tiga swimlane vertikal.
2. Letakkan `Mulai` pada lane Pekerja Kandang, lalu `Buka aplikasi tanpa login` dan `Pilih kamera atau galeri`.
3. Tambahkan `Crop foto` dan decision `Crop diselesaikan?`; cabang `[tidak]` kembali ke pemilihan foto.
4. Cabang `[ya]` menuju `Tekan Deteksi`; pindahkan alur ke lane Backend untuk `Validasi gambar` dan `Jalankan inferensi`.
5. Tambahkan decision `Deteksi berhasil?`; cabang gagal menampilkan error dan menyediakan `Coba lagi`.
6. Cabang sukses menuju `Tampilkan hasil, confidence, dan rekomendasi` di lane Aplikasi.
7. Buat decision `Simpan atau reset?`. Reset kembali ke pemilihan foto; Simpan menuju `Pilih nama pekerja aktif` lalu `Simpan hasil`.
8. Tambahkan catatan pada proses simpan: prediksi penyakit baru membuat tindak lanjut otomatis, sedangkan `Healthy` tidak masuk workflow.

## Konektor dan Relasi

- Gunakan Control Flow untuk urutan dan guard `[ya]`, `[tidak]`, `[simpan]`, `[reset]`.
- Gunakan garis putus-putus menuju Note untuk aturan `tanpa login`, `Healthy tidak membuat follow-up`, dan `data lama tidak dibackfill`.
- Alur retry harus kembali ke aksi yang gagal, bukan langsung ke final node.

## Saran Tata Letak

Gunakan alur vertikal utama di tengah. Letakkan jalur batal/retry di sisi kiri dan pilihan simpan/reset di sisi kanan agar mudah dibaca.

## Penjelasan Diagram untuk Laporan

Pekerja Kandang tetap menjadi pengguna anonim. Ia memilih foto, menyelesaikan crop, dan mengirim gambar ke backend untuk diprediksi. Aplikasi menampilkan label, nilai keyakinan, dan rekomendasi seperti sebelumnya. Ketika hasil disimpan, hanya prediksi penyakit baru yang memulai workflow pemisahan dan validasi; hasil `Healthy` serta data historis tidak masuk antrean tersebut.

## Checklist

- [ ] Pekerja Kandang tidak melalui login.
- [ ] Kamera/galeri, crop, deteksi, hasil, simpan, dan reset tersedia.
- [ ] Alur gagal dan retry terlihat.
- [ ] Rekomendasi tetap ditampilkan.
- [ ] Aturan penyakit baru versus Healthy tercantum.

