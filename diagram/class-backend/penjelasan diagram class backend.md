# Penjelasan Diagram Class Backend

## Tujuan

Diagram ini menjelaskan kelas/router/schema utama backend FastAPI yang melayani Pekerja Kandang, Admin, Dokter Hewan, dan Kepala Pekerja.

## Jenis Diagram

Gunakan **UML Class Diagram**. Representasikan modul router sebagai kelas berstereotip `<<router>>`, layanan sebagai `<<service>>`, dan model Pydantic sebagai `<<schema>>`.

## Elemen

- `Routes <<router>>`: `predict()`, `save_prediction()`, endpoint statistik/pekerja/Admin, `_require_role()`.
- `WorkflowRoutes <<router>>`: antrean/riwayat Dokter Hewan, validasi, Dashboard Kepala Pekerja, daftar follow-up, isolate, start, complete.
- `MLService <<service>>`: `load_model()`, `predict()`.
- `SupabaseService <<service>>`: pekerja, prediksi, storage, statistik, autentikasi, dan pembuatan akun staf.
- `WorkflowService <<service>>`: query antrean, validasi create/update, dashboard, dan transisi follow-up.
- Schema: `PredictionResponse`, `StaffAccountCreateRequest`, `ValidationCreateRequest`, `ValidationUpdateRequest`, `WorkflowItemResponse`, `DashboardResponse`.
- Enum/Literal: role `admin|veterinarian|head_worker`, verdict `matching|incorrect|uncertain`, serta status workflow `pending_isolation|pending_validation|requires_examination|ready_for_treatment|active_treatment|treatment_completed|auto_closed`.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > UML > Class Diagram**.
2. Buat package `API`, `Services`, dan `Schemas`.
3. Tambahkan setiap kelas dengan tiga kompartemen: nama, atribut penting, dan operasi.
4. Pada `Routes`, tampilkan alur publik Pekerja Kandang dan endpoint Admin. Pada `WorkflowRoutes`, kelompokkan operasi Dokter Hewan dan Kepala Pekerja.
5. Tambahkan `_require_role(authorization, expected_role)` sebagai operasi otorisasi yang digunakan router staf.
6. Hubungkan Routes ke MLService/SupabaseService dan WorkflowRoutes ke WorkflowService.
7. Hubungkan router ke schema respons/request yang digunakan.
8. Tambahkan note: Admin membuat akun staf; Dokter Hewan memvalidasi; Kepala Pekerja mengubah tindak lanjut; Pekerja Kandang tetap anonim.

## Konektor dan Relasi

- Gunakan Dependency dari router ke service dan schema.
- Gunakan Association dari WorkflowService ke data validasi/follow-up.
- Gunakan Generalization hanya jika benar-benar menggambar pewarisan Pydantic, misalnya ValidationCreateRequest dari ValidationFields.
- Beri multiplicity `1` pada service singleton bila ditampilkan sebagai instance aplikasi.

## Saran Tata Letak

Letakkan Router di atas, Service di tengah, dan Schema di bawah. Posisikan alur deteksi/Admin di kiri dan workflow Dokter/Kepala Pekerja di kanan.

## Penjelasan Diagram untuk Laporan

Backend memisahkan endpoint dari logika bisnis. Routes melayani deteksi anonim Pekerja Kandang serta administrasi, sedangkan WorkflowRoutes melayani Dokter Hewan dan Kepala Pekerja dengan pemeriksaan JWT dan role. MLService menangani inferensi, SupabaseService menangani data umum serta pembuatan akun staf oleh Admin, dan WorkflowService menegakkan validasi serta transisi penanganan. Schema Pydantic menjaga format request dan response.

## Checklist

- [ ] Empat peran dan tanggung jawabnya disebutkan.
- [ ] Router, service, dan schema dipisahkan.
- [ ] `_require_role()` terlihat pada endpoint staf.
- [ ] Tiga verdict dan status workflow dicantumkan.
- [ ] Dependency mengarah dari pengguna ke penyedia.
