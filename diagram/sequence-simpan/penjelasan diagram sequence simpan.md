# Penjelasan Diagram Sequence Simpan Prediksi

## Tujuan

Diagram ini menjelaskan proses penyimpanan hasil prediksi dan trigger yang hanya membuat tindak lanjut untuk prediksi penyakit baru.

## Jenis Diagram

Gunakan **UML Sequence Diagram** dengan fragment `alt` untuk hasil Healthy dan penyakit serta fragment `break` untuk kegagalan.

## Elemen

Lifeline: `Pekerja Kandang`, `Mobile App`, `Backend API`, `Supabase Storage`, `predictions`, `Trigger Database`, dan `prediction_followups`.

## Langkah Pembuatan di Visual Paradigm Online

1. Buat Sequence Diagram dan letakkan tujuh lifeline sesuai urutan Elemen.
2. Pekerja memilih nama pekerja aktif dan menekan Simpan.
3. Mobile → Backend: `POST /api/v1/predictions` berisi gambar, hasil prediksi, dan worker_id.
4. Tepat setelah request tiba, buat fragment `break [label di luar empat kelas model]`: validasi parameter FastAPI mengembalikan `422` sebelum fungsi endpoint, pencarian pekerja, atau upload dijalankan.
5. Untuk label valid, Backend melakukan `validate_worker_id`; tambahkan `break [tidak valid/nonaktif]` yang mengembalikan 400.
6. Backend → Storage: `upload image`; Storage mengembalikan image_url.
7. Backend → predictions: `INSERT prediction`. Setelah insert valid, Trigger membaca label pada record baru. Buat fragment `alt [Coccidiosis | New Castle Disease | Salmonellosis]` untuk `INSERT prediction_followups`; cabang `[Healthy]` tidak melakukan insert follow-up.
8. Database → Backend: record tersimpan; Backend → Mobile: `201 Created`; Mobile menampilkan sukses.
9. Tambahkan Note: trigger berlaku sejak fitur dirilis dan tidak melakukan backfill data lama.

## Konektor dan Relasi

- Gunakan message sinkron untuk validasi/upload/insert dan dashed return message untuk hasil.
- Gunakan found message atau pemanggilan otomatis dari predictions ke Trigger setelah INSERT.
- Tambahkan fragment error untuk upload/database gagal; Mobile menampilkan `Coba Lagi` tanpa mengulang deteksi.

## Saran Tata Letak

Letakkan komponen penyimpanan di kanan Backend. Tempatkan fragment penyakit/Healthy dekat Trigger agar perbedaannya tidak disangka sebagai pilihan pengguna.

## Penjelasan Diagram untuk Laporan

Setelah memilih pekerja aktif, aplikasi mengirim foto dan hasil deteksi ke backend. FastAPI lebih dahulu menolak label di luar empat kelas model sebelum handler berjalan. Untuk request valid, backend memvalidasi pekerja, mengunggah gambar, dan menyimpan prediksi. Trigger database otomatis membuat prediction_followups hanya bila record baru berlabel salah satu dari tiga penyakit. Healthy dan seluruh data yang telah ada sebelum migrasi tidak masuk workflow validasi maupun tindak lanjut.

## Checklist

- [ ] Validasi label `422` berada sebelum validasi worker_id, upload, dan insert.
- [ ] Trigger berjalan setelah INSERT predictions.
- [ ] Cabang penyakit membuat follow-up.
- [ ] Cabang Healthy tidak membuat follow-up.
- [ ] Tidak ada backfill data lama dan retry error dijelaskan.
