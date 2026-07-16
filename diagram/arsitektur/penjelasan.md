# Arsitektur Sistem (Deployment Diagram) — ChickenShii

## Tujuan
Menggambarkan komponen-komponen sistem dan bagaimana mereka terhubung satu sama lain secara **garis besar**.

## Komponen

| Komponen | Teknologi | Lokasi |
|----------|-----------|--------|
| **Mobile App** | React Native + Expo | Perangkat Android pengguna (APK) |
| **Backend API** | FastAPI + Uvicorn | Mesin lokal pengembang |
| **Model AI** | MobileNetV2 `.keras` | Di-load ke memori Backend saat startup |
| **Database** | Supabase PostgreSQL | Supabase Cloud |
| **Storage** | Supabase Storage Bucket | Supabase Cloud |

## Alur Komunikasi
- **Mobile → Backend**: REST API (HTTPS), untuk proses deteksi dan simpan riwayat
- **Mobile → Supabase**: Supabase JS SDK (langsung), untuk baca riwayat di Dashboard Admin
- **Backend → Supabase**: Supabase Python client + Service Role Key, untuk upload gambar & insert data
- **Model AI**: Tidak terpisah, berjalan **in-process** di dalam Backend FastAPI

## Catatan
- Model AI **tidak** diekspos sebagai endpoint terpisah; seluruh akses ke model melewati Backend.
- Mobile tidak pernah menulis data langsung ke Supabase tanpa melalui Backend (kecuali operasi baca Dashboard Admin yang dilindungi RLS).
