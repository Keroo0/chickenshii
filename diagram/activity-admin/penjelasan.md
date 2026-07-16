# Activity Diagram — Admin

## Tujuan
Menggambarkan alur aktivitas Admin (pemilik farm) dari proses login hingga pengelolaan data. Disajikan secara **garis besar**.

## Alur Utama
1. Buka halaman login → masukkan email & password
2. Jika berhasil → masuk Dashboard
3. Dari Dashboard, Admin dapat memilih berbagai aksi manajemen

## Aksi yang Tersedia
| Aksi | Keterangan |
|------|------------|
| Lihat Statistik | Filter mingguan/bulanan/tahunan via `GET /api/v1/stats` |
| Filter Riwayat | Cari riwayat berdasarkan nama pekerja, kelas, atau tanggal |
| Hapus Riwayat | Soft delete — entri ditandai, tidak dihapus permanen |
| Kelola Pekerja | Tambah pekerja baru atau nonaktifkan pekerja |
| Export CSV | Unduh data riwayat ke file CSV |

## Catatan
- Sesi Admin divalidasi setiap kali screen admin dibuka.
- Jika token kedaluwarsa, sistem redirect otomatis ke halaman login.
