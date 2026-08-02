# Penjelasan Diagram Flowchart Training Pipeline

## Tujuan

Diagram ini menjelaskan alur pelatihan dan pemilihan model AI ChickenShii. Workflow Dokter Hewan dan Kepala Pekerja tidak mengubah proses training yang telah digunakan.

## Jenis Diagram

Gunakan **Flowchart** dengan Data, Process, Decision, dan Terminator di Visual Paradigm Online.

## Elemen

- Data: `Dataset Kaggle 8.066 gambar`, `Dataset lapangan 210 gambar`, dan empat kelas Coccidiosis, Healthy, Salmonellosis, New Castle Disease.
- Process: `Gabungkan dan bersihkan data`, `Stratified split 70/15/15`, `Augmentasi training`, `Training Baseline CNN`, `MobileNetV2 Feature Extraction`, `MobileNetV2 Fine-Tuning`, `Evaluasi test set`, dan `Simpan model terbaik .keras`.
- Decision: `Validasi membaik?`, `Early stopping?`, dan `Model terbaik?`.
- Artifact: metrik akurasi/loss, confusion matrix, classification report, dan model `.keras`.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > Flowchart** dan letakkan `Mulai` di bagian atas.
2. Gambar dua simbol Data untuk sumber dataset, lalu gabungkan ke `Pembersihan dan pelabelan empat kelas`.
3. Tambahkan `Stratified split 70% training, 15% validation, 15% testing`.
4. Buat fork tiga cabang skenario: Baseline CNN, MobileNetV2 Feature Extraction, dan MobileNetV2 Fine-Tuning.
5. Pada setiap cabang, tambahkan proses training dan decision `Validasi membaik?`; tampilkan callback EarlyStopping dan ReduceLROnPlateau sebagai annotation/process.
6. Gabungkan tiga cabang pada `Bandingkan metrik validation/test`.
7. Tambahkan decision `Model terbaik?`, lalu `Evaluasi test set`, `Buat confusion matrix dan classification report`, dan `Simpan .keras`.
8. Akhiri dengan `Model siap dimuat Backend` → `Selesai`.

## Konektor dan Relasi

- Gunakan Flowline; labeli cabang dengan nama skenario model.
- Hubungkan validation set ke proses pemantauan callback dan test set hanya ke evaluasi akhir.
- Jangan menghubungkan role aplikasi atau tabel workflow ke proses training.

## Saran Tata Letak

Letakkan persiapan data vertikal di atas, tiga skenario training sejajar horizontal, dan evaluasi gabungan di bawah. Gunakan warna berbeda untuk data, proses, keputusan, dan artifact.

## Penjelasan Diagram untuk Laporan

Dataset publik dan lapangan digabungkan, dibersihkan, lalu dibagi secara stratified menjadi data training, validation, dan testing. Tiga skenario model dilatih dan dibandingkan dengan prosedur evaluasi yang sama. Model terbaik disimpan dalam format `.keras` untuk digunakan backend. Penambahan role dan workflow operasional tidak mengubah pipeline ini karena validasi Dokter Hewan menilai kasus penggunaan, bukan melatih ulang model secara otomatis.

## Checklist

- [ ] Dua sumber dataset dan empat kelas tercantum.
- [ ] Split 70/15/15 bersifat stratified.
- [ ] Tiga skenario model digambar sejajar.
- [ ] Callback, evaluasi, dan artifact hasil terlihat.
- [ ] Tidak ada klaim retraining otomatis dari validasi dokter.

