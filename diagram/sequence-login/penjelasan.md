# Sequence Diagram — Login Admin

## Tujuan
Menggambarkan alur autentikasi Admin dari form login hingga masuk ke Dashboard. Disajikan secara **garis besar**.

## Komponen yang Terlibat
| Komponen | Peran |
|----------|-------|
| **Mobile App** | Menampilkan form dan meneruskan kredensial |
| **Supabase Auth** | Memverifikasi email & password, menerbitkan JWT |
| **Secure Store** | Menyimpan token terenkripsi di level OS |

## Alur
1. Admin membuka `app/admin/login.tsx` dan mengisi email & password
2. Mobile mengirim kredensial ke Supabase Auth
3. Supabase Auth memvalidasi dan mengembalikan JWT token
4. Mobile menyimpan JWT ke `expo-secure-store` (Keychain/Keystore)
5. Mobile redirect ke Dashboard `app/admin/(tabs)/index.tsx`

## Catatan
- Setiap screen admin melakukan pengecekan sesi via `expo-secure-store` sebelum merender.
- Jika token kedaluwarsa atau tidak valid, sistem redirect otomatis ke `login.tsx`.
- Token **tidak pernah** disimpan sebagai plain text.
