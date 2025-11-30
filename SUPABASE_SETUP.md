# Supabase Production Setup Guide

## 1. Supabase Account yaratish

1. [supabase.com](https://supabase.com) ga o'ting
2. "Start your project" tugmasini bosing
3. GitHub bilan kirish (yoki email)
4. Yangi project yarating

## 2. Database Setup

### Database URL olish

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection String** bo'limida **URI** ni tanlang
3. Parolni ko'rsatish uchun "Show" tugmasini bosing
4. Connection string ni nusxalang:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Migration qo'llash

1. Local da migration fayllaringiz tayyor (`prisma/migrations/`)
2. `.env.production` faylida `DATABASE_URL` ni Supabase URL ga o'zgartiring
3. Migration qo'llash:
   ```bash
   npx prisma migrate deploy
   ```

## 3. Storage Setup

### Bucket yaratish

1. Supabase Dashboard → **Storage**
2. **New bucket** tugmasini bosing
3. Bucket nomi: `matozai-audio`
4. **Public bucket** ni tanlang (yoki private, keyin policy sozlaysiz)
5. **Create bucket**

### Storage Policy sozlash (agar private bucket bo'lsa)

1. Bucket → **Policies** → **New policy**
2. **For full customization** ni tanlang
3. Policy nomi: `Allow authenticated users to upload`
4. Policy definition:

   ```sql
   -- INSERT policy (upload)
   CREATE POLICY "Allow authenticated users to upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'matozai-audio');

   -- SELECT policy (download)
   CREATE POLICY "Allow public to download"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'matozai-audio');

   -- DELETE policy
   CREATE POLICY "Allow users to delete own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'matozai-audio');
   ```

## 4. API Keys olish

1. Supabase Dashboard → **Settings** → **API**
2. Quyidagilarni nusxalang:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon public** key (Frontend uchun)
   - **service_role** key (Backend uchun, **MAXFIY!**)

## 5. Environment Variables sozlash

`.env.production` faylini yarating va to'ldiring:

```env
# Application
NODE_ENV=production
PORT=3000

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# JWT
JWT_SECRET=GENERATE_RANDOM_STRING_HERE
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Supabase Storage
STORAGE_TYPE=supabase
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=matozai-audio

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
```

## 6. Deployment

### Render.com (Tavsiya etiladi)

1. [render.com](https://render.com) ga o'ting
2. **New** → **Web Service**
3. GitHub repository ni ulang
4. Sozlamalar:
   - **Name**: matozai-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment Variables**: Yuqoridagi barcha `.env.production` qiymatlarini qo'shing

### Railway.app

1. [railway.app](https://railway.app) ga o'ting
2. **New Project** → **Deploy from GitHub repo**
3. Repository ni tanlang
4. Environment variables qo'shing
5. Deploy!

### Vercel (Serverless)

**Eslatma**: NestJS Vercel da serverless sifatida ishlaydi, WebSocket ishlamaydi.

1. `vercel.json` yarating:

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/main.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/main.js"
       }
     ]
   }
   ```

2. Deploy:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## 7. Post-Deployment

### Database Migration

Production da birinchi marta:

```bash
npx prisma migrate deploy
```

### Health Check

```bash
curl https://your-backend-url.com/health
```

Javob:

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123.45,
  "timestamp": "2025-11-30T..."
}
```

## 8. Monitoring

### Supabase Dashboard

- **Database** → **Table Editor**: Ma'lumotlarni ko'rish
- **Storage** → **matozai-audio**: Yuklangan fayllar
- **Logs** → **Postgres Logs**: Database loglar

### Backend Logs

Render/Railway dashboard da real-time logs mavjud.

## 9. Troubleshooting

### Database connection error

- Supabase parolni tekshiring
- IP whitelist (Supabase da default hammaga ochiq)
- SSL mode: `?sslmode=require` qo'shing URL ga

### Storage upload fails

- Service role key to'g'riligini tekshiring
- Bucket nomi to'g'riligini tekshiring
- Bucket policy sozlamalarini tekshiring

### CORS errors

- `FRONTEND_URL` to'g'ri domain ekanligini tekshiring
- Supabase da CORS sozlamalari (default ochiq)

## 10. Cost Estimation (Free Tier)

**Supabase Free Tier:**

- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB/month
- API requests: Unlimited

**Render.com Free Tier:**

- 750 hours/month (1 instance 24/7)
- Auto-sleep after 15 min inactivity
- 512 MB RAM

**Jami**: $0/month (Free tier limits ichida)

---

## Qo'shimcha Maslahatlar

1. **JWT_SECRET** ni random string generator bilan yarating:

   ```bash
   openssl rand -base64 32
   ```

2. **Database backup**: Supabase avtomatik backup qiladi (7 kun)

3. **Monitoring**: Sentry.io yoki LogRocket qo'shing production errors uchun

4. **Rate limiting**: Production da `@nestjs/throttler` qo'shing

5. **SSL**: Render/Railway avtomatik SSL beradi
