# Enterprise Chat Application - NestJS Backend

Production-ready backend for the Comprehensive Enterprise Chat Application. Built with NestJS, TypeScript, PostgreSQL, Redis, MinIO, and Jitsi Meet.

## 🏗️ Current Status

### ✅ Completed

**Phase 1: Project Foundation & Infrastructure**
- ✅ NestJS project initialization
- ✅ TypeScript configuration with strict mode
- ✅ ESLint & Prettier setup
- ✅ Docker Compose infrastructure (PostgreSQL, Redis, MinIO, Jitsi)
- ✅ Environment configuration
- ✅ Logging setup (Winston + Morgan)
- ✅ Swagger API documentation setup
- ✅ Global validation pipes
- ✅ CORS & security (Helmet)

### 🚧 In Progress

**Phase 2: Database & Core Infrastructure**
- 🔄 TypeORM setup
- 🔄 Database entities
- 🔄 Core utilities (decorators, guards, filters, interceptors)

### 📋 Remaining Work

According to the comprehensive specification (`comprehensive_chat_app_prompt.md`), the following modules need to be implemented:

1. **Auth Module** - JWT, OAuth (Google, GitHub, Microsoft), MFA, password reset
2. **Users Module** - Profiles, settings, privacy, blocking
3. **Conversations Module** - Direct, group, channel conversations
4. **Messages Module** - Text, media, reactions, WebSocket gateway
5. **Groups Module** - Roles, permissions, invite links
6. **Channels Module** - Broadcast channels
7. **Calls Module** - Jitsi integration, call history
8. **Media Module** - MinIO storage, thumbnails, compression
9. **Workspaces Module** - Organizations, SSO, teams
10. **Notifications Module** - Push (FCM), email, in-app
11. **Stories Module** - 24hr content, auto-expiration
12. **Presence Module** - Online status, typing indicators
13. **Search Module** - Full-text search, filters
14. **Webhooks Module** - Integrations, chatbots
15. **AI Module** - OpenAI integration (smart replies, enhancement, transcription)
16. **Subscriptions Module** - Stripe integration, feature gating

**Estimated remaining development time:** 12-14 days

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Installation

1. **Clone and navigate:**
```bash
cd chat-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start infrastructure (Docker):**
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- MinIO on `localhost:9000` (Console: `localhost:9001`)
- Jitsi Meet on `localhost:8000`

5. **Run migrations** (when implemented):
```bash
npm run migration:run
```

6. **Start development server:**
```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **API Docs**: http://localhost:3000/api/docs

## 📁 Project Structure

```
chat-backend/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   ├── config/                      # Configuration
│   │   └── configuration.ts
│   ├── common/                      # Shared utilities
│   │   ├── decorators/              # Custom decorators
│   │   ├── filters/                 # Exception filters
│   │   ├── guards/                  # Auth guards
│   │   ├── interceptors/            # Request/response interceptors
│   │   ├── pipes/                   # Validation pipes
│   │   ├── middleware/              # Custom middleware
│   │   ├── interfaces/              # Shared interfaces
│   │   ├── types/                   # Type definitions
│   │   ├── constants/               # App constants
│   │   └── utils/                   # Utility functions
│   ├── database/                    # Database layer
│   │   ├── database.module.ts
│   │   ├── migrations/
│   │   └── seeds/
│   ├── modules/                     # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── messages/
│   │   ├── conversations/
│   │   ├── groups/
│   │   ├── channels/
│   │   ├── calls/
│   │   ├── media/
│   │   ├── workspaces/
│   │   ├── notifications/
│   │   ├── stories/
│   │   ├── presence/
│   │   ├── search/
│   │   ├── webhooks/
│   │   ├── ai/
│   │   └── subscriptions/
│   └── jobs/                        # Background jobs
│       ├── processors/
│       └── schedulers/
├── test/                            # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run start          # Start production mode
npm run start:dev      # Start with hot-reload
npm run start:debug    # Start in debug mode

# Build
npm run build          # Build for production

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run E2E tests

# Linting & Formatting
npm run lint           # Lint code
npm run format         # Format code

# Database
npm run migration:generate  # Generate migration
npm run migration:run       # Run migrations
npm run migration:revert    # Revert last migration
```

## 🔐 Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=chatapp

# JWT
JWT_SECRET=your-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Optional Services

- **OpenAI API**: For AI features (smart replies, translation, enhancement)
- **Stripe**: For subscription management
- **SMTP**: For email notifications
- **FCM/OneSignal**: For push notifications
- **OAuth**: Google, GitHub, Microsoft for social login

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 🐳 Docker

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Production Build

```bash
# Build production image
docker build -t chatapp-backend:latest .

# Run production container
docker run -p 3000:3000 --env-file .env chatapp-backend:latest
```

## 📦 Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15+ with TypeORM
- **Cache**: Redis 7+
- **Message Queue**: Bull Queue
- **Real-time**: Socket.IO
- **File Storage**: MinIO (S3-compatible)
- **Video Calls**: Jitsi Meet
- **Authentication**: JWT + Refresh Tokens, Passport.js
- **Validation**: class-validator, class-transformer
- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Logging**: Winston, Morgan

## 🔗 Integration with React Frontend

The React web client (`chat-web-client/`) is ready and waiting for this backend. Once core modules are implemented:

1. Update React app's API base URL to `http://localhost:3000/api/v1`
2. Replace mock data with real API calls
3. Implement WebSocket connection for real-time features
4. Connect AI features to OpenAI endpoints
5. Integrate Stripe for subscriptions

## 📖 Next Steps

1. **Complete Database Setup**
   - Create all entity schemas (users, messages, conversations, etc.)
   - Set up migrations
   - Add indexes for performance

2. **Build Core Infrastructure**
   - Custom decorators (@CurrentUser, @Roles, @RequireFeature)
   - Exception filters (HTTP, WebSocket)
   - Guards (JWT, Roles, Feature Access)
   - Interceptors (Logging, Transform, Timeout)

3. **Implement Auth Module** (Priority #1)
   - JWT authentication
   - Registration/Login
   - Password reset
   - OAuth integration
   - MFA (TOTP)

4. **Implement Users Module**
   - User CRUD
   - Profiles
   - Settings
   - Privacy controls

5. **Continue with remaining modules** according to `comprehensive_chat_app_prompt.md`

## 🤝 Contributing

This backend follows the coding standards defined in `comprehensive_chat_app_prompt.md`:

- TypeScript strict mode
- 80% minimum test coverage
- ESLint & Prettier compliance
- Comprehensive error handling
- JSDoc for public APIs

## 📄 License

MIT

## 📞 Support

See `comprehensive_chat_app_prompt.md` for complete technical specification and implementation guidelines.
