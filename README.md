# Communication App

Enterprise chat platform combining features from Slack, Microsoft Teams, WhatsApp, Zoho Cliq, and Instagram with WebRTC video/audio calls.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed and running

### One-Command Setup

```bash
# 1. Start Docker services (PostgreSQL, Redis, MinIO)
npm run docker:up

# 2. Install all dependencies (backend + frontend)
npm run install:all

# 3. Run both backend and frontend simultaneously
npm run dev
```

That's it! The application will start:
- **Backend API**: http://localhost:3000
- **Frontend UI**: http://localhost:5174

## 📋 Available Commands

### Development
```bash
npm run dev              # Run both backend + frontend
npm run dev:backend      # Run only backend (port 3000)
npm run dev:frontend     # Run only frontend (port 5174)
```

### Docker Management
```bash
npm run docker:up        # Start Docker containers (PostgreSQL, Redis, MinIO)
npm run docker:down      # Stop Docker containers
npm run docker:restart   # Restart Docker containers
npm run docker:logs      # View container logs (follow mode)
npm run docker:ps        # List running chatapp containers
npm run docker:clean     # Stop and remove containers + volumes
```

### Installation
```bash
npm run install:all      # Install all dependencies
npm run fresh            # Clean and reinstall everything
```

### Production Build
```bash
npm run build            # Build both backend + frontend
npm run build:backend    # Build only backend
npm run build:frontend   # Build only frontend
```

## 🗄️ Database Setup

**Using Docker (Recommended)**

We provide Docker containers for all services. Just run:

```bash
npm run docker:up
```

This starts:
- **PostgreSQL 15** (port 5432)
  - Database: `chatapp`
  - User: `postgres`
  - Password: `postgres123`
- **Redis 7** (port 6379)
- **MinIO** (ports 9000-9001)
  - Access Key: `minioadmin`
  - Secret Key: `minioadmin123`

**Manual Installation (Alternative)**

If you prefer to install services manually:

### PostgreSQL
```bash
createdb chatapp
psql -U postgres -d chatapp -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

Update `chat-backend/.env`:
```env
DATABASE_HOST=localhost
DATABASE_PASSWORD=your-password
DATABASE_NAME=chatapp
```

### Redis
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis
```

## 🔧 Environment Variables

### Backend (.env)
Create `chat-backend/.env`:
```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/chat_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### Frontend (.env)
Create `chat-web-client/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
VITE_ENABLE_AI=true
VITE_ENABLE_VIDEO_CALLS=true
```

## 📁 Project Structure

```
Communication App/
├── chat-backend/          # NestJS backend (180 TypeScript files)
├── chat-web-client/       # React frontend (130 TypeScript files)
├── realtime-service/      # WebRTC signaling server (8 TypeScript files)
├── package.json           # Root scripts (run both)
├── README.md             # This file - Quick start guide
├── CLAUDE.md             # Claude Code guidance
├── PROJECT_DOCUMENTATION.md # Complete file-by-file documentation (NEW)
├── PROJECT_ARCHITECTURE.md  # System architecture and design
└── comprehensive_chat_app_prompt.md # Master specification (4,500+ lines)
```

## ✨ Features

- ✅ Real-time messaging with Socket.IO
- ✅ WebRTC video/audio calls (peer-to-peer)
- ✅ User authentication (JWT)
- ✅ Workspaces & channels
- ✅ File sharing
- ✅ Presence & typing indicators
- ✅ Message reactions
- ✅ Stories (Instagram-style)
- ✅ AI-powered features (GPT integration)

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev:backend
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep chat_db
```

### WebSocket Issues
See `PROJECT_ARCHITECTURE.md` section "Current Issues & Solutions" for detailed WebSocket troubleshooting.

## 📚 Documentation

- **📖 Complete Documentation**: `PROJECT_DOCUMENTATION.md` - File-by-file tree view of all 318 files with inline explanations
- **🏗️ Architecture**: `PROJECT_ARCHITECTURE.md` - System architecture, design patterns, and technical decisions
- **📋 Specification**: `comprehensive_chat_app_prompt.md` - Full feature specification (4,500+ lines)
- **🤖 Claude Guidance**: `CLAUDE.md` - Claude Code AI assistant instructions

### Service-Specific Docs
- **Backend**: `chat-backend/README.md`, `chat-backend/ROADMAP.md`, `chat-backend/SMTP_SETUP_GUIDE.md`
- **Frontend**: `chat-web-client/README.md`, `chat-web-client/IMPLEMENTATION_GUIDE.md`
- **Realtime**: `realtime-service/README.md` (if exists)

## 🛠️ Technology Stack

**Backend:**
- NestJS 10.x
- PostgreSQL 15+
- Redis 7+
- Socket.IO
- TypeORM

**Frontend:**
- React 18
- TypeScript
- Vite 6.3.5
- ShadCN UI
- Tailwind CSS v4
- Zustand + React Query

## 📄 License

MIT
