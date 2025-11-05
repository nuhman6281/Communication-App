# CLAUDE.md - Project Rules & Architecture Guidelines

**Last Updated:** November 5, 2025
**Purpose:** Definitive guide for all feature implementation and architecture decisions in this codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Architecture State](#current-architecture-state)
3. [Mandatory Documentation Rules](#mandatory-documentation-rules)
4. [Architecture Patterns](#architecture-patterns)
5. [Coding Standards](#coding-standards)
6. [File Organization Rules](#file-organization-rules)
7. [API Design Patterns](#api-design-patterns)
8. [Real-Time Communication Patterns](#real-time-communication-patterns)
9. [Database Design Rules](#database-design-rules)
10. [Security Requirements](#security-requirements)
11. [Testing Requirements](#testing-requirements)
12. [Feature Implementation Workflow](#feature-implementation-workflow)

---

## Project Overview

### Vision
A **comprehensive enterprise chat platform** combining features from Slack, Microsoft Teams, WhatsApp, Zoho Cliq, and Instagram with native WebRTC video/audio calls.

### Master Documentation
- **Complete Spec**: `comprehensive_chat_app_prompt.md` (4,500+ lines) - Original project specification
- **Complete File Docs**: `PROJECT_DOCUMENTATION.md` - Every file documented with tree views (CURRENT STATE ONLY)
- **Architecture**: `PROJECT_ARCHITECTURE.md` - System design and technical decisions
- **This File**: `CLAUDE.md` - Project rules and implementation guidelines
- **Change History**: Create `CHANGELOG.md` if you need to track fixes, updates, and feature additions over time

**⚠️ CRITICAL**: `PROJECT_DOCUMENTATION.md` is a **snapshot of current state**, NOT a history log. Never add "Recent Changes" sections or update history to it.

### Project Structure
```
Communication App/
├── chat-backend/          # NestJS API (180 TypeScript files)
├── chat-web-client/       # React UI (130 TypeScript files)
├── realtime-service/      # WebRTC signaling (8 TypeScript files)
├── PROJECT_DOCUMENTATION.md  # Complete file-by-file documentation
├── comprehensive_chat_app_prompt.md  # Master specification
└── CLAUDE.md              # This file - Project rules
```

---

## Current Architecture State

### ✅ Fully Implemented Services

**1. chat-backend/ (Port 3001)**
- **Stack**: NestJS 10, TypeScript (strict), PostgreSQL 15, TypeORM, Redis 7, Socket.IO, Bull Queue
- **Status**: Production-ready with 15 modules (180 files)
- **Modules**: Auth, Users, Messages, Conversations, Groups, Channels, Workspaces, Calls, Media, Notifications, Presence, AI, Search, Stories, Webhooks, Email
- **Authentication**: JWT (15min) + Refresh tokens (7 days), OAuth (Google/GitHub/Microsoft), MFA
- **Real-time**: Socket.IO gateway with Redis adapter
- **Storage**: MinIO S3-compatible storage
- **AI**: OpenAI integration (GPT-3.5/4, Whisper, DALL-E)

**2. chat-web-client/ (Port 5173)**
- **Stack**: React 18, TypeScript (strict), Vite 6, TanStack Query v5, Zustand, Socket.IO Client, ShadCN UI, Tailwind v4
- **Status**: Production-ready with complete UI (130 files)
- **State**: Zustand stores (auth, call, conversation, presence, workspace, ui)
- **WebSocket**: Dual sockets (messaging port 3001 + WebRTC signaling port 4000)
- **WebRTC**: Custom service managing peer connections, media streams
- **Components**: 26 main components + 60+ ShadCN UI components
- **Features**: Messaging, calls, stories, workspaces, AI assistant, global search

**3. realtime-service/ (Port 4000)**
- **Stack**: Node.js 18, TypeScript (strict), Express 4, Socket.IO 4.7, Redis adapter
- **Status**: Production-ready WebRTC signaling server (8 files)
- **Purpose**: Dedicated WebRTC signaling, call room management, NAT traversal
- **Scaling**: Redis adapter for horizontal scaling, sticky sessions via Nginx
- **TURN/STUN**: Coturn integration for NAT traversal

### ❌ Not in Use
- `streamforge/` - Deprecated, excluded from documentation
- `chat_app_reference/` - Reference implementation only

---

## Mandatory Documentation Rules

### 🚨 CRITICAL: Update BOTH Documentation Files with EVERY Change

**Rule**: Both `CLAUDE.md` (this file) and `PROJECT_DOCUMENTATION.md` MUST be updated immediately after ANY code change, feature implementation, or integration.

**Why Two Files?**
- **CLAUDE.md**: Architecture patterns, coding standards, project rules, implementation guidelines
- **PROJECT_DOCUMENTATION.md**: Complete file-by-file tree view, API/WebSocket reference, database schema

---

### Update PROJECT_DOCUMENTATION.md When:

**Update Triggers** (ALL must trigger doc update):
1. ✅ **New file created** → Add to tree view with description
2. ✅ **File deleted** → Remove from tree view
3. ✅ **File renamed/moved** → Update path and description
4. ✅ **New function/method added** → Update file description
5. ✅ **API endpoint added/changed** → Update endpoint list
6. ✅ **WebSocket event added/changed** → Update event list
7. ✅ **Database entity field added/changed** → Update schema
8. ✅ **Environment variable added** → Update env section
9. ✅ **Configuration changed** → Update relevant section

**Documentation Sections to Maintain**:
```
PROJECT_DOCUMENTATION.md:
├── Chat Backend tree view (lines 86-382)
├── Chat Web Client tree view (lines 384-574)
├── Realtime Service tree view (lines 576-610)
├── API Endpoints Reference (lines 612+)
├── WebSocket Events Reference
├── Database Schema
├── Environment Variables
└── Documentation Maintenance (update date only)
```

**⚠️ DO NOT ADD TO PROJECT_DOCUMENTATION.md:**
- Recent Changes sections
- Update history
- Change logs
- Fix descriptions
- "What was changed" narratives

**Example Update**:
```markdown
# Before (in tree view):
├── src/modules/messages/
│   ├── messages.controller.ts - Message endpoints: GET, POST, PUT, DELETE

# After (added reaction endpoint):
├── src/modules/messages/
│   ├── messages.controller.ts - Message endpoints: GET, POST, PUT, DELETE, POST /:id/react
```

---

### 📝 Documentation Writing Style (MANDATORY)

**CRITICAL RULE**: PROJECT_DOCUMENTATION.md is a **CURRENT STATE SNAPSHOT**, NOT a history log.

**What PROJECT_DOCUMENTATION.md IS:**
- A normalized description of what currently exists in the codebase
- Written as if all features were always present
- Current state only - no history, no change tracking
- Simple, functional descriptions of what each file does

**What PROJECT_DOCUMENTATION.md IS NOT:**
- ❌ NOT a changelog
- ❌ NOT an update history
- ❌ NOT a "Recent Changes" document
- ❌ NOT a place to mention fixes, improvements, or modifications

**For Change Tracking:** Use a separate `CHANGELOG.md` file or update history in `CLAUDE.md`

---

**✅ DO:**
- State what the file **does** (functionality)
- Be concise - list core features only
- Write in present tense as if feature existed from day one
- Use simple, clear language

**❌ DON'T:**
- Mention "fixed", "improved", "changed", "updated", "enhanced"
- Include implementation details (pixel sizes, color codes, library versions)
- Describe how something was changed or what was wrong before
- Write verbose explanations or technical specifications
- Add "Recent Changes" sections or update history

**Examples:**

```markdown
# ❌ WRONG (too verbose, mentions changes):
VideoCallOverlay.tsx - Draggable/resizable call window with dual validation
for video display, proper effect dependencies for call type changes, enhanced
avatar grid for audio calls (192px circular avatars with unique gradients per
participant, animated speaking rings), RemoteAudio component for hidden audio
element playback in audio-only calls, ScreenShareDisplay component...

# ✅ CORRECT (normalized, concise):
VideoCallOverlay.tsx - Draggable call window, video/avatar grid display,
screen sharing, call controls, duration tracking
```

```markdown
# ❌ WRONG (mentions fixes and improvements):
GlobalCallContainer.tsx - Fixed minimized window to be draggable with dark
gradient background matching main dialog, improved text contrast, enhanced
with double-click to expand feature

# ✅ CORRECT (normalized):
GlobalCallContainer.tsx - Call state manager, portal rendering, draggable
minimized indicator, route persistence
```

```markdown
# ❌ WRONG (includes technical details):
call.store.ts - Fixed state initialization bug by setting isVideoEnabled based
on callType, added new updateCallType() action to prevent direct mutations,
improved toggleVideo() with track existence checks

# ✅ CORRECT (functional description):
call.store.ts - Call state management with media controls, participant tracking,
call lifecycle actions
```

**Format Template:**
```
ComponentName.tsx - [Core function 1], [core function 2], [core function 3]
```

Keep each file description to **one line, maximum 100 characters** in tree view sections.

---

### Update CLAUDE.md When:

**Update Triggers for Architecture Changes**:
1. ✅ **New module/feature pattern established** → Add to Architecture Patterns section
2. ✅ **New coding standard adopted** → Add to Coding Standards section
3. ✅ **New file organization rule** → Update File Organization Rules
4. ✅ **New API/WebSocket pattern** → Update API/Real-Time Communication Patterns
5. ✅ **New security requirement** → Update Security Requirements
6. ✅ **New testing requirement** → Update Testing Requirements
7. ✅ **New technology integrated** (e.g., new library, service) → Update Current Architecture State
8. ✅ **Breaking change or major refactor** → Document in Architecture Patterns with examples
9. ✅ **New workflow or process** → Update Feature Implementation Workflow
10. ✅ **Service added/removed** → Update Project Structure and Current Architecture State

**CLAUDE.md Sections to Maintain**:
```
CLAUDE.md:
├── Project Overview (update if scope changes)
├── Current Architecture State (update tech stack, modules)
├── Mandatory Documentation Rules (this section)
├── Architecture Patterns (add new patterns)
├── Coding Standards (add new standards)
├── File Organization Rules (update structure rules)
├── API Design Patterns (add new endpoint patterns)
├── Real-Time Communication Patterns (add new WebSocket patterns)
├── Database Design Rules (add new entity patterns)
├── Security Requirements (update auth/validation rules)
├── Testing Requirements (update test strategies)
└── Feature Implementation Workflow (update process)
```

**Example Update**:
```markdown
# Scenario: Added GraphQL alongside REST API

## In CLAUDE.md - Update Current Architecture State:
**1. chat-backend/ (Port 3001)**
- **Stack**: NestJS 10, TypeScript (strict), PostgreSQL 15, TypeORM, Redis 7, Socket.IO, Bull Queue, **GraphQL (Apollo Server)** ← NEW
- **APIs**: REST API + **GraphQL API** ← NEW

## Add new section in API Design Patterns:
### GraphQL Schema Design (NEW)
- Use schema-first approach
- Define types in .graphql files
- Use DataLoader for N+1 prevention
...

## In PROJECT_DOCUMENTATION.md - Update tree view:
├── src/
│   ├── schema.graphql - GraphQL schema definitions ← NEW
│   ├── modules/
│   │   ├── messages/
│   │   │   ├── messages.resolver.ts - GraphQL resolver ← NEW
```

---

### Complete Workflow for ALL Changes

```bash
# ========================================
# STEP 1: Make Code Changes
# ========================================
# Implement feature/fix following patterns in CLAUDE.md

# ========================================
# STEP 2: Test Changes
# ========================================
# Ensure all tests pass

# ========================================
# STEP 3: Update PROJECT_DOCUMENTATION.md
# ========================================
# ⚠️  IMPORTANT: Follow "Documentation Writing Style" rules above
#     - Write normalized, concise descriptions
#     - No "fixed", "improved", "changed" language
#     - State what files DO, not what was changed
#     - Keep descriptions under 100 characters

# 3a. Update tree view if file structure changed
#     - Add new files with descriptions (normalized style)
#     - Remove deleted files
#     - Update modified file descriptions (state functionality only)

# 3b. Update API/WebSocket sections if applicable
#     - Add new endpoints (normalized descriptions)
#     - Update endpoint descriptions (what they do, not changes)
#     - Add new WebSocket events

# 3c. Update Database Schema if entities changed
#     - Add new tables/fields
#     - Update relationships

# 3d. Update "Last Updated" date at bottom (date only, no change notes)

# ⚠️  IMPORTANT: DO NOT add "Recent Changes" or any update history to PROJECT_DOCUMENTATION.md

# ========================================
# STEP 4: Update CLAUDE.md (if applicable)
# ========================================
# 4a. Update Current Architecture State if:
#     - New technology/library added
#     - Service configuration changed
#     - Module count changed

# 4b. Update Architecture Patterns if:
#     - New pattern established
#     - Breaking change in pattern

# 4c. Update Coding Standards if:
#     - New standard adopted
#     - Best practice changed

# 4d. Update File Organization Rules if:
#     - New folder structure introduced
#     - Naming convention changed

# 4e. Update API/WebSocket Patterns if:
#     - New endpoint pattern established
#     - New event naming convention

# 4f. Update Security/Testing Requirements if:
#     - New security measure added
#     - Testing strategy changed

# 4g. Update "Last Updated" date at top

# ========================================
# STEP 5: Commit Everything Together
# ========================================
git add .
git commit -m "feat: [feature] + updated documentation"
# Commit code + both documentation files together
```

---

### Documentation Update Examples by Change Type

**Example 1: New Feature Module**
```bash
# Change: Added "Polls" feature
# Update PROJECT_DOCUMENTATION.md:
#   - Add polls/ folder to backend tree view with all files
#   - Add API endpoints: POST /polls, GET /polls/:id, POST /polls/:id/vote
#   - Add WebSocket events: poll:created, poll:vote, poll:closed
#   - Add Poll entity to database schema
# Update CLAUDE.md:
#   - Update module count in Current Architecture State
#   - Add poll module structure example if using new pattern
```

**Example 2: Technology Integration**
```bash
# Change: Integrated Elasticsearch for search
# Update PROJECT_DOCUMENTATION.md:
#   - Add elasticsearch/ config folder to tree view
#   - Update search endpoints with new capabilities
#   - Add Elasticsearch environment variables
# Update CLAUDE.md:
#   - Add "Elasticsearch 8" to tech stack in Current Architecture State
#   - Add Elasticsearch integration pattern in Architecture Patterns
#   - Add search index design rules in new section
```

**Example 3: Bug Fix with Architecture Impact**
```bash
# Change: Fixed WebSocket reconnection logic
# Update PROJECT_DOCUMENTATION.md:
#   - Update socket.ts file description (state what it does now, no "fixed" language)
# Update CLAUDE.md:
#   - Update WebSocket lifecycle pattern if approach changed
#   - Add reconnection best practice to Real-Time Communication Patterns
#   - Document the bug fix in CLAUDE.md history if needed
```

**Example 4: Refactor/Breaking Change**
```bash
# Change: Migrated from REST to tRPC for type-safety
# Update PROJECT_DOCUMENTATION.md:
#   - Add trpc/ folder to tree view
#   - Update API endpoints to show tRPC procedures (current state only)
# Update CLAUDE.md:
#   - Add tRPC to tech stack
#   - Replace REST patterns with tRPC patterns in API Design Patterns
#   - Update Feature Implementation Workflow to use tRPC
#   - Document migration in CLAUDE.md history section if needed
```

---

## Architecture Patterns

### 1. Backend Architecture (NestJS)

**Module Structure** (MANDATORY):
```
src/modules/<feature>/
├── <feature>.controller.ts      # HTTP REST endpoints
├── <feature>.service.ts         # Business logic
├── <feature>.module.ts          # Module configuration
├── <feature>.gateway.ts         # WebSocket events (optional)
│
├── entities/                    # Database entities
│   ├── <feature>.entity.ts     # Main entity
│   └── <feature>-*.entity.ts   # Related entities
│
└── dto/                         # Data Transfer Objects
    ├── create-<feature>.dto.ts # Create DTO
    ├── update-<feature>.dto.ts # Update DTO
    └── get-<feature>.dto.ts    # Query DTO
```

**Dependency Injection Pattern**:
```typescript
// ✅ CORRECT: Constructor injection
@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly conversationService: ConversationService,
    private readonly notificationService: NotificationService,
  ) {}
}

// ❌ INCORRECT: Direct instantiation
export class MessagesService {
  private messageRepo = new MessageRepository(); // NEVER DO THIS
}
```

**Controller Pattern**:
```typescript
// ✅ CORRECT: RESTful routes with proper decorators
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.getMessages(conversationId, query, user);
  }

  @Post()
  async createMessage(
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.createMessage(dto, user);
  }
}

// ❌ INCORRECT: Non-RESTful, missing guards
@Controller('api/v1/messages/list') // Bad route
export class MessagesController {
  @Get() // Missing auth guard, bad naming
  getAll() {}
}
```

### 2. Frontend Architecture (React)

**Component Structure** (MANDATORY):
```typescript
// ✅ CORRECT: Functional component with TypeScript
import { useState, useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  conversationId: string;
  onClose?: () => void;
}

export function ChatWindow({ conversationId, onClose }: ChatWindowProps) {
  const { messages, isLoading } = useMessages(conversationId);
  const [inputValue, setInputValue] = useState('');

  // Component logic...

  return (
    <div className="flex flex-col h-full">
      {/* JSX */}
    </div>
  );
}

// ❌ INCORRECT: Class component, missing types
export class ChatWindow extends Component {
  render() { /* ... */ }
}
```

**State Management Pattern**:
```typescript
// ✅ CORRECT: Zustand store for global state
// lib/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

// ✅ CORRECT: TanStack Query for server state
// hooks/useMessages.ts
import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/endpoints/messages.api';

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesApi.getMessages(conversationId),
    staleTime: 30000,
  });
}

// ❌ INCORRECT: useState for server data
export function ChatWindow() {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    fetch('/api/messages').then(/* ... */); // Bad: no caching, refetching, error handling
  }, []);
}
```

### 3. WebRTC Signaling Architecture

**Event Handler Pattern** (realtime-service):
```typescript
// ✅ CORRECT: Separate handlers for different concerns
// handlers/webrtc.handler.ts
export class WebRTCHandler {
  constructor(private io: Server) {}

  async handleCallInitiate(socket: Socket, data: InitiateCallData) {
    const callId = generateCallId();
    await this.roomService.createRoom(callId, data.participants);
    socket.join(callId);

    // Notify participants
    data.participants.forEach(participantId => {
      this.io.to(getUserSocketId(participantId)).emit('call:incoming', {
        callId,
        from: socket.data.userId,
        callType: data.callType,
      });
    });
  }

  async handleOffer(socket: Socket, data: SignalingData) {
    this.io.to(getUserSocketId(data.to)).emit('call:offer', {
      callId: data.callId,
      from: socket.data.userId,
      sdp: data.sdp,
    });
  }
}

// ❌ INCORRECT: Monolithic handler, no separation
io.on('connection', (socket) => {
  socket.on('call:initiate', (data) => {
    // 500 lines of code here mixing concerns
  });
});
```

---

## Coding Standards

### TypeScript Rules (ALL Services)

**Rule 1: Strict Mode ALWAYS**
```typescript
// tsconfig.json (MANDATORY)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}

// ✅ CORRECT: Explicit types
function createMessage(content: string, userId: string): Promise<Message> {
  return messageRepo.create({ content, senderId: userId });
}

// ❌ INCORRECT: Implicit any
function createMessage(content, userId) { // Bad: implicit any
  return messageRepo.create({ content, userId });
}
```

**Rule 2: Interface Over Type**
```typescript
// ✅ CORRECT: Use interfaces for object shapes
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
}

// ❌ INCORRECT: Type alias for objects (use for unions/primitives only)
export type User = {
  id: string;
  email: string;
}; // Use interface instead
```

**Rule 3: Enums for Constants**
```typescript
// ✅ CORRECT: Use enums for related constants
export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
}

// ❌ INCORRECT: String literals scattered
const status = 'online'; // No type safety
if (user.status === 'onlin') {} // Typo not caught
```

### Backend Coding Standards

**Rule 1: DTOs with Validation**
```typescript
// ✅ CORRECT: DTO with class-validator
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsString()
  @IsOptional()
  replyToId?: string;
}

// ❌ INCORRECT: Plain object, no validation
export interface CreateMessageDto {
  conversationId: string; // No validation
  content: string; // Could be 1 million chars
}
```

**Rule 2: Repository Pattern**
```typescript
// ✅ CORRECT: Use repository pattern with TypeORM
@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createMessage(dto: CreateMessageDto): Promise<Message> {
    const message = this.messageRepo.create(dto);
    return this.messageRepo.save(message);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}

// ❌ INCORRECT: Direct database access
async createMessage(dto) {
  return db.query('INSERT INTO messages VALUES...'); // SQL injection risk
}
```

**Rule 3: Error Handling**
```typescript
// ✅ CORRECT: Proper error handling with NestJS exceptions
@Post()
async createMessage(@Body() dto: CreateMessageDto) {
  try {
    const conversation = await this.conversationService.findById(dto.conversationId);

    if (!conversation) {
      throw new NotFoundException(`Conversation ${dto.conversationId} not found`);
    }

    return await this.messagesService.createMessage(dto);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error; // Re-throw known errors
    }

    this.logger.error('Failed to create message', error);
    throw new InternalServerErrorException('Failed to create message');
  }
}

// ❌ INCORRECT: Silent failures, generic errors
@Post()
async createMessage(@Body() dto) {
  try {
    return await this.messagesService.createMessage(dto);
  } catch (error) {
    return { error: 'Something went wrong' }; // Bad: No HTTP status, vague error
  }
}
```

### Frontend Coding Standards

**Rule 1: Custom Hooks for Logic**
```typescript
// ✅ CORRECT: Extract reusable logic into hooks
// hooks/useMessages.ts
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesApi.getMessages(conversationId),
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) => messagesApi.sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  return { messages, isLoading, sendMessage };
}

// Usage in component
export function ChatWindow({ conversationId }) {
  const { messages, isLoading, sendMessage } = useMessages(conversationId);
  // Clean component logic
}

// ❌ INCORRECT: All logic in component
export function ChatWindow({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 100 lines of data fetching logic
  }, [conversationId]);

  const sendMessage = () => {
    // 50 lines of mutation logic
  };
}
```

**Rule 2: Component Composition**
```typescript
// ✅ CORRECT: Small, focused components
// MessageBubble.tsx
export function MessageBubble({ message }: { message: Message }) {
  return (
    <div className="flex gap-2 p-2">
      <Avatar userId={message.senderId} />
      <MessageContent content={message.content} />
      <MessageTimestamp timestamp={message.createdAt} />
    </div>
  );
}

// MessageList.tsx
export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

// ❌ INCORRECT: Monolithic component
export function MessageList({ messages }) {
  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {/* 200 lines of complex JSX */}
        </div>
      ))}
    </div>
  );
}
```

**Rule 3: Tailwind CSS Styling**
```typescript
// ✅ CORRECT: Tailwind utility classes, mobile-first
export function Button({ children, variant = 'primary' }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      )}
    >
      {children}
    </button>
  );
}

// ❌ INCORRECT: Inline styles, no responsive design
export function Button({ children }) {
  return (
    <button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
      {children}
    </button>
  );
}
```

**Rule 4: AI Enhancement Integration Pattern**
```typescript
// ✅ CORRECT: Premium AI features with proper access control
// Component integration
import { useEnhanceMessage } from "@/hooks/useAI";
import { useAuthStore } from "@/lib/stores";
import { isPremiumUser } from "@/lib/utils/subscription";
import type { ToneType } from "@/lib/api/endpoints/ai.api";

export function MessageComposer() {
  const [showAIEnhance, setShowAIEnhance] = useState(false);
  const { user } = useAuthStore();
  const enhanceMessage = useEnhanceMessage();
  const isPremium = isPremiumUser(user);
  const hasEnhanceAccess = isPremium;

  const handleEnhance = async (tone: ToneType) => {
    if (!message.trim() || !hasEnhanceAccess) return;

    try {
      const result = await enhanceMessage.mutateAsync({
        content: message.trim(),
        tone,
      });
      setMessage(result.enhanced);
      setShowAIEnhance(false);
    } catch (error) {
      console.error("Failed to enhance message:", error);
    }
  };

  const toneOptions: Array<{ value: ToneType; label: string; description: string; icon: string }> = [
    { value: "professional", label: "Professional", description: "Formal and business-like", icon: "💼" },
    { value: "casual", label: "Casual", description: "Relaxed and friendly", icon: "😊" },
    { value: "formal", label: "Formal", description: "Polite and respectful", icon: "🎩" },
    { value: "friendly", label: "Friendly", description: "Warm and approachable", icon: "🤗" },
    { value: "concise", label: "Concise", description: "Brief and to the point", icon: "⚡" },
  ];

  return (
    // Popover with tone selection UI
    {hasEnhanceAccess ? (
      <Popover open={showAIEnhance} onOpenChange={setShowAIEnhance}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" disabled={message.trim().length === 0}>
            <Sparkles className="h-5 w-5" />
            {isPremium && <Crown className="h-3 w-3 text-amber-500" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          {toneOptions.map((option) => (
            <button key={option.value} onClick={() => handleEnhance(option.value)}>
              {option.icon} {option.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    ) : (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" disabled>
            <Sparkles className="h-5 w-5" />
            <Crown className="h-3 w-3 text-amber-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Premium feature - Upgrade to use AI enhancement</TooltipContent>
      </Tooltip>
    )}
  );
}

// ❌ INCORRECT: No access control, poor UX
export function MessageComposer() {
  const handleEnhance = async () => {
    const result = await fetch('/api/ai/enhance'); // No premium check, will fail
    setMessage(result.enhanced);
  };

  return <button onClick={handleEnhance}>Enhance</button>; // No tone selection, no loading state
}
```

---

## File Organization Rules

### Backend File Organization

**Rule 1: Feature Modules**
```
✅ CORRECT Structure:
src/modules/messages/
├── messages.controller.ts       # HTTP endpoints
├── messages.service.ts          # Business logic
├── messages.gateway.ts          # WebSocket events
├── messages.module.ts           # Module config
├── entities/
│   ├── message.entity.ts
│   ├── message-reaction.entity.ts
│   └── message-read.entity.ts
└── dto/
    ├── create-message.dto.ts
    ├── update-message.dto.ts
    └── get-messages.dto.ts

❌ INCORRECT Structure:
src/
├── controllers/
│   └── messages.controller.ts   # Don't separate by type
├── services/
│   └── messages.service.ts
└── entities/
    └── message.entity.ts
```

**Rule 2: Common Utilities**
```
✅ CORRECT:
src/common/
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── ws-jwt.guard.ts
├── interceptors/
│   ├── logging.interceptor.ts
│   └── transform.interceptor.ts
└── filters/
    └── http-exception.filter.ts

❌ INCORRECT:
src/utils/stuff.ts  # Too generic
src/helpers/functions.ts  # No clear purpose
```

### Frontend File Organization

**Rule 1: Feature-Based Components**
```
✅ CORRECT Structure:
src/components/
├── ChatWindow.tsx               # Main components at root
├── MessageBubble.tsx
├── MessageComposer.tsx
├── workspace/                   # Feature subfolder
│   ├── WorkspaceSelector.tsx
│   ├── CreateWorkspaceDialog.tsx
│   └── InviteMemberDialog.tsx
└── ui/                          # UI primitives
    ├── button.tsx
    ├── dialog.tsx
    └── input.tsx

❌ INCORRECT Structure:
src/components/
├── pages/                       # Don't nest by type
├── modals/
└── forms/
```

**Rule 2: Hooks Organization**
```
✅ CORRECT:
src/hooks/
├── index.ts                     # Barrel export
├── useAuth.ts                   # One hook per file
├── useMessages.ts
├── useConversations.ts
└── useWebSocket.ts

❌ INCORRECT:
src/hooks/hooks.ts               # All hooks in one file
src/utils/customHooks.tsx        # Wrong location
```

**Rule 3: API Layer Organization**
```
✅ CORRECT:
src/lib/api/
├── client.ts                    # Axios instance
├── utils.ts                     # API utilities
└── endpoints/
    ├── index.ts                 # Barrel export
    ├── auth.api.ts              # One service per file
    ├── messages.api.ts
    └── users.api.ts

❌ INCORRECT:
src/api.ts                       # Everything in one file
src/services/api/fetch.js        # Mixed concerns
```

---

## API Design Patterns

### REST API Patterns (Backend)

**Rule 1: RESTful Endpoints**
```typescript
// ✅ CORRECT: RESTful naming and verbs
GET    /api/messages/:conversationId       # Get messages
POST   /api/messages                       # Create message
PUT    /api/messages/:id                   # Update message
DELETE /api/messages/:id                   # Delete message
POST   /api/messages/:id/react             # Sub-resource action
GET    /api/conversations                  # List conversations
GET    /api/conversations/:id              # Get one conversation

// ❌ INCORRECT: Non-RESTful, inconsistent
GET    /api/getMessages?conv=123           # Bad: verb in URL
POST   /api/messages/create                # Bad: unnecessary 'create'
POST   /api/deleteMessage                  # Bad: wrong verb
GET    /api/conversation/:id/get           # Bad: redundant 'get'
```

**Rule 2: Pagination & Filtering**
```typescript
// ✅ CORRECT: Query parameters for pagination
@Get()
async getMessages(
  @Query() query: GetMessagesDto,
) {
  const { limit = 50, offset = 0, before, after } = query;

  return this.messagesService.getMessages({
    limit: Math.min(limit, 100), // Max 100
    offset,
    before,
    after,
  });
}

// DTO
export class GetMessagesDto {
  @IsOptional()
  @IsNumber()
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;

  @IsOptional()
  @IsString()
  before?: string; // Message ID

  @IsOptional()
  @IsString()
  after?: string; // Message ID
}

// Response format
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 500,
    "hasMore": true
  }
}

// ❌ INCORRECT: No pagination, no limits
@Get()
async getMessages() {
  return this.messageRepo.find(); // Could return millions of records
}
```

**Rule 3: Consistent Response Format**
```typescript
// ✅ CORRECT: Consistent response structure
// Implemented via transform.interceptor.ts
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-02T10:00:00Z",
    "version": "1.0.0"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "MESSAGE_NOT_FOUND",
    "message": "Message with ID 123 not found",
    "statusCode": 404
  },
  "meta": {
    "timestamp": "2025-11-02T10:00:00Z",
    "version": "1.0.0"
  }
}

// ❌ INCORRECT: Inconsistent responses
// Success: { data: ... }
// Error: { error: true, msg: "oops" }
// Different: { result: ..., status: "ok" }
```

---

## Real-Time Communication Patterns

### WebSocket Patterns

**Rule 1: Event Naming Convention**
```typescript
// ✅ CORRECT: resource:action naming
'message:send'           // Send message
'message:edit'           // Edit message
'message:delete'         // Delete message
'message:react'          // React to message
'typing:start'           // Start typing
'typing:stop'            // Stop typing
'call:initiate'          // Initiate call
'call:accept'            // Accept call
'user:online'            // User went online
'presence:update'        // Update presence

// ❌ INCORRECT: Inconsistent naming
'sendMessage'            // Bad: camelCase
'message_sent'           // Bad: underscore
'new-message'            // Bad: dash inconsistent
'MessageReceived'        // Bad: PascalCase
'msg'                    // Bad: abbreviation
```

**Rule 2: Room-Based Broadcasting**
```typescript
// ✅ CORRECT: Use rooms for targeted broadcasting
// Backend
@SubscribeMessage('message:send')
async handleMessage(
  @ConnectedSocket() socket: Socket,
  @MessageBody() data: SendMessageDto,
) {
  const message = await this.messagesService.createMessage(data);

  // Broadcast to conversation room
  socket.to(`conversation:${data.conversationId}`).emit('message:new', message);

  return { success: true, data: message };
}

// Join room on conversation open
@SubscribeMessage('conversation:join')
handleJoinConversation(
  @ConnectedSocket() socket: Socket,
  @MessageBody() data: { conversationId: string },
) {
  socket.join(`conversation:${data.conversationId}`);
}

// ❌ INCORRECT: Broadcast to all connected clients
socket.emit('message:new', message); // Everyone gets it
io.emit('message:new', message); // Massive performance issue
```

**Rule 3: Socket Connection Lifecycle**
```typescript
// ✅ CORRECT: Proper connection management (App.tsx)
useEffect(() => {
  if (!isAuthenticated) return;

  // Check if already connected
  if (socketService.isConnected()) {
    console.log('Already connected');
    return;
  }

  // Connect socket
  socketService.connect();

  // Setup event listeners
  setupWebSocketEvents();

  // Heartbeat to maintain connection
  const heartbeat = setInterval(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }
  }, 30000);

  // Cleanup only on unmount, NOT on every re-render
  return () => {
    clearInterval(heartbeat);
    // Note: Socket persists across navigation
  };
}, [isAuthenticated]);

// ❌ INCORRECT: Disconnect on every re-render
useEffect(() => {
  const socket = io();
  return () => socket.disconnect(); // Bad: Disconnects on every re-render
}, [someState]);
```

### WebRTC Signaling Patterns

**Rule 1: Signaling Flow**
```typescript
// ✅ CORRECT: Proper signaling flow
// 1. Initiator creates offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
realtimeSocket.emit('call:offer', {
  callId,
  to: participantId,
  sdp: offer,
});

// 2. Recipient receives offer, creates answer
realtimeSocket.on('call:offer', async ({ callId, from, sdp }) => {
  await peerConnection.setRemoteDescription(sdp);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  realtimeSocket.emit('call:answer', {
    callId,
    to: from,
    sdp: answer,
  });
});

// 3. Initiator receives answer
realtimeSocket.on('call:answer', async ({ callId, from, sdp }) => {
  await peerConnection.setRemoteDescription(sdp);
});

// 4. Both exchange ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    realtimeSocket.emit('ice-candidate', {
      callId,
      to: participantId,
      candidate: event.candidate,
    });
  }
};

// ❌ INCORRECT: Missing steps, no error handling
const offer = await peerConnection.createOffer();
socket.emit('offer', offer); // Missing setLocalDescription
```

### WebRTC Media Management Patterns (CRITICAL)

**Rule 1: State-First Pattern - ALWAYS Update Store BEFORE Requesting Media**

```typescript
// ✅ CORRECT: Set store state FIRST, then get media
async initiateCall(conversationId: string, callType: 'audio' | 'video', participants: string[]) {
  // STEP 1: Update store with correct media states
  useCallStore.getState().initiateCall(conversationId, callType, participants);
  //   This sets:
  //     isAudioEnabled: true
  //     isVideoEnabled: callType === 'video'  // false for audio, true for video

  // STEP 2: Get local stream AFTER store has correct states
  await this.getLocalStream(callType === 'video');
  //   Media tracks will be synced with store states on creation

  // STEP 3: Proceed with call initialization
  // ...
}

// ❌ INCORRECT: Get media first, update store later
async initiateCall(conversationId: string, callType: 'audio' | 'video', participants: string[]) {
  await this.getLocalStream(callType === 'video'); // BAD: Store states wrong
  useCallStore.getState().initiateCall(conversationId, callType, participants); // Too late
}
```

**Rule 2: Immutable State Updates - NEVER Mutate State Directly**

```typescript
// ✅ CORRECT: Use store actions for state updates
async switchToVideo() {
  // Add video track to stream
  const videoTrack = await getVideoTrack();
  this.localStream.addTrack(videoTrack);

  // Update call type using immutable store action
  useCallStore.getState().updateCallType('video'); // Triggers React re-render

  // Clone stream to create new reference for React
  const clonedStream = new MediaStream(this.localStream.getTracks());
  useCallStore.getState().setLocalStream(clonedStream);
}

// ❌ INCORRECT: Direct mutation doesn't trigger React updates
async switchToVideo() {
  const activeCall = useCallStore.getState().activeCall;
  activeCall.callType = 'video'; // BAD: Direct mutation, no re-render
}
```

**Rule 3: Track State Synchronization - Sync Tracks with Store on Creation**

```typescript
// ✅ CORRECT: Sync track enabled states with store after getUserMedia
async getLocalStream(video: boolean): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  });

  // CRITICAL: Sync track states with store
  const { isAudioEnabled, isVideoEnabled } = useCallStore.getState();

  stream.getAudioTracks().forEach(track => {
    track.enabled = isAudioEnabled; // Match store state
  });

  stream.getVideoTracks().forEach(track => {
    track.enabled = isVideoEnabled; // Match store state
  });

  useCallStore.getState().setLocalStream(stream);
  return stream;
}

// ❌ INCORRECT: Tracks enabled but store says disabled (or vice versa)
async getLocalStream(video: boolean): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
  // No sync - track.enabled might not match store state
  return stream;
}
```

**Rule 4: Dual Validation - Check Both State AND Actual Tracks**

```typescript
// ✅ CORRECT: Validate both state flag and actual track presence
const VideoTile = ({ isVideoEnabled, localStream }) => {
  // Check both conditions
  const hasVideoTrack = (localStream?.getVideoTracks().length || 0) > 0;
  const showVideo = isVideoEnabled && hasVideoTrack;

  return (
    <div>
      {showVideo ? (
        <video srcObject={localStream} />
      ) : (
        <div>Avatar placeholder</div>
      )}
    </div>
  );
};

// ❌ INCORRECT: Only check state flag
const VideoTile = ({ isVideoEnabled, localStream }) => {
  return showVideo ? <video srcObject={localStream} /> : <div>Avatar</div>;
  // Problem: Might try to show video when no video tracks exist
};
```

**Rule 5: Proper Effect Dependencies - Track All Relevant State**

```typescript
// ✅ CORRECT: Include all dependencies that affect rendering
useEffect(() => {
  if (localVideoRef.current && localStream) {
    localVideoRef.current.srcObject = localStream;
    localVideoRef.current.play();
  }
}, [localStream, call.callType, isVideoEnabled]); // All relevant dependencies

// ❌ INCORRECT: Missing dependencies
useEffect(() => {
  if (localVideoRef.current && localStream) {
    localVideoRef.current.srcObject = localStream;
  }
}, [localStream]); // Missing call.callType - won't update on audio→video switch
```

**Rule 6: Safe Toggle Operations - Only Toggle If Tracks Exist**

```typescript
// ✅ CORRECT: Check track existence before toggling
toggleVideo: () => {
  const { localStream, isVideoEnabled } = get();
  if (localStream) {
    const videoTracks = localStream.getVideoTracks();

    // Safety check
    if (videoTracks.length > 0) {
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      set({ isVideoEnabled: !isVideoEnabled });
    } else {
      console.warn('Cannot toggle video - no video tracks in stream');
    }
  }
};

// ❌ INCORRECT: Toggle state even when no tracks exist
toggleVideo: () => {
  set(state => ({ isVideoEnabled: !state.isVideoEnabled }));
  // Problem: State says enabled but no actual video tracks
};
```

**Rule 7: Stream Cloning for React Updates - Create New References**

```typescript
// ✅ CORRECT: Clone stream to trigger React re-render
pc.ontrack = (event) => {
  const [remoteStream] = event.streams;

  // Clone to create new object reference for React
  const clonedStream = new MediaStream(remoteStream.getTracks());

  useCallStore.getState().updateParticipant(userId, {
    stream: clonedStream, // New reference triggers useEffect
  });
};

// ❌ INCORRECT: Reuse same stream reference
pc.ontrack = (event) => {
  const [remoteStream] = event.streams;

  useCallStore.getState().updateParticipant(userId, {
    stream: remoteStream, // Same reference, React might not detect change
  });
};
```

**Rule 8: Audio/Video Call Type Initialization - Set Correct States**

```typescript
// ✅ CORRECT: Initialize store with correct media states for call type
initiateCall: (conversationId, callType, participants) => {
  const activeCall: ActiveCall = {
    callId: 'pending',
    conversationId,
    callType,
    status: 'initiating',
    participants: new Map(),
    startedAt: new Date(),
    isMinimized: false,
  };

  set({
    activeCall,
    isCallOverlayVisible: true,
    // CRITICAL: Set based on call type
    isAudioEnabled: true,              // Always true
    isVideoEnabled: callType === 'video', // false for audio, true for video
    isScreenSharing: false,
  });
};

// ❌ INCORRECT: Don't set media states, use defaults
initiateCall: (conversationId, callType, participants) => {
  set({
    activeCall: { /* ... */ },
    // Missing media state initialization - uses stale values
  });
};
```

**Rule 9: Proper Cleanup - Reset All States on Call End**

```typescript
// ✅ CORRECT: Reset all media states on call end
endCall: () => {
  const { activeCall, localStream } = get();

  // Stop all tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  // Reset ALL states to defaults
  set({
    activeCall: null,
    localStream: null,
    isCallOverlayVisible: false,
    isScreenSharing: false,
    isAudioEnabled: true,     // Reset to default
    isVideoEnabled: true,     // Reset to default
  });
};

// ❌ INCORRECT: Don't reset media states
endCall: () => {
  set({
    activeCall: null,
    localStream: null,
    // Missing: isAudioEnabled, isVideoEnabled - stale states remain
  });
};
```

**Rule 10: Always Sync Store When Reusing Streams**

```typescript
// ✅ CORRECT: Always update store even when reusing stream
async getLocalStream(video: boolean): Promise<MediaStream> {
  if (this.localStream) {
    const hasVideo = this.localStream.getVideoTracks().length > 0;

    if ((video && hasVideo) || (!video && !hasVideo)) {
      // CRITICAL: Sync with store even when reusing
      useCallStore.getState().setLocalStream(this.localStream);
      return this.localStream;
    }
  }

  // Create new stream...
}

// ❌ INCORRECT: Return cached stream without syncing
async getLocalStream(video: boolean): Promise<MediaStream> {
  if (this.localStream) {
    return this.localStream; // BAD: Store might not have this reference
  }
  // ...
}
```

**Rule 11: Offer Constraints Based on Call Type - CRITICAL for Audio Calls**

```typescript
// ✅ CORRECT: Set offerToReceiveVideo based on actual call type
async createOffer(userId: string) {
  const pc = this.createPeerConnection(userId);

  const activeCall = useCallStore.getState().activeCall;
  const isVideoCall = activeCall?.callType === 'video';

  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: isVideoCall, // false for audio, true for video
  });

  await pc.setLocalDescription(offer);
  // Send offer...
}

// ❌ INCORRECT: Always request video, even for audio calls
async createOffer(userId: string) {
  const pc = this.createPeerConnection(userId);

  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true, // BAD: Breaks audio-only calls!
  });

  // Problem: Audio tracks may not work properly because WebRTC
  // is trying to negotiate video channels that don't exist
}
```

**Why This Matters:**
- Setting `offerToReceiveVideo: true` for audio-only calls causes WebRTC to negotiate video channels
- This can interfere with audio track negotiation, causing microphone to not work
- Audio calls need `offerToReceiveVideo: false` to work correctly
- This applies to all offer creation: initial offers, renegotiation, ICE restarts

**Apply to All Offer Creation:**
```typescript
// Initial offer
createOffer() → check callType

// Renegotiation (audio→video switch)
renegotiate() → check callType

// ICE restart (connection recovery)
pc.createOffer({ iceRestart: true }) → check callType
```

---

## Database Design Rules

### Entity Design Patterns

**Rule 1: Base Entity**
```typescript
// ✅ CORRECT: Extend BaseEntity for all entities
// common/entities/base.entity.ts
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // Soft delete
}

// Usage
@Entity('messages')
export class Message extends BaseEntity {
  @Column()
  content: string;

  @Column()
  senderId: string;

  // ... other fields
}

// ❌ INCORRECT: Duplicate timestamp fields
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number; // Bad: Should be UUID

  @Column()
  content: string;

  @Column()
  created_at: Date; // Bad: Inconsistent naming, duplicate logic
}
```

**Rule 2: Relationships**
```typescript
// ✅ CORRECT: Proper TypeORM relationships
@Entity('messages')
export class Message extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: string;

  @ManyToOne(() => Conversation, { nullable: false })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: string;

  @OneToMany(() => MessageReaction, reaction => reaction.message, { cascade: true })
  reactions: MessageReaction[];
}

// ❌ INCORRECT: Missing foreign keys, no cascades
@Entity('messages')
export class Message {
  @Column()
  senderId: string; // No actual relationship

  @OneToMany(() => MessageReaction, reaction => reaction.message)
  reactions: MessageReaction[]; // No cascade, orphan records
}
```

**Rule 3: Indexes**
```typescript
// ✅ CORRECT: Index frequently queried fields
@Entity('messages')
@Index(['conversationId', 'createdAt']) // Composite index for pagination
@Index(['senderId']) // For user's messages
export class Message extends BaseEntity {
  @Column()
  conversationId: string;

  @Column()
  senderId: string;

  @Column()
  content: string;
}

// ❌ INCORRECT: No indexes
@Entity('messages')
export class Message extends BaseEntity {
  @Column()
  conversationId: string; // Slow queries on millions of messages
}
```

---

## Security Requirements

### Authentication & Authorization

**Rule 1: JWT + Refresh Token Pattern**
```typescript
// ✅ CORRECT: Short-lived access + long-lived refresh
// Auth service
async login(dto: LoginDto) {
  const user = await this.validateUser(dto.email, dto.password);

  const accessToken = this.jwtService.sign(
    { userId: user.id, email: user.email },
    { expiresIn: '15m' } // Short-lived
  );

  const refreshToken = this.jwtService.sign(
    { userId: user.id, tokenId: uuidv4() },
    { expiresIn: '7d' } // Long-lived
  );

  // Store refresh token in database
  await this.refreshTokenRepo.save({
    userId: user.id,
    token: refreshToken,
    expiresAt: addDays(new Date(), 7),
  });

  return { user, accessToken, refreshToken };
}

// ❌ INCORRECT: Long-lived access token, no refresh
async login(dto: LoginDto) {
  const token = this.jwtService.sign(
    { userId: user.id },
    { expiresIn: '30d' } // Bad: Too long, can't revoke
  );
  return { token };
}
```

**Rule 2: Input Validation & Sanitization**
```typescript
// ✅ CORRECT: Validate and sanitize all inputs
@Post('register')
async register(@Body() dto: RegisterDto) {
  // DTO validation via class-validator
  dto.email = dto.email.trim().toLowerCase();
  dto.username = this.sanitizeUsername(dto.username);

  if (!this.isValidEmail(dto.email)) {
    throw new BadRequestException('Invalid email format');
  }

  // Hash password with bcrypt (min 12 rounds)
  dto.password = await bcrypt.hash(dto.password, 12);

  return this.authService.register(dto);
}

// ❌ INCORRECT: Direct database insert, no validation
@Post('register')
async register(@Body() data: any) { // Bad: any type
  await this.userRepo.save(data); // Bad: SQL injection risk
}
```

**Rule 3: Authorization Guards**
```typescript
// ✅ CORRECT: Use guards for authorization
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  @Post(':id/invite')
  @UseGuards(WorkspaceAdminGuard) // Check if user is admin
  async inviteMembers(
    @Param('id') workspaceId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.workspacesService.inviteMembers(workspaceId, dto, user);
  }
}

// ❌ INCORRECT: Authorization in controller logic
@Post(':id/invite')
async inviteMembers(@Param('id') workspaceId: string, @Body() dto: any) {
  // Bad: Authorization mixed with business logic
  const workspace = await this.getWorkspace(workspaceId);
  if (workspace.ownerId !== user.id) {
    throw new ForbiddenException();
  }
  // ...
}
```

---

## Testing Requirements

### Backend Testing

**Rule 1: Unit Tests for Services**
```typescript
// ✅ CORRECT: Test service methods with mocked dependencies
describe('MessagesService', () => {
  let service: MessagesService;
  let mockMessageRepo: MockType<Repository<Message>>;
  let mockConversationService: MockType<ConversationService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useFactory: mockRepository,
        },
        {
          provide: ConversationService,
          useFactory: mockService,
        },
      ],
    }).compile();

    service = module.get(MessagesService);
    mockMessageRepo = module.get(getRepositoryToken(Message));
  });

  it('should create a message', async () => {
    const dto: CreateMessageDto = {
      conversationId: '123',
      content: 'Hello',
    };

    mockMessageRepo.create.mockReturnValue(dto);
    mockMessageRepo.save.mockResolvedValue({ id: '456', ...dto });

    const result = await service.createMessage(dto);

    expect(result.id).toBe('456');
    expect(mockMessageRepo.create).toHaveBeenCalledWith(dto);
    expect(mockMessageRepo.save).toHaveBeenCalled();
  });
});

// ❌ INCORRECT: No tests or incomplete tests
// No test file at all, or:
it('should work', () => {
  expect(true).toBe(true); // Useless test
});
```

### Frontend Testing

**Rule 2: Component Tests**
```typescript
// ✅ CORRECT: Test user interactions
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageComposer } from './MessageComposer';

describe('MessageComposer', () => {
  const mockOnSend = jest.fn();

  it('should send message when Enter is pressed', async () => {
    render(<MessageComposer onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello World' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Hello World');
    });
  });

  it('should add newline when Shift+Enter is pressed', () => {
    render(<MessageComposer onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockOnSend).not.toHaveBeenCalled();
  });
});

// ❌ INCORRECT: Testing implementation details
it('should have state', () => {
  const { result } = renderHook(() => useState(''));
  expect(result.current[0]).toBe(''); // Testing React internals
});
```

---

## Feature Implementation Workflow

### Step-by-Step Process

**1. Read Documentation**
```bash
# Before implementing ANY feature:
1. Read PROJECT_DOCUMENTATION.md
   - Find relevant modules/components
   - Understand current patterns
   - Check API endpoints

2. Read comprehensive_chat_app_prompt.md (if new feature)
   - Understand feature requirements
   - Check technical specifications
   - Review acceptance criteria

3. Read this file (CLAUDE.md)
   - Follow architecture patterns
   - Apply coding standards
   - Use correct file organization
```

**2. Plan Implementation**
```
Backend Feature Checklist:
□ Create module folder: src/modules/<feature>/
□ Create entity: entities/<feature>.entity.ts
□ Create DTOs: dto/create-<feature>.dto.ts, update-<feature>.dto.ts
□ Create service: <feature>.service.ts
□ Create controller: <feature>.controller.ts
□ Create gateway (if real-time): <feature>.gateway.ts
□ Create module: <feature>.module.ts
□ Add tests: <feature>.service.spec.ts, <feature>.controller.spec.ts
□ Register module in app.module.ts
□ Update PROJECT_DOCUMENTATION.md

Frontend Feature Checklist:
□ Create component: components/<Feature>.tsx
□ Create hook (if needed): hooks/use<Feature>.ts
□ Create API client: lib/api/endpoints/<feature>.api.ts
□ Create store (if needed): lib/stores/<feature>.store.ts
□ Add types: types/entities.types.ts
□ Create tests: <Feature>.test.tsx
□ Update PROJECT_DOCUMENTATION.md
```

**3. Implement Following Patterns**
```typescript
// Always follow established patterns from existing code

// Backend: Copy pattern from similar module
// Example: Creating "Polls" feature? Copy Messages module structure

src/modules/polls/
├── polls.controller.ts        # Copy from messages.controller.ts
├── polls.service.ts           # Copy from messages.service.ts
├── polls.module.ts            # Copy from messages.module.ts
├── entities/
│   └── poll.entity.ts         # Copy from message.entity.ts
└── dto/
    ├── create-poll.dto.ts     # Copy from create-message.dto.ts
    └── update-poll.dto.ts     # Copy from update-message.dto.ts

// Frontend: Copy pattern from similar component
// Example: Creating "PollComposer"? Copy MessageComposer structure
```

**4. Test Implementation**
```bash
# Backend testing
cd chat-backend
npm test                       # Run all tests
npm test -- polls.service      # Test specific service

# Frontend testing
cd chat-web-client
npm test                       # Run all tests
npm test -- PollComposer       # Test specific component

# Integration testing
npm run dev                    # Start all services
# Test manually in browser
```

**5. Update Documentation**
```markdown
# Update PROJECT_DOCUMENTATION.md

## In Backend tree view:
├── modules/
│   ├── polls/
│   │   ├── polls.controller.ts - Poll endpoints: GET, POST, PUT, DELETE
│   │   ├── polls.service.ts - Poll business logic: createPoll(), updatePoll()
│   │   ├── entities/
│   │   │   └── poll.entity.ts - Poll entity (id, question, options, votes)
│   │   └── dto/
│   │       ├── create-poll.dto.ts - Create poll DTO { question, options[] }
│   │       └── vote-poll.dto.ts - Vote DTO { optionId }

## In API Endpoints section:
### Polls
- GET /api/polls - Get all polls
- POST /api/polls - Create poll { question, options[] }
- POST /api/polls/:id/vote - Vote { optionId }

## Update "Last Updated" date at bottom
**Last Updated:** November 2, 2025

## ⚠️ DO NOT add "Recent Changes" section to PROJECT_DOCUMENTATION.md
# If you need to track this change, add it to CLAUDE.md or create a CHANGELOG.md file
```

**6. Commit Changes**
```bash
# Commit code and documentation together
git add .
git commit -m "feat: Add polls feature with real-time voting

- Backend: Create polls module with voting endpoints
- Frontend: Add PollComposer and PollDisplay components
- WebSocket: Add poll:vote event for real-time updates
- Docs: Update PROJECT_DOCUMENTATION.md with complete details
"
```

---

## Resources

### Documentation
- **PROJECT_DOCUMENTATION.md** - Complete file-by-file documentation (PRIMARY REFERENCE)
- **comprehensive_chat_app_prompt.md** - Original 4,500-line specification
- **PROJECT_ARCHITECTURE.md** - System architecture and design decisions
- **README.md** - Quick start guide

### External Resources
- **NestJS**: https://docs.nestjs.com/
- **React**: https://react.dev/
- **TypeORM**: https://typeorm.io/
- **TanStack Query**: https://tanstack.com/query/latest
- **Socket.IO**: https://socket.io/docs/
- **ShadCN UI**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/

---

## Summary

This CLAUDE.md file is the **definitive guide** for all development in this codebase. When implementing features:

1. ✅ **ALWAYS** read PROJECT_DOCUMENTATION.md first
2. ✅ **ALWAYS** follow the architecture patterns defined here
3. ✅ **ALWAYS** maintain TypeScript strict mode
4. ✅ **ALWAYS** update PROJECT_DOCUMENTATION.md immediately
5. ✅ **ALWAYS** follow file organization rules
6. ✅ **ALWAYS** write tests for new features
7. ✅ **ALWAYS** use established patterns from existing code

**Questions? Check PROJECT_DOCUMENTATION.md for file locations and patterns.**

---

**Last Updated:** November 5, 2025
**Maintained By:** Development Team
**Version:** 2.2.0 (Documentation structure improved - PROJECT_DOCUMENTATION.md is now current-state only)
