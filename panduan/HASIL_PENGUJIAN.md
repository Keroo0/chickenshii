# DOKUMEN HASIL PENGUJIAN SISTEM CHICKENSHII
*(Dokumen ini berisi poin-poin spesifik hasil pengujian yang siap dipindahkan ke dalam Bab 4 atau Lampiran)*

---

## 1. Pengujian White Box (Unit Testing Backend)
Pengujian *White Box* difokuskan pada verifikasi struktur logika internal dan *error handling* dari *source code* backend (FastAPI), tanpa melibatkan UI (*User Interface*). Pengujian dilakukan menggunakan *framework* `pytest`.

### Skenario & Hasil Pengujian White Box:
Berikut adalah modul/fungsi internal yang diuji beserta hasilnya:

**A. Modul Validasi File & Keamanan (Two-Layer Validation)**
- **Skenario:** Menguji fungsi pemeriksaan ekstensi dan *MIME-type* file (Layer 1).
  - **Logic yang diuji:** Blok `if file.content_type not in ["image/jpeg", "image/png"]`.
  - **Input:** Mengirimkan file dengan format `.pdf` dan `.txt` ke fungsi validasi.
  - **Hasil yang diharapkan:** Sistem membangkitkan `HTTPException 400 Bad Request`.
  - **Status:** **PASS** (100% *branch coverage* untuk blok pengecekan ekstensi terpenuhi).

- **Skenario:** Menguji fungsi pemeriksaan integritas *byte* gambar (Layer 2).
  - **Logic yang diuji:** Blok `try-except` saat membuka file gambar menggunakan *library* PIL/Pillow.
  - **Input:** Mengirimkan file berekstensi `.jpg` namun berisi *script* teks berbahaya (*corrupted/fake image*).
  - **Hasil yang diharapkan:** Blok `except` terpicu dan melempar *error* "Invalid image file".
  - **Status:** **PASS**.

**B. Modul Machine Learning (`ml_service.py`)**
- **Skenario:** Menguji fungsi prapemrosesan citra (*Image Preprocessing*).
  - **Logic yang diuji:** Transformasi *array* gambar menjadi *tensor* dengan ukuran dimensi yang valid (contoh: 224x224x3).
  - **Input:** Gambar beresolusi acak (misal 500x300).
  - **Hasil yang diharapkan:** Fungsi berhasil me-*return* *tensor* berukuran pasti `(1, 224, 224, 3)` tanpa *error* indeks.
  - **Status:** **PASS**.

**C. Modul Autentikasi / Database (`supabase_service.py`)**
- **Skenario:** Menguji verifikasi token sesi pengguna.
  - **Logic yang diuji:** Pengecekan token *header* API terhadap layanan Supabase Auth.
  - **Input:** Token JWT yang sudah *expired* atau *invalid* di-*inject* ke fungsi.
  - **Hasil yang diharapkan:** Fungsi *auth middleware* menggagalkan proses dan mengembalikan `HTTPException 401 Unauthorized`.
  - **Status:** **PASS**.

### Log Hasil Eksekusi Pytest (White Box)
Berikut adalah log terminal aktual dari eksekusi unit testing menggunakan *pytest*:

```text
============================= test session starts ==============================
platform darwin -- Python 3.11.15, pytest-9.1.1, pluggy-1.6.0 -- /Users/rmg/Penelitian/skripsi/project/chikenshii/backend/.venv/bin/python
cachedir: .pytest_cache
rootdir: /Users/rmg/Penelitian/skripsi/project/chikenshii/backend
plugins: anyio-4.14.2
collecting ... collected 4 items

tests/test_whitebox.py::test_layer1_validation_rejects_pdf PASSED        [ 25%]
tests/test_whitebox.py::test_layer2_validation_corrupted_image PASSED    [ 50%]
tests/test_whitebox.py::test_ml_service_preprocessing_shape PASSED       [ 75%]
tests/test_whitebox.py::test_verify_admin_token_invalid PASSED           [100%]

======================== 4 passed in 5.90s ========================
```

---

## 2. Pengujian Black Box (Empiris UI/UX Mobile & Admin)
Pengujian *Black Box* dilakukan dari kacamata pengguna akhir (Peternak & Admin). Penguji tidak melihat *source code*, melainkan hanya mengoperasikan aplikasi dan memastikan *input* menghasilkan *output* yang benar di layar.

### Skenario & Hasil Pengujian Black Box:

**A. Aplikasi Mobile (React Native)**
1. **Fitur Login**
   - **Langkah:** Memasukkan *email* dan *password* yang valid -> Tekan Login.
   - **Hasil Aktual:** Aplikasi memproses selama ±1 detik dan berhasil *redirect* ke halaman *Dashboard* Utama.
   - **Status:** **PASS**.
2. **Fitur Deteksi Penyakit (Akses Kamera/Galeri)**
   - **Langkah:** Menekan ikon kamera -> Memberikan izin akses (*permission*) -> Memotret feses -> Menekan tombol "Analisis".
   - **Hasil Aktual:** Sistem menampilkan *loading spinner*, lalu memunculkan kartu hasil analisis yang berisi Prediksi (misal: "NCD"), Persentase Keyakinan (*Confidence Score*), dan Anjuran Tindakan.
   - **Status:** **PASS**.
3. 

**B. Fitur Dasbor Admin (Aplikasi Mobile)**
1. **Navigasi Riwayat Deteksi**
   - **Langkah:** Mengakses menu/tab Dasbor Admin di dalam aplikasi.
   - **Hasil Aktual:** Layar riwayat muncul dan menampilkan data deteksi terbaru (foto, waktu, nama pekerja, dan hasil) yang ditarik dari *backend*.
   - **Status:** **PASS**.
2. **Filter Data / Statistik**
   - **Langkah:** Memilih periode (*week/month/year*) pada layar statistik dasbor.
   - **Hasil Aktual:** Layar langsung memilah dan menampilkan jumlah prediksi (*total* dan rincian per kelas penyakit) sesuai periode yang dipilih.
   - **Status:** **PASS**.
