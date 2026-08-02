# Penjelasan Diagram Flowchart Sistem

## Tujuan

Flowchart ini merangkum alur end-to-end ChickenShii dari deteksi Pekerja Kandang hingga keputusan Dokter Hewan dan tindak lanjut Kepala Pekerja, serta batas administrasi Admin.

## Jenis Diagram

Gunakan **Flowchart** lintas fungsi (*cross-functional flowchart*) di Visual Paradigm Online dengan lane `Pekerja Kandang`, `Sistem`, `Admin`, `Dokter Hewan`, dan `Kepala Pekerja`.

## Elemen

- Terminator: Mulai, Selesai, Kasus Ditutup Otomatis.
- Process: Deteksi AI, Simpan Prediksi, Buat Follow-up, Login Bersama, Validasi, Pisahkan Ayam, Mulai Penanganan, Penanganan Selesai, Kelola Pengguna.
- Decision: `Hasil Healthy?`, `Verdict dokter?`, `Koreksi Healthy?`, dan `Sudah dipisahkan DAN validasi pasti penyakit?`.
- Data: `predictions`, `staff_profiles`, `prediction_validations`, dan `prediction_followups`.
- On-page Connector berbentuk lingkaran: `A — Cek kesiapan` dan `B — Kembali menunggu`.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > Flowchart > Cross-Functional Flowchart** dan buat lima lane.
2. Pada lane Pekerja Kandang, susun `Mulai` → `Pilih foto` → `Deteksi AI` → `Lihat hasil/rekomendasi` → `Simpan Prediksi`.
3. Hubungkan `Simpan Prediksi` ke data `predictions`. Pada lane Sistem, buat decision `Hasil Healthy?`; `[ya]` menuju `Simpan sebagai riwayat saja` → `Selesai`, `[tidak]` menuju `Buat Follow-up` lalu data `prediction_followups`.
4. Dari `Buat Follow-up`, gambar **dua flowline biasa**: satu ke lane Dokter Hewan dan satu ke lane Kepala Pekerja. Beri Note `Kedua jalur independen; urutannya tidak ditentukan`. Jangan memakai Parallel Gateway BPMN atau Fork Node UML.
5. Pada jalur Dokter, gambar `Login Bersama` → sistem membaca `app_metadata.role = veterinarian` dari sesi Supabase Auth → `/doctor` → `Ambil antrean` → decision `Verdict dokter?`: Sesuai, Tidak sesuai, atau Tidak dapat dipastikan. Hubungkan hasilnya ke data `prediction_validations`. `staff_profiles` hanya menyediakan identitas tampilan, bukan sumber keputusan otorisasi.
6. `Tidak dapat dipastikan` menuju `Perlu pemeriksaan lebih lanjut` dan mengunci penanganan. `Tidak sesuai` menuju decision `Koreksi Healthy?`; `[ya]` menuju `Kasus Ditutup Otomatis`, `[tidak]` menuju connector lingkaran `A — Cek kesiapan`. `Sesuai` juga menuju connector A.
7. Pada jalur Kepala Pekerja, gambar `Login Bersama` → sistem membaca `app_metadata.role = head_worker` dari sesi Supabase Auth → `/head-worker` → `Pisahkan Ayam` → `Perbarui isolated_at/by` pada data `prediction_followups` → connector `A — Cek kesiapan`.
8. Dari connector A, buat decision `Sudah dipisahkan DAN validasi pasti penyakit?`. `[tidak]` menuju `Tunggu perubahan status` → connector `B — Kembali menunggu` → kembali ke decision yang sama. `[ya]` menuju `Siap ditangani` → `Mulai Penanganan` → `Penanganan Aktif` → `Penanganan Selesai` → perbarui data `prediction_followups` → `Selesai`.
9. Buat cabang terpisah pada lane Admin: `Login Bersama` → sistem membaca `app_metadata.role = admin` dari sesi Supabase Auth → `/admin` → Dashboard/Riwayat/Pengguna → `Kelola pekerja atau akun staf`; jangan hubungkan ke prediction_validations atau prediction_followups.
10. Tambahkan note pada login bahwa role mengarahkan staf ke `/admin`, `/doctor`, atau `/head-worker` dan role tidak dikenal mengakhiri sesi.

## Konektor dan Relasi

- Gunakan panah penuh dengan label `[ya]/[tidak]` dan nama verdict.
- Gunakan dua Flowline biasa dan Note independensi setelah follow-up; panduan ini tetap memakai notasi Flowchart, bukan BPMN atau UML Activity.
- Gabungkan hanya alur hasil pasti penyakit; jangan gabungkan uncertain atau Healthy ke penanganan.
- Gunakan connector A/B untuk menghindari garis panjang dan menunjukkan titik pemeriksaan ulang yang tepat.

## Saran Tata Letak

Susun lane horizontal dan alur dari kiri ke kanan. Tempatkan workflow penyakit sebagai jalur utama, Healthy di atas sebagai jalur pendek, dan Admin di lane terpisah agar ruang lingkupnya jelas.

## Penjelasan Diagram untuk Laporan

Pekerja Kandang mendeteksi dan menyimpan hasil tanpa login. Healthy berhenti sebagai riwayat, sedangkan penyakit baru membuat follow-up. Pemisahan dapat segera dilakukan sambil menunggu Dokter Hewan. Penanganan hanya terbuka ketika ayam sudah dipisahkan dan validasi menyatakan penyakit secara pasti. Tidak dapat dipastikan memerlukan pemeriksaan lanjutan, dan koreksi Healthy menutup kasus otomatis. Admin hanya mengelola administrasi serta akun staf dan tidak masuk ke workflow klinis.

## Checklist

- [ ] Empat peran: Pekerja Kandang, Admin, Dokter Hewan, Kepala Pekerja tergambar.
- [ ] Cabang Healthy tidak membuat workflow.
- [ ] Pemisahan dan validasi dapat berjalan paralel.
- [ ] Tidak dapat dipastikan mengunci penanganan.
- [ ] Penanganan hanya mengikuti hasil pasti penyakit dan pemisahan.
