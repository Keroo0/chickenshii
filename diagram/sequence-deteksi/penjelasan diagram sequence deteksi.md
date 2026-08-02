# Penjelasan Diagram Sequence Deteksi

## Tujuan

Diagram ini menggambarkan interaksi saat Pekerja Kandang meminta prediksi AI. Proses deteksi tidak langsung menyimpan data atau memulai workflow.

## Jenis Diagram

Gunakan **UML Sequence Diagram** dengan fragment `alt` untuk validasi gagal dan inferensi berhasil/gagal.

## Elemen

Lifeline: `Pekerja Kandang`, `Mobile App`, `Detection Router`, `MLService`, `Model MobileNetV2`, dan `Knowledge Base`.

## Langkah Pembuatan di Visual Paradigm Online

1. Buat Sequence Diagram dan enam lifeline dari kiri ke kanan.
2. Pekerja → Mobile: `pilih/crop foto` lalu `tekan Deteksi`.
3. Mobile → Detection Router: `POST /api/v1/predict (image)`.
4. Router melakukan self-message `validasi MIME dan ukuran maksimal`.
5. Pada fragment `alt [invalid]`, kembalikan error dan tampilkan retry.
6. Pada cabang valid, Router → MLService: `predict(bytes)`; MLService melakukan resize 224×224, RGB, dan normalisasi.
7. MLService → Model: `inferensi`; Model mengembalikan probabilitas empat kelas.
8. MLService menentukan label/confidence, lalu Router → Knowledge Base meminta deskripsi, penyebab, dan rekomendasi.
9. Router → Mobile: JSON hasil; Mobile → Pekerja: tampilkan label, confidence, probabilitas, dan rekomendasi.

## Konektor dan Relasi

- Request memakai synchronous message; response memakai dashed return message.
- Gunakan activation bar pada Router, MLService, dan Model.
- Tambahkan Note: `Tidak ada INSERT database pada endpoint deteksi`.

## Saran Tata Letak

Urutkan aktor dan lapisan teknis dari kiri ke kanan. Tempatkan preprocessing sebagai self-message bertingkat agar tidak memperlebar diagram.

## Penjelasan Diagram untuk Laporan

Foto yang telah di-crop dikirim ke backend untuk divalidasi dan diproses oleh MobileNetV2. Backend melengkapi hasil probabilitas dengan knowledge base, lalu mengembalikannya ke aplikasi. Tahap ini hanya menampilkan hasil dan rekomendasi; workflow baru dibuat jika pengguna kemudian menyimpan prediksi penyakit.

## Checklist

- [ ] Validasi gambar dan preprocessing tercantum.
- [ ] Model menghasilkan probabilitas empat kelas.
- [ ] Knowledge base dan rekomendasi tetap ada.
- [ ] Jalur error/retry digambar.
- [ ] Tidak ada penyimpanan database pada alur ini.

