# Sequence Diagram — Simpan Hasil Prediksi

## Tujuan
Menggambarkan interaksi antar komponen saat Pekerja Kandang menekan tombol **Simpan** setelah deteksi berhasil. Disajikan secara **garis besar**.

## Komponen yang Terlibat
| Komponen | Peran |
|----------|-------|
| **Mobile App** | Mengirim gambar + data prediksi + worker_id |
| **Backend FastAPI** | Memvalidasi, mengupload, dan menyimpan ke DB |
| **Supabase** | Menyimpan gambar (Storage) dan riwayat (PostgreSQL) |

## Alur
1. Mobile mengirim gambar + data prediksi + `worker_id` via `POST /api/v1/predictions`
2. Backend memvalidasi `worker_id` (harus ada & `is_active = true`)
3. Backend mengupload gambar ke Supabase Storage bucket `feses-images`
4. Backend melakukan INSERT ke tabel `predictions`
5. Backend mengembalikan response `201 Created`
6. Mobile menampilkan notifikasi sukses

## Error Cases
| Kondisi | Response |
|---------|----------|
| `worker_id` tidak valid / nonaktif | `400 Bad Request` |
| Gambar gagal diupload | `500 Internal Server Error` |
| Gagal insert ke DB | `500 Internal Server Error` |
| Network timeout | Tampilkan `RetrySaveBanner` di Mobile |
