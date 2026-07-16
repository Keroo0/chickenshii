# Deployment Guide — ChickenShii

Panduan deploy backend & mobile app ke production.

---

## 1. Backend (FastAPI + Docker)

### Prerequisites
- Docker Desktop terinstall
- Akun Docker Hub
- Akun Railway / Render

### Build Docker Image
```bash
cd backend
docker build -t chikenshii-api .
```

### Test Lokal
```bash
docker run -p 8000:8000 \
  -e SUPABASE_URL=https://xxx.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=xxx \
  chikenshii-api
```

Buka `http://localhost:8000` — cek health check.

### Push ke Docker Hub
```bash
docker login
docker tag chikenshii-api <username>/chikenshii-api
docker push <username>/chikenshii-api
```

### Deploy ke Railway / Render

**Railway:**
1. Buka railway.app
2. New Project → Deploy from Docker Image
3. Masukkan image: `<username>/chikenshii-api`
4. Tambah environment variables:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=xxx
   SUPABASE_ANON_KEY=xxx
   ```
5. Deploy

**Render:**
1. Buka render.com
2. New → Web Service
3. Choose existing image / connect GitHub repo
4. Isi environment variables (sama seperti Railway)
5. Deploy

### Update CORS
Di backend `app/core/config.py`, update `cors_origins` agar menerima request dari mobile app:
```python
cors_origins: list[str] = ["*"]  # atau spesifik: ["https://your-app.up.railway.app"]
```

---

## 2. Mobile App (Expo)

### Update API URL
Buat/update file `.env` di folder `mobile/`:
```
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
```

Pastikan semua fetch/axios menggunakan `EXPO_PUBLIC_API_URL`.

### Build APK (Production)
```bash
eas build --platform android --profile production
```

### Build APK (Preview / Demo)
```bash
eas build --platform android --profile preview
```

---

## 3. Untuk Demo Sidang

Kalau cuma butuh demo (bukan production beneran):

1. **Backend**: Run lokal pakai `python run.py` — cukup, nggak perlu deploy
2. **Mobile**: Build preview APK → install ke HP Android

Lebih simpel, nggak perlu Docker / cloud.
