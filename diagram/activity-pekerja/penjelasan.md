# Activity Diagram — Pekerja Kandang

## Tujuan
Menggambarkan alur aktivitas Pekerja Kandang dari membuka aplikasi hingga menyimpan hasil deteksi. Disajikan secara **garis besar**.

## Alur Utama
1. Buka aplikasi → pilih foto dari kamera atau galeri
2. Crop foto (wajib diselesaikan)
3. Tekan tombol **Deteksi** → sistem memproses gambar
4. Lihat hasil prediksi
5. Pilih: **Reset** (ulangi dari awal) atau **Simpan** (pilih nama pekerja → konfirmasi)

## Catatan
- Jika crop dibatalkan, pengguna harus memilih ulang foto.
- Jika proses simpan gagal, banner "Coba Lagi" muncul tanpa mengulang proses deteksi.
