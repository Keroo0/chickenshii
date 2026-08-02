# Penjelasan Diagram Sequence Login Bersama

## Tujuan

Diagram ini menunjukkan satu proses login untuk Admin, Dokter Hewan, dan Kepala Pekerja, sekaligus menegaskan Pekerja Kandang tetap memakai aplikasi tanpa login.

## Jenis Diagram

Gunakan **UML Sequence Diagram** dengan combined fragment `alt`.

## Elemen

Lifeline: `Pekerja Kandang`, `Staf`, `Mobile App`, `Supabase Auth`, `Auth Provider/Role Guard`, dan `Protected Area`. Protected Area dapat diberi catatan tujuan `/admin`, `/doctor`, `/head-worker`.

## Langkah Pembuatan di Visual Paradigm Online

1. Pilih **New Diagram > UML > Sequence Diagram**.
2. Tambahkan lifeline dari kiri ke kanan sesuai bagian Elemen.
3. Gambar Pekerja Kandang → Mobile App: `buka /`; Mobile membalas `halaman deteksi tanpa login`.
4. Gambar Staf → Mobile: `buka /login` dan `submit(email, password)`.
5. Mobile → Supabase Auth: `signInWithPassword`; Auth membalas session/JWT atau error.
6. Tambahkan fragment `alt [kredensial tidak valid]` untuk pesan gagal tanpa menyimpan sesi.
7. Pada cabang sukses, Mobile → Auth Provider: `simpan/restore session`; Role Guard membaca `app_metadata.role` dan memverifikasi token melalui backend bila diperlukan.
8. Tambahkan fragment `alt` dengan `[admin] → /admin`, `[veterinarian] → /doctor`, `[head_worker] → /head-worker`, dan `[role tidak dikenal] → signOut() → /login`.
9. Tambahkan cabang akses lintas-role: Role Guard menolak dan mengarahkan ke area role yang benar.

## Konektor dan Relasi

- Gunakan synchronous message untuk request dan dashed return message untuk respons.
- Gunakan self-message pada Role Guard untuk `resolveRole()`.
- Tiga tujuan route harus berada dalam fragment `alt`, bukan digambar sebagai login terpisah.

## Saran Tata Letak

Letakkan alur anonim singkat di bagian atas. Tempatkan fragment login staf di bawahnya dan fragment role redirect paling bawah agar urutannya mudah diikuti.

## Penjelasan Diagram untuk Laporan

Pekerja Kandang langsung membuka halaman deteksi tanpa autentikasi. Admin, Dokter Hewan, dan Kepala Pekerja mengirim kredensial dari `/login` yang sama ke Supabase Auth. Setelah JWT diterima, aplikasi membaca role aman dari `app_metadata` dan mengarahkan staf ke `/admin`, `/doctor`, atau `/head-worker`. Role tidak dikenal ditolak, sesinya diakhiri, dan akses lintas-role diblokir.

## Checklist

- [ ] Keempat peran disebutkan.
- [ ] Pekerja Kandang memiliki alur anonim.
- [ ] Supabase Auth mengembalikan session/JWT.
- [ ] Redirect `/admin`, `/doctor`, `/head-worker` tepat.
- [ ] Role salah dan tidak dikenal ditolak.

