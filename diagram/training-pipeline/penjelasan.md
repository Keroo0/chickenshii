# Flowchart — Pipeline Pelatihan Model AI

## Tujuan
Menggambarkan alur keseluruhan proses pelatihan model deep learning dari pengumpulan dataset hingga menghasilkan model terbaik.

## Dataset
| Sumber | Jumlah | Keterangan |
|--------|--------|------------|
| Kaggle (publik) | 8.066 gambar | 4 kelas penyakit |
| PT Nirwana Farm (lapangan) | 210 gambar | Foto feses kondisi asli kandang |
| **Total** | **8.276 gambar** | Gabungan kedua sumber |

## Distribusi Kelas
| Kelas | Jumlah |
|-------|--------|
| Coccidiosis | 2.566 |
| Healthy | 2.404 |
| Salmonellosis | 2.625 |
| New Castle Disease | 681 |

## Split Data
- **70%** Training, **15%** Validation, **15%** Testing (Stratified Split)

## Tiga Skenario Model
| Model | Metode | Epoch |
|-------|--------|-------|
| **Baseline CNN** | Custom 3 block Conv2D | — |
| **MobileNetV2 FE** | Feature Extraction (layer dibekukan) | 10 |
| **MobileNetV2 FT** | Fine-Tuning (30 layer terakhir dibuka) | 15 |

## Callbacks
- `EarlyStopping(patience=5)` — hentikan jika tidak ada peningkatan selama 5 epoch
- `ReduceLROnPlateau(factor=0.2, patience=3)` — kurangi LR saat stagnan
