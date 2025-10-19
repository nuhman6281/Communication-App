# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

This workspace is designed to build a **comprehensive enterprise chat platform** combining features from Slack, Microsoft Teams, WhatsApp, Zoho Cliq, and Instagram. The complete specification is in `comprehensive_chat_app_prompt.md` (4,500+ lines).

### Current State

Currently contains the **web/desktop UI client** (`chat-web-client/`) - a React/TypeScript interface generated from Figma designs. This is a production-ready UI layer using **mock data**, designed to integrate with a full-stack backend.

### Planned Workspace Structure

```
Communication App/
├── chat-web-client/              # React/Vite web & desktop UI (CURRENT)
├── chat-backend/                 # NestJS + PostgreSQL + Redis (PLANNED)
├── chat-mobile/                  # Flutter mobile app (PLANNED)
├── shared/                       # Shared types and utilities (PLANNED)
├── comprehensive_chat_app_prompt.md  # Master specification (4,500 lines)
└── CLAUDE.md                     # This file
```

## Full Platform Vision

The complete platform includes:

### Backend Stack (NestJS - Specified in comprehensive_chat_app_prompt.md)
- **Framework:** NestJS with TypeScript (strict mode)
- **Database:** PostgreSQL 15+ with TypeORM
- **Cache:** Redis 7+
- **Message Queue:** Bull Queue
- **Real-time:** Socket.IO for WebSockets
- **Video:** Jitsi Meet (self-hosted)
- **Storage:** MinIO (S3-compatible)
- **Auth:** JWT + Refresh Tokens, OAuth2, MFA
- **Deployment:** Docker + Docker Compose + Nginx

### Features Roadmap
1. **Authentication** - Email/phone, OAuth (Google, GitHub, Microsoft), MFA, password reset
2. **Messaging** - 1-on-1, groups (256 members), channels, threads, reactions, markdown
3. **Media** - Images, videos, audio, documents, GIFs, stickers, location sharing, polls
4. **Real-time** - Typing indicators, read receipts, presence, live location
5. **Calls** - Jitsi integration (video/audio, screen share, recording, up to 50 participants)
6. **Workspaces** - Organizations, teams, departments, SSO (SAML 2.0), roles/permissions
7. **Search** - Global search with filters, hashtags, saved messages
8. **Stories** - Instagram-style 24hr disappearing content
9. **Advanced** - E2E encryption (Signal Protocol), self-destruct messages, bots, webhooks
10. **AI Features** - Smart replies, translation, enhancement, transcription, summarization

## Chat Web Client (Current Implementation)

Located in `chat-web-client/`

A React/TypeScript/Vite application providing the web and desktop UI interface. Generated from Figma designs with production-ready components.

### Development Commands

Navigate to the application directory first:
```bash
cd chat-web-client
```

**Installation:**
```bash
npm i
```

**Development Server:**
```bash
npm run dev
```
Starts Vite dev server on port 3000 with auto-open browser.

**Build:**
```bash
npm run build
```
Builds production bundle to `build/` directory with ESNext target.

### Architecture

The app follows a **view-based routing pattern** with a central `ChatInterface` component:

**Authentication Flow:** `AuthScreen` → `ChatInterface` (managed in `src/App.tsx`)

**View Types:** `chat`, `profile`, `settings`, `video-call`, `stories`, `workspace`, `create-group`

**State Management:** React hooks-based state (no external state management library currently)

**Responsive Design:** Mobile-first with breakpoints at 768px (tablet) and 1024px (desktop)

**Component Hierarchy:**
```
App
└── AuthScreen (if not authenticated)
└── ChatInterface (if authenticated)
    ├── Sidebar (navigation)
    ├── ConversationList (left panel, 320-384px width)
    ├── ChatWindow (main content, flex-1)
    └── NotificationsPanel (conditional right panel, 360px width)
```

### Implemented Features

1. **Global Search** (`GlobalSearch.tsx`)
   - Triggered via Cmd/Ctrl+K keyboard shortcut
   - Searches messages, conversations, files, contacts
   - Recent searches history
   - Filter by type

2. **AI Assistant** (`AIAssistant.tsx`)
   - Premium feature gating system
   - Smart replies (free tier)
   - Message enhancement with tone adjustment (premium: professional, casual, formal)
   - Translation support (free tier)
   - Loading states and upgrade prompts

3. **Notifications Panel** (`NotificationsPanel.tsx`)
   - Real-time notification center
   - Categorized by type (messages, mentions, calls, groups, system)
   - Mark as read/unread functionality
   - Direct conversation navigation

4. **File Preview** (`FilePreview.tsx`)
   - Multi-format support: images, videos, PDFs, audio
   - Zoom and rotation controls for images
   - Download and share functionality
   - File metadata display

5. **Video Calling** (`VideoCallScreen.tsx`)
   - Designed for Jitsi Meet integration
   - Screen sharing and recording capabilities
   - Group video call support

6. **Stories View** (`StoriesView.tsx`)
   - Instagram-style stories interface
   - 24-hour disappearing content UI

7. **Workspace View** (`WorkspaceView.tsx`)
   - Team/organization management interface
   - Channel and member management

### UI Component System

Uses **ShadCN UI** components built on **Radix UI primitives** with **Tailwind CSS v4**:
- UI components: `src/components/ui/` (60+ production-ready components)
- Custom components: `src/components/`
- Path alias `@` resolves to `./src` (configured in `vite.config.ts`)

**Available ShadCN Components:**
- Layout: Card, Separator, Tabs, Sheet, Sidebar
- Forms: Input, Textarea, Select, Checkbox, Radio, Switch
- Feedback: Alert, Badge, Progress, Skeleton, Toast (Sonner)
- Navigation: Breadcrumb, Menubar, Navigation Menu, Pagination
- Overlays: Dialog, Drawer, Popover, Tooltip, Hover Card
- Data Display: Avatar, Table, Calendar, Chart
- Interactive: Button, Dropdown Menu, Context Menu, Command

### State Management Patterns

- **Local Component State:** `useState` for isolated state
- **Prop Drilling:** Parent-child communication (no context providers currently)
- **View State:** Centralized in `ChatInterface` (`currentView`, `selectedConversation`, etc.)
- **Mobile Responsiveness:** `showConversationList` controls mobile layout toggling

### Mobile Layout Logic

Conversation list and chat window share viewport on mobile:
- `selectedConversation` set + `showConversationList` false → show only ChatWindow
- `showConversationList` true → show only ConversationList
- Desktop (`md:` breakpoint) → both visible side-by-side

### Styling System

- **CSS Variables:** Defined in `src/index.css` for theme customization
- **Dark Mode:** CSS variable overrides in `.dark` class
- **Tailwind Classes:** Primary styling with custom utilities
- **Breakpoints:**
  - Mobile: `< 768px` (full-width, stacked)
  - Tablet: `768-1024px` (two-column)
  - Desktop: `> 1024px` (three-column with side panels)

### Component Width Standards
- ConversationList: `w-80` (320px) to `lg:w-96` (384px)
- NotificationsPanel: `w-96` (360px, fixed)
- Sidebar: Icon-based, minimal width
- ChatWindow: `flex-1` (fills remaining space)

### Component Imports

Direct imports without barrel exports:
```tsx
import { ComponentName } from './components/ComponentName';
```

### Vite Configuration

Contains extensive package version aliases for dependency resolution. Check `vite.config.ts` when adding new dependencies.

## AI Features & Subscription System

### Free Tier Features
- **Smart Replies** - AI-generated quick reply suggestions (GPT-3.5 Turbo)
- **Basic Translation** - Translate messages to multiple languages (LibreTranslate)
- **Concise Formatting** - Message formatting improvements
- **Spam Detection** - Automatic spam/abuse detection

### Premium Tier Features
- **Message Enhancement** - Rewrite messages in professional, casual, or formal tones (GPT-4)
- **Meeting Transcription** - AI transcription of video/audio calls (Whisper)
- **Semantic Search** - AI-powered search with embeddings
- **Conversation Summarization** - Auto-generate meeting summaries and action items
- **AI Image Generation** - Create images from text prompts (DALL-E 3)

### Subscription Tiers (from comprehensive_chat_app_prompt.md)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1-on-1 chats, basic groups, smart replies, translation, 1GB storage |
| **Premium** | $9.99/mo | AI enhancement, transcription, 50GB storage, priority support |
| **Business** | $19.99/user/mo | Workspaces, SSO, admin controls, 500GB storage, SLA |
| **Enterprise** | Custom | Unlimited storage, dedicated support, on-premise option, SAML |

### Feature Gating Implementation

The `AIAssistant` component demonstrates feature gating:
- Check `isPremium` prop before enabling premium features
- Show upgrade prompts for locked features
- Graceful degradation for free tier users

## Backend Integration

### Current State
**Uses mock data** - All conversations, messages, users, notifications are hardcoded.

### Integration Points (for future backend)

When connecting to NestJS backend:

1. **WebSocket Connection**
   - Establish Socket.IO connection in `ChatInterface` or dedicated service
   - Real-time message updates
   - Typing indicators, presence updates
   - Notification events

2. **REST API Endpoints**
   - Authentication: `/auth/login`, `/auth/register`, `/auth/refresh`
   - Users: `/users/:id`, `/users/me`, `/users/:id/profile`
   - Messages: `/messages`, `/messages/:id`, `/conversations/:id/messages`
   - Conversations: `/conversations`, `/conversations/:id`
   - Media: `/media/upload`, `/media/:id`
   - AI: `/ai/smart-replies`, `/ai/enhance`, `/ai/translate`, `/ai/transcribe`
   - Search: `/search?q=query&type=messages`

3. **File Upload**
   - Target MinIO/S3 compatible storage
   - Multipart upload for large files
   - Thumbnail generation for images/videos
   - Progress tracking

4. **Authentication**
   - JWT access tokens (short-lived)
   - Refresh tokens (long-lived, stored in httpOnly cookies)
   - Auto-refresh mechanism
   - Logout and token invalidation

5. **State Management Migration**
   - Consider adding React Query or SWR for server state caching
   - Or use Zustand/Redux for global state management
   - Separate server state from UI state

See `chat-web-client/src/IMPLEMENTATION_GUIDE.md` for detailed integration examples and `comprehensive_chat_app_prompt.md` for complete backend API specifications.

## Testing Strategy

No tests currently implemented. When adding tests:

**Unit Tests (Jest):**
- Utility functions
- Component logic (hooks)
- State transformations

**Component Tests (React Testing Library):**
- User interactions
- Conditional rendering
- Form validations
- Feature gating logic

**E2E Tests (Cypress/Playwright):**
- Authentication flow
- Message sending/receiving
- File uploads
- Search functionality
- Video call initialization

**Focus Areas:**
- `ChatInterface` routing logic and state management
- Mobile responsive behavior with viewport mocking
- Premium feature gating
- WebSocket connection handling (when implemented)

## Development Workflow

### Figma-to-Code
- UI components follow Figma design specifications closely
- Component naming reflects Figma layer names
- Maintain visual fidelity while implementing functionality
- Original Figma: https://www.figma.com/design/D9dJL7nfJnTAN6FXlH7XLp/Comprehensive-Enterprise-Chat-Application

### Cross-Platform Considerations

**React Web Client** serves as reference for **Flutter mobile** app:
- Component structure mirrors Flutter widget hierarchy
- State patterns translate to Riverpod/Provider patterns
- UI layouts use flexbox to match Flutter's Row/Column patterns
- See `IMPLEMENTATION_GUIDE.md` for Flutter equivalents

**Desktop (Electron/Tauri):**
- Window resize handling
- Native menu integration
- System tray notifications
- Keyboard shortcuts

## Code Quality Standards

### TypeScript
- Strict mode enabled
- Use explicit types, avoid `any`
- Define interfaces for data structures
- Use type guards for runtime checks

### Component Structure
- Keep components small and focused
- Extract complex logic into custom hooks
- Use composition over inheritance
- Memoize expensive computations

### Styling
- Use Tailwind utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing (4px base grid)
- Use CSS variables for theming

### Performance
- Lazy load heavy components
- Implement virtual scrolling for long lists
- Optimize images (lazy loading, compression)
- Use React.memo() for expensive renders
- Debounce search inputs

## Resources

### Documentation
- Complete Specification: `comprehensive_chat_app_prompt.md`
- Implementation Guide: `chat-web-client/src/IMPLEMENTATION_GUIDE.md`
- NestJS Docs: https://docs.nestjs.com/
- ShadCN UI: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/
- Radix UI: https://www.radix-ui.com/

### Key Technologies
- **Frontend:** React 18, TypeScript, Vite, Tailwind v4, ShadCN UI
- **Backend (Planned):** NestJS, TypeORM, PostgreSQL, Redis, Socket.IO
- **Mobile (Planned):** Flutter, Riverpod, Dio, Socket.IO Client
- **Infrastructure (Planned):** Docker, Nginx, MinIO, Jitsi Meet

## Next Steps

### Short Term (Web Client)
1. Add React Query or SWR for API state management
2. Implement WebSocket service for real-time updates
3. Create API client service with Axios/Fetch
4. Add form validation with React Hook Form
5. Implement proper error boundaries
6. Add loading skeletons for better UX
7. Set up E2E testing

### Medium Term (Backend Integration)
1. Connect to NestJS backend (see comprehensive_chat_app_prompt.md for specs)
2. Implement JWT authentication flow
3. Replace mock data with real API calls
4. Set up WebSocket connections
5. Implement file upload to MinIO
6. Integrate OpenAI for AI features
7. Add Stripe for subscriptions

### Long Term (Platform Expansion)
1. Build NestJS backend (`chat-backend/`)
2. Build Flutter mobile app (`chat-mobile/`)
3. Set up Docker deployment
4. Implement Jitsi Meet integration
5. Add E2E encryption (Signal Protocol)
6. Set up CI/CD pipeline
7. Production deployment with monitoring
