# Production Deployment - Quick Guide

## ⚠️ MUHIM: `.env` sozlamalari

Production ga deploy qilishdan oldin `.env` faylida quyidagilarni tekshiring:

### 1. Database (Supabase)

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.tllnzneahvtdslwnbcki.supabase.co:5432/postgres"
```

⚠️ **Parolda `/` yoki maxsus belgilar bo'lmasligi kerak!**

Agar parolda muammo bo'lsa:

1. Supabase Dashboard → Settings → Database
2. "Reset Database Password"
3. Yangi oddiy parol yarating (faqat harflar va raqamlar)

### 2. Storage Type

**Local storage (hozircha):**

```env
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
```

**Supabase Storage (kelajakda):**

```env
STORAGE_TYPE=supabase
SUPABASE_URL=https://tllnzneahvtdslwnbcki.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=matozai-audio
```

### 3. JWT Secret

Kuchli secret yarating:

```bash
openssl rand -base64 32
```

Natijani `.env` ga qo'ying:

```env
JWT_SECRET=GENERATED_RANDOM_STRING_HERE
```

### 4. CORS

Frontend URL ni to'g'ri kiriting:

```env
FRONTEND_URL=https://matoz-ai.vercel.app
```

⚠️ **Oxirida `/` bo'lmasin!**

### 5. Port

```env
PORT=7070
```

Yoki Render default portini ishlating (PORT environment variable Render tomonidan avtomatik beriladi).

## 🚀 Render.com Deploy

### Build Command:

```
npm install && npm run build
```

### Start Command:

```
npm run start:prod
```

### Environment Variables (Render Dashboard):

Render.com da quyidagi environment variables ni qo'shing:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.tllnzneahvtdslwnbcki.supabase.co:5432/postgres
JWT_SECRET=YOUR_GENERATED_SECRET
JWT_ACCESS_EXPIRY=6h
JWT_REFRESH_EXPIRY=14d
FRONTEND_URL=https://matoz-ai.vercel.app
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
LOG_LEVEL=info
```

⚠️ **PORT ni qo'shMANG** - Render avtomatik beradi!

## ✅ Deploy Checklist

- [ ] Supabase database parolini tekshirish/yangilash
- [ ] JWT_SECRET yaratish (`openssl rand -base64 32`)
- [ ] FRONTEND_URL to'g'ri (slash siz)
- [ ] STORAGE_TYPE=local (hozircha)
- [ ] Render.com da environment variables qo'shish
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start:prod`
- [ ] Deploy!

## 🔍 Post-Deploy Test

Deploy bo'lgandan keyin:

```bash
# Health check
curl https://your-backend.onrender.com/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "uptime": 123.45,
  "timestamp": "2025-12-01T..."
}
```

## 📝 Logs

Render Dashboard → Logs tab da real-time logs ko'ring.

Qidiruv uchun:

- `[SessionsService]` - Session operations
- `[StorageService]` - File upload/download
- `[ERROR]` - Xatolar

## 🔄 Supabase Storage ga o'tish (kelajakda)

1. Supabase Dashboard → Storage
2. Bucket yaratish: `matozai-audio` (public)
3. Service Role Key olish
4. `.env` da `STORAGE_TYPE=supabase` qilish
5. Supabase keys qo'shish
6. Redeploy

## ⚡ Troubleshooting

### Build fails: "Cannot find namespace Express"

✅ **Hal qilindi**: `@types/multer` package.json da bor.

### Database connection error

- Parolni tekshiring
- Supabase da database running ekanligini tekshiring
- `DATABASE_URL` formatini tekshiring

### Audio upload fails

- `STORAGE_TYPE=local` ekanligini tekshiring
- `UPLOAD_DIR=./uploads` to'g'riligini tekshiring
- Render da disk space borligini tekshiring

### CORS errors

- `FRONTEND_URL` to'g'ri ekanligini tekshiring
- Slash yo'qligini tekshiring
- Frontend va backend bir xil protocol (https) ishlatayotganini tekshiring

---

**Tayyor!** Deploy qiling va test qiling! 🚀
