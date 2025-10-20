# Port Configuration - Communication App

**Last Updated**: October 20, 2025

---

## 🌐 Service Ports

### Development Environment

| Service              | Port | URL                             | Description           |
| -------------------- | ---- | ------------------------------- | --------------------- |
| **Backend API**      | 3000 | http://localhost:3000           | NestJS backend server |
| **Backend API (v1)** | 3000 | http://localhost:3000/api/v1/v1 | REST API endpoints    |
| **Swagger Docs**     | 3000 | http://localhost:3000/api/docs  | API documentation     |
| **WebSocket**        | 3000 | ws://localhost:3000             | Socket.IO real-time   |
| **Web Client**       | 5173 | http://localhost:5173           | React/Vite web app    |
| **PostgreSQL**       | 5432 | localhost:5432                  | Database              |
| **Redis**            | 6379 | localhost:6379                  | Cache & queue         |
| **MinIO API**        | 9000 | http://localhost:9000           | S3-compatible storage |
| **MinIO Console**    | 9001 | http://localhost:9001           | MinIO web UI          |

---

## 🚀 How to Start Services

### 1. Start Infrastructure (Docker)

```bash
cd chat-backend
docker-compose up -d

# Services started:
# - PostgreSQL on port 5432
# - Redis on port 6379
# - MinIO on ports 9000 (API) and 9001 (Console)
```

### 2. Start Backend API

```bash
cd chat-backend
npm run start:dev

# Backend running on:
# - API: http://localhost:3000
# - Endpoints: http://localhost:3000/api/v1/v1
# - Docs: http://localhost:3000/api/docs
# - WebSocket: ws://localhost:3000
```

### 3. Start Web Client

```bash
cd chat-web-client
npm run dev

# Web client running on:
# - URL: http://localhost:5173
# - Auto-opens in browser
```

---

## 🔧 Configuration Files

### Backend Port Configuration

**File**: `chat-backend/src/main.ts`

```typescript
const port = process.env.PORT || 3000;
await app.listen(port);
```

**Environment**: `chat-backend/.env`

```bash
PORT=3000
```

### Web Client Port Configuration

**File**: `chat-web-client/vite.config.ts`

```typescript
server: {
  port: 5173,
  open: true,
  host: true,
}
```

**Environment**: `chat-web-client/.env.development`

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
VITE_STORAGE_URL=http://localhost:9000/chatapp-media
```

---

## 🌍 Production Configuration

### Production Ports (Example)

| Service                   | Port   | URL                 | Notes            |
| ------------------------- | ------ | ------------------- | ---------------- |
| **Nginx (Reverse Proxy)** | 80/443 | https://chatapp.com | SSL/HTTPS        |
| **Backend API**           | 3000   | Internal            | Not exposed      |
| **Web Client**            | 5173   | Internal            | Served by Nginx  |
| **PostgreSQL**            | 5432   | Internal            | Not exposed      |
| **Redis**                 | 6379   | Internal            | Not exposed      |
| **MinIO**                 | 9000   | Internal            | Proxied by Nginx |

### Nginx Configuration (Production)

```nginx
# API proxy
location /api {
    proxy_pass http://localhost:3000;
}

# WebSocket proxy
location /socket.io {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Web client (static files)
location / {
    root /var/www/chat-web-client/build;
    try_files $uri $uri/ /index.html;
}

# Storage proxy
location /storage {
    proxy_pass http://localhost:9000;
}
```

---

## 🔍 Port Conflict Resolution

### If Port 5173 is Already in Use

```bash
# Option 1: Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Option 2: Change port in vite.config.ts
server: {
  port: 5174,  // or any other available port
}

# Option 3: Specify port when starting
npm run dev -- --port 5174
```

### If Port 3000 is Already in Use

```bash
# Option 1: Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Change port in .env
PORT=3001

# Then update web client .env.development
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
```

---

## 📱 Cross-Platform Ports

### Mobile Development

**iOS Simulator**:

- Use `http://localhost:5173` (works directly)
- Or use Mac IP: `http://192.168.1.x:5173`

**Android Emulator**:

- Use `http://10.0.2.2:5173` (Android emulator alias for localhost)
- Or use Mac IP: `http://192.168.1.x:5173`

**Physical Devices**:

- Use Mac/PC IP address: `http://192.168.1.x:5173`
- Ensure devices are on same network
- Update `.env.development` with local IP

### Desktop (Electron/Tauri)

Desktop apps will use the same ports as web client:

- API: `http://localhost:3000`
- Web Client: `http://localhost:5173` (during development)
- Production: Bundled with app

---

## 🧪 Testing Endpoints

### Quick Health Checks

```bash
# Test Backend API
curl http://localhost:3000/api/v1/v1/auth/login

# Test Web Client
curl http://localhost:5173

# Test PostgreSQL
docker exec chatapp-postgres psql -U postgres -c "SELECT 1"

# Test Redis
docker exec chatapp-redis redis-cli PING

# Test MinIO
curl http://localhost:9000/minio/health/live
```

### WebSocket Connection Test

```javascript
// In browser console at http://localhost:5173
const socket = io("http://localhost:3000");
socket.on("connect", () => console.log("Connected!"));
```

---

## 🔐 Firewall & Security

### Development (Localhost Only)

All ports are bound to localhost by default - no external access needed.

### Production Firewall Rules

```bash
# Allow only HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to backend services
sudo ufw deny 3000/tcp
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp
sudo ufw deny 9000/tcp
```

---

## 📊 Port Usage Summary

```
Development Environment:
┌─────────────────────────────────────────────┐
│  Browser (http://localhost:5173)           │
│           ↓ API Requests                    │
│  Backend (http://localhost:3000)           │
│           ↓                                 │
│  PostgreSQL (localhost:5432)               │
│  Redis (localhost:6379)                    │
│  MinIO (localhost:9000)                    │
└─────────────────────────────────────────────┘

Production Environment:
┌─────────────────────────────────────────────┐
│  Internet (https://chatapp.com)            │
│           ↓                                 │
│  Nginx (port 80/443)                       │
│      ├── /api → Backend (port 3000)        │
│      ├── /    → Web Client (static)        │
│      └── /storage → MinIO (port 9000)      │
│                                             │
│  Internal Services:                        │
│  - PostgreSQL (port 5432)                  │
│  - Redis (port 6379)                       │
└─────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

After starting all services, verify:

- [ ] Backend API: http://localhost:3000/api/v1/v1
- [ ] Swagger Docs: http://localhost:3000/api/docs
- [ ] Web Client: http://localhost:5173
- [ ] PostgreSQL: Port 5432 accessible
- [ ] Redis: Port 6379 accessible
- [ ] MinIO API: http://localhost:9000
- [ ] MinIO Console: http://localhost:9001

All services should be accessible without port conflicts!

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
