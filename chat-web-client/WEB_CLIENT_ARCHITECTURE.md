# Web Client Architecture & Integration Plan

**Project**: Communication App Web Client
**Framework**: React + TypeScript + Vite
**Backend**: NestJS API (localhost:3000)
**Status**: Refactoring from mock data to real API integration

---

## 🎯 Objectives

1. **Replace mock data** with real backend API integration
2. **Implement state management** using Zustand for client state + TanStack Query for server state
3. **Add WebSocket support** for real-time features
4. **Ensure cross-platform compatibility** (Web + Desktop via Tauri/Electron)
5. **Maintain responsive design** (existing mobile/tablet/desktop support)
6. **Follow backend architecture patterns** (clean, organized, scalable)

---

## 📁 New Project Structure

```
chat-web-client/
├── src/
│   ├── main.tsx                          # App entry point
│   ├── App.tsx                           # Root component
│   ├── vite-env.d.ts                     # Vite types
│   │
│   ├── config/                           # ✨ NEW
│   │   ├── api.config.ts                 # API configuration
│   │   ├── websocket.config.ts           # WebSocket configuration
│   │   └── constants.ts                  # App constants
│   │
│   ├── lib/                              # ✨ NEW - Core utilities
│   │   ├── api/                          # API client layer
│   │   │   ├── client.ts                 # Axios instance
│   │   │   ├── interceptors.ts           # Request/response interceptors
│   │   │   ├── endpoints/                # API endpoint wrappers
│   │   │   │   ├── auth.api.ts
│   │   │   │   ├── users.api.ts
│   │   │   │   ├── conversations.api.ts
│   │   │   │   ├── messages.api.ts
│   │   │   │   ├── groups.api.ts
│   │   │   │   ├── channels.api.ts
│   │   │   │   ├── media.api.ts
│   │   │   │   ├── calls.api.ts
│   │   │   │   ├── stories.api.ts
│   │   │   │   ├── notifications.api.ts
│   │   │   │   ├── search.api.ts
│   │   │   │   ├── ai.api.ts
│   │   │   │   ├── webhooks.api.ts
│   │   │   │   └── presence.api.ts
│   │   │   └── index.ts                  # Barrel export
│   │   │
│   │   ├── websocket/                    # WebSocket layer
│   │   │   ├── socket.ts                 # Socket.IO client
│   │   │   ├── events.ts                 # Event handlers
│   │   │   └── hooks.ts                  # WebSocket hooks
│   │   │
│   │   ├── stores/                       # Zustand stores (client state)
│   │   │   ├── auth.store.ts             # Auth state
│   │   │   ├── ui.store.ts               # UI state (theme, sidebar, etc.)
│   │   │   ├── conversation.store.ts     # Selected conversation
│   │   │   ├── typing.store.ts           # Typing indicators
│   │   │   └── presence.store.ts         # User presence
│   │   │
│   │   ├── hooks/                        # Custom React hooks
│   │   │   ├── useAuth.ts                # Auth hooks
│   │   │   ├── useConversations.ts       # TanStack Query for conversations
│   │   │   ├── useMessages.ts            # TanStack Query for messages
│   │   │   ├── useUsers.ts               # TanStack Query for users
│   │   │   ├── useGroups.ts
│   │   │   ├── useChannels.ts
│   │   │   ├── useStories.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── useSearch.ts
│   │   │   ├── useAI.ts
│   │   │   ├── useCalls.ts
│   │   │   ├── useFileUpload.ts
│   │   │   └── useWebSocket.ts
│   │   │
│   │   └── utils/                        # Utility functions
│   │       ├── date.ts                   # Date formatting
│   │       ├── file.ts                   # File handling
│   │       ├── validation.ts             # Form validation
│   │       ├── encryption.ts             # Client-side encryption helpers
│   │       └── helpers.ts                # General helpers
│   │
│   ├── types/                            # ✨ NEW - TypeScript types
│   │   ├── api.types.ts                  # API response types
│   │   ├── entities.types.ts             # Entity types (User, Message, etc.)
│   │   ├── websocket.types.ts            # WebSocket event types
│   │   └── ui.types.ts                   # UI-specific types
│   │
│   ├── components/                       # React components
│   │   ├── auth/                         # ✨ REFACTORED
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── OAuthButtons.tsx
│   │   │   └── AuthScreen.tsx            # Main auth screen
│   │   │
│   │   ├── chat/                         # ✨ REFACTORED
│   │   │   ├── ChatInterface.tsx         # Main chat layout
│   │   │   ├── ConversationList.tsx      # Left sidebar
│   │   │   ├── ChatWindow.tsx            # Message area
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── MessageReactions.tsx
│   │   │   └── MessageContextMenu.tsx
│   │   │
│   │   ├── groups/                       # ✨ REFACTORED
│   │   │   ├── GroupCreation.tsx
│   │   │   ├── GroupSettings.tsx
│   │   │   ├── GroupMembers.tsx
│   │   │   └── GroupInviteLink.tsx
│   │   │
│   │   ├── channels/                     # ✨ NEW
│   │   │   ├── ChannelCreation.tsx
│   │   │   ├── ChannelSettings.tsx
│   │   │   └── ChannelSubscribers.tsx
│   │   │
│   │   ├── media/                        # ✨ REFACTORED
│   │   │   ├── FilePreview.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   └── VideoPlayer.tsx
│   │   │
│   │   ├── calls/                        # ✨ REFACTORED
│   │   │   ├── VideoCallScreen.tsx
│   │   │   ├── IncomingCallDialog.tsx
│   │   │   └── CallControls.tsx
│   │   │
│   │   ├── stories/                      # ✨ REFACTORED
│   │   │   ├── StoriesView.tsx
│   │   │   ├── StoryCreator.tsx
│   │   │   ├── StoryViewer.tsx
│   │   │   └── StoryReplies.tsx
│   │   │
│   │   ├── search/                       # ✨ REFACTORED
│   │   │   ├── GlobalSearch.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── SearchFilters.tsx
│   │   │
│   │   ├── ai/                           # ✨ REFACTORED
│   │   │   ├── AIAssistant.tsx
│   │   │   ├── SmartReplies.tsx
│   │   │   ├── MessageEnhancer.tsx
│   │   │   └── TranslationPanel.tsx
│   │   │
│   │   ├── notifications/                # ✨ REFACTORED
│   │   │   ├── NotificationsPanel.tsx
│   │   │   ├── NotificationItem.tsx
│   │   │   └── NotificationSettings.tsx
│   │   │
│   │   ├── user/                         # ✨ REFACTORED
│   │   │   ├── UserProfile.tsx
│   │   │   ├── ProfileSettings.tsx
│   │   │   └── PresenceStatus.tsx
│   │   │
│   │   ├── workspace/                    # ✨ NEW
│   │   │   ├── WorkspaceView.tsx
│   │   │   ├── WorkspaceSettings.tsx
│   │   │   └── TeamManagement.tsx
│   │   │
│   │   ├── common/                       # ✨ NEW - Shared components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── ui/                           # ShadCN UI components (existing)
│   │   │   └── [60+ components]
│   │   │
│   │   └── figma/                        # Figma-specific (existing)
│   │       └── ImageWithFallback.tsx
│   │
│   ├── pages/                            # ✨ NEW (optional routing)
│   │   ├── HomePage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── SettingsPage.tsx
│   │
│   └── styles/                           # Styles
│       ├── index.css                     # Global styles
│       └── themes/                       # Theme configurations
│           ├── light.css
│           └── dark.css
│
├── public/                               # Static assets
│   ├── icons/
│   ├── images/
│   └── sounds/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── .env.development                      # ✨ NEW
├── .env.production                       # ✨ NEW
└── WEB_CLIENT_ARCHITECTURE.md            # This file
```

---

## 🔧 Technology Stack

### Core Dependencies (NEW)
```json
{
  "@tanstack/react-query": "^5.x",      // Server state management
  "zustand": "^4.x",                      // Client state management
  "axios": "^1.x",                        // HTTP client
  "socket.io-client": "^4.x",            // WebSocket client
  "react-router-dom": "^6.x",            // Routing (optional)
  "zod": "^3.x",                         // Schema validation
  "@hookform/resolvers": "^3.x",         // Form validation
  "date-fns": "^3.x",                    // Date utilities
  "immer": "^10.x"                       // Immutable state updates
}
```

### Existing Dependencies (Keep)
- React 18.3+
- TypeScript
- Vite
- Tailwind CSS v4
- ShadCN UI components
- Radix UI primitives
- React Hook Form
- Lucide React icons

---

## 🏗️ Architecture Patterns

### 1. State Management Strategy

**Client State** (Zustand) - UI and ephemeral data:
- Authentication state
- UI preferences (theme, sidebar open/closed)
- Selected conversation
- Typing indicators
- User presence

**Server State** (TanStack Query) - API data:
- Conversations list
- Messages
- User profiles
- Groups/Channels
- Notifications
- Search results
- AI responses

**Benefits**:
- Separation of concerns
- Automatic caching and revalidation
- Optimistic updates
- Background refetching
- Offline support

### 2. API Client Architecture

**Layered Approach**:
```typescript
User Component
    ↓
Custom Hook (useMessages)
    ↓
TanStack Query
    ↓
API Service (messages.api.ts)
    ↓
Axios Client (with interceptors)
    ↓
Backend API
```

**Features**:
- Centralized error handling
- Automatic token refresh
- Request/response transformation
- Retry logic
- Loading states
- Optimistic updates

### 3. Real-time Communication

**WebSocket Architecture**:
```typescript
Backend Socket.IO Server
    ↓
Socket Client (socket.ts)
    ↓
Event Handlers (events.ts)
    ↓
Zustand Store Updates
    ↓
React Components Re-render
```

**Event Types**:
- `message:new` - New message received
- `message:updated` - Message edited/deleted
- `message:reaction` - Reaction added/removed
- `user:typing` - User typing indicator
- `user:online` - User online status
- `user:offline` - User offline status
- `conversation:updated` - Conversation metadata changed
- `notification:new` - New notification

### 4. File Upload Strategy

**Upload Flow**:
1. Select file from file picker
2. Validate file (type, size)
3. Generate thumbnail (images/videos)
4. Upload to MinIO via backend API
5. Show progress indicator
6. Get file URL from response
7. Send message with file attachment

**Features**:
- Drag and drop support
- Multiple file selection
- Upload progress tracking
- Pause/resume uploads (chunked)
- Client-side image compression
- Thumbnail generation

---

## 🔐 Authentication Flow

### Login Process
```typescript
1. User enters credentials
2. Call POST /auth/login
3. Receive accessToken + refreshToken
4. Store tokens in localStorage (encrypted)
5. Set auth state in Zustand
6. Initialize WebSocket connection
7. Fetch user profile
8. Redirect to chat interface
```

### Token Refresh
```typescript
1. API request receives 401 Unauthorized
2. Interceptor catches error
3. Call POST /auth/refresh with refreshToken
4. Get new accessToken
5. Retry original request
6. If refresh fails → logout user
```

### Protected Routes
```typescript
<ProtectedRoute>
  <ChatInterface />
</ProtectedRoute>
```

---

## 📡 API Integration Examples

### Example 1: Fetch Conversations
```typescript
// lib/hooks/useConversations.ts
import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '@/lib/api';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.getAll,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Component usage
const { data: conversations, isLoading } = useConversations();
```

### Example 2: Send Message
```typescript
// lib/hooks/useMessages.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messagesApi.send,
    onMutate: async (newMessage) => {
      // Optimistic update
      await queryClient.cancelQueries(['messages', conversationId]);
      const previous = queryClient.getQueryData(['messages', conversationId]);
      queryClient.setQueryData(['messages', conversationId], (old) =>
        [...old, { ...newMessage, id: 'temp', status: 'sending' }]
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversations']);
    },
  });
}
```

### Example 3: WebSocket Real-time Updates
```typescript
// lib/websocket/events.ts
import { socket } from './socket';
import { useConversationStore } from '@/lib/stores';
import { queryClient } from '@/main';

export function setupMessageListeners() {
  socket.on('message:new', (message) => {
    // Update TanStack Query cache
    queryClient.setQueryData(['messages', message.conversationId], (old) =>
      [...old, message]
    );

    // Update conversation last message
    queryClient.invalidateQueries(['conversations']);

    // Show notification if not in active conversation
    const activeConversation = useConversationStore.getState().activeId;
    if (activeConversation !== message.conversationId) {
      showNotification(message);
    }
  });
}
```

---

## 🎨 Component Refactoring Strategy

### Before (Mock Data)
```typescript
// OLD: ChatWindow.tsx
const [messages, setMessages] = useState(mockMessages);

function sendMessage(text: string) {
  const newMessage = {
    id: Date.now(),
    text,
    sender: currentUser,
    timestamp: new Date(),
  };
  setMessages([...messages, newMessage]);
}
```

### After (Real API)
```typescript
// NEW: ChatWindow.tsx
import { useMessages, useSendMessage } from '@/lib/hooks';

const { data: messages, isLoading } = useMessages(conversationId);
const sendMessageMutation = useSendMessage(conversationId);

function sendMessage(text: string) {
  sendMessageMutation.mutate({
    conversationId,
    content: text,
    type: 'text',
  });
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Install dependencies
- [ ] Setup API client with Axios
- [ ] Configure TanStack Query
- [ ] Setup Zustand stores
- [ ] Create type definitions
- [ ] Configure environment variables

### Phase 2: Authentication (Week 1)
- [ ] Implement login/register forms
- [ ] Token management
- [ ] Protected routes
- [ ] OAuth integration
- [ ] Auto token refresh

### Phase 3: Core Messaging (Week 2)
- [ ] Conversations list API integration
- [ ] Messages API integration
- [ ] Send/receive messages
- [ ] WebSocket setup
- [ ] Real-time message updates
- [ ] Typing indicators

### Phase 4: Media & Files (Week 2)
- [ ] File upload to MinIO
- [ ] Image preview
- [ ] Video player
- [ ] File download
- [ ] Drag & drop

### Phase 5: Advanced Features (Week 3)
- [ ] Groups/Channels
- [ ] Stories
- [ ] Search
- [ ] AI features
- [ ] Video calls (Jitsi)
- [ ] Notifications

### Phase 6: Polish & Testing (Week 3)
- [ ] Error handling
- [ ] Loading states
- [ ] Offline support
- [ ] Cross-platform testing
- [ ] Performance optimization
- [ ] Documentation

---

## 🌐 Cross-Platform Support

### Web Browser
- Responsive design (existing)
- PWA support (add manifest.json)
- Service worker for offline
- Web Push notifications

### Desktop (Tauri/Electron)
- Native window controls
- System tray integration
- Native notifications
- Deep linking
- Auto-updates

**Tauri Configuration** (Recommended - smaller bundle):
```json
{
  "tauri": {
    "bundle": {
      "identifier": "com.chatapp.desktop",
      "windows": {
        "title": "ChatApp"
      }
    },
    "security": {
      "csp": "default-src 'self'; connect-src 'self' http://localhost:3000 ws://localhost:3000"
    }
  }
}
```

---

## 📝 Environment Variables

### .env.development
```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_STORAGE_URL=http://localhost:9000/chatapp-media
VITE_JITSI_DOMAIN=meet.jit.si
```

### .env.production
```bash
VITE_API_URL=https://api.chatapp.com/api/v1
VITE_WS_URL=wss://api.chatapp.com
VITE_STORAGE_URL=https://storage.chatapp.com
VITE_JITSI_DOMAIN=meet.chatapp.com
```

---

## 🧪 Testing Strategy

### Unit Tests
- API service functions
- Utility functions
- Custom hooks (React Testing Library)

### Integration Tests
- Authentication flow
- Message sending/receiving
- File upload
- WebSocket events

### E2E Tests (Playwright)
- User registration → login → send message
- Create group → add members
- Upload file → preview → download
- Make video call

---

## 📦 Build & Deployment

### Build for Web
```bash
npm run build
# Output: dist/
```

### Build for Desktop (Tauri)
```bash
npm run tauri build
# Output: src-tauri/target/release/
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

---

## 🎯 Performance Optimization

1. **Code Splitting**: Lazy load routes and heavy components
2. **Image Optimization**: WebP format, lazy loading, responsive images
3. **Bundle Size**: Tree shaking, minimize dependencies
4. **Caching**: TanStack Query cache, service worker
5. **Virtual Scrolling**: For long message lists (react-window)
6. **Debouncing**: Search inputs, typing indicators
7. **Memoization**: React.memo, useMemo, useCallback

---

## 📚 Resources

### Documentation
- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://zustand-demo.pmnd.rs/
- Socket.IO Client: https://socket.io/docs/v4/client-api/
- Axios: https://axios-http.com/
- Tauri: https://tauri.app/

### Backend API
- Base URL: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api/docs
- WebSocket: ws://localhost:3000

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Status**: Architecture Defined - Ready for Implementation
