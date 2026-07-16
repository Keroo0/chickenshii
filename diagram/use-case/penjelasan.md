# Use Case Diagram — ChickenShii

## Tujuan
Menggambarkan semua aksi yang dapat dilakukan oleh dua aktor utama sistem terhadap fitur-fitur aplikasi ChickenShii.

## Aktor
| Aktor | Keterangan |
|-------|------------|
| **Pekerja Kandang** | Staf kandang PT Nirwana Farm. Tidak memerlukan login. Fokus pada deteksi harian. |
| **Admin** | Pemilik farm. Memerlukan login via Supabase Auth. Mengakses semua fitur termasuk manajemen data. |

## Use Case

| No | Use Case | Aktor |
|----|----------|-------|
| UC1 | Upload Foto Feses | Pekerja, Admin |
| UC2 | Deteksi Penyakit AI | Pekerja, Admin |
| UC3 | Lihat Hasil Prediksi | Pekerja, Admin |
| UC4 | Simpan Riwayat | Pekerja, Admin |
| UC5 | Login | Admin |
| UC6 | Lihat Dashboard Statistik | Admin |
| UC7 | Filter & Cari Riwayat | Admin |
| UC8 | Hapus Riwayat (Soft Delete) | Admin |
| UC9 | Kelola Daftar Pekerja | Admin |
| UC10 | Export CSV | Admin |

## Catatan
- Pekerja Kandang mengakses UC1–UC4 **tanpa autentikasi**.
- Admin memiliki semua akses Pekerja ditambah fitur manajemen (UC5–UC10).
- UC4 (Simpan Riwayat) memerlukan pemilihan nama dari dropdown pekerja aktif — bukan input teks bebas.
