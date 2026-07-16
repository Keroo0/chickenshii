# Sequence Diagram — Proses Deteksi Penyakit

## Tujuan
Menggambarkan interaksi antar komponen saat Pekerja Kandang melakukan proses deteksi penyakit. Disajikan secara **garis besar**.

## Komponen yang Terlibat
| Komponen | Peran |
|----------|-------|
| **Mobile App** | Mengirim gambar dan menampilkan hasil |
| **Backend FastAPI** | Menerima gambar, validasi, preprocessing |
| **Model AI** | Melakukan inferensi MobileNetV2 |

## Alur
1. Mobile mengirim gambar hasil crop via `POST /api/v1/predict`
2. Backend memvalidasi tipe & ukuran file
3. Backend meneruskan gambar ke Model AI untuk inferensi
4. Model mengembalikan probabilitas 4 kelas penyakit
5. Backend melengkapi data dari Knowledge Base statis
6. Backend mengembalikan JSON hasil ke Mobile
7. Mobile menampilkan hasil prediksi ke pengguna

## Catatan
- Endpoint ini **tidak menyimpan** data apapun ke database.
- `confidence_threshold` (default 60.0) disertakan dalam respons agar Mobile dapat menentukan perlu tidaknya menampilkan peringatan confidence rendah.
