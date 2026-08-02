# Product

## Register

ChickenShii adalah aplikasi mobile pendukung keputusan untuk peternakan ayam petelur. Pengguna mengambil foto feses, menerima dugaan awal AI, dan—untuk kasus penyakit baru—menjalankan validasi dokter serta tindak lanjut operasional.

## Users and routes

| Pengguna | Akses | Route utama | Navigasi |
|---|---|---|---|
| Pekerja Kandang | Anonim | `/` | Deteksi dan hasil |
| Admin | Login | `/admin` | Dashboard, Riwayat, Pengguna |
| Dokter Hewan | Login | `/doctor` | Tepat dua tab: Validasi, Riwayat |
| Kepala Pekerja | Login | `/head-worker` | Tepat dua tab: Dashboard, Tindak Lanjut |

Semua staf menggunakan `/login`. Role berasal dari `app_metadata`; role tidak dikenal harus logout dan ditolak. `/admin/login` hanya merupakan redirect kompatibilitas, bukan formulir login kedua. Tidak ada halaman profil.

## Product purpose

Tujuan utama adalah mempercepat deteksi dan respons awal tanpa menyatakan AI sebagai diagnosis. Pekerja mendapat alur satu foto–satu hasil–simpan. Dokter memberi keputusan profesional. Kepala pekerja memastikan ayam segera dipisahkan dan penanganan berlangsung dalam urutan yang aman. Admin mengelola data prediksi dan pengguna, tetapi tidak melihat atau mengekspor data workflow.

## Workflow experience

- Hanya prediksi penyakit baru masuk workflow; `Healthy` dan data lama tidak ditampilkan.
- Kepala pekerja dapat menandai `Sudah dipisahkan` segera setelah deteksi.
- Dokter memilih `Sesuai`, `Tidak sesuai`, atau `Tidak dapat dipastikan`; label koreksi wajib saat tidak sesuai.
- Penanganan hanya aktif setelah kasus dipisahkan dan validasi memastikan penyakit.
- Koreksi ke `Healthy` menutup kasus; ketidakpastian menampilkan `Perlu pemeriksaan lebih lanjut` dan memblokir penanganan.
- Rekomendasi tetap terlihat dan mengikuti label koreksi dokter.
- Detail, validasi, dan konfirmasi tindakan menggunakan modal agar role baru tetap dua tab.

## Brand personality

Hangat, ramah, optimistis, dan dapat dipercaya. Antarmuka harus jelas dipakai di kandang, namun penanganan medis harus disampaikan hati-hati dan tidak memberi kesan AI menggantikan dokter.

## Anti-references

- Bukan aplikasi diagnosis final.
- Bukan sistem generatif/LLM untuk rekomendasi medis.
- Bukan sistem identifikasi individu ayam atau kandang.
- Bukan platform notifikasi push atau manajemen akun lengkap.
- Bukan dashboard padat informasi untuk pekerja lapangan.

## Design principles

1. **Instant Clarity** — satu tugas utama per layar/modal dan status workflow terbaca seketika.
2. **Trust Through Roles** — tampilkan tindakan hanya kepada role yang berwenang dan jelaskan mengapa aksi terkunci.
3. **Preventive First** — pemisahan ayam tidak boleh tertunda oleh proses validasi.
4. **Mobile-First Utility** — target sentuh minimal 44 px, teks terbaca di luar ruang, dan state loading/error/empty/retry jelas.
5. **Medical Restraint** — disclaimer selalu tersedia; label AI dibedakan dari hasil dokter.

## Fixed scope

Tidak ada halaman profil, notifikasi push, identitas ayam/kandang, fitur Admin untuk mereset atau mengaktifkan/nonaktifkan akun staf, kewajiban mengganti password sementara, maupun alur reset password mandiri pada halaman login. Admin hanya membuat akun staf memakai nama, email, role, dan password sementara.
