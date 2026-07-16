# Flowchart — Inference Pipeline (Proses Prediksi Backend)

## Tujuan
Menggambarkan langkah-langkah teknis yang dilakukan backend dari saat menerima gambar hingga menghasilkan JSON respons prediksi.

## Langkah Pipeline

| Langkah | Keterangan |
|---------|------------|
| **1. Terima Gambar** | File bytes diterima dari `POST /api/v1/predict` |
| **2. Validasi** | Cek MIME type (jpg/png) dan ukuran file (maks 5MB) |
| **3. Baca Bytes** | Buka gambar menggunakan Pillow |
| **4. Resize** | Ubah dimensi menjadi 224×224 piksel (syarat MobileNetV2) |
| **5. Konversi RGB** | Pastikan gambar 3 channel (RGB), bukan RGBA atau Grayscale |
| **6. Normalisasi** | Konversi nilai piksel dari [0–255] menjadi [0.0–1.0] |
| **7. Inferensi** | Model MobileNetV2 memproses array gambar |
| **8. Output Softmax** | Model menghasilkan probabilitas untuk 4 kelas penyakit |
| **9. Ambil Kelas Tertinggi** | Tentukan `class_name` dan `confidence` dari probabilitas tertinggi |
| **10. Lookup Knowledge Base** | Ambil `description`, `cause`, `immediate_action` dari kamus statis |
| **11. Return JSON** | Kembalikan respons lengkap ke Mobile App |

## Catatan Teknis
- Preprocessing dilakukan **di luar** arsitektur model (tidak ada Lambda layer di dalam `.keras`).
- Normalisasi menggunakan NumPy: `array / 255.0`.
- `confidence_threshold` (60.0) disertakan dalam respons agar Mobile dapat menentukan tampil tidaknya peringatan.
