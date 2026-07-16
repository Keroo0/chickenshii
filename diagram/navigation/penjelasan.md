# Navigation Diagram — Mobile App (Expo Router)

## Tujuan
Menggambarkan struktur navigasi layar aplikasi mobile menggunakan Expo Router (file-based routing).

## Struktur Layar

| File | Jenis | Keterangan |
|------|-------|------------|
| `app/_layout.tsx` | Root Provider | Setup context Auth dan Theme global |
| `app/index.tsx` | Public Screen | Home Pekerja Kandang — 2 state: Upload & Hasil |
| `app/admin/_layout.tsx` | Guard | Pengecekan sesi sebelum merender screen admin |
| `app/admin/login.tsx` | Public Screen | Form login Admin |
| `app/admin/(tabs)/index.tsx` | Protected Screen | Dashboard statistik & riwayat |
| `app/admin/(tabs)/history.tsx` | Protected Screen | Daftar riwayat + filter + soft delete |
| `app/admin/(tabs)/workers.tsx` | Protected Screen | Manajemen daftar Pekerja Kandang |

## Alur Navigasi
- **Pekerja Kandang**: Hanya mengakses `index.tsx` (bolak-balik antara state Upload dan state Hasil)
- **Admin**: Login di `login.tsx` → masuk ke grup `(tabs)` → navigasi antar tab
- Jika sesi Admin tidak valid → redirect otomatis ke `login.tsx`

## Catatan
- Navigasi menggunakan file-based routing Expo Router.
- Grup `admin/(tabs)` dilindungi oleh `_layout.tsx` (route guard).
