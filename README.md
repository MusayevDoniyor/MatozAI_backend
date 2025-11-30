# MatozAI Backend

Backend API for MatozAI voice-to-text platform built with NestJS, PostgreSQL, and Supabase.

## 🚀 Features

- ✅ **Authentication**: JWT-based auth with refresh tokens
- ✅ **User Management**: Profile, password change, account deletion
- ✅ **Sessions**: CRUD operations for recording sessions
- ✅ **File Storage**: Local and Supabase Storage support
- ✅ **WebSocket**: Real-time transcription updates
- ✅ **API Documentation**: Swagger/OpenAPI
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **Validation**: class-validator & class-transformer
- ✅ **Production Ready**: Supabase integration

## 📋 Tech Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.x
- **Authentication**: JWT (Passport)
- **Storage**: Supabase Storage / Local
- **Real-time**: Socket.IO
- **Documentation**: Swagger
- **Validation**: class-validator

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (or Supabase account)
- npm or yarn

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd MatozAI_backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

Server will run on `http://localhost:3001`

API Documentation: `http://localhost:3001/api/docs`

## 📁 Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data transfer objects
│   ├── guards/          # Auth guards
│   ├── strategies/      # Passport strategies
│   └── auth.service.ts
├── users/               # User management
├── sessions/            # Recording sessions
├── storage/             # File storage (local/Supabase)
├── websocket/           # WebSocket gateway
├── prisma/              # Prisma service
├── app.module.ts        # Root module
└── main.ts              # Entry point
```

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/matozai"

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Storage
STORAGE_TYPE=local  # or 'supabase'
UPLOAD_DIR=./uploads
```

## 🌐 Production Deployment

### Quick Deploy to Render.com

1. Create Supabase project
2. Copy `.env.production.example` to `.env.production`
3. Fill in Supabase credentials
4. Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

### Detailed Setup

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete Supabase configuration.

## 📚 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Users

- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update profile
- `POST /users/change-password` - Change password
- `DELETE /users/account` - Delete account

### Sessions

- `POST /sessions` - Create session (with audio upload)
- `GET /sessions` - Get all sessions (paginated)
- `GET /sessions/:id` - Get session by ID
- `GET /sessions/:id/audio` - Download audio
- `PATCH /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session
- `GET /sessions/stats` - Get statistics

### Health

- `GET /health` - Health check

## 🔌 WebSocket Events

Connect to: `ws://localhost:3001/ws`

**Client → Server:**

- `join_session` - Join a session
- `transcription_update` - Send transcription update
- `leave_session` - Leave session

**Server → Client:**

- `session_joined` - Session joined confirmation
- `transcription_received` - New transcription data
- `error` - Error message

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Database Schema

### User

- id, email, name, password, isActive
- Relations: sessions, refreshTokens

### Session

- id, userId, text, audioUrl, audioSize, duration, script
- Relations: user

### RefreshToken

- id, userId, token, expiresAt
- Relations: user

## 🔧 Scripts

```bash
npm run build          # Build for production
npm run start          # Start production server
npm run start:dev      # Start development server
npm run start:debug    # Start with debugger

npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:deploy    # Deploy migrations (prod)
npm run prisma:studio    # Open Prisma Studio
```

## 📝 License

MIT

## 👥 Author

MatozAI Development Team

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-30
