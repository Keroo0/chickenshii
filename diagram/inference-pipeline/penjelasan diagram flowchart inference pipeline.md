# Penjelasan Diagram Flowchart Inference Pipeline

## Tujuan

Diagram ini menjelaskan proses teknis backend sejak menerima gambar hingga mengembalikan hasil prediksi. Penambahan role tidak mengubah logika inferensi model.

## Jenis Diagram

Gunakan **Flowchart** standar di Visual Paradigm Online dengan Terminator, Input/Output, Process, Decision, dan Data.

## Elemen

- Terminator: `Mulai` dan `Selesai`.
- Input/Output: `Terima file gambar` dan `Return JSON`.
- Decision: `MIME jpg/png?`, `Ukuran ≤ 5 MB?`, `File kosong?`, dan `Gambar dapat dibaca?`.
- Process: `Baca bytes`, `Buka dengan Pillow`, `Konversi RGB`, `Resize 224×224`, `Ubah ke float32 bernilai 0–255`, `Tambah batch dimension`, `Rescaling internal model ke -1..1`, `Inferensi MobileNetV2`, `Softmax empat kelas`, `Ambil kelas tertinggi`, dan `Lookup knowledge base`.
- Output error: `422 MIME tidak didukung`, `413 ukuran > 5 MB`, `422 file kosong`, dan `500 gambar tidak terbaca/inferensi gagal`.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > Flowchart**.
2. Susun `Mulai` → `Terima file gambar` → decision `MIME jpg/png?` → `Baca bytes` → decision `Ukuran ≤ 5 MB?` → decision `File kosong?` → decision `Gambar dapat dibaca Pillow?`.
3. Hubungkan MIME `[tidak]` ke `422`, ukuran `[tidak]` ke `413`, file kosong `[ya]` ke `422`, dan gambar terbaca `[tidak]` ke `500`; setiap output error berakhir di `Selesai`.
4. Cabang valid dilanjutkan ke proses buka Pillow, konversi RGB, resize, float32 0–255, dan penambahan batch. Tambahkan proses `Rescaling internal model -1..1` tepat sebelum/intern pada MobileNetV2; jangan menggambar normalisasi 0–1 di backend.
5. Tambahkan `Inferensi MobileNetV2` → `Softmax empat kelas` → `Ambil kelas dan confidence tertinggi`.
6. Hubungkan ke data store `Knowledge Base` untuk mengambil description, cause, dan immediate_action/rekomendasi.
7. Akhiri dengan `Return JSON hasil lengkap` → `Selesai`.
8. Tambahkan Note: `Tidak menyimpan prediksi dan tidak membuat workflow`.

## Konektor dan Relasi

- Gunakan Flowline berpanah penuh.
- Semua Decision wajib memiliki label `[ya]` dan `[tidak]`.
- Knowledge Base dihubungkan ke proses lookup menggunakan Data Flow.
- Hindari menyambungkan inference langsung ke tabel predictions.

## Saran Tata Letak

Gunakan alur utama vertikal. Tempatkan semua output error di kanan decision masing-masing dan gabungkan ke satu Selesai bila tidak menimbulkan garis silang.

## Penjelasan Diagram untuk Laporan

Backend memvalidasi MIME, ukuran, dan file kosong sebelum melakukan preprocessing. Array backend tetap bernilai 0–255; layer `Rescaling` di dalam model mengubahnya ke rentang -1 sampai 1. Model menghasilkan probabilitas empat kelas, lalu sistem mengambil label dengan probabilitas tertinggi dan melengkapinya dengan rekomendasi dari knowledge base. Pipeline ini tetap sama setelah penambahan role karena autentikasi dan workflow baru berlaku pada penyimpanan serta tindak lanjut, bukan pada inferensi.

## Checklist

- [ ] Seluruh validasi input dan jalur error tergambar.
- [ ] Resize, RGB, float32 0–255, Rescaling internal -1..1, dan batch dicantumkan.
- [ ] Inferensi menghasilkan empat probabilitas.
- [ ] Lookup knowledge base dan rekomendasi terlihat.
- [ ] Tidak ada penyimpanan atau workflow di pipeline ini.
