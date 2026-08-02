# Penjelasan Diagram Sequence Validasi Dokter

## Tujuan

Diagram ini menjelaskan interaksi Dokter Hewan ketika mengambil antrean, menyimpan salah satu dari tiga verdict, menangani konflik validator, serta memperbarui validasinya sendiri.

## Jenis Diagram

Gunakan **UML Sequence Diagram** dengan fragment `alt`, `opt`, dan `critical`.

## Elemen

Lifeline dari kiri ke kanan: `Dokter Hewan`, `Doctor UI`, `Workflow Router`, `Role Authorization`, `Workflow Service`, `predictions`, `prediction_validations`, `Database Trigger`, dan `prediction_followups`.

## Langkah Pembuatan di Visual Paradigm Online

1. Buat Sequence Diagram dan sembilan lifeline sesuai urutan di atas.
2. Doctor UI → Workflow Router: `GET /api/v1/doctor/validations/pending (Bearer JWT)`; Router → Role Authorization: `requireRole(veterinarian)`; Authorization mengembalikan `user_id` atau `401/403`.
3. Router → Workflow Service: `listPending(filters)`. Service → prediction_followups: `SELECT follow-up`; Service → prediction_validations: `SELECT by prediction_id`; Service → predictions: `SELECT disease records`. Masing-masing tabel mengembalikan row, lalu Service → Router: `items`; Router → UI: `200 items`.
4. Dokter → UI: `buka modal dan pilih verdict`. Gunakan fragment `alt`: `[Sesuai/matching]`, `[Tidak sesuai/incorrect]`, `[Tidak dapat dipastikan/uncertain]`.
5. Pada cabang incorrect, gambar Dokter → UI: `pilih corrected_prediction berbeda dari label AI (wajib)`; pada semua cabang, gambar fragment `opt [mengisi catatan]`.
6. UI → Router: `POST /api/v1/doctor/validations (payload + Bearer JWT)`; Router → Authorization: `requireRole(veterinarian)`; Router → Service: `createValidation(user_id, payload)`.
7. Service → predictions: `SELECT prediction`; Service → prediction_followups: `SELECT follow-up`; lalu gunakan fragment `critical` saat Service → prediction_validations: `INSERT prediction_id UNIQUE, veterinarian_id, verdict, correction, note`.
8. prediction_validations → Database Trigger: `AFTER INSERT syncFollowup()`. Dalam `alt [incorrect + Healthy]`, Trigger → prediction_followups: `UPDATE closed_at/reason/by`; operand lain tidak menutup follow-up. Verdict uncertain tetap tersimpan dan dibaca sebagai status `Perlu pemeriksaan lebih lanjut`.
9. Fragment hasil create: `[validator pertama]` prediction_validations → Service: row, kemudian Router → UI: `201`; `[prediction_id sudah ada]` Router → UI: `409`, lalu UI memanggil ulang GET antrean; `[koreksi hilang/tidak sah]` Router → UI: `422`.
10. Untuk edit, gambar UI → Router: `PATCH /api/v1/doctor/validations/{validation_id} (payload + JWT)` → Authorization: `requireRole(veterinarian)` → Service: `updateValidation(user_id, validation_id, payload)`.
11. Service → prediction_validations: `SELECT id AND veterinarian_id`. Fragment `alt [tidak ditemukan/bukan miliknya]` mengembalikan `404`; `[miliknya]` dilanjutkan Service → prediction_validations: `PATCH verdict/correction/note`.
12. prediction_validations → Database Trigger: `BEFORE UPDATE cek treatment_started_at` dengan pembacaan prediction_followups. `[sudah dimulai]` menghasilkan `409`; `[belum]` update diteruskan, lalu `AFTER UPDATE syncFollowup()` memperbarui/tidak memperbarui penutupan otomatis.
13. Akhiri dengan fragment hasil PATCH: sukses `200 updated validation`, bentuk koreksi tidak valid `422`, validasi terkunci `409`, atau kepemilikan/tidak ditemukan `404`.

## Konektor dan Relasi

- Semua endpoint membawa Bearer JWT.
- Gunakan activation bar pada Router dan Service.
- Return message mencantumkan GET/PATCH sukses `200`, create sukses `201`, konflik `409`, request tidak sah `422`, tidak ditemukan/kepemilikan `404`, dan auth `401/403`.
- Gunakan Note `penyimpanan pertama menang` di sekitar critical fragment.

## Saran Tata Letak

Tempatkan pembacaan antrean di atas, penciptaan validasi di tengah, sinkronisasi follow-up di bawah, dan edit sebagai blok terakhir. Sejajarkan tiga operand verdict.

## Penjelasan Diagram untuk Laporan

Dokter Hewan mengambil antrean penyakit yang belum divalidasi. Verdict Tidak sesuai wajib membawa label koreksi, sedangkan catatan selalu opsional. Constraint unik memastikan hanya dokter pertama yang berhasil menyimpan validasi. Koreksi Healthy menutup kasus, verdict tidak pasti menandainya perlu pemeriksaan, dan perubahan validasi hanya diizinkan bagi pembuatnya sebelum penanganan dimulai.

## Checklist

- [ ] Endpoint antrean, create, dan update tergambar.
- [ ] Tiga verdict serta koreksi wajib terlihat.
- [ ] Critical fragment menunjukkan penyimpanan pertama menang.
- [ ] Healthy dan uncertain menyinkronkan follow-up.
- [ ] Edit dibatasi kepemilikan dan waktu mulai penanganan.
