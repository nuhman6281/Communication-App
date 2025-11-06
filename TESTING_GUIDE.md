# Testing Guide for Communication App

**Last Updated:** November 6, 2025
**Purpose:** Comprehensive testing instructions for new features and integrations

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Testing Web Push Notifications](#testing-web-push-notifications)
4. [Testing Error Boundaries](#testing-error-boundaries)
5. [Testing Existing Integrations](#testing-existing-integrations)
6. [Manual Testing Checklist](#manual-testing-checklist)
7. [Known Limitations](#known-limitations)

---

## Prerequisites

### Required Software
- **Docker** & **Docker Compose** (for running services)
- **Node.js** v18+ and **npm** v9+
- **Modern browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Git** for version control

### Browser Requirements for Push Notifications
- **Chrome/Edge**: Full support for Web Push API
- **Firefox**: Full support for Web Push API
- **Safari**: Limited support (requires iOS 16.4+ / macOS 13+)
- **Incognito/Private Mode**: Push notifications may be disabled

---

## Environment Setup

### 1. Start All Services

```bash
# From project root
cd /home/user/Communication-App

# Start Docker services (PostgreSQL, Redis, MinIO, Coturn)
docker compose up -d

# Verify services are running
docker compose ps

# Expected output:
# - chatapp-postgres (healthy)
# - chatapp-redis (healthy)
# - chatapp-redis-realtime (healthy)
# - chatapp-minio (healthy)
# - chatapp-coturn (running)
# - chatapp-backend (running)
# - chatapp-realtime-service (running)
```

### 2. Install Dependencies

```bash
# Backend
cd chat-backend
npm install

# Frontend
cd ../chat-web-client
npm install
```

### 3. Configure Environment Variables

```bash
# Backend (.env file in chat-backend/)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=chatapp
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-change-this-in-production-min-32-chars
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
GROQ_API_KEY=your_groq_api_key_here  # For AI features

# Frontend (.env file in chat-web-client/)
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_REALTIME_URL=http://localhost:4000
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key  # For push notifications
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd chat-backend
npm run start:dev

# Terminal 2: Frontend
cd chat-web-client
npm run dev

# Frontend will be available at http://localhost:5173
# Backend API at http://localhost:3001
```

---

## Testing Web Push Notifications

### Phase 1: Service Worker Registration

1. **Open Developer Tools** (F12 or Cmd+Option+I)
2. **Navigate to Application tab** → Service Workers
3. **Load the app** at `http://localhost:5173`
4. **Expected**: Service worker registered successfully

**Verification**:
```
Console Output:
[Service Worker] Installing...
[Service Worker] Caching app shell
[Service Worker] Activating...
[Push] Service worker registered
```

### Phase 2: Request Notification Permission

1. **Login to the app** with your credentials
2. **Navigate to Settings** (gear icon in sidebar)
3. **Scroll to Notifications section**
4. **Find "Web Push Notifications"** card (blue highlighted section)
5. **Click "Enable Push Notifications"** button
6. **Browser prompts for permission** → Click "Allow"

**Expected Results**:
- ✅ Badge changes from "Not Enabled" to "Enabled" (green)
- ✅ Toast notification: "Push notifications enabled successfully"
- ✅ Button changes to "Disable Push Notifications"

**Console Verification**:
```
[Push] Permission result: granted
[Push] Push subscription created: {...}
[Push] Subscription sent to backend
```

### Phase 3: Test Push Notification Delivery

**Option A: Test from Backend (Recommended)**

```bash
# In backend directory, create test script:
# chat-backend/scripts/test-push.ts

import { NotificationService } from '../src/modules/notifications/notification.service';

async function testPush() {
  // Get user's device token from database
  const deviceToken = '...'; // From device_tokens table

  // Send test notification
  await notificationService.sendPushNotification({
    userId: 'user-id',
    title: 'Test Notification',
    body: 'This is a test push notification',
    type: 'message',
  });
}

testPush();
```

**Option B: Trigger from App**
1. **Open two browser windows** side-by-side
2. **Login as User A** in window 1
3. **Login as User B** in window 2
4. **User A sends message to User B**
5. **Minimize window 2** (or switch to another tab)
6. **Expected**: Browser notification appears for User B

**Expected Notification**:
```
Title: "New Message"
Body: "[User A]: Hello there!"
Icon: User A's avatar
Actions: [Reply] [Mark as Read]
```

### Phase 4: Test Notification Actions

1. **Click on notification**
   - App window opens/focuses
   - Navigates to conversation

2. **Click "Reply" action**
   - Opens app with message composer focused

3. **Click "Mark as Read" action**
   - Notification dismissed
   - Message marked as read in app

### Phase 5: Test Unsubscribe

1. **Go back to Settings**
2. **Click "Disable Push Notifications"**
3. **Expected**: Badge changes to "Not Enabled", subscription removed

**Console Verification**:
```
[Push] Unsubscribed: true
```

---

## Testing Error Boundaries

### Test 1: Component-Level Error

**Create Test Error Component**:
```tsx
// chat-web-client/src/components/TestError.tsx
export function TestError() {
  // Force error on button click
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test component error');
  }

  return <button onClick={() => setShouldError(true)}>Trigger Error</button>;
}
```

**Test Procedure**:
1. Add `<TestError />` to ChatInterface temporarily
2. Click "Trigger Error" button
3. **Expected**: Component shows error fallback UI (amber box) with retry button
4. Click "Retry" → Component resets

### Test 2: Page-Level Error

**Simulate Navigation Error**:
1. Modify a route component to throw error in useEffect
2. Navigate to that route
3. **Expected**: Page shows error UI with "Try Again" and "Go Home" buttons
4. Click "Try Again" → Page attempts to re-render
5. Click "Go Home" → Navigate to homepage

### Test 3: App-Level Error

**Simulate Critical Error**:
1. Throw error in App.tsx root level (temporarily)
2. **Expected**: Full-screen error UI with "Reload Page" button
3. Shows error details in development mode
4. Click "Reload Page" → App reloads

**Verification in Console**:
```
[ErrorBoundary] Caught error: Error message
Component Stack: <Component tree>
```

---

## Testing Existing Integrations

### Stories Integration

1. **Navigate to Stories view** (story icon in sidebar)
2. **Verify stories load from API** (not mock data)
3. **Upload new story**: Click "+" button, select image/video
4. **View someone's story**: Click on story ring
5. **Reply to story**: Type message, send (creates DM)
6. **Check story replies**: View your own story, see replies

**API Verification**:
```
Network Tab:
GET /api/stories → 200 OK (grouped by user)
POST /api/stories/upload → 201 Created
POST /api/stories/:id/view → 200 OK
POST /api/stories/:id/reply → 201 Created
GET /api/stories/:id/replies → 200 OK
```

### Notifications Integration

1. **Open Notifications Panel** (bell icon in sidebar)
2. **Verify notifications load from API**
3. **Filter**: Click "Unread" tab
4. **Mark as read**: Click notification
5. **Delete notification**: Click trash icon
6. **Mark all as read**: Click "Mark all as read" button

**API Verification**:
```
GET /api/notifications → 200 OK
PATCH /api/notifications/:id/read → 200 OK
POST /api/notifications/read-all → 200 OK
DELETE /api/notifications/:id → 200 OK
```

### Profile Integration

1. **Open User Profile** (profile icon in sidebar)
2. **Click "Edit"** button
3. **Update fields**: First name, last name, bio, status
4. **Upload avatar**: Click camera icon, select image
5. **Click "Save"** → Updates sent to backend
6. **Verify changes persist** after page reload

**API Verification**:
```
GET /api/users/me → 200 OK
PATCH /api/users/me → 200 OK
POST /api/users/me/avatar → 200 OK (FormData)
```

### Settings Integration

1. **Navigate to Settings**
2. **Toggle notification preferences**
3. **Verify API calls in Network tab**
4. **Reload page** → Settings persist

**API Verification**:
```
GET /api/notifications/preferences → 200 OK
PATCH /api/notifications/preferences → 200 OK
```

---

## Manual Testing Checklist

### Pre-Flight Checks
- [ ] All Docker containers running
- [ ] Backend API responding (`curl http://localhost:3001/api/health`)
- [ ] Frontend loading at `http://localhost:5173`
- [ ] WebSocket connecting (check browser console)
- [ ] Database migrations applied

### Authentication Flow
- [ ] Register new user
- [ ] Email verification (check logs or email)
- [ ] Login with credentials
- [ ] OAuth login (Google/GitHub/Microsoft) - if configured
- [ ] Logout
- [ ] Token refresh works automatically

### Messaging
- [ ] Send text message
- [ ] Send image message
- [ ] Send video message
- [ ] Send file attachment
- [ ] Edit message
- [ ] Delete message
- [ ] React to message (emoji)
- [ ] Reply to message (quote)
- [ ] Search messages

### Real-Time Features
- [ ] Messages appear instantly in both users' chats
- [ ] Typing indicator shows when other user types
- [ ] Presence status updates (online/away/offline)
- [ ] Read receipts show when message is read
- [ ] Reactions update in real-time

### Video/Audio Calls
- [ ] Initiate audio call
- [ ] Initiate video call
- [ ] Accept incoming call
- [ ] Reject incoming call
- [ ] Toggle microphone during call
- [ ] Toggle video during call
- [ ] Share screen during call
- [ ] Switch audio→video during call
- [ ] End call
- [ ] Call history shows past calls

### Stories
- [ ] Upload image story
- [ ] Upload video story
- [ ] View story (auto-progress after 5 seconds)
- [ ] Navigate between stories (prev/next)
- [ ] Reply to story (sends DM)
- [ ] View story replies (if story owner)
- [ ] Story expires after 24 hours

### Workspaces
- [ ] Create workspace
- [ ] Invite members to workspace
- [ ] Create channel in workspace
- [ ] Post message in channel
- [ ] Switch between workspaces

### AI Features (if API key configured)
- [ ] Enhance message with AI (Premium)
- [ ] Smart reply suggestions
- [ ] Translate message

### Push Notifications (NEW)
- [ ] Enable push notifications in Settings
- [ ] Receive notification when app minimized
- [ ] Click notification opens app
- [ ] Notification action buttons work
- [ ] Disable push notifications

### Error Handling (NEW)
- [ ] Component error shows fallback UI
- [ ] Retry button recovers from error
- [ ] Page error shows appropriate message
- [ ] Network error shows retry option

---

## Known Limitations

### Web Push Notifications
1. **Safari Limitations**:
   - Requires macOS 13+ or iOS 16.4+
   - May require HTTPS (localhost exempt in dev)
   - Limited support for action buttons

2. **Incognito/Private Mode**:
   - Push notifications typically disabled
   - Service workers may not persist

3. **Browser Differences**:
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari: Limited support
   - Mobile browsers: Varies by platform

### Testing Without Docker
- Cannot test full production deployment
- External services (SMTP, OAuth) may need mocking
- Database must be manually set up

### Cross-Browser Testing
- **Recommended**: Test in Chrome first (best Web Push support)
- Test in Firefox and Safari after Chrome works
- Mobile testing requires device or emulator

---

## Debugging Tips

### Service Worker Issues
```bash
# Clear service workers
1. Open DevTools → Application → Service Workers
2. Click "Unregister" for all workers
3. Hard reload page (Cmd+Shift+R or Ctrl+Shift+R)

# Check service worker logs
DevTools → Console → Filter: "[Service Worker]"
```

### Push Notification Issues
```bash
# Verify permission
console.log(Notification.permission); // Should be "granted"

# Check subscription
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub);
  });
});

# Test browser notification
new Notification('Test', { body: 'Testing' });
```

### WebSocket Issues
```bash
# Check connection status
DevTools → Network → WS (WebSocket filter)
# Should show:
# - ws://localhost:3001/socket.io/?transport=websocket (messaging)
# - ws://localhost:4000/socket.io/?transport=websocket (realtime)

# Console logs
Filter: "[WebSocket]" or "[Socket]"
```

### Backend API Issues
```bash
# Check backend logs
cd chat-backend
npm run start:dev
# Watch for errors in terminal

# Test API directly
curl http://localhost:3001/api/health
curl http://localhost:3001/api/stories -H "Authorization: Bearer <token>"
```

---

## Automated Testing (Future)

### Unit Tests
```bash
# Backend
cd chat-backend
npm test

# Frontend
cd chat-web-client
npm test
```

### E2E Tests (Playwright/Cypress)
```bash
# Install
npm install -D @playwright/test

# Run tests
npx playwright test

# Test files location:
# chat-web-client/e2e/**/*.spec.ts
```

---

## Troubleshooting Common Issues

### Issue: Push notifications not showing
**Solution**:
1. Check browser permission (should be "granted")
2. Verify service worker is active
3. Check backend logs for push errors
4. Ensure VAPID keys are configured correctly

### Issue: WebSocket not connecting
**Solution**:
1. Verify backend is running
2. Check CORS configuration
3. Verify JWT token is valid
4. Clear browser cache and reload

### Issue: Stories not loading
**Solution**:
1. Check Network tab for API errors
2. Verify backend stories endpoints work
3. Check authentication token
4. Clear API cache in dev tools

### Issue: Error boundary not catching errors
**Solution**:
1. Ensure error is thrown in render phase (not async)
2. Check ErrorBoundary is parent of component
3. Verify error is not caught by try/catch

---

## Reporting Issues

When reporting bugs, include:
1. **Browser** and version
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Console logs** (copy full output)
6. **Network tab** (HAR file or screenshots)
7. **Backend logs** (if relevant)

Submit issues at: [GitHub Issues](https://github.com/anthropics/communication-app/issues)

---

**Happy Testing! 🚀**
