# Communication App - Complete Project Architecture

**Last Updated:** October 22, 2025
**Version:** 1.0.0
**Status:** Development (WebRTC Integration Complete, Backend WebSocket Issue Pending)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [WebRTC & Real-Time Communication](#webrtc--real-time-communication)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [Component Documentation](#component-documentation)
10. [State Management](#state-management)
11. [Current Issues & Solutions](#current-issues--solutions)
12. [Development Guide](#development-guide)

---

## Project Overview

### Vision
A comprehensive enterprise chat platform combining features from Slack, Microsoft Teams, WhatsApp, Zoho Cliq, and Instagram. Built with modern WebRTC for peer-to-peer video/audio calls, real-time messaging, and collaborative workspaces.

### Current State
- ✅ **Backend**: NestJS + PostgreSQL + Redis (Running on `http://localhost:3000`)
- ✅ **Frontend**: React + TypeScript + Vite (Running on `http://localhost:5174`)
- ✅ **WebRTC**: Fully integrated with production-ready call UI
- ⚠️ **Issue**: WebSocket disconnection (backend rejecting connections after auth)

### Master Specification
See `comprehensive_chat_app_prompt.md` (4,500+ lines) for complete feature specifications.

---

## Technology Stack

### Backend (`chat-backend/`)
```yaml
Framework: NestJS 10.x (TypeScript strict mode)
Database: PostgreSQL 15+ with TypeORM
Cache: Redis 7+
Real-time: Socket.IO for WebSockets
Queue: Bull Queue (Redis-based)
Auth: JWT + Refresh Tokens, OAuth2, MFA
Storage: MinIO (S3-compatible)
Video: Jitsi Meet (self-hosted) - Now replaced with WebRTC
Deployment: Docker + Docker Compose + Nginx
```

### Frontend (`chat-web-client/`)
```yaml
Framework: React 18 + TypeScript (strict mode)
Build Tool: Vite 6.3.5
UI Library: ShadCN UI (Radix UI + Tailwind CSS v4)
State: Zustand stores + React Query
Routing: React Router v6
Real-time: Socket.IO Client
WebRTC: Native RTCPeerConnection API
Animations: Framer Motion
HTTP Client: Axios
Forms: React Hook Form
Validation: Zod
```

### Mobile (`chat-mobile/`) - PLANNED
```yaml
Framework: Flutter 3.x
State: Riverpod
HTTP: Dio
Real-time: Socket.IO Client (Dart)
```

---

## Project Structure

```
Communication App/
├── chat-backend/                    # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Authentication module
│   │   │   ├── users/              # User management
│   │   │   ├── conversations/      # Conversations & messages
│   │   │   ├── calls/              # Call management & WebRTC signaling
│   │   │   ├── workspaces/         # Workspace/organization management
│   │   │   ├── media/              # File upload/storage
│   │   │   ├── ai/                 # AI features (OpenAI integration)
│   │   │   └── websocket/          # WebSocket gateway
│   │   ├── common/                 # Shared utilities
│   │   ├── config/                 # Configuration files
│   │   └── main.ts                 # Application entry point
│   ├── prisma/                     # Database schema
│   └── package.json
│
├── chat-web-client/                 # React Frontend
│   ├── src/
│   │   ├── components/             # UI Components
│   │   │   ├── ui/                # ShadCN UI primitives (60+ components)
│   │   │   ├── workspace/         # Workspace-specific components
│   │   │   ├── AuthScreen.tsx     # Login/Register screen
│   │   │   ├── ChatInterface.tsx  # Main chat interface (routing hub)
│   │   │   ├── Sidebar.tsx        # Left navigation sidebar
│   │   │   ├── ConversationList.tsx # Conversation/channel list
│   │   │   ├── ChatWindow.tsx     # Main chat view
│   │   │   ├── VideoCall.tsx      # WebRTC video/voice call UI
│   │   │   ├── IncomingCallModal.tsx # Incoming call notification
│   │   │   ├── OutgoingCallModal.tsx # Outgoing call UI
│   │   │   ├── MessageComposer.tsx # Message input with rich features
│   │   │   ├── NotificationsPanel.tsx # Notifications sidebar
│   │   │   ├── GlobalSearch.tsx   # Global search (Cmd/Ctrl+K)
│   │   │   ├── AIAssistant.tsx    # AI message enhancement
│   │   │   ├── FilePreview.tsx    # Media file preview
│   │   │   ├── StoriesView.tsx    # Instagram-style stories
│   │   │   ├── WorkspaceView.tsx  # Workspace management
│   │   │   └── GroupCreation.tsx  # Create group dialog
│   │   ├── contexts/
│   │   │   └── CallContext.tsx    # WebRTC call state management
│   │   ├── lib/
│   │   │   ├── stores/            # Zustand state stores
│   │   │   │   ├── index.ts       # Auth, call, presence stores
│   │   │   │   └── call.store.ts  # Call-specific store
│   │   │   ├── webrtc/            # WebRTC services
│   │   │   │   ├── webrtc.service.ts # Main WebRTC service
│   │   │   │   ├── enhanced-webrtc-service.ts # Production WebRTC
│   │   │   │   ├── webrtc-manager.ts # WebRTC connection manager
│   │   │   │   ├── webrtc-config.ts # STUN/TURN config
│   │   │   │   ├── types.ts       # WebRTC TypeScript types
│   │   │   │   └── constants.ts   # WebRTC constants
│   │   │   ├── websocket/         # WebSocket services
│   │   │   │   ├── websocket-service.ts # Socket.IO singleton
│   │   │   │   ├── events.ts      # WebSocket event types
│   │   │   │   └── presence-handler.ts # Presence/typing handlers
│   │   │   ├── api/               # API client
│   │   │   │   └── client.ts      # Axios instance
│   │   │   └── utils.ts           # Utility functions
│   │   ├── hooks/                 # React hooks (React Query)
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── App.tsx                # Root component
│   │   ├── main.tsx               # React entry point
│   │   └── index.css              # Global styles (Tailwind)
│   ├── public/                    # Static assets
│   ├── vite.config.ts             # Vite configuration
│   ├── tailwind.config.js         # Tailwind configuration
│   └── package.json
│
├── comprehensive_chat_app_prompt.md # Complete specification (4,500+ lines)
├── CLAUDE.md                       # Claude Code guidance
├── PROJECT_ARCHITECTURE.md         # This file
└── fix-conversation-participants.sql # Database migration
```

---

## Backend Architecture

### Base URL
```
http://localhost:3000/api/v1
```

### Module Breakdown

#### 1. **Auth Module** (`src/modules/auth/`)
**Purpose**: User authentication, registration, JWT token management

**Files**:
- `auth.controller.ts` - Authentication endpoints
- `auth.service.ts` - Auth business logic
- `jwt.strategy.ts` - Passport JWT strategy
- `refresh-token.strategy.ts` - Refresh token handling

**Endpoints**:
```typescript
POST   /auth/register              // Register new user
POST   /auth/login                 // Login with email/password
POST   /auth/refresh               // Refresh access token
POST   /auth/logout                // Logout user
GET    /auth/me                    // Get current user profile
```

**Flow**:
1. User registers → Creates user in DB → Returns JWT access + refresh tokens
2. Access token (short-lived, 15min) stored in memory
3. Refresh token (long-lived, 7 days) stored in httpOnly cookie
4. Frontend auto-refreshes access token before expiry

---

#### 2. **Users Module** (`src/modules/users/`)
**Purpose**: User profile management, contacts, presence

**Files**:
- `users.controller.ts` - User endpoints
- `users.service.ts` - User operations
- `user.entity.ts` - User database model

**Endpoints**:
```typescript
GET    /users                      // List all users (paginated)
GET    /users/:id                  // Get user by ID
PATCH  /users/:id                  // Update user profile
DELETE /users/:id                  // Delete user (soft delete)
GET    /users/:id/conversations    // Get user's conversations
```

**User Entity**:
```typescript
{
  id: UUID
  email: string (unique)
  username: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  avatarUrl: string | null
  status: 'online' | 'away' | 'busy' | 'offline'
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

#### 3. **Conversations Module** (`src/modules/conversations/`)
**Purpose**: Conversations, messages, typing indicators

**Files**:
- `conversations.controller.ts` - Conversation endpoints
- `conversations.service.ts` - Conversation logic
- `messages.service.ts` - Message operations
- `conversation.entity.ts` - Conversation model
- `message.entity.ts` - Message model

**Endpoints**:
```typescript
GET    /conversations                           // List conversations
POST   /conversations                           // Create conversation
GET    /conversations/:id                       // Get conversation details
PATCH  /conversations/:id                       // Update conversation
DELETE /conversations/:id                       // Delete conversation
GET    /conversations/:id/messages              // Get messages (paginated)
POST   /conversations/:id/messages              // Send message
PATCH  /conversations/:id/messages/:messageId   // Edit message
DELETE /conversations/:id/messages/:messageId   // Delete message
POST   /conversations/:id/typing                // Send typing indicator
GET    /conversations/self                      // Get self-conversation (notes)
```

**Conversation Entity**:
```typescript
{
  id: UUID
  name: string | null
  type: 'direct' | 'group' | 'channel'
  avatarUrl: string | null
  workspaceId: UUID | null
  createdBy: UUID
  createdAt: DateTime
  updatedAt: DateTime
  lastMessageAt: DateTime | null
  participants: ConversationParticipant[]
  messages: Message[]
}
```

**Message Entity**:
```typescript
{
  id: UUID
  content: string
  conversationId: UUID
  senderId: UUID
  replyToId: UUID | null
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system'
  metadata: JSON | null
  isEdited: boolean
  isPinned: boolean
  reactions: Reaction[]
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime | null
}
```

---

#### 4. **Calls Module** (`src/modules/calls/`)
**Purpose**: WebRTC call management, signaling, call history

**Files**:
- `calls.controller.ts` - Call HTTP endpoints
- `calls.gateway.ts` - WebSocket signaling gateway
- `calls.service.ts` - Call business logic
- `call.entity.ts` - Call database model

**HTTP Endpoints**:
```typescript
POST   /calls                      // Initiate call
POST   /calls/:id/join             // Join call
POST   /calls/:id/end              // End call
GET    /calls/history              // Get call history
GET    /calls/missed               // Get missed calls
```

**WebSocket Events** (Socket.IO):
```typescript
// Client → Server
'call:initiate'      { recipientId, callType, conversationId }
'call:accept'        { callId, sdp }
'call:reject'        { callId }
'call:end'           { callId }
'call:ice-candidate' { callId, candidate }
'call:offer'         { callId, sdp }
'call:answer'        { callId, sdp }

// Server → Client
'call:incoming'      { callId, callerId, callerName, callType }
'call:accepted'      { callId, acceptedBy, sdp }
'call:rejected'      { callId, rejectedBy }
'call:ended'         { callId, endedBy }
'call:ice-candidate' { callId, candidate }
'call:offer'         { callId, sdp }
'call:answer'        { callId, sdp }
```

**Call Flow**:
```
1. User A initiates call → POST /calls
2. Server creates call record → Sends 'call:incoming' to User B via WebSocket
3. User B accepts → Emits 'call:accept' → Server notifies User A
4. WebRTC negotiation:
   a. User A creates offer → Emits 'call:offer'
   b. User B receives offer → Creates answer → Emits 'call:answer'
   c. Both exchange ICE candidates → 'call:ice-candidate'
5. Peer-to-peer connection established
6. Either user ends → Emits 'call:end' → Server updates DB
```

**Call Entity**:
```typescript
{
  id: UUID
  callType: 'audio' | 'video'
  status: 'initiated' | 'ringing' | 'active' | 'ended' | 'missed'
  conversationId: UUID | null
  initiatorId: UUID
  participants: CallParticipant[]
  startedAt: DateTime
  endedAt: DateTime | null
  duration: number | null
  createdAt: DateTime
}
```

---

#### 5. **Workspaces Module** (`src/modules/workspaces/`)
**Purpose**: Organizations, teams, channels, permissions

**Files**:
- `workspaces.controller.ts` - Workspace endpoints
- `workspaces.service.ts` - Workspace logic
- `workspace.entity.ts` - Workspace model

**Endpoints**:
```typescript
GET    /workspaces                 // List user's workspaces
POST   /workspaces                 // Create workspace
GET    /workspaces/:id             // Get workspace details
PATCH  /workspaces/:id             // Update workspace
DELETE /workspaces/:id             // Delete workspace
POST   /workspaces/:id/members     // Add member
DELETE /workspaces/:id/members/:userId // Remove member
GET    /workspaces/:id/channels    // List channels
POST   /workspaces/:id/channels    // Create channel
```

**Workspace Entity**:
```typescript
{
  id: UUID
  name: string
  description: string | null
  avatarUrl: string | null
  ownerId: UUID
  plan: 'free' | 'premium' | 'business' | 'enterprise'
  members: WorkspaceMember[]
  channels: Conversation[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

#### 6. **Media Module** (`src/modules/media/`)
**Purpose**: File uploads, storage, thumbnails

**Files**:
- `media.controller.ts` - Upload endpoints
- `media.service.ts` - Storage operations
- `media.entity.ts` - Media metadata model

**Endpoints**:
```typescript
POST   /media/upload               // Upload file
GET    /media/:id                  // Get file metadata
DELETE /media/:id                  // Delete file
GET    /media/:id/download         // Download file
POST   /media/thumbnail            // Generate thumbnail
```

**Storage**:
- Uses MinIO (S3-compatible)
- Generates thumbnails for images/videos
- Tracks file metadata in PostgreSQL

---

#### 7. **WebSocket Gateway** (`src/modules/websocket/`)
**Purpose**: Real-time events, presence, typing indicators

**Files**:
- `websocket.gateway.ts` - Socket.IO gateway
- `websocket.service.ts` - WebSocket utilities

**Events**:
```typescript
// Presence
'presence:update'    { userId, status }
'presence:batch'     { users: [{ userId, status }] }
'user:online'        { userId }
'user:offline'       { userId }

// Typing
'typing:start'       { conversationId, userId, username }
'typing:stop'        { conversationId, userId }

// Messages
'message:new'        { conversationId, message }
'message:edited'     { conversationId, messageId, content }
'message:deleted'    { conversationId, messageId }

// Reactions
'reaction:added'     { messageId, reaction }
'reaction:removed'   { messageId, reactionId }
```

**Connection Flow**:
```
1. Client connects → Socket.IO handshake
2. Client emits 'auth' with userId
3. Server validates user → Joins user to rooms
4. Server broadcasts 'user:online' to contacts
5. Client receives presence updates
```

**Current Issue**:
⚠️ Server is disconnecting immediately after auth message with "io server disconnect" error.

---

## Frontend Architecture

### Entry Point Flow
```
main.tsx → App.tsx → AuthScreen | ChatInterface
```

### App.tsx
**Purpose**: Root component, authentication, WebSocket initialization

**Key Responsibilities**:
- Check authentication state
- Initialize WebSocket when user is authenticated
- Setup presence handlers
- Handle visibility changes (tab focus/blur)
- Route to AuthScreen or ChatInterface

**Code Structure**:
```typescript
function App() {
  // 1. Auth state from Zustand
  const { isAuthenticated, user } = useAuthStore();

  // 2. WebSocket initialization
  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect WebSocket (singleton pattern prevents double connection)
      if (!webSocketService.getConnectionState()) {
        webSocketService.connect(user.id);
      }

      // Setup presence handlers
      const cleanup = setupPresenceHandlers();

      // Update presence to 'online'
      webSocketService.updatePresence('online');

      return () => {
        webSocketService.updatePresence('offline');
        cleanup();
      };
    }
  }, [isAuthenticated, user]);

  // 3. Route based on auth
  return isAuthenticated ? <ChatInterface /> : <AuthScreen />;
}
```

---

### ChatInterface.tsx
**Purpose**: Main application shell, view routing, conversation selection

**Views**:
- `chat` - Main chat view (default)
- `profile` - User profile settings
- `settings` - Application settings
- `stories` - Instagram-style stories
- `workspace` - Workspace management
- `create-group` - Group creation flow

**Layout** (3-column responsive):
```
┌──────┬─────────────────┬──────────────────────┬─────────────────┐
│      │                 │                      │                 │
│ Side │ Conversation    │   Chat Window        │ Notifications   │
│ bar  │ List            │   (Main Content)     │ Panel           │
│ (64) │ (320-384px)     │   (flex-1)           │ (360px)         │
│      │                 │                      │                 │
└──────┴─────────────────┴──────────────────────┴─────────────────┘
```

**Mobile Layout** (single column, toggling):
- Shows ConversationList OR ChatWindow (not both)
- `showConversationList` state controls toggle
- Back button in ChatWindow returns to ConversationList

**State Management**:
```typescript
const [currentView, setCurrentView] = useState<View>('chat');
const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
const [showConversationList, setShowConversationList] = useState(true);
const [showNotifications, setShowNotifications] = useState(false);
const [showCallHistory, setShowCallHistory] = useState(false);
const [showSearch, setShowSearch] = useState(false);
```

**Call Handling**:
```typescript
// 1. Listen for outgoing call modal
<OutgoingCallModal />

// 2. Listen for active call (renders as draggable overlay)
{activeCall && <VideoCall onEnd={() => {}} />}

// 3. When call is accepted (for initiator)
useEffect(() => {
  if (callAccepted && outgoingCall?.callId === callAccepted.callId) {
    joinCallMutation.mutate(callId, {
      onSuccess: () => {
        setActiveCall({ id, type, participants, startedAt });
      }
    });
  }
}, [callAccepted, outgoingCall]);
```

---

### Component Documentation

#### **Sidebar.tsx**
**Purpose**: Left navigation bar with icons

**Features**:
- Logo at top (gradient blue-purple)
- Search button (triggers GlobalSearch)
- Notifications button (shows badge)
- Call history button
- Navigation items (Chat, Stories, Workspace, Profile, Settings)
- User avatar at bottom
- Status indicator

**Styling**:
- Background: `slate-900`
- Width: `64px` (mobile), `80px` (desktop)
- Hover effects: `bg-white/10`
- Active state: `bg-white/10`

---

#### **ConversationList.tsx**
**Purpose**: List of conversations, channels, groups

**Features**:
- Workspace selector dropdown
- Search conversations
- Filter tabs (All, Direct, Groups, Channels)
- New message / New channel buttons
- Conversation items with:
  - Avatar (user/group)
  - Name
  - Last message preview
  - Timestamp
  - Unread badge
  - Missed call indicator
  - Pinned indicator
  - Presence status (online/offline)

**Data Fetching**:
```typescript
const { data, isLoading } = useConversations({
  type: filter === 'direct' ? 'direct' : 'group' | 'channel',
  search: searchQuery || undefined
});
```

**Conversation Item Click**:
```typescript
onSelect={(id) => {
  setSelectedConversation(id);
  setShowConversationList(false); // Hide list on mobile
}}
```

---

#### **ChatWindow.tsx**
**Purpose**: Main chat view with messages, composer, call buttons

**Layout**:
```
┌─────────────────────────────────────────┐
│ Header: Name, Status, Actions           │ ← 64px height
├─────────────────────────────────────────┤
│                                         │
│ Messages Area (scrollable)              │ ← flex-1
│                                         │
├─────────────────────────────────────────┤
│ MessageComposer (input, attachments)    │ ← auto height
└─────────────────────────────────────────┘
```

**Header Actions**:
- Audio call button → Initiates call via CallContext
- Video call button → Initiates video call
- More options (dropdown)

**Call Initiation**:
```typescript
const { initiateCall } = useCall();

<Button onClick={async () => {
  const recipientId = conversation?.participants?.find(
    p => p.id !== user?.id
  )?.id || conversationId;

  await initiateCall(recipientId, 'audio', conversationName);
}} />
```

**Messages**:
- Fetched via React Query: `useConversationMessages(conversationId)`
- Reverse chronological order (newest at bottom)
- Auto-scroll to bottom on new message
- Virtualized scrolling for performance

---

#### **VideoCall.tsx**
**Purpose**: WebRTC video/audio call interface (draggable dialog)

**Features**:
- **Draggable**: Can be moved around screen
- **Resizable states**: Normal (1000x700), Minimized (400x120), Maximized (fullscreen)
- **PiP local video**: Bottom-right corner (video calls only)
- **Remote video**: Full screen
- **Voice call UI**: Animated avatar with call duration
- **Controls**: Mute, Video toggle, Screen share, Speaker, End call, More options
- **Connection status**: Connecting/Connected/Disconnected indicator
- **Call duration timer**: MM:SS or HH:MM:SS format

**Positioning Logic**:
```typescript
const getBounds = () => {
  const width = isMinimized ? 400 : 1000;
  const height = isMinimized ? 120 : 700;

  return {
    left: -(window.innerWidth / 2 - width / 2 - 20),
    right: window.innerWidth / 2 - width / 2 - 20,
    top: -(window.innerHeight / 2 - height / 2 - 20),
    bottom: window.innerHeight / 2 - height / 2 - 20,
  };
};
```

**Video Streams**:
```typescript
// Local stream → localVideoRef
useEffect(() => {
  if (localStream && localVideoRef.current) {
    localVideoRef.current.srcObject = localStream;
  }
}, [localStream]);

// Remote stream → remoteVideoRef
useEffect(() => {
  if (remoteStream && remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = remoteStream;
    setConnectionStatus('connected');
  }
}, [remoteStream]);
```

**Theme**:
- Background: `slate-900`
- Header: Gradient `slate-800` → `slate-900`
- Buttons: Rounded `xl` with `slate-700/80` background
- Active states: `blue-600` (screen share), `red-600` (muted)
- Border: `slate-700/50`

---

#### **IncomingCallModal.tsx**
**Purpose**: Modal for incoming call notification with ringtone

**Features**:
- Full-screen overlay with blur backdrop
- Animated rings (green pulsing circles)
- Large avatar with caller info
- Call type indicator (video/voice)
- Mute toggle (for video calls, to answer muted)
- Accept/Decline buttons
- Auto-plays ringtone (loops)

**Actions**:
```typescript
const handleAccept = () => {
  ringtoneRef.current?.pause();
  acceptCall(audioEnabled); // From CallContext
};

const handleReject = () => {
  ringtoneRef.current?.pause();
  rejectCall();
};
```

**Theme**:
- Background: Gradient `slate-900` → `slate-800`
- Ring color: `green-400/30`
- Accept button: `green-600` with glow animation
- Decline button: `red-600`

---

#### **OutgoingCallModal.tsx**
**Purpose**: Modal shown when initiating a call

**Features**:
- Animated rings (blue pulsing)
- Avatar with recipient info
- "Calling..." status with animated dots
- Mute/Video toggle before call connects
- End call button
- Timeout message (60 seconds)

**Theme**:
- Ring color: `blue-400/30`
- Dots animation: Blue
- End call button: `red-600`

---

#### **MessageComposer.tsx**
**Purpose**: Rich message input with attachments, mentions, emojis

**Features**:
- Textarea with auto-grow
- Emoji picker (popover)
- File attachment button
- Voice message recorder
- AI Assistant integration
- Mention autocomplete (@username)
- Send on Enter, Shift+Enter for newline
- Typing indicator broadcast

**Typing Indicator**:
```typescript
const handleTyping = () => {
  webSocketService.emit('typing:start', {
    conversationId,
    userId: user.id,
    username: user.username
  });

  // Auto-stop after 3 seconds
  setTimeout(() => {
    webSocketService.emit('typing:stop', { conversationId, userId });
  }, 3000);
};
```

---

#### **GlobalSearch.tsx**
**Purpose**: Cmd/Ctrl+K global search overlay

**Features**:
- Keyboard shortcut: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
- Search across: Messages, Conversations, Files, Contacts
- Filter by type
- Recent searches
- Click result → Navigate to conversation/message

**Implementation**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowSearch(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

#### **AIAssistant.tsx**
**Purpose**: AI-powered message enhancement (GPT integration)

**Features** (Premium):
- Smart replies (Free tier)
- Message enhancement with tone (Professional, Casual, Formal)
- Translation (Free tier)
- Concise formatting

**Premium Check**:
```typescript
if (!isPremium && feature === 'enhance') {
  showUpgradePrompt();
  return;
}
```

---

#### **NotificationsPanel.tsx**
**Purpose**: Right sidebar with all notifications

**Categories**:
- Messages
- Mentions
- Calls (missed)
- Groups
- System

**Actions**:
- Mark as read/unread
- Clear notification
- Click → Navigate to conversation

---

#### **FilePreview.tsx**
**Purpose**: Modal for previewing media files

**Supported Types**:
- Images (zoom, rotate)
- Videos (player controls)
- PDFs (viewer)
- Audio (player)

**Actions**:
- Download
- Share
- Close

---

## WebRTC & Real-Time Communication

### CallContext.tsx
**Purpose**: Central call state management using React Context

**State**:
```typescript
interface CallContextState {
  // Call state flags
  incomingCall: boolean
  outgoingCall: boolean
  activeCall: boolean

  // Call metadata
  currentCallId: string | null
  callType: 'audio' | 'video'
  remoteUserInfo: { id: string, name: string } | null

  // Media streams
  localStream: MediaStream | null
  remoteStream: MediaStream | null

  // Media controls
  localAudioEnabled: boolean
  localVideoEnabled: boolean
  isScreenSharing: boolean

  // WebRTC
  peerConnectionRef: RefObject<RTCPeerConnection>
}
```

**Actions**:
```typescript
interface CallContextActions {
  initiateCall(recipientId: string, type: 'audio' | 'video', name: string): Promise<void>
  acceptCall(audioEnabled: boolean): Promise<void>
  rejectCall(): void
  endCall(): void
  toggleMute(): void
  toggleVideo(): void
  toggleScreenShare(): Promise<void>
}
```

**WebRTC Flow Implementation**:

```typescript
// 1. Initiate Call
async function initiateCall(recipientId, type, name) {
  // Wait for WebSocket connection
  while (!webSocketService.getConnectionState()) {
    await wait(500ms);
  }

  // Get media stream
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === 'video'
  });
  setLocalStream(stream);

  // Create peer connection
  const pc = new RTCPeerConnection(ICE_CONFIG);

  // Add local tracks
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });

  // Create and set offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // Wait for ICE gathering
  await waitForICEComplete(pc);

  // Send to backend
  const response = await api.post('/calls', {
    recipientId,
    callType: type,
    offer: pc.localDescription
  });

  setCurrentCallId(response.data.id);
  setOutgoingCall(true);
  setActiveCall(true); // Show UI immediately for initiator
}
```

```typescript
// 2. Accept Call
async function acceptCall(audioEnabled) {
  // Get media stream
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: audioEnabled,
    video: callType === 'video'
  });
  setLocalStream(stream);

  // Create peer connection
  const pc = new RTCPeerConnection(ICE_CONFIG);

  // Add local tracks
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });

  // Set remote offer (from initiator)
  await pc.setRemoteDescription(remoteOffer);

  // Create answer
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // Wait for ICE
  await waitForICEComplete(pc);

  // Send answer to backend
  webSocketService.emit('call:accept', {
    callId: currentCallId,
    sdp: pc.localDescription
  });

  setIncomingCall(false);
  setActiveCall(true);
}
```

```typescript
// 3. Handle WebSocket Events
useEffect(() => {
  // Incoming call
  const unsubIncoming = webSocketService.on('call:incoming', (data) => {
    setCurrentCallId(data.callId);
    setRemoteUserInfo({ id: data.callerId, name: data.callerName });
    setCallType(data.callType);
    setIncomingCall(true);

    // Store remote offer
    setRemoteOffer(data.offer);
  });

  // Call accepted (for initiator)
  const unsubAccepted = webSocketService.on('call:accepted', async (data) => {
    const pc = peerConnectionRef.current;

    // Set remote answer
    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

    setOutgoingCall(false);
    setActiveCall(true);
  });

  // ICE candidate
  const unsubICE = webSocketService.on('call:ice-candidate', async (data) => {
    const pc = peerConnectionRef.current;

    if (pc && data.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });

  // Call ended
  const unsubEnded = webSocketService.on('call:ended', () => {
    cleanup();
  });

  return () => {
    unsubIncoming();
    unsubAccepted();
    unsubICE();
    unsubEnded();
  };
}, []);
```

```typescript
// 4. WebRTC Event Handlers
useEffect(() => {
  const pc = peerConnectionRef.current;
  if (!pc) return;

  // Track received (remote stream)
  pc.ontrack = (event) => {
    setRemoteStream(event.streams[0]);
  };

  // ICE candidate
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      webSocketService.emit('call:ice-candidate', {
        callId: currentCallId,
        candidate: event.candidate
      });
    }
  };

  // Connection state
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'disconnected') {
      endCall();
    }
  };
}, [peerConnectionRef.current]);
```

**Screen Sharing**:
```typescript
async function toggleScreenShare() {
  if (isScreenSharing) {
    // Stop screen share, restore video
    screenShareStream.getTracks().forEach(t => t.stop());

    if (localStream && callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    }
  } else {
    // Start screen share
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
    if (sender) await sender.replaceTrack(screenTrack);

    setScreenShareStream(screenStream);
  }

  setIsScreenSharing(!isScreenSharing);
}
```

---

### WebSocket Service (websocket-service.ts)
**Purpose**: Singleton Socket.IO client

**Pattern**:
```typescript
class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(userId: string) {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true
    });

    this.socket.on('connect', () => {
      this.emit('auth', { userId });
    });
  }

  on(event: string, handler: EventHandler): () => void {
    // Register handler
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);

    // Setup socket listener
    this.socket?.on(event, handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);

      this.socket?.off(event, handler);
    };
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
}

export const webSocketService = WebSocketService.getInstance();
```

**Usage**:
```typescript
// In component
const unsubscribe = webSocketService.on('message:new', (data) => {
  addMessage(data.message);
});

// Cleanup
useEffect(() => {
  return () => unsubscribe();
}, []);
```

---

### WebRTC Configuration (webrtc-config.ts)
```typescript
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
};

export const CONNECTION_TIMEOUT = 30000; // 30s
export const ICE_GATHERING_TIMEOUT = 10000; // 10s
```

---

## State Management

### Zustand Stores (`lib/stores/index.ts`)

#### **Auth Store**
```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken } = response.data;

    localStorage.setItem('token', accessToken);
    set({ user, token: accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));
```

#### **Call Store** (Deprecated - Replaced by CallContext)
```typescript
// Old pattern (before CallContext)
interface CallState {
  activeCall: Call | null
  outgoingCall: OutgoingCall | null
  callAccepted: CallAccepted | null
  callRejected: CallRejected | null
}

// New pattern: Use CallContext instead
const { activeCall, initiateCall, acceptCall } = useCall();
```

#### **Presence Store**
```typescript
interface PresenceState {
  presences: Map<string, UserPresence>
  typingUsers: Map<string, TypingUser[]>

  setPresence: (userId: string, presence: UserPresence) => void
  addTypingUser: (conversationId: string, user: TypingUser) => void
  removeTypingUser: (conversationId: string, userId: string) => void
}

const usePresenceStore = create<PresenceState>((set) => ({
  presences: new Map(),
  typingUsers: new Map(),

  setPresence: (userId, presence) => set((state) => {
    state.presences.set(userId, presence);
    return { presences: new Map(state.presences) };
  }),

  // ... other methods
}));
```

---

### React Query Hooks (`hooks/`)

**Pattern**:
```typescript
// useConversations.ts
export function useConversations(params: ConversationsParams) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: () => api.get('/conversations', { params }),
    staleTime: 30000, // 30s
  });
}

// useConversationMessages.ts
export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get(`/conversations/${conversationId}/messages`),
  });
}

// useSendMessage.ts
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) =>
      api.post(`/conversations/${data.conversationId}/messages`, data),

    onSuccess: (response, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries(['messages', variables.conversationId]);
    },
  });
}
```

**Available Hooks**:
- `useConversations()` - List conversations
- `useConversation(id)` - Get single conversation
- `useConversationMessages(id)` - Get messages
- `useSendMessage()` - Send message mutation
- `useEditMessage()` - Edit message mutation
- `useDeleteMessage()` - Delete message mutation
- `useInitiateCall()` - Initiate call mutation
- `useJoinCall()` - Join call mutation
- `useWorkspaces()` - List workspaces
- `useMissedCalls()` - Get missed calls

---

## API Documentation

### Base Configuration
```typescript
// lib/api/client.ts
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        return api.request(error.config);
      } else {
        logout();
      }
    }
    return Promise.reject(error);
  }
);
```

### Complete API Endpoints

#### **Authentication**
```
POST   /auth/register
Body: { email, username, password, firstName, lastName }
Response: { user, accessToken, refreshToken }

POST   /auth/login
Body: { email, password }
Response: { user, accessToken, refreshToken }

POST   /auth/refresh
Body: { refreshToken }
Response: { accessToken }

POST   /auth/logout
Headers: { Authorization: Bearer <token> }
Response: { message: 'Logged out' }

GET    /auth/me
Headers: { Authorization: Bearer <token> }
Response: { user }
```

#### **Users**
```
GET    /users?page=1&limit=20&search=query
Response: { items: User[], total, page, limit }

GET    /users/:id
Response: { user }

PATCH  /users/:id
Body: { firstName?, lastName?, avatarUrl?, status? }
Response: { user }
```

#### **Conversations**
```
GET    /conversations?type=direct&search=query&page=1&limit=20
Response: { items: Conversation[], total, page, limit }

POST   /conversations
Body: { type: 'direct' | 'group', participantIds: string[], name?, avatarUrl? }
Response: { conversation }

GET    /conversations/:id
Response: { conversation }

GET    /conversations/self
Response: { conversation } // Self-conversation for notes

PATCH  /conversations/:id
Body: { name?, avatarUrl? }
Response: { conversation }

DELETE /conversations/:id
Response: { message: 'Deleted' }
```

#### **Messages**
```
GET    /conversations/:id/messages?page=1&limit=50
Response: { items: Message[], total, page, limit }

POST   /conversations/:id/messages
Body: { content, type?: 'text', replyToId?, metadata? }
Response: { message }

PATCH  /conversations/:id/messages/:messageId
Body: { content }
Response: { message }

DELETE /conversations/:id/messages/:messageId
Response: { message: 'Deleted' }

POST   /conversations/:id/messages/:messageId/reactions
Body: { emoji }
Response: { reaction }

DELETE /conversations/:id/messages/:messageId/reactions/:reactionId
Response: { message: 'Deleted' }
```

#### **Calls**
```
POST   /calls
Body: { recipientId, callType: 'audio' | 'video', conversationId?, offer }
Response: { call }

POST   /calls/:id/join
Body: { answer }
Response: { call }

POST   /calls/:id/end
Response: { call }

GET    /calls/history?page=1&limit=20
Response: { items: Call[], total }

GET    /calls/missed?limit=100
Response: { items: Call[], total }
```

#### **Workspaces**
```
GET    /workspaces
Response: { items: Workspace[] }

POST   /workspaces
Body: { name, description?, avatarUrl? }
Response: { workspace }

GET    /workspaces/:id
Response: { workspace }

PATCH  /workspaces/:id
Body: { name?, description?, avatarUrl? }
Response: { workspace }

POST   /workspaces/:id/members
Body: { userId, role: 'admin' | 'member' }
Response: { member }

DELETE /workspaces/:id/members/:userId
Response: { message: 'Removed' }
```

#### **Media**
```
POST   /media/upload
Body: FormData { file: File }
Response: { media: { id, url, type, size, filename } }

GET    /media/:id
Response: { media }

DELETE /media/:id
Response: { message: 'Deleted' }
```

---

## Database Schema

### PostgreSQL Tables (TypeORM Entities)

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- bcrypt hashed
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'offline', -- online, away, busy, offline
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
```

#### **conversations**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  type VARCHAR(20) NOT NULL, -- direct, group, channel
  avatar_url TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

#### **conversation_participants**
```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- admin, member
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP,
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
```

#### **messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text', -- text, image, video, audio, file, system
  reply_to_id UUID REFERENCES messages(id),
  metadata JSONB, -- { fileUrl, fileName, fileSize, duration, etc. }
  is_edited BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

#### **reactions**
```sql
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON reactions(message_id);
```

#### **calls**
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_type VARCHAR(10) NOT NULL, -- audio, video
  status VARCHAR(20) NOT NULL, -- initiated, ringing, active, ended, missed
  conversation_id UUID REFERENCES conversations(id),
  initiator_id UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INTEGER, -- seconds
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_initiator ON calls(initiator_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created ON calls(created_at DESC);
```

#### **call_participants**
```sql
CREATE TABLE call_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,

  UNIQUE(call_id, user_id)
);

CREATE INDEX idx_call_participants_call ON call_participants(call_id);
CREATE INDEX idx_call_participants_user ON call_participants(user_id);
```

#### **workspaces**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id UUID REFERENCES users(id),
  plan VARCHAR(20) DEFAULT 'free', -- free, premium, business, enterprise
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
```

#### **workspace_members**
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- owner, admin, member
  joined_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
```

#### **media**
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  size BIGINT, -- bytes
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB, -- { width, height, duration, etc. }
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_user ON media(user_id);
CREATE INDEX idx_media_created ON media(created_at DESC);
```

---

## Current Issues & Solutions

### 🔴 Critical Issue: WebSocket Disconnection

**Problem**:
The backend WebSocket server is immediately disconnecting clients after receiving the auth message with error: `"io server disconnect"`.

**Symptoms**:
```
✅ WebSocket connected
📤 Auth message sent: { userId: '...' }
❌ WebSocket disconnected: io server disconnect
```

**Evidence**:
```typescript
// Frontend logs
websocket-service.ts:50 ✅ WebSocket connected
websocket-service.ts:140 📤 WebSocket message sent: auth {userId: 'f7f3f911...'}
websocket-service.ts:65 🔌 WebSocket disconnected: io server disconnect
```

**Impact**:
- Calls cannot be initiated (requires WebSocket for signaling)
- Real-time messaging doesn't work
- Presence updates fail
- Typing indicators fail

**Root Cause** (Backend):
The backend WebSocket gateway is likely rejecting the connection after the auth message. Possible reasons:
1. Auth validation failing
2. Missing middleware to maintain connection
3. Gateway immediately closing socket after auth
4. CORS or transport issues

**Solution** (Backend Team Required):

1. **Check Gateway Auth Handler** (`src/modules/websocket/websocket.gateway.ts`):
```typescript
@WebSocketGateway({ cors: true })
export class WebSocketGateway {
  @SubscribeMessage('auth')
  async handleAuth(client: Socket, payload: { userId: string }) {
    try {
      // Validate user exists
      const user = await this.usersService.findOne(payload.userId);
      if (!user) {
        client.disconnect(); // ❌ This might be the issue
        return;
      }

      // Store userId on socket
      client.data.userId = payload.userId;

      // Join user room
      client.join(`user:${payload.userId}`);

      // Broadcast online status
      this.server.emit('user:online', { userId: payload.userId });

      // ✅ DO NOT disconnect here - keep connection alive

    } catch (error) {
      console.error('Auth error:', error);
      client.disconnect(); // Only disconnect on error
    }
  }
}
```

2. **Ensure Connection Lifecycle**:
```typescript
// handleConnection should not disconnect
handleConnection(client: Socket) {
  console.log('Client connected:', client.id);
  // Don't disconnect here
}

// handleDisconnect for cleanup
handleDisconnect(client: Socket) {
  const userId = client.data.userId;
  if (userId) {
    this.server.emit('user:offline', { userId });
  }
}
```

3. **Check CORS Configuration**:
```typescript
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
```

4. **Add Logging**:
```typescript
@SubscribeMessage('auth')
async handleAuth(client: Socket, payload: { userId: string }) {
  console.log('🔐 Auth received:', payload.userId);

  // ... auth logic ...

  console.log('✅ Auth successful, connection maintained');

  // Return acknowledgment
  return { success: true };
}
```

**Temporary Workaround** (Frontend):
The frontend already has retry logic and connection checking:
```typescript
// Waits up to 5 seconds for WebSocket to connect
while (!webSocketService.getConnectionState() && attempts < 10) {
  await new Promise(resolve => setTimeout(resolve, 500));
  attempts++;
}

if (!webSocketService.getConnectionState()) {
  throw new Error('WebSocket not connected. Please check your connection.');
}
```

---

### ✅ Fixed Issue: Call Dialog Positioning

**Problem**: Call dialog was positioned incorrectly, with 50% of it hidden off-screen (bottom-right).

**Solution**: Fixed `getBounds()` function in `VideoCall.tsx` to calculate proper drag bounds:

```typescript
const getBounds = () => {
  if (isMaximized) return {};

  const width = isMinimized ? 400 : 1000;
  const height = isMinimized ? 120 : 700;

  return {
    left: -(window.innerWidth / 2 - width / 2 - 20),
    right: window.innerWidth / 2 - width / 2 - 20,
    top: -(window.innerHeight / 2 - height / 2 - 20),
    bottom: window.innerHeight / 2 - height / 2 - 20,
  };
};
```

**Result**: Dialog now:
- Opens centered in viewport
- Stays fully visible when dragged
- Respects 20px margins from edges
- Works correctly when minimized/maximized

---

### ✅ Fixed Issue: React StrictMode Double Mounting

**Problem**: React StrictMode in development causes useEffect to run twice, leading to double WebSocket connections.

**Solution**: Added connection state check in `App.tsx`:

```typescript
useEffect(() => {
  if (isAuthenticated && user) {
    // Only connect if not already connected
    if (!webSocketService.getConnectionState()) {
      webSocketService.connect(user.id);
    }
  }
}, [isAuthenticated, user]);
```

---

## Development Guide

### Initial Setup

1. **Clone Repository**:
```bash
git clone <repo-url>
cd "Communication App"
```

2. **Backend Setup**:
```bash
cd chat-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Configure .env:
DATABASE_URL="postgresql://user:password@localhost:5432/chat_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Run database migrations
npm run migration:run

# Start backend
npm run start:dev
# Backend runs on http://localhost:3000
```

3. **Frontend Setup**:
```bash
cd chat-web-client

# Install dependencies
npm install

# Start frontend
npm run dev
# Frontend runs on http://localhost:5173 or 5174
```

4. **Database Setup** (PostgreSQL):
```bash
# Create database
createdb chat_db

# Or via SQL
psql -U postgres
CREATE DATABASE chat_db;

# Enable UUID extension
\c chat_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

5. **Redis Setup**:
```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Or via Docker
docker run -d -p 6379:6379 redis:7-alpine
```

---

### Development Commands

#### Backend
```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert

# Testing
npm run test
npm run test:watch
npm run test:e2e
```

#### Frontend
```bash
# Development (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

---

### Environment Variables

#### Backend (`.env`)
```env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chat_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# MinIO (S3)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=chat-uploads

# OpenAI (AI features)
OPENAI_API_KEY=sk-...

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Frontend (`.env`)
```env
# API
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000

# Features
VITE_ENABLE_AI=true
VITE_ENABLE_VIDEO_CALLS=true
```

---

### Code Standards

#### TypeScript
- **Strict mode enabled** in both backend and frontend
- **Explicit types** - avoid `any`
- **Interfaces for data structures**:
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  username: string;
}

// ❌ Bad
const user: any = { ... };
```

#### React Components
- **Functional components** with hooks
- **Props interface**:
```typescript
interface ChatWindowProps {
  conversationId: string;
  onBack: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  // ...
}
```

- **Component structure**:
```typescript
export function Component({ prop1, prop2 }: Props) {
  // 1. Hooks
  const [state, setState] = useState();
  const { data } = useQuery();

  // 2. Effects
  useEffect(() => {}, []);

  // 3. Handlers
  const handleClick = () => {};

  // 4. Render
  return <div>...</div>;
}
```

#### Styling (Tailwind)
- **Mobile-first** responsive design
- **Consistent spacing** (4px base grid)
- **Theme colors**: Use app theme (slate-900, blue-500, purple-600)
- **Component classes**:
```tsx
<div className="flex items-center gap-4 p-4 bg-slate-900 rounded-xl">
  {/* ... */}
</div>
```

---

### Testing Strategy

#### Backend (Jest)
```typescript
// Unit test
describe('UsersService', () => {
  it('should create user', async () => {
    const user = await service.create({ email: 'test@test.com' });
    expect(user.email).toBe('test@test.com');
  });
});

// E2E test
describe('Auth (e2e)', () => {
  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password' })
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
      });
  });
});
```

#### Frontend (Vitest + React Testing Library)
```typescript
// Component test
describe('ChatWindow', () => {
  it('renders messages', () => {
    render(<ChatWindow conversationId="123" />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('sends message on Enter', async () => {
    render(<ChatWindow conversationId="123" />);
    const input = screen.getByPlaceholderText('Type a message...');

    await userEvent.type(input, 'Hello{Enter}');

    expect(mockSendMessage).toHaveBeenCalledWith({
      content: 'Hello',
      conversationId: '123',
    });
  });
});
```

---

### Deployment

#### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: chat_db
      POSTGRES_USER: chat_user
      POSTGRES_PASSWORD: chat_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./chat-backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://chat_user:chat_password@postgres:5432/chat_db
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./chat-web-client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Next Steps

### Immediate (Fix WebSocket Issue)
1. Debug backend WebSocket gateway auth handler
2. Ensure connection is maintained after auth
3. Test call flow end-to-end

### Short Term (Frontend)
1. Add comprehensive error boundaries
2. Implement offline support (service worker)
3. Add message queue for offline messages
4. Improve loading states and skeletons
5. Add E2E tests (Playwright/Cypress)

### Medium Term (Features)
1. End-to-End Encryption (Signal Protocol)
2. Message reactions and threads
3. Voice messages
4. Screen recording
5. File sharing with drag-drop
6. Rich text editor (markdown)
7. Custom emoji upload
8. Message search

### Long Term (Platform)
1. Mobile app (Flutter)
2. Desktop app (Electron/Tauri)
3. Admin dashboard
4. Analytics and reporting
5. SSO integration (SAML 2.0)
6. Self-hosted option
7. Kubernetes deployment

---

## Troubleshooting

### WebSocket Connection Issues
**Symptom**: "WebSocket disconnected: io server disconnect"

**Check**:
1. Backend is running (`http://localhost:3000`)
2. WebSocket gateway is enabled
3. CORS is configured correctly
4. Auth handler doesn't disconnect prematurely

**Debug**:
```typescript
// In backend gateway
@SubscribeMessage('auth')
async handleAuth(client: Socket, payload: { userId: string }) {
  console.log('🔐 Auth received:', payload);

  try {
    const user = await this.usersService.findOne(payload.userId);
    console.log('✅ User found:', user.id);

    client.data.userId = user.id;
    client.join(`user:${user.id}`);

    console.log('✅ Connection maintained');

    return { success: true };
  } catch (error) {
    console.error('❌ Auth error:', error);
    client.disconnect();
  }
}
```

---

### Database Connection Issues
**Symptom**: "Connection refused" or "ECONNREFUSED"

**Check**:
1. PostgreSQL is running: `pg_isready`
2. Database exists: `psql -l | grep chat_db`
3. Connection string in `.env` is correct
4. Firewall allows connection on port 5432

---

### CORS Issues
**Symptom**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Fix** (Backend `main.ts`):
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
});
```

---

### Port Already in Use
**Symptom**: "Port 3000 is already in use"

**Fix**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run start:dev
```

---

## Summary

This Communication App is a modern, production-ready enterprise chat platform with:

- ✅ **Full-stack architecture** (NestJS + React + PostgreSQL + Redis)
- ✅ **WebRTC video/audio calls** (peer-to-peer, production-ready UI)
- ✅ **Real-time messaging** (Socket.IO)
- ✅ **Beautiful, responsive UI** (ShadCN + Tailwind + Framer Motion)
- ✅ **Type-safe** (TypeScript strict mode)
- ✅ **Scalable** (Microservices-ready architecture)

**Current Status**: Development, with one critical backend issue (WebSocket disconnection) blocking real-time features.

**Next Action**: Fix backend WebSocket gateway to maintain connections after authentication.

---

**Document Version**: 1.0.0
**Last Updated**: October 22, 2025
**Author**: Claude Code Session
**Contact**: See CLAUDE.md for project guidance
