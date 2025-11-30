# MatozAI Backend - Production Deployment

## Tezkor Boshlash

### 1. Supabase Sozlash

1. **Supabase account yarating**: https://supabase.com
2. **Yangi project yarating**
3. **Database URL ni oling**:

   - Settings → Database → Connection String (URI)
   - Parolni saqlang!

4. **Storage bucket yarating**:

   - Storage → New bucket → `matozai-audio` (public)

5. **API keys ni oling**:
   - Settings → API
   - Project URL, anon key, service_role key ni nusxalang

### 2. Environment Variables

`.env.production.example` faylini `.env.production` ga nusxalang:

```bash
cp .env.production.example .env.production
```

Quyidagi qiymatlarni to'ldiring:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres"
JWT_SECRET="$(openssl rand -base64 32)"
FRONTEND_URL="https://your-frontend.vercel.app"
SUPABASE_URL="https://YOUR_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Database Migration

```bash
# Prisma client generate
npm run prisma:generate

# Production migration
npm run prisma:deploy
```

### 4. Local Production Test

```bash
# Build
npm run build

# Run production mode
NODE_ENV=production npm run start:prod
```

Test qiling:

```bash
curl http://localhost:3001/health
```

### 5. Deploy (Render.com)

1. **Render.com** ga o'ting: https://render.com
2. **New → Web Service**
3. **GitHub repository** ni ulang
4. **Sozlamalar**:

   - Name: `matozai-backend`
   - Environment: `Node`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm run start:prod`

5. **Environment Variables** qo'shing (`.env.production` dan):

   - `NODE_ENV=production`
   - `DATABASE_URL=...`
   - `JWT_SECRET=...`
   - `FRONTEND_URL=...`
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
   - `SUPABASE_STORAGE_BUCKET=matozai-audio`
   - `STORAGE_TYPE=supabase`

6. **Create Web Service**

### 6. Post-Deployment

Backend URL ni oling (masalan: `https://matozai-backend.onrender.com`)

Test qiling:

```bash
curl https://matozai-backend.onrender.com/health
```

API docs:

```
https://matozai-backend.onrender.com/api/docs
```

### 7. Frontend ni yangilash

Frontend `.env` fayliga backend URL ni qo'shing:

```env
VITE_API_URL=https://matozai-backend.onrender.com
```

---

## Troubleshooting

### Database connection error

- Supabase parol to'g'riligini tekshiring
- `DATABASE_URL` format to'g'riligini tekshiring

### Storage upload fails

- `STORAGE_TYPE=supabase` ekanligini tekshiring
- Service role key to'g'riligini tekshiring
- Supabase bucket `matozai-audio` yaratilganligini tekshiring

### CORS errors

- `FRONTEND_URL` to'g'ri domain ekanligini tekshiring
- Frontend va backend bir xil protocol (https) ishlatayotganini tekshiring

---

## Monitoring

- **Render Dashboard**: Logs va metrics
- **Supabase Dashboard**: Database va storage
- **Health endpoint**: `/health`

---

## Qo'shimcha Ma'lumot

To'liq setup guide: `SUPABASE_SETUP.md`
