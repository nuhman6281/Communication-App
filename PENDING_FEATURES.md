# Pending Features & Integration Tasks

**Last Updated:** November 5, 2025
**Status:** Comprehensive Feature Gap Analysis
**Purpose:** Complete list of pending features, API integrations, and bug fixes for future development

---

## Table of Contents

1. [Critical Pending Features](#critical-pending-features)
2. [High Priority Features](#high-priority-features)
3. [Medium Priority Features](#medium-priority-features)
4. [Low Priority Features](#low-priority-features)
5. [Frontend Integration Tasks](#frontend-integration-tasks)
6. [Backend Integration Tasks](#backend-integration-tasks)
7. [Real-Time WebSocket Events](#real-time-websocket-events)
8. [Database Schema Updates](#database-schema-updates)
9. [Third-Party Integrations](#third-party-integrations)
10. [Performance Optimizations](#performance-optimizations)
11. [Security Enhancements](#security-enhancements)

---

## Critical Pending Features

### 1. End-to-End Encryption (E2EE) ⚠️ **CRITICAL SECURITY**

**Priority:** 🔴 CRITICAL
**Effort:** 🔥🔥🔥🔥🔥 (Very High)
**Impact:** Maximum Security & Privacy

**Backend Tasks:**
- [ ] Implement Signal Protocol library integration
- [ ] Create E2E encryption module (`src/modules/encryption/`)
- [ ] Generate and manage key pairs for users
- [ ] Implement X3DH key agreement protocol
- [ ] Implement Double Ratchet algorithm for message encryption
- [ ] Create key exchange endpoints
- [ ] Implement encrypted message storage
- [ ] Add pre-key bundles management
- [ ] Create session management for encrypted conversations
- [ ] Add encrypted group messaging support

**Frontend Tasks:**
- [ ] Integrate libsignal-protocol library
- [ ] Implement client-side key generation
- [ ] Create key exchange UI flow
- [ ] Encrypt messages before sending
- [ ] Decrypt messages on receipt
- [ ] Display encryption status indicator
- [ ] Implement encrypted media handling
- [ ] Add "Verify Safety Number" feature
- [ ] Create encrypted backup/restore flow

**Database:**
```sql
CREATE TABLE encryption_keys (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    identity_key TEXT NOT NULL,
    signed_pre_key TEXT NOT NULL,
    one_time_pre_keys JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE encrypted_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    peer_id UUID REFERENCES users(id),
    session_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, peer_id)
);
```

**References:**
- Backend: `/chat-backend/src/modules/encryption/`
- Frontend: `/chat-web-client/src/lib/encryption/`
- Spec: `comprehensive_chat_app_prompt.md:3170`

---

### 2. Push Notifications (FCM/OneSignal) ⚠️ **CRITICAL USER ENGAGEMENT**

**Priority:** 🔴 CRITICAL
**Effort:** 🔥🔥🔥 (High)
**Impact:** Essential for user retention

**Backend Tasks:**
- [ ] Install Firebase Admin SDK or OneSignal SDK
- [ ] Create push notification service (`src/modules/notifications/push-notification.service.ts`)
- [ ] Implement device token registration endpoints
- [ ] Create notification payload builder
- [ ] Integrate push notifications with message events
- [ ] Add call notification support (incoming call alerts)
- [ ] Implement notification batching for performance
- [ ] Add notification preferences management
- [ ] Create scheduled notification support
- [ ] Implement notification analytics tracking

**Frontend Tasks:**
- [ ] Install Firebase Messaging or OneSignal React SDK
- [ ] Request notification permissions on login
- [ ] Register device token with backend
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Implement notification click handling (deep linking)
- [ ] Add notification sound customization
- [ ] Create notification settings UI
- [ ] Implement notification badge management
- [ ] Add "Mark all as read" functionality

**Environment Variables:**
```env
# Firebase Cloud Messaging
FCM_SERVER_KEY=your_fcm_server_key
FCM_PROJECT_ID=your_firebase_project_id

# Or OneSignal
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_API_KEY=your_onesignal_api_key
```

**Database:**
```sql
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(20), -- 'ios', 'android', 'web'
    device_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
```

**References:**
- Backend: `/chat-backend/src/modules/notifications/push-notification.service.ts`
- Frontend: `/chat-web-client/src/lib/notifications/`
- Spec: `comprehensive_chat_app_prompt.md:3149-3157`

---

### 3. Data Export (GDPR Compliance) ⚠️ **LEGAL REQUIREMENT**

**Priority:** 🔴 CRITICAL
**Effort:** 🔥🔥🔥 (High)
**Impact:** Legal compliance (EU GDPR, CCPA)

**Backend Tasks:**
- [ ] Create data export module (`src/modules/export/`)
- [ ] Implement `POST /users/me/export` endpoint
- [ ] Export user profile data (JSON)
- [ ] Export all messages with timestamps
- [ ] Export media files (create ZIP archive)
- [ ] Export call history
- [ ] Export contacts and blocked users
- [ ] Use Bull Queue for async export processing
- [ ] Email download link when ready
- [ ] Implement export expiration (delete after 7 days)
- [ ] Add export request rate limiting

**Frontend Tasks:**
- [ ] Add "Export Data" button in Settings
- [ ] Show export progress indicator
- [ ] Display export status (processing, ready, expired)
- [ ] Download exported archive
- [ ] Show export history

**Database:**
```sql
CREATE TABLE data_exports (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    file_url TEXT,
    file_size BIGINT,
    expires_at TIMESTAMP,
    requested_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_data_exports_user ON data_exports(user_id);
```

**References:**
- Backend: `/chat-backend/src/modules/export/`
- Frontend: `/chat-web-client/src/components/Settings.tsx`
- Spec: `comprehensive_chat_app_prompt.md:3180`

---

### 4. Message Threading/Replies

**Priority:** 🔴 CRITICAL
**Effort:** 🔥🔥🔥🔥 (Very High)
**Impact:** Essential collaboration feature

**Backend Tasks:**
- [ ] Add `reply_to_id` and `thread_id` columns to messages table
- [ ] Create thread aggregation queries
- [ ] Implement `GET /messages/:id/thread` endpoint
- [ ] Update message creation to link replies
- [ ] Add thread participant tracking
- [ ] Implement thread notifications
- [ ] Create thread summary/preview generation

**Frontend Tasks:**
- [ ] Add "Reply" button to message actions
- [ ] Create reply composer UI with quoted message
- [ ] Display thread indicator on messages
- [ ] Implement thread view sidebar
- [ ] Show thread participant count
- [ ] Navigate between thread messages
- [ ] Implement thread-specific notifications

**Database:**
```sql
ALTER TABLE messages ADD COLUMN reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN thread_id UUID;
ALTER TABLE messages ADD COLUMN thread_reply_count INTEGER DEFAULT 0;

CREATE INDEX idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
```

**WebSocket Events:**
- `message:reply` - New reply in thread
- `thread:updated` - Thread metadata changed

**References:**
- Backend: `/chat-backend/src/modules/messages/`
- Frontend: `/chat-web-client/src/components/MessageThread.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3060`

---

### 5. Read Receipts with Privacy Controls

**Priority:** 🔴 CRITICAL
**Effort:** 🔥🔥🔥 (High)
**Impact:** User expectation feature

**Backend Tasks:**
- [ ] Create message_reads table
- [ ] Implement `POST /messages/:id/read` endpoint
- [ ] Track read timestamps per user
- [ ] Respect user privacy settings (disable read receipts)
- [ ] Implement read receipt aggregation
- [ ] Add group message read tracking
- [ ] Create privacy settings endpoints

**Frontend Tasks:**
- [ ] Send read receipt when message viewed
- [ ] Display read indicators (checkmarks)
- [ ] Show "Read by" list in groups
- [ ] Add privacy toggle in Settings
- [ ] Update message status icons (sent → delivered → read)
- [ ] Implement read receipt real-time updates

**Database:**
```sql
CREATE TABLE message_reads (
    id UUID PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

ALTER TABLE user_settings
ADD COLUMN show_read_receipts BOOLEAN DEFAULT TRUE;

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);
```

**WebSocket Events:**
- `message:read` - Message read by recipient

**References:**
- Backend: `/chat-backend/src/modules/messages/entities/message-read.entity.ts`
- Frontend: `/chat-web-client/src/components/MessageBubble.tsx`
- Spec: `comprehensive_chat_app_prompt.md:3095-3096`

---

### 6. Pin Important Messages

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥 (Medium)
**Impact:** Collaboration essential

**Backend Tasks:**
- [ ] Create pinned_messages table
- [ ] Implement `POST /conversations/:id/pin/:messageId` endpoint
- [ ] Implement `DELETE /conversations/:id/pin/:messageId` endpoint
- [ ] Limit pinned messages per conversation (max 5)
- [ ] Create `GET /conversations/:id/pinned` endpoint
- [ ] Add permission checks (admins only in groups)

**Frontend Tasks:**
- [ ] Add "Pin Message" to message context menu
- [ ] Display pinned messages banner at top
- [ ] Show pinned message count
- [ ] Create pinned messages list view
- [ ] Add "Unpin" action
- [ ] Real-time pin/unpin updates

**Database:**
```sql
CREATE TABLE pinned_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    pinned_by UUID REFERENCES users(id),
    pinned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(conversation_id, message_id)
);

CREATE INDEX idx_pinned_messages_conversation ON pinned_messages(conversation_id);
```

**WebSocket Events:**
- `message:pinned` - Message pinned
- `message:unpinned` - Message unpinned

**References:**
- Backend: `/chat-backend/src/modules/messages/`
- Frontend: `/chat-web-client/src/components/PinnedMessages.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3071`

---

## High Priority Features

### 7. Markdown Support in Messages

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥 (Medium)
**Impact:** Rich text formatting

**Backend Tasks:**
- [ ] No backend changes required (store as plain text)
- [ ] Optional: Add markdown sanitization/validation

**Frontend Tasks:**
- [ ] Install `react-markdown` and `remark-gfm`
- [ ] Create markdown editor component
- [ ] Add formatting toolbar (bold, italic, code, lists)
- [ ] Implement markdown preview toggle
- [ ] Render markdown in message bubbles
- [ ] Support syntax highlighting for code blocks
- [ ] Add emoji shortcode support (`:smile:` → 😊)

**References:**
- Frontend: `/chat-web-client/src/components/MessageComposer.tsx`
- Frontend: `/chat-web-client/src/components/MarkdownRenderer.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3058`

---

### 8. Polls and Surveys

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥🔥🔥 (Very High)
**Impact:** Engagement feature

**Backend Tasks:**
- [ ] Create polls module (`src/modules/polls/`)
- [ ] Create poll.entity.ts with options and votes
- [ ] Implement `POST /polls` endpoint
- [ ] Implement `POST /polls/:id/vote` endpoint
- [ ] Implement `GET /polls/:id/results` endpoint
- [ ] Add poll expiration/close functionality
- [ ] Support multiple choice polls
- [ ] Support anonymous voting option

**Frontend Tasks:**
- [ ] Create poll creation dialog
- [ ] Add "Create Poll" button in composer
- [ ] Display poll in message bubbles
- [ ] Implement voting UI
- [ ] Show real-time vote counts
- [ ] Display poll results (bar chart)
- [ ] Add poll expiration countdown

**Database:**
```sql
CREATE TABLE polls (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- [{"id": "1", "text": "Option 1"}, ...]
    allow_multiple BOOLEAN DEFAULT FALSE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    closes_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE poll_votes (
    id UUID PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    option_id TEXT NOT NULL,
    voted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(poll_id, user_id, option_id)
);

CREATE INDEX idx_polls_conversation ON polls(conversation_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
```

**WebSocket Events:**
- `poll:created` - New poll created
- `poll:vote` - New vote cast
- `poll:closed` - Poll closed

**References:**
- Backend: `/chat-backend/src/modules/polls/` (NEW)
- Frontend: `/chat-web-client/src/components/PollComposer.tsx` (NEW)
- Frontend: `/chat-web-client/src/components/PollDisplay.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3086`

---

### 9. Forward Messages

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥 (Medium)
**Impact:** Essential messaging feature

**Backend Tasks:**
- [ ] Implement `POST /messages/forward` endpoint
- [ ] Duplicate message content to new conversation
- [ ] Maintain forwarded_from metadata
- [ ] Handle media file duplication
- [ ] Add forward count tracking

**Frontend Tasks:**
- [ ] Add "Forward" to message context menu
- [ ] Create conversation selector dialog
- [ ] Support multi-conversation forwarding
- [ ] Show "Forwarded" label on messages
- [ ] Display original sender info

**Database:**
```sql
ALTER TABLE messages ADD COLUMN forwarded_from_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN forward_count INTEGER DEFAULT 0;
```

**References:**
- Backend: `/chat-backend/src/modules/messages/messages.controller.ts`
- Frontend: `/chat-web-client/src/components/ForwardDialog.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3062`

---

### 10. Location Sharing

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥🔥 (High)
**Impact:** Real-world meetup coordination

**Backend Tasks:**
- [ ] Add location message type support
- [ ] Store latitude/longitude in message metadata
- [ ] Implement location validation
- [ ] Optional: Reverse geocoding for address

**Frontend Tasks:**
- [ ] Integrate Google Maps or Mapbox
- [ ] Add "Share Location" button in composer
- [ ] Request geolocation permission
- [ ] Display current location picker
- [ ] Allow custom location selection (pin drop)
- [ ] Render map in message bubbles
- [ ] Add "Open in Maps" button
- [ ] Support live location sharing (optional)

**Database:**
```sql
ALTER TABLE messages ADD COLUMN location JSONB;
-- {"latitude": 40.7128, "longitude": -74.0060, "address": "New York, NY"}
```

**Environment Variables:**
```env
GOOGLE_MAPS_API_KEY=your_google_maps_key
# Or
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

**References:**
- Frontend: `/chat-web-client/src/components/LocationPicker.tsx` (NEW)
- Frontend: `/chat-web-client/src/components/LocationMessage.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3084`

---

## Medium Priority Features

### 11. Code Snippets with Syntax Highlighting

**Priority:** 🟢 MEDIUM
**Effort:** 🔥🔥 (Medium)
**Impact:** Developer-friendly feature

**Backend Tasks:**
- [ ] Add code snippet message type
- [ ] Store language and code in metadata

**Frontend Tasks:**
- [ ] Install `react-syntax-highlighter`
- [ ] Add "Code Snippet" button in composer
- [ ] Create code editor with language selector
- [ ] Render code with syntax highlighting
- [ ] Add copy button to code blocks
- [ ] Support popular languages (JS, Python, Java, etc.)

**Database:**
```sql
ALTER TABLE messages ADD COLUMN code_snippet JSONB;
-- {"language": "javascript", "code": "const foo = 'bar';"}
```

**References:**
- Frontend: `/chat-web-client/src/components/CodeSnippet.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3087`

---

### 12. Block/Unblock Users ✅ **COMPLETED**

**Priority:** 🟢 MEDIUM
**Effort:** 🔥🔥 (Medium)
**Impact:** Privacy & safety
**Completed:** November 5, 2025

**Backend Tasks:**
- [x] Create blocked_users table
- [x] Implement `POST /users/:id/block` endpoint
- [x] Implement `DELETE /users/:id/unblock` endpoint
- [x] Implement `GET /users/blocked` endpoint
- [x] Filter blocked users from conversations
- [x] Prevent messages from blocked users
- [x] Block WebSocket events from blocked users

**Frontend Tasks:**
- [x] Add "Block User" to user context menu
- [x] Show blocked users list in Settings
- [x] Add "Unblock" action
- [x] Hide messages from blocked users
- [x] Show "You blocked this user" message

**Database:**
```sql
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY,
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
```

**References:**
- Backend: `/chat-backend/src/modules/users/users.controller.ts`
- Frontend: `/chat-web-client/src/components/BlockedUsers.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3052`

---

### 13. In-Call Chat

**Priority:** 🟢 MEDIUM
**Effort:** 🔥🔥🔥 (High)
**Impact:** Enhanced call experience

**Backend Tasks:**
- [ ] Create call-specific chat rooms
- [ ] Link messages to call sessions
- [ ] Auto-delete chat after call ends (optional)

**Frontend Tasks:**
- [ ] Add chat toggle button in call UI
- [ ] Create chat sidebar overlay
- [ ] Send/receive messages during call
- [ ] Show typing indicators
- [ ] Auto-focus chat input

**WebSocket Events:**
- Use existing `message:send` event with call context

**References:**
- Frontend: `/chat-web-client/src/components/InCallChat.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3111`

---

### 14. Virtual Backgrounds (Video Calls)

**Priority:** 🟢 MEDIUM
**Effort:** 🔥🔥🔥🔥 (Very High)
**Impact:** Privacy & professionalism

**Frontend Tasks:**
- [ ] Integrate TensorFlow.js BodyPix or MediaPipe
- [ ] Implement background blur
- [ ] Add custom background image upload
- [ ] Apply background to video stream
- [ ] Add background selection UI
- [ ] Optimize performance (WebGL acceleration)

**References:**
- Frontend: `/chat-web-client/src/lib/webrtc/backgroundSegmentation.ts` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3107`

---

### 15. Call Recording

**Priority:** 🟢 MEDIUM
**Effort:** 🔥🔥🔥🔥🔥 (Very High)
**Impact:** Business/legal documentation

**Backend Tasks:**
- [ ] Integrate FFmpeg for server-side recording
- [ ] Create recording worker service
- [ ] Store recordings in MinIO
- [ ] Generate recording metadata (duration, participants)
- [ ] Implement recording permissions/consent
- [ ] Add recording download endpoint
- [ ] Auto-delete recordings after 30 days (configurable)

**Frontend Tasks:**
- [ ] Add "Record" button in call UI
- [ ] Show recording indicator to all participants
- [ ] Display recording duration
- [ ] Stop recording control
- [ ] View recordings in call history
- [ ] Download recordings

**Database:**
```sql
CREATE TABLE call_recordings (
    id UUID PRIMARY KEY,
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    duration INTEGER, -- seconds
    started_by UUID REFERENCES users(id),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**References:**
- Backend: `/chat-backend/src/modules/calls/recording.service.ts` (NEW)
- Frontend: `/chat-web-client/src/components/CallRecording.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3113`

---

## Frontend Integration Tasks

### 16. Stories - Connect to Real Backend API ⚠️ **INTEGRATION REQUIRED**

**Current Status:** ✅ Backend implemented, ❌ Frontend using mock data

**Files to Update:**
- `/chat-web-client/src/components/StoriesView.tsx` (currently uses `mockStories`)
- `/chat-web-client/src/lib/api/endpoints/stories.api.ts` (NEW - create this)
- `/chat-web-client/src/hooks/useStories.ts` (NEW - create this)

**Backend API Endpoints (Already Exist):**
```typescript
GET    /api/stories              // Get all active stories
GET    /api/stories/:id          // Get specific story
POST   /api/stories              // Create new story
DELETE /api/stories/:id          // Delete story
POST   /api/stories/:id/view     // Mark story as viewed
GET    /api/stories/:id/viewers  // Get story viewers
```

**Integration Steps:**
1. [ ] Create `storiesApi` client in `/lib/api/endpoints/stories.api.ts`
2. [ ] Create `useStories()` hook with TanStack Query
3. [ ] Replace `mockStories` with real API data
4. [ ] Implement story creation flow
5. [ ] Connect story view tracking
6. [ ] Add real-time story updates via WebSocket

**WebSocket Events to Implement:**
```typescript
socket.on('story:new', (story) => {
  // Add new story to list
  queryClient.invalidateQueries(['stories']);
});

socket.on('story:expired', (storyId) => {
  // Remove expired story
  queryClient.setQueryData(['stories'], (old) =>
    old.filter(s => s.id !== storyId)
  );
});

socket.on('story:viewed', ({ storyId, viewerId }) => {
  // Update viewer count
});
```

**Missing Features in Stories:**
- [ ] Story privacy controls (who can view)
- [ ] Story highlights (save stories permanently)
- [ ] Reply to stories
- [ ] Story analytics (view count, reach)

**References:**
- Backend: `/chat-backend/src/modules/stories/`
- Frontend: `/chat-web-client/src/components/StoriesView.tsx`
- Spec: `comprehensive_chat_app_prompt.md:3159-3166`

---

### 17. Presence - Real-Time Status Updates ⚠️ **INTEGRATION REQUIRED**

**Current Status:** ✅ Backend implemented, ⚠️ Partial frontend integration

**Files to Update:**
- `/chat-web-client/src/lib/services/socket.ts` (add presence event listeners)
- `/chat-web-client/src/lib/stores/presence.store.ts` (already exists, verify completeness)
- `/chat-web-client/src/components/UserStatusBadge.tsx` (NEW - create this)

**Backend WebSocket Events (Already Implemented):**
```typescript
// Server emits
'presence:update'     // User status changed
'user:online'         // User came online
'user:offline'        // User went offline
'user:away'           // User went away
'user:busy'           // User set to busy/DND

// Client emits
'presence:update'     // Update own status
```

**Integration Steps:**
1. [ ] Add presence event listeners in `socketService`
2. [ ] Update `presenceStore` on real-time events
3. [ ] Display online status in conversation list
4. [ ] Show status in message headers
5. [ ] Add status selector in user menu
6. [ ] Implement "last seen" timestamp
7. [ ] Add typing indicators using presence
8. [ ] Subscribe to presence for visible users only (performance)

**Missing Presence Features:**
- [ ] Custom status messages ("In a meeting", "On vacation")
- [ ] Auto-away after inactivity (5 minutes)
- [ ] Presence privacy settings (who can see status)
- [ ] Bulk presence updates for contact lists

**WebSocket Subscription Pattern:**
```typescript
// Subscribe to presence for conversation participants
useEffect(() => {
  const participantIds = conversation.participants.map(p => p.id);

  socket.emit('presence:subscribe', { userIds: participantIds });

  return () => {
    socket.emit('presence:unsubscribe', { userIds: participantIds });
  };
}, [conversation.id]);
```

**References:**
- Backend: `/chat-backend/src/modules/presence/`
- Frontend: `/chat-web-client/src/lib/stores/presence.store.ts`
- Frontend: `/chat-web-client/src/lib/services/socket.ts`
- Spec: `comprehensive_chat_app_prompt.md:3093-3099`

---

### 18. Profile Page - Connect to User API ⚠️ **INTEGRATION REQUIRED**

**Current Status:** ✅ Backend API exists, ❌ Frontend using hardcoded data

**Files to Update:**
- `/chat-web-client/src/components/UserProfile.tsx` (currently hardcoded)
- `/chat-web-client/src/lib/api/endpoints/users.api.ts` (verify all endpoints)
- `/chat-web-client/src/hooks/useUserProfile.ts` (NEW - create this)

**Backend API Endpoints (Already Exist):**
```typescript
GET    /api/users/me                // Get current user profile
PUT    /api/users/me                // Update profile
POST   /api/users/me/avatar         // Upload avatar
GET    /api/users/:id               // Get other user profile
PUT    /api/users/me/status         // Update status message
PUT    /api/users/me/password       // Change password
```

**Integration Steps:**
1. [ ] Create `useUserProfile()` hook
2. [ ] Fetch current user data on component mount
3. [ ] Implement profile update mutation
4. [ ] Add avatar upload functionality
5. [ ] Show loading states
6. [ ] Add error handling
7. [ ] Implement form validation
8. [ ] Add success toast on update
9. [ ] Update auth store after profile changes

**Missing Profile Features:**
- [ ] Profile visibility settings (public/private/contacts-only)
- [ ] Custom status messages
- [ ] Social links (website, LinkedIn, GitHub)
- [ ] Timezone display
- [ ] Profile verification badge
- [ ] Profile view history ("Who viewed my profile")

**Example Integration:**
```typescript
// hooks/useUserProfile.ts
export function useUserProfile() {
  const { user, setUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => usersApi.getProfile(),
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileDto) => usersApi.updateProfile(data),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success('Profile updated successfully');
    },
  });

  return { profile: data, isLoading, updateProfile };
}
```

**References:**
- Backend: `/chat-backend/src/modules/users/`
- Frontend: `/chat-web-client/src/components/UserProfile.tsx`
- Frontend: `/chat-web-client/src/lib/api/endpoints/users.api.ts`
- Spec: `comprehensive_chat_app_prompt.md:3050-3053`

---

### 19. Settings - Proper API Integration ⚠️ **INTEGRATION REQUIRED**

**Current Status:** ⚠️ Partial - Some settings work, others are UI-only

**Files to Update:**
- `/chat-web-client/src/components/Settings.tsx`
- `/chat-web-client/src/lib/api/endpoints/settings.api.ts` (NEW - create this)
- `/chat-web-client/src/hooks/useSettings.ts` (NEW - create this)

**Backend API Endpoints (Need to Create):**
```typescript
GET    /api/users/me/settings              // Get user settings
PUT    /api/users/me/settings              // Update settings
PUT    /api/users/me/settings/privacy      // Privacy settings
PUT    /api/users/me/settings/notifications // Notification preferences
```

**Settings Categories to Integrate:**

**1. Privacy Settings:**
- [ ] Last seen visibility (everyone, contacts, nobody)
- [ ] Profile photo visibility
- [ ] Read receipts toggle
- [ ] Typing indicators toggle
- [ ] Online status visibility
- [ ] Group invite permissions
- [ ] Call permissions (everyone, contacts, nobody)

**2. Notification Settings:**
- [ ] Push notification toggle (per conversation type)
- [ ] Email notification toggle
- [ ] Notification sound selection
- [ ] Vibration toggle
- [ ] Message preview in notifications
- [ ] Do Not Disturb schedule
- [ ] Mute all notifications

**3. Appearance Settings:**
- [ ] Theme (light, dark, system)
- [ ] Font size
- [ ] Message bubble style
- [ ] Accent color
- [ ] Compact mode toggle

**4. Data & Storage:**
- [ ] Auto-download media (WiFi, cellular, never)
- [ ] Media quality (original, compressed)
- [ ] Cache size limit
- [ ] Clear cache button
- [ ] Storage usage breakdown

**5. Security Settings:**
- [ ] Two-factor authentication (2FA)
- [ ] Active sessions list
- [ ] Logout from all devices
- [ ] Security notifications
- [ ] Login history

**Database Schema (Already Exists):**
```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE,
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Integration Steps:**
1. [ ] Create backend settings endpoints
2. [ ] Create settings API client
3. [ ] Create `useSettings()` hook
4. [ ] Connect each setting to backend
5. [ ] Add optimistic updates
6. [ ] Show loading states on toggles
7. [ ] Persist settings to backend on change
8. [ ] Sync settings across devices via WebSocket

**References:**
- Backend: `/chat-backend/src/modules/users/` (add settings endpoints)
- Frontend: `/chat-web-client/src/components/Settings.tsx`
- Spec: `comprehensive_chat_app_prompt.md:3051, 3153-3157`

---

### 20. Notifications Panel - Real Data Integration ⚠️ **INTEGRATION REQUIRED**

**Current Status:** ✅ Backend implemented, ❌ Frontend using mock data

**Files to Update:**
- `/chat-web-client/src/components/NotificationsPanel.tsx` (uses `mockNotifications`)
- `/chat-web-client/src/lib/api/endpoints/notifications.api.ts` (NEW - create this)
- `/chat-web-client/src/hooks/useNotifications.ts` (NEW - create this)

**Backend API Endpoints (Already Exist):**
```typescript
GET    /api/notifications              // Get all notifications
GET    /api/notifications/unread       // Get unread count
PUT    /api/notifications/:id/read     // Mark as read
PUT    /api/notifications/read-all     // Mark all as read
DELETE /api/notifications/:id          // Delete notification
DELETE /api/notifications/clear-all    // Clear all
```

**Backend WebSocket Events (Already Implemented):**
```typescript
'notification:new'      // New notification received
'notification:read'     // Notification marked as read
'notification:deleted'  // Notification deleted
```

**Integration Steps:**
1. [ ] Create `notificationsApi` client
2. [ ] Create `useNotifications()` hook with TanStack Query
3. [ ] Replace `mockNotifications` with real API data
4. [ ] Add real-time notification updates via WebSocket
5. [ ] Implement notification actions (click, dismiss)
6. [ ] Add notification sound on new notification
7. [ ] Update unread badge count in real-time
8. [ ] Implement deep linking (click notification → open conversation)

**Notification Types to Handle:**
- `message` - New message
- `mention` - @mentioned in message
- `call` - Incoming/missed call
- `group` - Added to group
- `workspace` - Workspace invitation
- `story` - Story reply/view
- `system` - System announcements

**WebSocket Integration:**
```typescript
socket.on('notification:new', (notification) => {
  // Play notification sound
  playNotificationSound();

  // Add to notifications list
  queryClient.setQueryData(['notifications'], (old) => [
    notification,
    ...old
  ]);

  // Update unread count badge
  updateBadgeCount((count) => count + 1);
});
```

**References:**
- Backend: `/chat-backend/src/modules/notifications/`
- Frontend: `/chat-web-client/src/components/NotificationsPanel.tsx`
- Spec: `comprehensive_chat_app_prompt.md:3149-3157`

---

### 21. Badge Value Real-Time Updates (Side Menu) ⚠️ **INTEGRATION REQUIRED**

**Current Status:** ❌ Badges not updating in real-time

**Files to Update:**
- `/chat-web-client/src/components/Sidebar.tsx` (or main navigation)
- `/chat-web-client/src/lib/stores/ui.store.ts` (add badge counts)
- `/chat-web-client/src/hooks/useUnreadCounts.ts` (NEW - create this)

**Badge Types:**
1. **Unread Messages Badge** (per conversation)
2. **Total Unread Badge** (all conversations)
3. **Notifications Badge**
4. **Missed Calls Badge**
5. **New Stories Badge**

**Backend API Endpoints:**
```typescript
GET /api/conversations/unread-count  // Total unread messages
GET /api/notifications/unread-count  // Unread notifications
GET /api/calls/missed-count          // Missed calls
GET /api/stories/new-count           // New stories
```

**WebSocket Events:**
```typescript
// Listen for events that should update badges
socket.on('message:new', (message) => {
  if (message.conversationId !== activeConversationId) {
    incrementUnreadBadge(message.conversationId);
  }
});

socket.on('message:read', ({ conversationId, userId }) => {
  if (userId === currentUserId) {
    resetUnreadBadge(conversationId);
  }
});

socket.on('notification:new', () => {
  incrementNotificationBadge();
});

socket.on('call:missed', () => {
  incrementMissedCallBadge();
});
```

**Integration Steps:**
1. [ ] Create badge count store (Zustand)
2. [ ] Fetch initial counts on app load
3. [ ] Subscribe to real-time badge updates
4. [ ] Display badges on navigation items
5. [ ] Update badges when switching conversations
6. [ ] Clear badges on conversation open
7. [ ] Persist badge counts in localStorage (fallback)
8. [ ] Add badge count to browser tab title

**UI Store Updates:**
```typescript
// lib/stores/ui.store.ts
interface BadgeCounts {
  totalUnread: number;
  notifications: number;
  missedCalls: number;
  newStories: number;
  conversationBadges: Record<string, number>; // conversationId → count
}

interface UIStore {
  badges: BadgeCounts;
  incrementBadge: (type: keyof BadgeCounts) => void;
  resetBadge: (type: keyof BadgeCounts) => void;
  // ...
}
```

**References:**
- Frontend: `/chat-web-client/src/components/Sidebar.tsx`
- Frontend: `/chat-web-client/src/lib/stores/ui.store.ts`

---

### 22. Message Search within Conversation

**Current Status:** ❌ Not implemented

**Integration Steps:**
1. [ ] Add search input in conversation header
2. [ ] Implement `GET /api/conversations/:id/search?q=query`
3. [ ] Highlight search results
4. [ ] Navigate between search results
5. [ ] Show match count
6. [ ] Clear search results

**References:**
- Backend: `/chat-backend/src/modules/search/`
- Frontend: `/chat-web-client/src/components/ConversationSearch.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3143`

---

### 23. Contact Cards

**Priority:** 🟢 LOW
**Effort:** 🔥🔥 (Medium)

**Backend Tasks:**
- [ ] Add contact card message type
- [ ] Store contact vCard data

**Frontend Tasks:**
- [ ] Create contact card composer
- [ ] Display contact info in message
- [ ] "Add to Contacts" button

**References:**
- Spec: `comprehensive_chat_app_prompt.md:3085`

---

## Backend Integration Tasks

### 24. Phone Number Authentication with OTP

**Priority:** 🟢 LOW
**Effort:** 🔥🔥🔥 (High)

**Backend Tasks:**
- [ ] Install Twilio SDK or Firebase Auth
- [ ] Create phone auth endpoints
- [ ] Implement OTP generation
- [ ] Send OTP via SMS
- [ ] Verify OTP
- [ ] Link phone to user account

**Frontend Tasks:**
- [ ] Phone number input with country code
- [ ] OTP verification screen
- [ ] Resend OTP button

**Database:**
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE otp_codes (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**References:**
- Backend: `/chat-backend/src/modules/auth/phone-auth.service.ts` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3046`

---

### 25. Group Invite Links

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥 (Medium)

**Backend Tasks:**
- [ ] Generate unique invite tokens
- [ ] Create `POST /groups/:id/invite-link` endpoint
- [ ] Create `POST /groups/join/:token` endpoint
- [ ] Add link expiration
- [ ] Track joins via link

**Frontend Tasks:**
- [ ] "Generate Invite Link" button
- [ ] Copy link to clipboard
- [ ] Join via link flow
- [ ] Show link preview

**Database:**
```sql
CREATE TABLE group_invite_links (
    id UUID PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    token VARCHAR(100) UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**References:**
- Backend: `/chat-backend/src/modules/groups/`
- Spec: `comprehensive_chat_app_prompt.md:3072`

---

### 26. Message Scheduling

**Priority:** 🟢 LOW
**Effort:** 🔥🔥🔥 (High)

**Backend Tasks:**
- [ ] Create scheduled_messages table
- [ ] Implement `POST /messages/schedule` endpoint
- [ ] Use Bull Queue for scheduled sending
- [ ] Process scheduled messages worker

**Frontend Tasks:**
- [ ] Add "Schedule" option in composer
- [ ] Date/time picker for send time
- [ ] Show scheduled messages indicator
- [ ] Cancel scheduled message

**Database:**
```sql
CREATE TABLE scheduled_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
    created_at TIMESTAMP DEFAULT NOW()
);
```

**References:**
- Backend: `/chat-backend/src/modules/messages/`
- Spec: `comprehensive_chat_app_prompt.md:3173`

---

### 27. Auto-Reply / Away Messages

**Priority:** 🟢 LOW
**Effort:** 🔥🔥 (Medium)

**Backend Tasks:**
- [ ] Store auto-reply settings in user_settings
- [ ] Check auto-reply on message received
- [ ] Send automated response

**Frontend Tasks:**
- [ ] Auto-reply toggle in Settings
- [ ] Custom message input
- [ ] Schedule auto-reply (date range)

**Database:**
```sql
ALTER TABLE user_settings ADD COLUMN auto_reply JSONB DEFAULT '{"enabled": false, "message": ""}';
```

**References:**
- Backend: `/chat-backend/src/modules/messages/`
- Spec: `comprehensive_chat_app_prompt.md:3174`

---

## Real-Time WebSocket Events

### Missing WebSocket Events to Implement

**Typing Indicators:**
```typescript
// Client → Server
socket.emit('typing:start', { conversationId });
socket.emit('typing:stop', { conversationId });

// Server → Clients
socket.on('typing:start', ({ userId, conversationId }) => {
  showTypingIndicator(userId, conversationId);
});
socket.on('typing:stop', ({ userId, conversationId }) => {
  hideTypingIndicator(userId, conversationId);
});
```

**Message Delivery Status:**
```typescript
socket.on('message:delivered', ({ messageId, userId }) => {
  updateMessageStatus(messageId, 'delivered');
});

socket.on('message:read', ({ messageId, userId }) => {
  updateMessageStatus(messageId, 'read');
});
```

**Group Events:**
```typescript
socket.on('group:member_added', ({ groupId, userId, addedBy }) => {
  addMemberToGroup(groupId, userId);
});

socket.on('group:member_removed', ({ groupId, userId, removedBy }) => {
  removeMemberFromGroup(groupId, userId);
});

socket.on('group:updated', ({ groupId, changes }) => {
  updateGroupInfo(groupId, changes);
});
```

**Call Events:**
```typescript
socket.on('call:incoming', ({ callId, from, callType }) => {
  showIncomingCallDialog(callId, from, callType);
});

socket.on('call:accepted', ({ callId, userId }) => {
  handleCallAccepted(callId, userId);
});

socket.on('call:rejected', ({ callId, userId }) => {
  handleCallRejected(callId, userId);
});

socket.on('call:ended', ({ callId, endedBy }) => {
  handleCallEnded(callId, endedBy);
});
```

**References:**
- Backend: `/chat-backend/src/modules/*/gateways/`
- Frontend: `/chat-web-client/src/lib/services/socket.ts`
- Spec: `comprehensive_chat_app_prompt.md:3092-3099`

---

## Database Schema Updates

### Required Migrations

**1. Add Missing Columns to Existing Tables:**
```sql
-- Messages table
ALTER TABLE messages ADD COLUMN reply_to_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN thread_id UUID;
ALTER TABLE messages ADD COLUMN forwarded_from_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN location JSONB;
ALTER TABLE messages ADD COLUMN code_snippet JSONB;

-- Users table
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP;
ALTER TABLE users ADD COLUMN custom_status VARCHAR(255);

-- User settings
ALTER TABLE user_settings ADD COLUMN show_read_receipts BOOLEAN DEFAULT TRUE;
ALTER TABLE user_settings ADD COLUMN show_typing_indicators BOOLEAN DEFAULT TRUE;
ALTER TABLE user_settings ADD COLUMN show_online_status BOOLEAN DEFAULT TRUE;
ALTER TABLE user_settings ADD COLUMN auto_reply JSONB DEFAULT '{}';
```

**2. Create New Tables:**
```sql
-- Already listed in feature sections above:
- encryption_keys
- encrypted_sessions
- device_tokens
- data_exports
- message_reads
- pinned_messages
- polls
- poll_votes
- blocked_users
- call_recordings
- scheduled_messages
- group_invite_links
- otp_codes
```

**3. Add Performance Indexes:**
```sql
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_last_seen ON users(last_seen_at);
```

**References:**
- Database: `/chat-backend/src/database/migrations/`
- Spec: `comprehensive_chat_app_prompt.md:3624-3847`

---

## Third-Party Integrations

### 28. Push Notifications (FCM/OneSignal)

**Already documented in Critical Features section #2**

---

### 29. GIF Integration (Giphy/Tenor)

**Priority:** 🟢 LOW
**Effort:** 🔥 (Low)

**Backend Tasks:**
- [ ] Add Giphy API key to env
- [ ] Create GIF search proxy endpoint (optional)

**Frontend Tasks:**
- [ ] Install `@giphy/react-components`
- [ ] Add GIF picker button in composer
- [ ] Search and select GIFs
- [ ] Send GIF as image message

**Environment Variables:**
```env
GIPHY_API_KEY=your_giphy_api_key
```

**References:**
- Frontend: `/chat-web-client/src/components/GifPicker.tsx` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3088`

---

### 30. Email Notifications

**Priority:** 🟢 MEDIUM
**Effort:** 🔥🔥 (Medium)

**Backend Tasks:**
- [ ] Configure email templates (Handlebars/Pug)
- [ ] Send email on missed messages (configurable threshold)
- [ ] Send weekly digest emails
- [ ] Unsubscribe link in emails

**Email Types:**
- Missed messages summary
- Missed call notifications
- Password reset
- Account verification
- Weekly activity digest

**References:**
- Backend: `/chat-backend/src/modules/email/` (already exists)
- Spec: `comprehensive_chat_app_prompt.md:3157`

---

### 31. Multi-Language Support (i18n)

**Priority:** 🟢 LOW
**Effort:** 🔥🔥🔥 (High)

**Frontend Tasks:**
- [ ] Install `react-i18next`
- [ ] Extract all strings to translation files
- [ ] Create language selector in Settings
- [ ] Support RTL languages (Arabic, Hebrew)
- [ ] Format dates/times per locale

**Supported Languages:**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Arabic (ar)
- Hindi (hi)

**References:**
- Frontend: `/chat-web-client/src/locales/` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3177`

---

## Performance Optimizations

### 32. Implement Virtual Scrolling for Messages

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥🔥 (High)

**Frontend Tasks:**
- [ ] Install `react-window` or `react-virtuoso`
- [ ] Implement virtual scrolling in message list
- [ ] Handle dynamic message heights
- [ ] Maintain scroll position on new messages
- [ ] Optimize for 10,000+ messages

**References:**
- Frontend: `/chat-web-client/src/components/MessageList.tsx`

---

### 33. Image Lazy Loading & Optimization

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥 (Medium)

**Frontend Tasks:**
- [ ] Implement lazy loading for images
- [ ] Generate thumbnails for large images
- [ ] Progressive image loading (blur-up)
- [ ] WebP format support
- [ ] Image compression before upload

**References:**
- Frontend: `/chat-web-client/src/components/ImageMessage.tsx`

---

### 34. Pagination & Infinite Scroll

**Priority:** 🟡 HIGH
**Effort:** 🔥🔥 (Medium)

**Backend Tasks:**
- [ ] Implement cursor-based pagination for messages
- [ ] Add pagination to all list endpoints

**Frontend Tasks:**
- [ ] Implement infinite scroll in conversations
- [ ] Load more messages on scroll up
- [ ] Cache loaded pages

**References:**
- Backend: `/chat-backend/src/common/dto/pagination.dto.ts`
- Frontend: `/chat-web-client/src/hooks/useInfiniteMessages.ts` (NEW)

---

## Security Enhancements

### 35. Self-Destructing Messages

**Priority:** 🟢 LOW
**Effort:** 🔥🔥🔥 (High)

**Backend Tasks:**
- [ ] Add `expires_at` field to messages
- [ ] Implement auto-deletion worker (Bull Queue)
- [ ] Delete expired messages from database

**Frontend Tasks:**
- [ ] Add timer option in composer
- [ ] Display countdown in message bubble
- [ ] Auto-delete message from UI

**Database:**
```sql
ALTER TABLE messages ADD COLUMN expires_at TIMESTAMP;
CREATE INDEX idx_messages_expires ON messages(expires_at) WHERE expires_at IS NOT NULL;
```

**References:**
- Backend: `/chat-backend/src/jobs/processors/message-cleanup.processor.ts` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3171`

---

### 36. Screenshot Detection

**Priority:** 🟢 LOW
**Effort:** 🔥🔥 (Medium)

**Frontend Tasks:**
- [ ] Detect screenshot events (browser API limited)
- [ ] Show warning when screenshot detected
- [ ] Notify sender of screenshot

**Note:** Browser API support is limited. Better on mobile apps.

**References:**
- Spec: `comprehensive_chat_app_prompt.md:3172`

---

### 37. SSO for Enterprise (SAML 2.0)

**Priority:** 🟢 LOW
**Effort:** 🔥🔥🔥🔥🔥 (Very High)

**Backend Tasks:**
- [ ] Install `passport-saml`
- [ ] Configure SAML identity provider
- [ ] Implement SSO login flow
- [ ] Add workspace-level SSO enforcement

**References:**
- Backend: `/chat-backend/src/modules/auth/strategies/saml.strategy.ts` (NEW)
- Spec: `comprehensive_chat_app_prompt.md:3125`

---

## Implementation Priority Roadmap

### Phase 1: Critical Features (Next Sprint)
1. Push Notifications (FCM/OneSignal)
2. Stories API Integration
3. Presence Real-Time Updates
4. Profile API Integration
5. Notifications Panel Real Data
6. Badge Count Updates

### Phase 2: High Priority (Month 1-2)
1. End-to-End Encryption
2. Message Threading/Replies
3. Read Receipts
4. Pin Important Messages
5. Data Export (GDPR)
6. Markdown Support
7. Settings API Integration

### Phase 3: Medium Priority (Month 3-4)
1. Polls and Surveys
2. Forward Messages
3. Location Sharing
4. Code Snippets
5. Block/Unblock Users
6. In-Call Chat
7. Virtual Backgrounds

### Phase 4: Low Priority (Month 5+)
1. Call Recording
2. Phone Auth (OTP)
3. Group Invite Links
4. Message Scheduling
5. Auto-Reply
6. GIF Integration
7. Multi-Language (i18n)
8. Self-Destructing Messages
9. SSO (SAML)

---

## Testing Checklist

### Before Marking Feature as Complete:

- [ ] Unit tests written (backend services)
- [ ] Integration tests written (API endpoints)
- [ ] E2E tests written (critical user flows)
- [ ] Component tests written (frontend)
- [ ] Real-time events tested with multiple clients
- [ ] Error handling tested
- [ ] Loading states implemented
- [ ] Mobile responsive design verified
- [ ] Accessibility tested (keyboard navigation, screen readers)
- [ ] Performance tested (large datasets)
- [ ] Security reviewed (XSS, CSRF, SQL injection)
- [ ] Documentation updated (CLAUDE.md, PROJECT_DOCUMENTATION.md)

---

## Documentation References

- **Master Specification:** `comprehensive_chat_app_prompt.md` (7,645 lines)
- **Architecture Guide:** `CLAUDE.md`
- **File Documentation:** `PROJECT_DOCUMENTATION.md`
- **Docker Setup:** `DOCKER_GUIDE.md`

---

**Last Updated:** November 5, 2025
**Next Review:** December 1, 2025
**Maintained By:** Development Team
