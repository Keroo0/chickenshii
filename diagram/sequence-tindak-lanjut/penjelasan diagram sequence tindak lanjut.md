# Penjelasan Diagram Sequence Tindak Lanjut

## Tujuan

Diagram ini menjelaskan interaksi Kepala Pekerja untuk pemisahan, memulai penanganan, dan menyelesaikan penanganan dengan validasi aturan status pada backend dan database.

## Jenis Diagram

Gunakan **UML Sequence Diagram** dengan fragment `alt` untuk setiap kondisi transisi.

## Elemen

Lifeline: `Kepala Pekerja`, `Head Worker UI`, `Workflow Router`, `Role Authorization`, `Workflow Service`, `prediction_validations`, dan `prediction_followups`.

## Langkah Pembuatan di Visual Paradigm Online

1. Buat Sequence Diagram dan tujuh lifeline.
2. UI → Router: `GET /api/v1/head-worker/dashboard` serta `GET /api/v1/head-worker/follow-ups`; Router memverifikasi role `head_worker`.
3. Kepala Pekerja membuka modal kasus dan memilih `Sudah dipisahkan`.
4. UI → Router: `POST /api/v1/head-worker/follow-ups/{prediction_id}/isolate`; Service menyimpan isolated_at dan isolated_by. Aksi ini tidak meminta validasi dokter.
5. Saat `Mulai penanganan`, UI memanggil `POST /api/v1/head-worker/follow-ups/{prediction_id}/treatment/start`. Service membaca follow-up dan validation.
6. Buat fragment `alt`: `[belum dipisahkan] → 409`, `[belum divalidasi] → 409`, `[uncertain] → 409 + Perlu pemeriksaan lebih lanjut`, `[corrected Healthy] → kasus sudah auto_closed`, `[hasil pasti penyakit] → simpan treatment_started_*`.
7. Saat `Penanganan selesai`, panggil `POST /api/v1/head-worker/follow-ups/{prediction_id}/treatment/complete`; fragment `[belum dimulai] → 409`, `[aktif] → simpan treatment_completed_*`.
8. Service mengembalikan item/status terbaru dan UI me-refresh Dashboard serta Tindak Lanjut.

## Konektor dan Relasi

- Semua request membawa Bearer JWT dan diverifikasi pada setiap endpoint.
- Gunakan synchronous message serta dashed return message berisi status HTTP.
- Gunakan self-message Service `validate_transition()` sebelum update database.
- Tunjukkan aktor ID dicatat bersama setiap timestamp.

## Saran Tata Letak

Bagi diagram menjadi tiga blok horizontal berurutan: Isolasi, Mulai Penanganan, Selesai Penanganan. Tempatkan cabang penolakan di bawah pemanggilan yang terkait.

## Penjelasan Diagram untuk Laporan

Kepala Pekerja dapat mencatat pemisahan segera setelah prediksi penyakit tersimpan. Mulai penanganan baru diterima jika pemisahan sudah tercatat dan dokter memberi hasil pasti penyakit. Tidak dapat dipastikan mengunci aksi dan koreksi Healthy sudah menutup kasus otomatis. Penyelesaian hanya dapat dilakukan setelah penanganan dimulai, sehingga urutan status tetap konsisten.

## Checklist

- [ ] Dashboard dan daftar follow-up dimuat.
- [ ] Pemisahan tidak bergantung pada validasi.
- [ ] Semua syarat mulai penanganan digambar.
- [ ] Uncertain dan Healthy menghasilkan alur berbeda.
- [ ] Selesai ditolak bila penanganan belum dimulai.
