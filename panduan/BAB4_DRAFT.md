# BAB 4
# HASIL DAN PEMBAHASAN

Bab ini menguraikan hasil dari penelitian yang telah dilakukan, mulai dari implementasi lingkungan dan antarmuka sistem, hasil eksperimen dan evaluasi model *deep learning* yang digunakan, pengujian fungsional perangkat lunak, hingga evaluasi kebergunaan (*usability testing*) oleh pengguna akhir. Bab ini ditutup dengan pembahasan strategis serta analisis dampak dari hasil yang diperoleh.

## 4.1 Implementasi Lingkungan dan Antarmuka Sistem

Tahap implementasi bertujuan untuk merealisasikan rancangan sistem ke dalam bentuk perangkat lunak yang beroperasi pada lingkungan yang telah ditentukan. Sistem Chickenshii terdiri dari aplikasi *mobile* berbasis React Native untuk pengguna akhir, dasbor admin, dan *backend* berbasis FastAPI.

**A. Implementasi Aplikasi Mobile (React Native)**
Aplikasi *mobile* telah berhasil di-deploy dan dijalankan pada perangkat fisik pintar (Redmi 10). Berikut adalah bukti fisik antarmuka aplikasi yang berjalan pada perangkat tersebut:

*(Tempatkan Foto/Screenshot 1: Tampilan Beranda Aplikasi di HP Redmi 10)*

*(Tempatkan Foto/Screenshot 2: Tampilan Pemindaian/Deteksi Feses di HP Redmi 10)*

*(Tempatkan Foto/Screenshot 3: Tampilan Hasil Deteksi Penyakit)*

**B. Implementasi Dasbor Admin**
Dasbor admin berfungsi sebagai pusat kendali untuk memantau data deteksi dan mengelola operasional sistem. Antarmuka dasbor telah diimplementasikan dengan fitur-fitur pemantauan yang komprehensif.

*(Tempatkan Foto/Screenshot 4: Tampilan Utama Dasbor Admin)*

*(Tempatkan Foto/Screenshot 5: Tampilan Manajemen Data/Riwayat)*

**C. Status Operasional Backend FastAPI (macOS 15)**
*Backend* sistem yang dibangun menggunakan kerangka kerja FastAPI telah di-deploy dan berjalan secara stabil pada lingkungan sistem operasi macOS 15. Server *backend* menangani proses autentikasi, manajemen basis data, serta melayani *endpoint* inferensi model *deep learning*.

*(Tempatkan Screenshot 6: Log terminal yang menunjukkan FastAPI berjalan di macOS 15, misalnya pesan "Uvicorn running on http://127.0.0.1:8000" dan log *request* yang berhasil)*

---

## 4.2 Hasil Eksperimen dan Evaluasi Model Deep Learning

Pada bagian ini, dilakukan evaluasi terhadap kinerja model *deep learning* dalam mengklasifikasikan feses ayam. Eksperimen dilakukan dengan membandingkan tiga skenario *training*, yaitu: *Baseline CNN*, *Feature Extraction*, dan *Fine-Tuning*.

**A. Perbandingan Performa 3 Skenario Training**
Berikut adalah tabel perbandingan hasil evaluasi akhir dari ketiga skenario *training* berdasarkan metrik Akurasi, *Precision*, *Recall*, dan F1-*Score*.

*(Tempatkan Tabel 4.1: Tabel perbandingan metrik evaluasi untuk Baseline CNN, Feature Extraction, dan Fine-Tuning)*

**B. Grafik Konvergensi Epoch**
Proses pelatihan model dievaluasi melalui grafik konvergensi *loss* dan *accuracy* terhadap jumlah *epoch*. Grafik ini menunjukkan seberapa baik model belajar dan menggeneralisasi data selama proses *training*.

*(Tempatkan Grafik 1: Kurva Training & Validation Loss untuk masing-masing skenario)*

*(Tempatkan Grafik 2: Kurva Training & Validation Accuracy untuk masing-masing skenario)*

*Analisis Singkat: (Jelaskan grafik di atas, skenario mana yang konvergen paling cepat dan mana yang menunjukkan gejala overfitting/underfitting).*

**C. Bedah Confusion Matrix Final**
Untuk melihat secara detail performa klasifikasi tiap kelas (khususnya untuk kelas yang tidak seimbang), berikut disajikan *Confusion Matrix* dari model terbaik (misal: *Fine-Tuning*).

*(Tempatkan Gambar: Confusion Matrix Final dari model terbaik)*

*Analisis Singkat: (Jelaskan jumlah True Positive, False Positive, True Negative, dan False Negative pada masing-masing kelas. Soroti kelas mana yang sering salah diklasifikasikan).*

---

## 4.3 Hasil Pengujian Fungsional Perangkat Lunak

Pengujian fungsional bertujuan untuk memastikan bahwa seluruh fitur pada antarmuka sistem dan logika validasi pada *backend* berjalan sesuai dengan spesifikasi yang diharapkan.

**A. Uji Empiris Black Box Antarmuka**
Pengujian *Black Box* dilakukan untuk mengevaluasi fungsionalitas antarmuka dari perspektif pengguna tanpa melihat struktur kode internal.

**Tabel 4.2 Hasil Pengujian Black Box**
| No | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|
| 1 | Login Pengguna | Memasukkan kredensial valid dan menekan tombol login | Masuk ke halaman utama aplikasi | Masuk ke halaman utama | Pass |
| 2 | Deteksi Gambar | Mengunggah gambar feses dan menekan tombol deteksi | Sistem mengembalikan hasil klasifikasi penyakit | Hasil klasifikasi muncul | Pass |
| ... | *(Tambahkan skenario pengujian antarmuka lainnya)* | ... | ... | ... | ... |

**B. Eksekusi Unit Testing (Pytest) untuk Two-Layer Validation**
Untuk menjamin integritas data dan logika, dilakukan *unit testing* menggunakan **pytest**, secara spesifik menguji fitur *Two-Layer Validation*. Berikut adalah ringkasan laporan log eksekusinya:

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
*Analisis Singkat: (Jelaskan bahwa sistem berhasil melewati seluruh assertion pada Two-Layer Validation, memvalidasi integritas input sebelum diteruskan ke model).*

---

## 4.4 Hasil Evaluasi Kebergunaan (Usability Testing)

Evaluasi kebergunaan (*Usability Testing*) dilakukan dengan menggunakan instrumen kuesioner *System Usability Scale* (SUS) untuk mengukur tingkat penerimaan pengguna terhadap aplikasi. Responden merupakan para pekerja kandang dari PT Nirwana Farm.

**Tabulasi dan Perhitungan Kuesioner SUS**

*(Tempatkan Tabel 4.3: Tabulasi data mentah jawaban (Skala 1-5) dari 10 pertanyaan SUS untuk seluruh responden pekerja kandang)*

Perhitungan skor akhir SUS dilakukan berdasarkan rumus standar SUS:
- Untuk pertanyaan ganjil (positif): Skor = (Nilai Skala) - 1
- Untuk pertanyaan genap (negatif): Skor = 5 - (Nilai Skala)
- Skor Akhir = (Total Skor Ganjil + Total Skor Genap) * 2.5

*(Tempatkan Tabel 4.4: Hasil Perhitungan Skor Akhir SUS tiap responden dan Rata-rata Skor Keseluruhan)*

*Analisis Singkat: (Contoh: "Berdasarkan hasil perhitungan, diperoleh rata-rata skor SUS sebesar **[Masukkan Skor]**. Skor ini masuk ke dalam kategori **[Acceptable/Marginal/Not Acceptable]** dan grade scale **[A/B/C/D/F]**, yang menunjukkan bahwa aplikasi Chickenshii dapat diterima dan mudah digunakan oleh para pekerja kandang PT Nirwana Farm dalam operasional sehari-hari").*

---

## 4.5 Pembahasan Strategis dan Analisis Dampak

Berdasarkan hasil yang telah diuraikan, terdapat beberapa temuan strategis yang memerlukan analisis mendalam terkait performa sistem klasifikasi dan arsitektur operasional.

**A. Analisis Metrik Kelas Minoritas (NCD) akibat Intervensi Class Weights**
Pada evaluasi model, ditemukan bahwa pada kelas minoritas penyakit *Newcastle Disease* (NCD), model menghasilkan tingkat **Recall yang tinggi** namun **Precision yang rendah**. Kondisi ini merupakan hasil langsung dari penerapan intervensi *Class Weights* selama fase pelatihan (*training*).

*Class Weights* diterapkan untuk memberikan penalti yang lebih besar kepada model jika salah mengklasifikasikan kelas minoritas (NCD), memaksa model untuk lebih "sensitif" terhadap fitur penyakit ini.
- **Tingginya Recall (Sensitivitas):** Menunjukkan bahwa model berhasil mendeteksi hampir seluruh kasus NCD yang sebenarnya. Dalam konteks peternakan, hal ini sangat krusial karena NCD adalah penyakit yang sangat menular dan fatal. Kehilangan satu kasus positif (*False Negative*) dapat berakibat penyebaran wabah di seluruh kandang.
- **Rendahnya Precision:** Menunjukkan bahwa sensitivitas tinggi tersebut dibayar dengan meningkatnya *False Positive* (beberapa feses sehat atau penyakit lain diprediksi sebagai NCD). Meskipun ini dapat menyebabkan peringatan palsu bagi peternak, dalam manajemen risiko wabah, lebih baik melakukan pemeriksaan ekstra (*False Positive*) daripada melewatkan penyakit mematikan (*False Negative*).

Oleh karena itu, *trade-off* antara *Recall* dan *Precision* ini adalah keputusan strategis yang secara klinis lebih menguntungkan untuk keselamatan unggas di PT Nirwana Farm.

**B. Justifikasi Operasional Sistem Tanpa LLM**
Dalam pengembangan sistem ini, arsitektur difokuskan pada deteksi citra (*Computer Vision*) dan antarmuka operasional yang lugas tanpa mengintegrasikan *Large Language Models* (LLM) sebagai asisten diagnosis berbasis teks. Justifikasi dari keputusan ini didasarkan pada beberapa faktor operasional di lapangan:
1. **Kecepatan dan Latensi:** Intervensi di kandang ayam membutuhkan keputusan secara *real-time*. Deteksi gambar murni jauh lebih cepat diproses dibandingkan harus mem-parsing hasil prediksi, mengirimkannya ke API LLM pihak ketiga, dan menunggu balasan naratif.
2. **Keterbatasan Infrastruktur dan Biaya:** Operasional di lingkungan peternakan sering kali memiliki koneksi internet yang fluktuatif. Ketergantungan pada LLM (seperti GPT-4 atau sejenisnya) membutuhkan *bandwidth* yang stabil dan meningkatkan biaya operasional API. Model klasifikasi *in-house* yang di-*host* di server FastAPI lokal menjamin ketersediaan sistem (*high availability*).
3. **Kesesuaian dengan Pengguna Akhir:** Hasil *usability testing* menunjukkan pekerja kandang membutuhkan hasil yang instan, langsung (*point-and-shoot*), dan instruksi baku (misal: label "Sehat", "NCD", "Coccidiosis"). Narasi panjang hasil *generate* dari LLM justru berpotensi membingungkan dan memperlambat tindakan preventif yang harus segera dilakukan di lapangan.

Keputusan mengeliminasi LLM menjadikan sistem Chickenshii lebih ringan (*lightweight*), deterministik, dan tangguh (*robust*) untuk dioperasikan secara mandiri.
