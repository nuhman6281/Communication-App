# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Self-user presence tracking with automatic online/away status
- Activity-based presence updates (away after 5 minutes of inactivity)
- Presence subscription system in ConversationList
- Real-time presence status updates for all conversation participants
- Improved UserStatusBadge design (hides for offline users, better contrast)
- Comprehensive debug logging for presence system troubleshooting
- Socket reconnection handling in ChatWindow and ConversationList
- Automatic event listener re-registration on socket reconnection
- **Story Replies UI** - Story owners can now view replies to their stories directly in the story viewer with collapsible replies panel showing sender avatar, name, content, and timestamp
- **Real-time Story Replies** - WebSocket event handler (`story:reply`) for instant reply updates without page refresh
- **Story Replies API Integration** - Added `useStoryReplies` hook, query key, and API method for fetching story replies with TanStack Query caching
- **Story Replies as DMs (Instagram Approach)** - Story replies now create direct message conversations between replier and story owner, allowing natural conversation continuation. Includes story context metadata in message
- **Story Reply Message Preview** - Story reply messages in chat display story thumbnail/preview (image, video with play icon, or text gradient) with "Replied to your story" label for clear context
- **Story Expiration Constants** - Centralized story configuration constants (`STORY_EXPIRATION_HOURS`, `MAX_STORY_FILE_SIZE_MB`, `MAX_STORY_DURATION_SECONDS`) for easy maintenance
- **Sound Notifications** - Audio feedback for messages and calls with graceful degradation when sound files are missing. Message notification sound plays on new messages, call ringtone loops on incoming calls and stops when answered/ended
- **Sound Mute Toggle** - Sidebar toggle button for muting/unmuting notification sounds with volume controls and persistent mute state
- **Real-time Unread Badges** - Zustand-based unread message tracking with localStorage persistence. Sidebar shows total unread count, conversation list shows per-conversation badges, unread count resets when opening conversation, only increments when not viewing conversation
- **🆕 Web Push Notifications** - Complete Web Push API integration with service worker, push subscriptions, background notifications, and notification action buttons. Includes UI in Settings for enabling/disabling push notifications with real-time status badges
- **🆕 Comprehensive Error Boundaries** - Multi-level error handling with app-level, page-level, and component-level error boundaries. Provides graceful degradation with retry functionality and detailed error information in development mode
- **🆕 Push Notification Service** - Dedicated service for managing push subscriptions, service worker lifecycle, and notification delivery with VAPID authentication
- **🆕 Push Notifications Hook** - React hook (`usePushNotifications`) for easy push notification management in components with subscription status, permission handling, and notification display
- **🆕 Service Worker** - Background worker for handling push notifications, offline support, message caching, and background sync with IndexedDB integration
- **🆕 TESTING_GUIDE.md** - Comprehensive testing documentation covering all features, setup instructions, manual testing procedures, and debugging tips

### Fixed
- **Critical: Unread badge increments for self-sent messages** - Fixed WebSocket `message:new` handler to check if sender is current user before incrementing unread count and playing sound. Self-sent messages no longer trigger notifications
- **Critical: Notification sounds not playing** - Added Web Audio API fallback beep sounds when MP3 files are missing. Message sound plays 800Hz beep (150ms), call sound plays looping 600Hz double-beep pattern (2s interval). Handles autoplay restrictions and gracefully falls back on errors
- **Critical: Stories not listing in UI** - Fixed user authentication extraction across all stories endpoints by replacing `@Req() req: any` with `@GetUser('id')` decorator for proper JWT userId extraction
- **Critical: Stories data format mismatch** - Backend was returning flat story arrays but frontend expected stories grouped by user. Created `getActiveStoriesGrouped()` method that groups stories by user, calculates unseen counts, and sorts by latest timestamp
- **Critical: Stories API 500 error** - Fixed database schema mismatch where `customViewers` and `blockedViewers` were defined as `simple-array` (VARCHAR with comma-separated values) but queries used PostgreSQL `ANY()` operator expecting actual arrays. Changed columns to proper `text[]` arrays and ran migration to update database schema
- **Critical: Stories upload endpoint missing** - Implemented `POST /stories/upload` endpoint in backend to handle direct file uploads for stories. Endpoint accepts multipart/form-data with media file, optional caption, and privacy settings. Uses MediaService for file upload to MinIO storage, automatically determines story type from MIME type, validates file size (max 100MB) and type (image/video only)
- **Critical: Story reply endpoint 400 error** - Frontend was sending `{ message }` but backend DTO expected `{ content }`. Fixed API client to send correct field name
- **Critical: Story display showing black screen** - Fixed field name mismatch in StoriesView component. Component was using `contentType`, `contentUrl`, `textContent` but Story entity uses `type`, `mediaUrl`, `content`. Updated all references throughout the component
- **Critical: Socket event listeners not re-registered on reconnect** - App.tsx now re-registers all event listeners when socket reconnects, ensuring messages, typing indicators, reactions, and all real-time features continue working after reconnection
- **Critical: WebRTC event handlers not re-registered on reconnect** - WebRTC service now properly cleans up and re-registers all call event handlers on realtime socket reconnection, fixing issue where incoming calls weren't received after logout/login until page refresh
- **Critical: Message reactions not updating in real-time** - Enhanced `message:reaction` event handler with comprehensive logging and proper query invalidation, reactions now update instantly without page refresh
- **Critical: ChatWindow not rejoining conversation rooms on reconnect** - Added socket reconnect listener to automatically rejoin conversation rooms, fixing issue where User 2 wouldn't receive messages from User 1 after User 1 reconnected
- **Critical: Presence system architecture** - Added presence event handlers (`presence:update`, `presence:subscribe`, `presence:unsubscribe`) to main messages gateway, eliminating need for separate namespace connection
- **Critical: Presence broadcasting** - Backend now broadcasts `presence:update` events when users connect/disconnect, and responds to subscription requests with `presence:batch` events
- **Critical: Presence subscription timing** - ConversationList now waits for socket connection before subscribing, prevents "Cannot subscribe - socket not connected" error
- **Critical: Presence UI not re-rendering** - ConversationList now properly subscribes to presenceMap changes using Zustand selector, triggering React re-renders when presence updates
- **Critical: Stories API endpoint mismatch** - Changed frontend to call `GET /stories` instead of non-existent `GET /stories/active` endpoint
- **Stories reply error toast crash** - Fixed React error "Objects are not valid as a React child" by properly extracting error message string from nested response objects
- **Stories API error handling** - Added retry logic and silent failure for background story queries to prevent UI crashes
- Self-user presence not updating (now sends presence on connect and activity)
- Avatar badge design improved with better visibility and styling
- Socket event handlers comprehensively reviewed and validated

### Changed
- ConversationList uses `presenceMap` selector instead of `getPresence()` function for reactive updates
- ConversationList automatically resubscribes to presence updates on socket reconnection
- ChatWindow automatically rejoins conversation rooms on socket reconnection
- App.tsx cleans up and re-registers event listeners on every socket reconnection
- WebRTC service cleans up and re-registers all 15 call event handlers on every realtime socket reconnection
- Message reaction event handler enhanced with comprehensive logging and reaction data parsing
- UserStatusBadge no longer shows badge for offline users (cleaner UI)
- Badge colors updated for better contrast (yellow-400 for away)
- Presence update events now use correct format (`presence:update` instead of `presence_update`)
- Activity tracking added for mouse, keyboard, scroll, and touch events
- Enhanced logging in presence event handlers and ConversationList for debugging
- Backend messages gateway now handles presence events directly (no separate namespace needed)

### Known Issues
- None at this time

---

## [2.1.2] - 2025-11-05

### Added
- Documentation structure improvements to CLAUDE.md
- CHANGELOG.md file for tracking project changes over time

### Changed
- PROJECT_DOCUMENTATION.md is now a current-state snapshot only (no history)
- Removed "Recent Changes" section from PROJECT_DOCUMENTATION.md
- Updated CLAUDE.md with clear documentation writing guidelines

### Fixed
- PENDING_FEATURES.md - Marked Block/Unblock Users as completed

---

## [2.1.1] - 2025-11-05

### Fixed
- **NotificationsPanel crash**: Fixed data structure access from `data?.data` to `data?.items` to match `PaginatedResponse` type
- **Sidebar active icon visibility**: Updated styling from `bg-white/10` to `bg-blue-600` for better contrast on dark background
- **Real-time presence updates**: Integrated presence store with ConversationList for live status updates

### Changed
- ConversationList now checks presence store first, then falls back to API data
- Added `getPresenceStatus()` helper function for unified presence access

---

## [2.1.0] - 2025-11-02

### Added
- Block/Unblock Users feature
  - BlockedUsers component with unblock functionality
  - Block user option in ChatWindow conversation menu
  - Expandable blocked users section in Settings
  - Integration with backend block/unblock API endpoints

### Fixed
- **Socket Connection Issues**:
  - Fixed sockets disconnecting on every page refresh
  - Implemented auto-reconnection strategy for network issues
  - Added intentional disconnect flag to differentiate logout vs network failures
  - Fixed microphone not working in voice calls
  - Sockets now persist across navigation

### Changed
- App.tsx: Removed socket disconnect from useEffect cleanup
- Socket services: Added connection state checks and socket reuse logic
- Auth store: Added logout event emission for proper socket cleanup
- WebRTC service: Enhanced logging for debugging

---

## [2.0.0] - 2025-11-02

### Added
- Complete project documentation in PROJECT_DOCUMENTATION.md
- Comprehensive CLAUDE.md with architecture patterns and coding standards
- Full feature implementation (messaging, calls, workspaces, AI, etc.)

---

## Notes

- **For current state documentation**: See PROJECT_DOCUMENTATION.md
- **For architecture and patterns**: See CLAUDE.md
- **For change history**: This file (CHANGELOG.md)
