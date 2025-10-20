# WebSocket Real-Time Messaging Issues & Fixes

## Critical Issues Found

### 1. **Namespace Mismatch** ⚠️ CRITICAL
**Problem:**
- Backend Messages Gateway uses namespace: `/messages`
- Frontend connects to root namespace: `http://localhost:3000`

**Impact:** Frontend and backend are on completely different namespaces, so NO events are being received.

**Fix:** Remove the namespace from backend gateway OR connect frontend to `/messages` namespace.

---

### 2. **Event Name Mismatches** ⚠️ CRITICAL

**Backend emits:**
- `message:new` ✅
- `message:reaction:new`
- `message:read:receipt`
- `typing:user`

**Frontend listens for:**
- `message:new` ✅ MATCHES
- `message:reaction` ❌ Should be `message:reaction:new`
- `typing:start` and `typing:stop` ❌ Backend emits `typing:user`

**Fix:** Align event names between frontend and backend.

---

### 3. **Room Joining Not Working** ⚠️ CRITICAL

**Problem:**
- Backend expects: `conversation:join` event
- Frontend emits: `join_room` event
- Users never join conversation rooms

**Impact:** Messages are broadcast to `conversation:${conversationId}` rooms, but users haven't joined these rooms, so they don't receive messages.

**Fix:**
- Update frontend to emit correct event names
- Auto-join user's active conversations on connection

---

### 4. **No WebSocket Events from REST API** ⚠️ CRITICAL

**Problem:**
- `MessagesService.sendMessage()` creates message in DB
- BUT doesn't emit WebSocket event to notify other users
- Only WebSocket-based `message:send` emits events

**Impact:** If user sends message via REST API (which the frontend does), other users don't get real-time updates.

**Fix:** Inject MessagesGateway into MessagesService and emit events after DB operations.

---

### 5. **UserId Not Passed in Handshake** ⚠️ HIGH

**Problem:**
- Backend expects `userId` in handshake.auth or handshake.query
- Frontend passes `token` in handshake.auth
- Backend can't identify users without userId

**Impact:** Users can't join their personal `user:${userId}` rooms.

**Fix:** Extract userId from JWT token in backend instead of expecting it in handshake.

---

### 6. **No JWT Authentication in Gateway** ⚠️ HIGH (SECURITY)

**Problem:**
- Gateway doesn't verify JWT tokens
- No authentication guard on WebSocket gateway

**Impact:** Anyone can connect and listen to events without authentication.

**Fix:** Add JWT authentication middleware/guard for WebSocket.

---

### 7. **Presence Gateway Issues**

Need to review:
- Presence gateway implementation
- How online/offline status is tracked
- How typing indicators work

---

### 8. **No Notification Sounds**

Need to add:
- Audio element in frontend
- Sound files for different notification types
- Play sound when receiving new messages

---

## Fix Implementation Plan

### Phase 1: Critical WebSocket Fixes (PRIORITY) - ✅ COMPLETED

1. ✅ Remove `/messages` namespace from backend (use root namespace) - DONE
2. ✅ Add JWT verification to WebSocket gateway - DONE (WsJwtGuard created)
3. ✅ Extract userId from JWT token - DONE
4. ✅ Fix event name mismatches - DONE
   - Fixed typing:start/typing:stop events
   - Fixed message:reaction event
5. ✅ Fix room joining mechanism - DONE
   - Updated frontend to emit conversation:join/conversation:leave
   - Updated ChatWindow to auto-join conversations
6. ✅ Add WebSocket emit to MessagesService - DONE
   - sendMessage() now emits message:new
   - editMessage() now emits message:updated
   - deleteMessage() now emits message:deleted
   - forwardMessage() now emits message:new for each forwarded message

### Phase 2: Message Delivery

1. Auto-join user's conversations on connect
2. Test message delivery between users
3. Test group message delivery
4. Test channel message delivery

### Phase 3: Presence & Typing

1. Review and fix presence gateway
2. Fix typing indicators
3. Test online/offline status

### Phase 4: Notifications & Sounds

1. Add notification sound files
2. Implement sound playback
3. Add user preferences for sounds

---

## Current State

### Backend
- ❌ WebSocket namespace: `/messages` (should be root)
- ❌ No JWT auth on gateway
- ❌ MessagesService doesn't emit WebSocket events
- ✅ REST API endpoints work
- ✅ Database operations work

### Frontend
- ❌ Connects to root namespace (backend uses `/messages`)
- ❌ Event names don't match backend
- ❌ Room joining uses wrong event name
- ✅ WebSocket client implemented
- ✅ Event listeners setup

---

## Expected Flow (After Fixes)

### Sending a Message

1. User A sends message via REST API: `POST /messages`
2. MessagesService creates message in DB
3. MessagesService emits WebSocket event: `message:new` to `conversation:${conversationId}` room
4. User B (in the conversation room) receives `message:new` event
5. User B's frontend updates UI with new message
6. Notification sound plays (if enabled)

### Typing Indicators

1. User A starts typing
2. Frontend emits: `typing:start` with conversationId and userId
3. Backend broadcasts to conversation room: `typing:user` event
4. User B receives event and shows "User A is typing..."
5. After 3 seconds of no typing, frontend emits: `typing:stop`

### Presence Updates

1. User A connects → Backend marks as online
2. Backend broadcasts `presence:update` to User A's contacts
3. User B receives event and updates User A's status indicator
4. User A disconnects → Backend marks as offline after grace period

---

## Files to Modify

### Backend
- `src/modules/messages/messages.gateway.ts` - Remove namespace, add auth
- `src/modules/messages/messages.service.ts` - Add WebSocket emits
- `src/modules/presence/presence.gateway.ts` - Review and fix
- Create `src/common/guards/ws-jwt.guard.ts` - WebSocket JWT guard

### Frontend
- `src/lib/websocket/socket.ts` - Update to pass userId
- `src/lib/websocket/events.ts` - Fix event names
- `src/hooks/useMessages.ts` - Auto-join conversations
- Add notification sounds

