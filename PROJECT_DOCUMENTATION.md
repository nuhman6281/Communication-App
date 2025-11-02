# Communication App - Complete Project Documentation

**Description:** Full-stack enterprise chat application with video calls, WebRTC, real-time messaging, workspaces, and AI features

**Tech Stack:** React 18, TypeScript, Vite, NestJS 10, PostgreSQL 15, TypeORM, Socket.IO, Redis 7, MinIO, Docker

**Last Updated:** November 2, 2025
**Version:** 2.0.0
**Status:** Active Development

---

## Table of Contents

1. [Project Summary](#project-summary)
2. [Active Services](#active-services)
3. [Chat Backend - Complete File Structure](#chat-backend---complete-file-structure)
4. [Chat Web Client - Complete File Structure](#chat-web-client---complete-file-structure)
5. [Realtime Service - Complete File Structure](#realtime-service---complete-file-structure)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [WebSocket Events Reference](#websocket-events-reference)
8. [Database Schema](#database-schema)
9. [Environment Variables](#environment-variables)
10. [Development Setup](#development-setup)
11. [Docker & Deployment](#docker--deployment)
12. [Recent Changes](#recent-changes)

---

## Project Summary

A **comprehensive enterprise chat platform** combining features from Slack, Microsoft Teams, WhatsApp, Zoho Cliq, and Instagram. Built with modern WebRTC for peer-to-peer video/audio calls, real-time messaging, and collaborative workspaces.

**Key Features:**
- 🔐 Authentication (Email, OAuth, MFA, JWT tokens)
- 💬 Real-time messaging (1-on-1, groups, channels, threading)
- 📞 WebRTC calls (audio, video, screen sharing)
- 🏢 Workspaces (organizations, teams, permissions)
- 🤖 AI features (smart replies, enhancement, translation)
- 📖 Stories (Instagram-style 24hr content)
- 🔍 Global search (messages, files, users)
- 📎 Media management (file uploads, previews)
- 🔔 Real-time notifications
- 🪝 Webhook integrations

---

## Active Services

### 1. chat-backend/ (180 TypeScript files)
**Tech:** NestJS 10, PostgreSQL 15, TypeORM, Redis 7, Socket.IO, Bull Queue
**Port:** 3001
**Purpose:** Main API server, database operations, authentication, business logic

### 2. chat-web-client/ (130 TypeScript files)
**Tech:** React 18, TypeScript, Vite, TanStack Query, Zustand, ShadCN UI, Tailwind CSS v4
**Port:** 5173 (dev)
**Purpose:** Web UI, real-time messaging interface, WebRTC call UI

### 3. realtime-service/ (8 TypeScript files)
**Tech:** Node.js, TypeScript, Socket.IO 4.7, Redis adapter, Express
**Port:** 4000
**Purpose:** WebRTC signaling server, call room management, NAT traversal

### Inactive Services (Not in Use)
- **streamforge/** - Deprecated, not currently used
- **chat_app_reference/** - Reference implementation only

### Supporting Files
- **docker-compose.realtime.yml** - Docker stack for realtime service (Redis, Coturn, Nginx)
- **nginx-realtime.conf** - Nginx reverse proxy configuration for WebRTC
- **start-realtime.sh** - Startup script for realtime service with dependencies
- **.env** - Root environment variables
- **package.json** - Monorepo workspace configuration
- **CLAUDE.md** - Claude Code project guidance
- **PROJECT_ARCHITECTURE.md** - Existing architecture documentation
- **comprehensive_chat_app_prompt.md** - Original project specification (4,500+ lines)

---

## Chat Backend - Complete File Structure

**Tech Stack:** NestJS 10, TypeScript (strict), PostgreSQL 15, TypeORM, Redis 7, Socket.IO, Bull Queue, Passport (JWT/OAuth), MinIO, OpenAI

```
chat-backend/
├── src/
│   ├── main.ts - Application entry point, bootstrap NestJS app, CORS setup, Swagger docs, global pipes/filters, runs on port 3001
│   ├── app.module.ts - Root module, imports all feature modules, TypeORM config, Redis config, cache manager
│   ├── seed.ts - Database seeder, generates development/test data
│   │
│   ├── config/
│   │   └── configuration.ts - Environment config loader, validation schema using @nestjs/config
│   │
│   ├── database/
│   │   └── database.module.ts - TypeORM module configuration, PostgreSQL connection options
│   │
│   ├── types/
│   │   ├── passport-github2.d.ts - TypeScript definitions for passport-github2 strategy
│   │   └── passport-microsoft.d.ts - TypeScript definitions for passport-microsoft strategy
│   │
│   ├── common/
│   │   ├── constants/
│   │   │   └── index.ts - Application-wide constants (roles, status values, pagination limits)
│   │   │
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts - @CurrentUser() decorator, extracts user from JWT request
│   │   │   ├── get-user.decorator.ts - @GetUser() decorator for WebSocket connections
│   │   │   ├── public.decorator.ts - @Public() decorator, marks routes as public (skips JWT guard)
│   │   │   └── roles.decorator.ts - @Roles() decorator for role-based access control
│   │   │
│   │   ├── guards/
│   │   │   ├── ws-jwt.guard.ts - WebSocket JWT authentication guard, validates socket tokens
│   │   │   └── premium.guard.ts - Premium subscription guard, checks user subscription tier
│   │   │
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts - Global exception filter, formats error responses consistently
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts - Request/response logging interceptor with timing
│   │   │   └── transform.interceptor.ts - Response transformation, wraps responses in standard format
│   │   │
│   │   └── entities/
│   │       └── base.entity.ts - Base entity class with id (UUID), createdAt, updatedAt, deletedAt fields
│   │
│   └── modules/
│       │
│       ├── auth/
│       │   ├── auth.controller.ts - Auth endpoints: POST /register, POST /login, POST /refresh, POST /verify-email, POST /forgot-password, POST /reset-password, GET /google, GET /github, GET /microsoft
│       │   ├── auth.service.ts - Auth business logic: register(), login(), verifyEmail(), generateTokens(), refreshTokens(), hashPassword(), validateUser()
│       │   ├── auth.module.ts - Auth module, imports Passport strategies, JWT module, email service
│       │   │
│       │   ├── strategies/
│       │   │   ├── jwt.strategy.ts - JWT validation strategy, validates access tokens, extracts user payload
│       │   │   ├── refresh-token.strategy.ts - Refresh token validation strategy
│       │   │   ├── google.strategy.ts - Google OAuth2 strategy, profile extraction and user creation
│       │   │   ├── github.strategy.ts - GitHub OAuth strategy
│       │   │   └── microsoft.strategy.ts - Microsoft OAuth strategy
│       │   │
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts - Global JWT guard, can be bypassed with @Public() decorator
│       │   │   ├── roles.guard.ts - Role-based access control guard, works with @Roles() decorator
│       │   │   └── ws-jwt.guard.ts - WebSocket JWT authentication guard
│       │   │
│       │   ├── entities/
│       │   │   ├── email-verification.entity.ts - Email verification tokens (token, userId, expiresAt, verified)
│       │   │   ├── password-reset.entity.ts - Password reset tokens (token, userId, expiresAt, used)
│       │   │   └── refresh-token.entity.ts - Refresh tokens (token, userId, expiresAt, revoked)
│       │   │
│       │   └── dto/
│       │       ├── login.dto.ts - Login request DTO { email, password }
│       │       ├── register.dto.ts - Registration DTO { email, password, username, firstName, lastName }
│       │       ├── refresh-token.dto.ts - Refresh token DTO { refreshToken }
│       │       ├── verify-email.dto.ts - Email verification DTO { token }
│       │       ├── forgot-password.dto.ts - Forgot password DTO { email }
│       │       ├── reset-password.dto.ts - Reset password DTO { token, newPassword }
│       │       ├── enable-mfa.dto.ts - MFA enable DTO { secret }
│       │       └── verify-mfa.dto.ts - MFA verification DTO { code }
│       │
│       ├── users/
│       │   ├── users.controller.ts - User endpoints: GET /me, PUT /:id, GET /search, GET /:id, POST /block, DELETE /block/:id
│       │   ├── users.service.ts - User service: createUser(), updateUser(), findById(), searchUsers(), updateStatus(), blockUser(), unblockUser()
│       │   ├── users.module.ts - Users module configuration
│       │   │
│       │   ├── entities/
│       │   │   ├── user.entity.ts - User entity (id, email, username, passwordHash, firstName, lastName, avatarUrl, status, lastSeen, createdAt, updatedAt, deletedAt)
│       │   │   ├── user-settings.entity.ts - User settings (userId, theme, language, notificationsEnabled, emailNotifications, pushNotifications)
│       │   │   └── blocked-users.entity.ts - Blocked users relation (userId, blockedUserId, blockedAt)
│       │   │
│       │   └── dto/
│       │       ├── update-user.dto.ts - Update user DTO { firstName?, lastName?, avatarUrl?, status? }
│       │       ├── search-users.dto.ts - Search users DTO { q, limit, offset }
│       │       ├── update-password.dto.ts - Password update DTO { oldPassword, newPassword }
│       │       ├── update-settings.dto.ts - Settings update DTO { theme?, language?, notificationsEnabled? }
│       │       └── block-user.dto.ts - Block user DTO { userId }
│       │
│       ├── messages/
│       │   ├── messages.controller.ts - Message endpoints: GET /:conversationId, POST /, PUT /:id, DELETE /:id, POST /:id/react, DELETE /:id/reactions/:reactionId, POST /:id/forward, POST /:id/pin
│       │   ├── messages.service.ts - Message service: createMessage(), getMessages(), editMessage(), deleteMessage(), addReaction(), removeReaction(), forwardMessage(), pinMessage(), unpinMessage()
│       │   ├── messages.gateway.ts - WebSocket gateway for real-time message events (message:send, message:edit, message:delete, message:react)
│       │   ├── messages.module.ts - Messages module configuration
│       │   │
│       │   ├── entities/
│       │   │   ├── message.entity.ts - Message entity (id, conversationId, senderId, content, type, replyToId, attachments, isEdited, isPinned, createdAt, updatedAt, deletedAt)
│       │   │   ├── message-reaction.entity.ts - Message reactions (id, messageId, userId, emoji, createdAt)
│       │   │   ├── message-read.entity.ts - Message read status (id, messageId, userId, readAt)
│       │   │   ├── message-edit-history.entity.ts - Edit history (id, messageId, oldContent, editedAt)
│       │   │   └── pinned-message.entity.ts - Pinned messages (id, messageId, conversationId, pinnedBy, pinnedAt)
│       │   │
│       │   └── dto/
│       │       ├── create-message.dto.ts - Create message DTO { conversationId, content, type?, replyToId?, attachments? }
│       │       ├── update-message.dto.ts - Update message DTO { content }
│       │       ├── message-reaction.dto.ts - Reaction DTO { emoji }
│       │       ├── get-messages.dto.ts - Get messages DTO { limit, offset, before?, after? }
│       │       └── forward-message.dto.ts - Forward message DTO { conversationIds[] }
│       │
│       ├── conversations/
│       │   ├── conversations.controller.ts - Conversation endpoints: GET /, POST /, GET /:id, DELETE /:id, POST /:id/participants, DELETE /:id/participants/:userId, PATCH /:id/participants/:userId
│       │   ├── conversations.service.ts - Conversation service: createConversation(), getConversations(), getConversationById(), addParticipant(), removeParticipant(), updateParticipant(), markAsRead()
│       │   ├── conversations.module.ts - Conversations module configuration
│       │   │
│       │   ├── entities/
│       │   │   ├── conversation.entity.ts - Conversation entity (id, name, type, avatarUrl, workspaceId, createdBy, lastMessageAt, createdAt, updatedAt, deletedAt)
│       │   │   └── conversation-participant.entity.ts - Participant entity (id, conversationId, userId, role, joinedAt, lastReadAt, isMuted, isPinned)
│       │   │
│       │   └── dto/
│       │       ├── create-conversation.dto.ts - Create conversation DTO { type, participantIds[], name?, avatarUrl? }
│       │       ├── get-conversations.dto.ts - Get conversations DTO { type?, search?, limit, offset }
│       │       ├── update-conversation.dto.ts - Update conversation DTO { name?, avatarUrl? }
│       │       ├── add-participant.dto.ts - Add participant DTO { userId }
│       │       └── update-participant.dto.ts - Update participant DTO { role?, isMuted?, isPinned? }
│       │
│       ├── groups/
│       │   ├── groups.controller.ts - Group endpoints: POST /, PUT /:id, POST /:id/members, DELETE /:id/members/:userId, GET /:id
│       │   ├── groups.service.ts - Group service: createGroup(), updateGroup(), addMembers(), removeMembers(), getGroupById(), updateMemberRole()
│       │   ├── groups.module.ts - Groups module configuration
│       │   │
│       │   ├── entities/
│       │   │   ├── group.entity.ts - Group entity (extends Conversation, adds maxMembers, isPrivate)
│       │   │   └── group-member.entity.ts - Group member entity (id, groupId, userId, role, joinedAt, addedBy)
│       │   │
│       │   └── dto/
│       │       ├── create-group.dto.ts - Create group DTO { name, description?, avatarUrl?, participantIds[], isPrivate? }
│       │       ├── update-group.dto.ts - Update group DTO { name?, description?, avatarUrl? }
│       │       └── add-member.dto.ts - Add member DTO { userIds[] }
│       │
│       ├── workspaces/
│       │   ├── workspaces.controller.ts - Workspace endpoints: GET /, POST /, GET /:id, PUT /:id, DELETE /:id, POST /:id/invite, DELETE /:id/members/:userId, PATCH /:id/members/:userId/role
│       │   ├── workspaces.service.ts - Workspace service: createWorkspace(), updateWorkspace(), deleteWorkspace(), inviteMembers(), removeMember(), updateMemberRole(), getWorkspaces()
│       │   ├── workspaces.module.ts - Workspaces module configuration
│       │   │
│       │   ├── guards/
│       │   │   ├── workspace-owner.guard.ts - Ensures user is workspace owner
│       │   │   ├── workspace-admin.guard.ts - Ensures user is workspace admin or owner
│       │   │   └── workspace-member.guard.ts - Ensures user is workspace member
│       │   │
│       │   ├── entities/
│       │   │   ├── workspace.entity.ts - Workspace entity (id, name, description, avatarUrl, ownerId, plan, createdAt, updatedAt, deletedAt)
│       │   │   └── workspace-member.entity.ts - Workspace member entity (id, workspaceId, userId, role, joinedAt, invitedBy)
│       │   │
│       │   └── dto/
│       │       ├── create-workspace.dto.ts - Create workspace DTO { name, description?, avatarUrl? }
│       │       ├── get-workspaces.dto.ts - Get workspaces DTO { limit, offset }
│       │       ├── update-workspace.dto.ts - Update workspace DTO { name?, description?, avatarUrl? }
│       │       ├── invite-member.dto.ts - Invite member DTO { emails[] }
│       │       └── update-member-role.dto.ts - Update role DTO { role }
│       │
│       ├── channels/
│       │   ├── channels.controller.ts - Channel endpoints: GET /, POST /, GET /:id, PUT /:id, DELETE /:id, POST /:id/subscribe, DELETE /:id/subscribe
│       │   ├── channels.service.ts - Channel service: createChannel(), updateChannel(), deleteChannel(), subscribe(), unsubscribe(), getChannelsByWorkspace()
│       │   ├── channels.module.ts - Channels module configuration
│       │   │
│       │   ├── entities/
│       │   │   ├── channel.entity.ts - Channel entity (id, workspaceId, name, description, isPrivate, createdBy, createdAt, updatedAt, deletedAt)
│       │   │   └── channel-subscriber.entity.ts - Subscriber entity (id, channelId, userId, subscribedAt)
│       │   │
│       │   └── dto/
│       │       ├── create-channel.dto.ts - Create channel DTO { workspaceId, name, description?, isPrivate? }
│       │       └── update-channel.dto.ts - Update channel DTO { name?, description?, isPrivate? }
│       │
│       ├── calls/
│       │   ├── calls.controller.ts - Call endpoints: GET /, POST /initiate, POST /:id/join, POST /:id/end, GET /history, GET /missed
│       │   ├── calls.service.ts - Call service: initiateCall(), joinCall(), endCall(), getCallHistory(), getMissedCalls(), updateCallStatus()
│       │   ├── calls.gateway.ts - WebSocket gateway for call events, delegates signaling to realtime-service
│       │   ├── calls.module.ts - Calls module configuration
│       │   │
│       │   ├── entities/
│       │   │   └── call.entity.ts - Call entity (id, conversationId, initiatorId, callType, status, startedAt, endedAt, duration, recordingUrl, createdAt)
│       │   │
│       │   └── dto/
│       │       ├── initiate-call.dto.ts - Initiate call DTO { conversationId, callType, participants[] }
│       │       ├── join-call.dto.ts - Join call DTO { callId }
│       │       ├── end-call.dto.ts - End call DTO { callId }
│       │       └── update-recording.dto.ts - Recording update DTO { recordingUrl }
│       │
│       ├── media/
│       │   ├── media.controller.ts - Media endpoints: POST /upload, GET /:id, DELETE /:id, GET /:id/download
│       │   ├── media.service.ts - Media service: uploadFile(), getFileById(), deleteFile(), generatePresignedUrl()
│       │   ├── media.module.ts - Media module configuration
│       │   │
│       │   ├── services/
│       │   │   └── storage.service.ts - MinIO S3 client, handles upload(), download(), delete(), generateThumbnail()
│       │   │
│       │   ├── entities/
│       │   │   └── media.entity.ts - Media entity (id, userId, filename, originalName, mimeType, size, url, thumbnailUrl, createdAt)
│       │   │
│       │   └── dto/
│       │       └── upload-media.dto.ts - Upload DTO { file: File }
│       │
│       ├── notifications/
│       │   ├── notifications.controller.ts - Notification endpoints: GET /, PUT /:id/read, PUT /read-all, DELETE /:id, PUT /settings
│       │   ├── notifications.service.ts - Notification service: createNotification(), getNotifications(), markAsRead(), markAllAsRead(), deleteNotification(), sendPushNotification(), updateSettings()
│       │   ├── notifications.gateway.ts - WebSocket gateway for real-time notifications (notification:new)
│       │   ├── notifications.module.ts - Notifications module configuration
│       │   │
│       │   ├── entities/
│       │   │   └── notification.entity.ts - Notification entity (id, userId, type, title, content, metadata, isRead, readAt, createdAt)
│       │   │
│       │   └── dto/
│       │       ├── create-notification.dto.ts - Create notification DTO { userId, type, title, content, metadata? }
│       │       └── get-notifications.dto.ts - Get notifications DTO { limit, offset, type?, isRead? }
│       │
│       ├── presence/
│       │   ├── presence.controller.ts - Presence endpoints: GET /online, PUT /status
│       │   ├── presence.gateway.ts - WebSocket gateway for presence (presence:update, user:online, user:offline, typing:start, typing:stop)
│       │   ├── presence.service.ts - Presence service: updateStatus(), getOnlineUsers(), setTyping(), clearTyping(), getUserPresence()
│       │   ├── presence.module.ts - Presence module configuration
│       │   │
│       │   ├── entities/
│       │   │   ├── presence.entity.ts - Presence entity (userId, status, lastSeen, deviceInfo, createdAt, updatedAt)
│       │   │   └── typing-indicator.entity.ts - Typing indicator (userId, conversationId, startedAt, expiresAt)
│       │   │
│       │   └── dto/
│       │       ├── update-presence.dto.ts - Update presence DTO { status }
│       │       └── typing-indicator.dto.ts - Typing DTO { conversationId, isTyping }
│       │
│       ├── ai/
│       │   ├── ai.controller.ts - AI endpoints: POST /smart-replies, POST /enhance, POST /translate, POST /summarize, POST /chat
│       │   ├── ai.service.ts - AI service: generateSmartReplies() (GPT-3.5), enhanceMessage() (GPT-4), translate(), summarize(), chatCompletion(), transcribeAudio() (Whisper)
│       │   ├── ai.module.ts - AI module, OpenAI client configuration
│       │   │
│       │   └── dto/
│       │       ├── smart-reply.dto.ts - Smart reply DTO { messageId }
│       │       ├── enhance-message.dto.ts - Enhance DTO { content, tone }
│       │       ├── translate-message.dto.ts - Translate DTO { content, targetLanguage }
│       │       ├── summarize.dto.ts - Summarize DTO { conversationId, messageCount }
│       │       └── chat-completion.dto.ts - Chat completion DTO { messages[], model? }
│       │
│       ├── search/
│       │   ├── search.controller.ts - Search endpoints: GET /?q=query&type=messages|files|users&limit=20
│       │   ├── search.service.ts - Search service: globalSearch(), searchMessages(), searchFiles(), searchUsers(), searchWithFilters()
│       │   ├── search.module.ts - Search module configuration
│       │   │
│       │   └── dto/
│       │       └── search-query.dto.ts - Search query DTO { q, type?, limit, offset, filters? }
│       │
│       ├── stories/
│       │   ├── stories.controller.ts - Stories endpoints: GET /, POST /, GET /:id, DELETE /:id, POST /:id/view, POST /:id/reply
│       │   ├── stories.service.ts - Stories service: createStory(), getStories(), viewStory(), deleteStory(), replyToStory(), deleteExpiredStories()
│       │   ├── stories.module.ts - Stories module configuration
│       │   │
│       │   ├── entities/
│       │   │   ├── story.entity.ts - Story entity (id, userId, content, mediaUrl, mediaType, duration, expiresAt, createdAt, deletedAt)
│       │   │   ├── story-view.entity.ts - Story view entity (id, storyId, userId, viewedAt)
│       │   │   └── story-reply.entity.ts - Story reply entity (id, storyId, userId, content, createdAt)
│       │   │
│       │   └── dto/
│       │       ├── create-story.dto.ts - Create story DTO { content?, mediaUrl, mediaType, duration }
│       │       ├── get-stories.dto.ts - Get stories DTO { userId?, limit, offset }
│       │       ├── update-story.dto.ts - Update story DTO { content? }
│       │       └── create-story-reply.dto.ts - Reply DTO { content }
│       │
│       ├── webhooks/
│       │   ├── webhooks.controller.ts - Webhook endpoints: POST /, GET /, GET /:id, PUT /:id, DELETE /:id
│       │   ├── webhooks.service.ts - Webhook service: createWebhook(), getWebhooks(), updateWebhook(), deleteWebhook(), triggerWebhook(), validateSignature(), retryFailedWebhooks()
│       │   ├── webhooks.module.ts - Webhooks module configuration
│       │   │
│       │   ├── entities/
│       │   │   ├── webhook.entity.ts - Webhook entity (id, userId, url, events[], secret, isActive, createdAt, updatedAt)
│       │   │   └── webhook-log.entity.ts - Webhook log entity (id, webhookId, event, payload, responseStatus, responseBody, attemptCount, createdAt)
│       │   │
│       │   └── dto/
│       │       ├── create-webhook.dto.ts - Create webhook DTO { url, events[] }
│       │       └── update-webhook.dto.ts - Update webhook DTO { url?, events?, isActive? }
│       │
│       └── email/
│           ├── email.service.ts - Email service: sendVerificationEmail(), sendPasswordResetEmail(), sendWelcomeEmail(), sendNotificationEmail()
│           └── email.module.ts - Email module, Nodemailer configuration
│
├── test/
│   ├── unit/ - Unit test directory
│   ├── integration/ - Integration test directory
│   └── e2e/ - End-to-end test directory
│
├── docker/
│   └── Dockerfile - Docker container configuration for backend
│
├── package.json - Dependencies, scripts, NestJS configuration
├── tsconfig.json - TypeScript compiler configuration (strict mode)
├── nest-cli.json - NestJS CLI configuration
└── .env - Environment variables (DATABASE_URL, JWT_SECRET, REDIS_URL, etc.)
```

## Chat Web Client - Complete File Structure

**Tech Stack:** React 18, TypeScript (strict), Vite 6, TanStack Query v5, Zustand, Socket.IO Client, ShadCN UI, Radix UI, Tailwind CSS v4, Framer Motion

```
chat-web-client/
├── src/
│   ├── main.tsx - React app entry point, QueryClientProvider, theme provider, StrictMode wrapper
│   ├── App.tsx - Root component, authentication guard, dual socket connection management (messaging + WebRTC), WebRTC initialization, logout event handler, heartbeat intervals
│   │
│   ├── components/
│   │   ├── AuthScreen.tsx - Login/register UI, email/password forms, OAuth buttons (Google/GitHub/Microsoft), forgot password link
│   │   ├── EmailVerification.tsx - Email verification page, token extraction from URL params, verification API call
│   │   ├── ChatInterface.tsx - Main app shell, view router (chat/profile/settings/stories/workspace), conversation selection, notification panel toggle, responsive layout manager
│   │   ├── Sidebar.tsx - Left navigation bar, workspace selector, search button (Cmd+K), notifications badge, call history, navigation icons, user avatar with status
│   │   ├── ConversationList.tsx - Conversation list panel, search filter, type tabs (All/Direct/Groups/Channels), conversation items with avatars/names/last message/unread badges/timestamps
│   │   ├── ChatWindow.tsx - Main chat view, message display area, header with call buttons (audio/video), typing indicators, scroll to bottom, message input composer
│   │   ├── MessageComposer.tsx - Message input field with auto-grow, emoji picker popover, file attachment button, voice message recorder, AI assistant integration, send on Enter (Shift+Enter for newline)
│   │   ├── MessageBubble.tsx - Individual message rendering, sender info, timestamp, read status, reactions display, reply/forward/edit/delete context menu, reply threading
│   │   ├── MessageContentRenderer.tsx - Message content parser, markdown rendering, code syntax highlighting, link previews, file attachments display, embedded media
│   │   │
│   │   ├── GlobalCallContainer.tsx - Global call state manager, renders active call UI at root level, persists across navigation, minimized call indicator
│   │   ├── VideoCallOverlay.tsx - Draggable call window (800x600), video grid layout, local video PiP (bottom-right), remote video full-screen, call controls (mute/video/screen share/end), call duration timer, connection status indicator
│   │   ├── IncomingCallModal.tsx - Incoming call notification modal, animated rings, caller info with avatar, call type badge (audio/video), accept/reject buttons, ringtone autoplay
│   │   │
│   │   ├── GlobalSearch.tsx - Global search overlay (Cmd/Ctrl+K), search input with filters (messages/files/contacts), recent searches history, result navigation, Escape to close
│   │   ├── NotificationsPanel.tsx - Right sidebar notifications panel, categorized notifications (messages/mentions/calls/groups/system), mark as read/unread, clear notification, click to navigate
│   │   ├── AIAssistant.tsx - AI features popover, smart replies (free tier), message enhancement with tone selection (premium), translation (free tier), premium upgrade prompts
│   │   ├── FilePreview.tsx - File preview modal, multi-format support (images/videos/PDFs/audio), zoom controls, rotation, download button, share functionality
│   │   ├── PinnedMessagesPanel.tsx - Pinned messages sidebar, shows all pinned messages in conversation, click to navigate to original message, unpin button
│   │   ├── ForwardMessageDialog.tsx - Message forwarding dialog, conversation search, multi-select conversations, forward confirmation
│   │   ├── NewMessageDialog.tsx - Start new conversation dialog, user search, recent contacts, create conversation button
│   │   ├── CreateChannelDialog.tsx - Create workspace channel dialog, channel name/description inputs, privacy toggle (public/private)
│   │   ├── GroupCreation.tsx - Multi-step group creation wizard, name/description/avatar, participant selection with search, group settings (max members, privacy)
│   │   ├── StoriesView.tsx - Instagram-style stories UI, horizontal story scroll, story viewer with progress bars, swipe navigation, 24hr timer display
│   │   ├── WorkspaceView.tsx - Workspace management UI, member list with roles, channel list, workspace settings, invite members dialog, permissions management
│   │   ├── UserProfile.tsx - User profile page, avatar display/upload, personal info (name/email/status), edit mode, theme toggle, account settings link
│   │   ├── Settings.tsx - Application settings page, tabs (General/Notifications/Privacy/Advanced), theme selection, language, notification preferences, account management
│   │   │
│   │   ├── ui/
│   │   │   ├── accordion.tsx - ShadCN accordion component, collapsible sections with animation
│   │   │   ├── alert-dialog.tsx - Alert/confirm dialog, modal with actions
│   │   │   ├── alert.tsx - Alert banner component, variants (default/destructive/success)
│   │   │   ├── aspect-ratio.tsx - Aspect ratio container for media
│   │   │   ├── avatar.tsx - Avatar component with fallback initials
│   │   │   ├── badge.tsx - Badge component, variants (default/secondary/destructive/outline)
│   │   │   ├── breadcrumb.tsx - Breadcrumb navigation component
│   │   │   ├── button.tsx - Button component, variants (default/destructive/outline/secondary/ghost/link), sizes (default/sm/lg/icon)
│   │   │   ├── calendar.tsx - Date picker calendar component
│   │   │   ├── card.tsx - Card container with header/content/footer
│   │   │   ├── carousel.tsx - Image carousel with navigation
│   │   │   ├── chart.tsx - Chart components (bar/line/pie) using Recharts
│   │   │   ├── checkbox.tsx - Checkbox input with label
│   │   │   ├── collapsible.tsx - Collapsible section component
│   │   │   ├── command.tsx - Command palette (Cmd+K style)
│   │   │   ├── context-menu.tsx - Right-click context menu
│   │   │   ├── dialog.tsx - Modal dialog with backdrop
│   │   │   ├── drawer.tsx - Slide-out drawer component
│   │   │   ├── dropdown-menu.tsx - Dropdown menu with items/separators/checkboxes
│   │   │   ├── form.tsx - Form wrapper with validation (React Hook Form)
│   │   │   ├── hover-card.tsx - Hover popover card
│   │   │   ├── input-otp.tsx - OTP input component (6 digits)
│   │   │   ├── input.tsx - Text input with variants
│   │   │   ├── label.tsx - Form label component
│   │   │   ├── menubar.tsx - Menu bar with dropdown menus
│   │   │   ├── modal.tsx - Legacy modal wrapper
│   │   │   ├── navigation-menu.tsx - Navigation menu with dropdowns
│   │   │   ├── pagination.tsx - Pagination controls
│   │   │   ├── popover.tsx - Popover component for tooltips/menus
│   │   │   ├── progress.tsx - Progress bar component
│   │   │   ├── radio-group.tsx - Radio button group
│   │   │   ├── resizable.tsx - Resizable panels
│   │   │   ├── scroll-area.tsx - Custom scrollbar container
│   │   │   ├── select.tsx - Select dropdown component
│   │   │   ├── separator.tsx - Horizontal/vertical separator line
│   │   │   ├── sheet.tsx - Side sheet/drawer component
│   │   │   ├── sidebar.tsx - Sidebar navigation component
│   │   │   ├── skeleton.tsx - Loading skeleton placeholder
│   │   │   ├── slider.tsx - Range slider input
│   │   │   ├── sonner.tsx - Toast notification (Sonner library)
│   │   │   ├── switch.tsx - Toggle switch component
│   │   │   ├── table.tsx - Data table with sorting/filtering
│   │   │   ├── tabs.tsx - Tab navigation component
│   │   │   ├── textarea.tsx - Multiline text input
│   │   │   ├── toggle-group.tsx - Toggle button group
│   │   │   ├── toggle.tsx - Single toggle button
│   │   │   ├── tooltip.tsx - Tooltip on hover
│   │   │   ├── use-mobile.ts - Mobile detection hook
│   │   │   └── utils.ts - UI utility functions
│   │   │
│   │   ├── workspace/
│   │   │   ├── CreateWorkspaceDialog.tsx - Create workspace dialog, name/description inputs, avatar upload
│   │   │   ├── GenerateInviteLinkDialog.tsx - Generate workspace invite link, link expiration options, copy to clipboard
│   │   │   ├── InviteMemberDialog.tsx - Invite members by email, role selection (admin/member)
│   │   │   ├── JoinWorkspaceDialog.tsx - Join workspace with invite code/link input
│   │   │   ├── WorkspaceSelector.tsx - Workspace switcher dropdown, shows all workspaces, create new workspace option
│   │   │   └── index.ts - Workspace components barrel export
│   │   │
│   │   └── figma/
│   │       └── ImageWithFallback.tsx - Image component with loading fallback and error handling
│   │
│   ├── hooks/
│   │   ├── index.ts - Hooks barrel export
│   │   ├── useAuth.ts - Auth hooks: useLogin(), useRegister(), useLogout(), useRefreshToken() using TanStack Query
│   │   ├── useConversations.ts - Conversation hooks: useConversations(), useConversationById(), useCreateConversation(), useDeleteConversation()
│   │   ├── useMessages.ts - Message hooks: useMessages(), useSendMessage(), useEditMessage(), useDeleteMessage(), useReactToMessage(), useForwardMessage()
│   │   ├── useUsers.ts - User hooks: useSearchUsers(), useUserProfile(), useUpdateProfile()
│   │   ├── useGroups.ts - Group hooks: useCreateGroup(), useUpdateGroup(), useAddMembers(), useRemoveMembers()
│   │   ├── useChannels.ts - Channel hooks: useChannels(), useCreateChannel(), useUpdateChannel(), useSubscribeChannel()
│   │   ├── useWorkspaces.ts - Workspace hooks: useWorkspaces(), useCreateWorkspace(), useUpdateWorkspace(), useInviteMembers()
│   │   ├── useMedia.ts - Media hooks: useUploadFile(), useDeleteFile()
│   │   ├── useAI.ts - AI hooks: useSmartReplies(), useEnhanceMessage(), useTranslateMessage()
│   │   ├── useSubscription.ts - Subscription hooks: useSubscriptionStatus(), useUpgradePlan()
│   │   └── useRefreshProfile.ts - Auto-refresh user profile hook
│   │
│   ├── lib/
│   │   ├── stores/
│   │   │   ├── index.ts - Zustand stores barrel export
│   │   │   ├── auth.store.ts - Auth store: user, accessToken, refreshToken, isAuthenticated, setAuth(), logout(), updateTokens(), refreshUser()
│   │   │   ├── call.store.ts - Call store: activeCall, participants, initiateCall(), acceptCall(), endCall(), toggleAudio(), toggleVideo()
│   │   │   ├── conversation.store.ts - Conversation store: conversations map, selectedConversation, messages, addMessage(), updateMessage()
│   │   │   ├── presence.store.ts - Presence store: onlineUsers, typingUsers, setPresence(), addTypingUser(), removeTypingUser()
│   │   │   ├── workspace.store.ts - Workspace store: currentWorkspace, workspaces, channels, members
│   │   │   └── ui.store.ts - UI store: theme, sidebarOpen, notificationsPanelOpen, modal states
│   │   │
│   │   ├── websocket/
│   │   │   ├── index.ts - WebSocket services barrel export, setupWebSocketEvents(), cleanupWebSocketEvents()
│   │   │   ├── socket.ts - Messaging WebSocket service (port 3001), connect(), emit(), on(), off(), intentionalDisconnect flag, auto-reconnect logic
│   │   │   ├── realtime-socket.ts - WebRTC signaling WebSocket service (port 4000), connection management, socket reuse, disconnect handling
│   │   │   └── events.ts - WebSocket event type definitions and event handler setup
│   │   │
│   │   ├── webrtc/
│   │   │   └── webrtc.service.ts - WebRTC manager: initiateCall(), acceptCall(), endCall(), toggleAudio(), toggleVideo(), switchToVideo(), handleOffer(), handleAnswer(), createPeerConnection(), ICE candidate handling
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts - Axios instance with base URL, auth interceptor (adds JWT token), response interceptor (handles 401/token refresh), error handler
│   │   │   ├── utils.ts - API utilities: buildQueryString(), handleApiError(), formatResponse()
│   │   │   │
│   │   │   └── endpoints/
│   │   │       ├── index.ts - API endpoints barrel export
│   │   │       ├── auth.api.ts - Auth endpoints: register(), login(), logout(), verifyEmail(), forgotPassword(), resetPassword(), refreshToken()
│   │   │       ├── users.api.ts - User endpoints: getMe(), getUserById(), updateProfile(), searchUsers(), blockUser(), unblockUser()
│   │   │       ├── conversations.api.ts - Conversation endpoints: getConversations(), getConversationById(), createConversation(), updateConversation(), deleteConversation()
│   │   │       ├── messages.api.ts - Message endpoints: getMessages(), sendMessage(), editMessage(), deleteMessage(), reactToMessage(), forwardMessage(), pinMessage()
│   │   │       ├── groups.api.ts - Group endpoints: createGroup(), updateGroup(), addMembers(), removeMembers()
│   │   │       ├── channels.api.ts - Channel endpoints: getChannels(), createChannel(), updateChannel(), deleteChannel(), subscribeChannel()
│   │   │       ├── workspaces.api.ts - Workspace endpoints: getWorkspaces(), createWorkspace(), updateWorkspace(), inviteMembers(), removeMember()
│   │   │       ├── media.api.ts - Media endpoints: uploadFile(), getFileUrl(), deleteFile()
│   │   │       ├── ai.api.ts - AI endpoints: generateSmartReplies(), enhanceMessage(), translateMessage(), summarizeConversation()
│   │   │       ├── notifications.api.ts - Notification endpoints: getNotifications(), markAsRead(), updateSettings()
│   │   │       ├── presence.api.ts - Presence endpoints: updateStatus(), getOnlineUsers()
│   │   │       ├── search.api.ts - Search endpoints: globalSearch(), searchMessages(), searchFiles()
│   │   │       ├── stories.api.ts - Stories endpoints: getStories(), createStory(), viewStory(), replyToStory()
│   │   │       └── webhooks.api.ts - Webhook endpoints: createWebhook(), updateWebhook(), deleteWebhook()
│   │   │
│   │   ├── utils.ts - General utilities: cn() (classname merger), formatDate(), formatTime(), truncateText(), debounce()
│   │   ├── query-client.ts - TanStack Query client configuration, default options (staleTime, cacheTime, retry logic)
│   │   │
│   │   └── utils/
│   │       └── subscription.ts - Subscription utilities: isPremium(), canAccessFeature(), getSubscriptionTier()
│   │
│   ├── config/
│   │   └── api.config.ts - API configuration: API_CONFIG with baseURL (http://localhost:3001/api), wsURL (http://localhost:3001), realtimeURL (http://localhost:4000), timeouts
│   │
│   ├── types/
│   │   ├── entities.types.ts - Entity TypeScript interfaces: User, Conversation, Message, Group, Channel, Workspace, Story, Notification, Call, Media
│   │   └── api.types.ts - API request/response TypeScript types: LoginRequest, RegisterRequest, MessageCreateRequest, etc.
│   │
│   ├── styles/
│   │   └── index.css - Global Tailwind CSS imports, custom CSS variables for theming (--primary, --background, etc.), dark mode overrides
│   │
│   ├── guidelines/ - Design system and component guidelines (Figma-generated)
│   │
│   └── main.tsx - Already listed above (React entry point)
│
├── public/
│   ├── index.html - HTML template
│   ├── favicon.ico - App favicon
│   └── assets/ - Static assets (images, fonts)
│
├── build/ - Production build output directory
│   └── assets/ - Bundled JS/CSS assets
│
├── package.json - Dependencies: React 18.3, Vite, TypeScript, TanStack Query, Zustand, Socket.IO Client, ShadCN UI, Tailwind, Framer Motion
├── vite.config.ts - Vite configuration: React plugin, path aliases (@/ -> ./src), port 5173, HMR, build options
├── tailwind.config.js - Tailwind v4 configuration: content paths, theme customization, plugins (tailwindcss-animate)
├── tsconfig.json - TypeScript configuration: strict mode, path mappings, JSX support
├── postcss.config.js - PostCSS configuration for Tailwind
├── .env - Frontend environment variables (VITE_API_URL, VITE_WS_URL, VITE_REALTIME_URL)
└── README.md - Frontend documentation
```

## Realtime Service - Complete File Structure

**Tech Stack:** Node.js 18, TypeScript (strict), Express 4, Socket.IO 4.7, Redis 7 adapter, JWT auth, Winston logger

```
realtime-service/
├── src/
│   ├── index.ts - Application entry point, Express + Socket.IO server setup, Redis adapter initialization, authentication middleware registration, event handler setup, CORS configuration, health check endpoint (/health), runs on port 4000
│   │
│   ├── config/
│   │   └── environment.ts - Environment configuration loader: REALTIME_PORT, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_ENABLED, JWT_SECRET, CORS_ORIGIN, TURN_SERVER_URL, STUN_SERVER_URL, TURN_USERNAME, TURN_PASSWORD, MAX_PARTICIPANTS_PER_CALL, CALL_TIMEOUT_MS, LOG_LEVEL
│   │
│   ├── middleware/
│   │   └── auth.middleware.ts - Socket.IO authentication middleware, JWT token validation using shared secret with backend, extracts userId and username from token payload, attaches user data to socket.data object, rejects connections with invalid/missing tokens
│   │
│   ├── services/
│   │   └── room.service.ts - Call room management service: createRoom(callId, participants[]), getRoomParticipants(callId), addParticipant(callId, userId, metadata), removeParticipant(callId, userId), updateParticipantMedia(callId, userId, mediaState), destroyRoom(callId), participant tracking with join time and media state (audio/video enabled/disabled)
│   │
│   ├── handlers/
│   │   ├── connection.handler.ts - Socket connection lifecycle handler: handleConnection(socket), handleDisconnect(socket), handleJoinRoom(socket, data), handleLeaveRoom(socket, data), presence broadcasting (user:online, user:offline events), cleanup on unexpected disconnect
│   │   ├── webrtc.handler.ts - WebRTC signaling event handler: handleCallInitiate(socket, data), handleCallAccept(socket, data), handleCallReject(socket, data), handleCallEnd(socket, data), handleOffer(socket, sdp), handleAnswer(socket, sdp), handleIceCandidate(socket, candidate), handleMediaToggle(socket, data), handleScreenShare(socket, data), forwards signaling messages between peers
│   │   └── chat.handler.ts - Real-time chat during calls: handleMessage(socket, data), handleTyping(socket, data), broadcasts messages to call room participants
│   │
│   └── utils/
│       └── logger.ts - Winston logger configuration: console transport with colorized output, file transports (error.log, combined.log), log format with timestamp and level, log rotation
│
├── logs/ - Log files directory
│   ├── error.log - Error-level logs only
│   └── combined.log - All log levels
│
├── package.json - Dependencies: Socket.IO 4.7, @socket.io/redis-adapter, ioredis, express, winston, jsonwebtoken, dotenv, typescript
├── tsconfig.json - TypeScript configuration: strict mode, ES2020 target, Node.js module resolution
├── .env - Environment variables (REALTIME_PORT, REDIS_HOST, JWT_SECRET, TURN/STUN config)
└── README.md - Realtime service documentation
```

---

- `ChatInterface.tsx` - Main app container, view routing, conversation state, notification panel toggle
- `Sidebar.tsx` - Left navigation, workspace switcher, search trigger, user profile access
- `ConversationList.tsx` - Chat list display, search filter, conversation selection, unread badges
- `ChatWindow.tsx` - Message display container, composer, call buttons, file upload handler
- `MessageComposer.tsx` - Text input, emoji picker, file attachments, send handler, mentions support
- `MessageBubble.tsx` - Message rendering, reactions, reply threading, edit/delete options
- `MessageContentRenderer.tsx` - Markdown parser, link previews, code highlighting, file rendering

**Authentication:**

- `AuthScreen.tsx` - Login/register toggle, OAuth buttons (Google/GitHub/Microsoft), email verification trigger
- `EmailVerification.tsx` - Email verification handler with token validation from query params

**Real-Time Communication:**

- `GlobalCallContainer.tsx` - Call state manager, portal renderer, minimized indicator, persistent across routes
- `VideoCallOverlay.tsx` - Floating draggable call window (800x600), video grid, screen share layout
- `IncomingCallModal.tsx` - Floating draggable call notification, accept/reject, quick reply options
- `GlobalSearch.tsx` - Cmd/Ctrl+K global search, filters (messages/files/contacts), recent history

**Features:**

- `NotificationsPanel.tsx` - Notification center, mark read/unread, direct navigation, categorized display
- `AIAssistant.tsx` - Smart replies, message enhancement, translation, premium feature gating
- `StoriesView.tsx` - Instagram-style 24hr stories, view progress, swipe navigation
- `WorkspaceView.tsx` - Team management, channel list, member roster, permissions
- `GroupCreation.tsx` - Multi-step group creator, participant selection, settings configuration
- `FilePreview.tsx` - Multi-format viewer (images/videos/PDFs/audio), zoom/rotate, download/share
- `PinnedMessagesPanel.tsx` - Shows pinned messages with navigation to original message
- `ForwardMessageDialog.tsx` - Message forwarding to multiple conversations with search
- `NewMessageDialog.tsx` - Start new conversation dialog with user search
- `CreateChannelDialog.tsx` - Create workspace channel with privacy options
- `UserProfile.tsx` - User profile display, edit mode, settings access, status management
- `Settings.tsx` - App settings, theme toggle, notification preferences, account management

### State Management (Zustand Stores)

**lib/stores/**

- `auth.store.ts` - User authentication state, setAuth(), logout(), updateTokens(), refreshUser()
- `conversation.store.ts` - Active conversations map, selected conversation, setMessages(), addMessage()
- `call.store.ts` - Active call state, participants map, initiateCall(), acceptCall(), endCall(), toggleAudio()
- `presence.store.ts` - User online status, typing indicators, setTyping(), clearTyping()
- `workspace.store.ts` - Current workspace, channels, members, permissions
- `ui.store.ts` - Theme, sidebar state, notifications panel toggle, modal states

### WebSocket Services

**lib/websocket/**

- `socket.ts` - Messaging WebSocket (port 3001), connect(), emit(), on(), intentionalDisconnect flag
- `realtime-socket.ts` - WebRTC signaling WebSocket (port 4000), connection management, auto-reconnect
- `events.ts` - Socket event handlers setup, message:new, typing:start/stop, user:online/offline
- `index.ts` - Export barrel, setupWebSocketEvents(), cleanupWebSocketEvents()

### WebRTC Service

**lib/webrtc/**

- `webrtc.service.ts` - WebRTC manager, initiateCall(), acceptCall(), toggleAudio(), toggleVideo(), switchToVideo(), handleOffer(), handleAnswer(), createPeerConnection()

### API Layer (TanStack Query + Axios)

**lib/api/**

- `client.ts` - Axios instance, auth interceptor, token refresh, error handling
- `utils.ts` - buildQueryString(), handleApiError()

**lib/api/endpoints/**

- `auth.api.ts` - register(), login(), verifyEmail(), forgotPassword(), resetPassword(), refreshToken()
- `users.api.ts` - getMe(), updateProfile(), searchUsers(), getUserById()
- `conversations.api.ts` - getConversations(), getConversationById(), createConversation(), deleteConversation()
- `messages.api.ts` - getMessages(), sendMessage(), editMessage(), deleteMessage(), reactToMessage()
- `groups.api.ts` - createGroup(), updateGroup(), addMembers(), removeMembers()
- `channels.api.ts` - getChannels(), createChannel(), updateChannel(), deleteChannel()
- `workspaces.api.ts` - getWorkspaces(), createWorkspace(), updateWorkspace(), inviteMembers()
- `media.api.ts` - uploadFile(), getFileUrl(), deleteFile()
- `ai.api.ts` - generateSmartReplies(), enhanceMessage(), translateMessage()
- `notifications.api.ts` - getNotifications(), markAsRead(), updateSettings()
- `presence.api.ts` - updateStatus(), setTyping(), getOnlineUsers()
- `search.api.ts` - globalSearch(), searchMessages(), searchFiles()
- `stories.api.ts` - getStories(), createStory(), viewStory()
- `webhooks.api.ts` - createWebhook(), updateWebhook(), deleteWebhook()

### Custom Hooks

**hooks/**

- `useAuth.ts` - useLogin(), useRegister(), useLogout(), useRefreshToken()
- `useConversations.ts` - useConversations(), useConversationById(), useCreateConversation()
- `useMessages.ts` - useMessages(), useSendMessage(), useEditMessage(), useReactToMessage()
- `useUsers.ts` - useSearchUsers(), useUserProfile()
- `useGroups.ts` - useCreateGroup(), useUpdateGroup()
- `useChannels.ts` - useChannels(), useCreateChannel()
- `useWorkspaces.ts` - useWorkspaces(), useCreateWorkspace()
- `useMedia.ts` - useUploadFile()
- `useAI.ts` - useSmartReplies(), useEnhanceMessage(), useTranslate()
- `useSubscription.ts` - useSubscriptionStatus(), useUpgradePlan()
- `useRefreshProfile.ts` - Auto-refresh user profile data

### UI Components (ShadCN/Radix)

**components/ui/** - 60+ production-ready components:

Button, Input, Textarea, Select, Checkbox, Radio, Switch, Slider, Dialog, Sheet, Popover, Tooltip, Dropdown Menu, Context Menu, Command, Tabs, Accordion, Card, Avatar, Badge, Alert, Progress, Skeleton, Toast (Sonner), Calendar, Table, Pagination, Breadcrumb, Navigation Menu, Menubar, Scroll Area, Separator, Sidebar, Hover Card, Collapsible, Toggle, Toggle Group, Aspect Ratio, Resizable

### Configuration

**config/**

- `api.config.ts` - API_CONFIG with baseURL, wsURL, timeouts

**types/**

- `entities.types.ts` - User, Conversation, Message, Group, Channel, Workspace interfaces
- `api.types.ts` - API request/response types

### Utilities

**lib/utils.ts** - cn() (classname merger), formatters, validators

**lib/utils/subscription.ts** - Subscription tier checks, feature gating

**lib/query-client.ts** - TanStack Query client config, default options

---

## Module 2: Chat Backend - NestJS API

### Tech Stack
- NestJS 10.3, TypeScript (strict mode)
- Database: PostgreSQL 15+ with TypeORM
- Cache: Redis 7+ with cache-manager
- Queue: Bull with Redis
- WebSocket: Socket.IO with @nestjs/websockets
- Auth: JWT + Refresh Tokens, Passport (Google/GitHub/Microsoft OAuth)
- Storage: MinIO (S3-compatible)
- Docs: Swagger/OpenAPI

### Complete File Structure (180 Files)

#### Core Files

**src/main.ts** - Bootstrap NestJS app, CORS setup, Swagger docs, global pipes/filters, port 3001

**src/app.module.ts** - Root module, imports all feature modules, TypeORM config, cache config

**src/seed.ts** - Database seeder for development data

#### Configuration

**src/config/**
- `configuration.ts` - Environment config loader, validation schema

#### Database

**src/database/**
- `database.module.ts` - TypeORM module config, connection options

#### Common Utilities (15 files)

**src/common/constants/**
- `index.ts` - Application-wide constants (roles, status values, limits)

**src/common/decorators/** (5 decorators)
- `current-user.decorator.ts` - @CurrentUser() decorator extracts user from request
- `get-user.decorator.ts` - @GetUser() WebSocket decorator
- `public.decorator.ts` - @Public() marks routes as public (skip JWT guard)
- `roles.decorator.ts` - @Roles() decorator for RBAC

**src/common/guards/** (2 guards)
- `ws-jwt.guard.ts` - WebSocket JWT authentication guard
- `premium.guard.ts` - Premium subscription feature guard

**src/common/filters/** (1 filter)
- `http-exception.filter.ts` - Global exception handler, formatted error responses

**src/common/interceptors/** (2 interceptors)
- `logging.interceptor.ts` - Request/response logging
- `transform.interceptor.ts` - Response wrapper, consistent API format

**src/common/entities/**
- `base.entity.ts` - Base entity with id (UUID), createdAt, updatedAt, deletedAt fields

#### Type Definitions

**src/types/**
- `passport-github2.d.ts` - TypeScript definitions for passport-github2
- `passport-microsoft.d.ts` - TypeScript definitions for passport-microsoft

### Backend Modules (165 Files)

#### Auth Module (15 files)

**src/modules/auth/**
- `auth.controller.ts` - POST /register, POST /login, POST /refresh, POST /verify-email, POST /forgot-password, POST /reset-password, GET /google, GET /github, GET /microsoft
- `auth.service.ts` - register(), login(), verifyEmail(), generateTokens(), refreshTokens(), hashPassword(), sendVerificationEmail()
- `auth.module.ts` - Module imports: JWT, Passport strategies, email service

**src/modules/auth/strategies/** (5 strategies)
- `jwt.strategy.ts` - JWT validation strategy for Passport, validates access tokens
- `refresh-token.strategy.ts` - Refresh token validation
- `google.strategy.ts` - Google OAuth strategy, profile extraction
- `github.strategy.ts` - GitHub OAuth strategy
- `microsoft.strategy.ts` - Microsoft OAuth strategy

**src/modules/auth/guards/** (2 guards)
- `jwt-auth.guard.ts` - Global JWT authentication guard (can be bypassed with @Public())
- `roles.guard.ts` - Role-based access control guard (@Roles decorator)
- `ws-jwt.guard.ts` - WebSocket JWT guard

**src/modules/auth/entities/** (3 entities)
- `email-verification.entity.ts` - Email verification tokens (token, userId, expiresAt, verified)
- `password-reset.entity.ts` - Password reset tokens (token, userId, expiresAt, used)
- `refresh-token.entity.ts` - Refresh tokens (token, userId, expiresAt, revoked)

**src/modules/auth/dto/** (8 DTOs)
- `login.dto.ts` - { email, password }
- `register.dto.ts` - { email, password, username, firstName, lastName }
- `refresh-token.dto.ts` - { refreshToken }
- `verify-email.dto.ts` - { token }
- `forgot-password.dto.ts` - { email }
- `reset-password.dto.ts` - { token, newPassword }
- `enable-mfa.dto.ts` - { secret }
- `verify-mfa.dto.ts` - { code }

#### Users Module (10 files)

**src/modules/users/**
- `users.controller.ts` - GET /users/me, PUT /users/:id, GET /users/search, GET /users/:id, POST /users/block, DELETE /users/block/:id
- `users.service.ts` - createUser(), updateUser(), findById(), searchUsers(), updateStatus(), blockUser(), unblockUser()
- `users.module.ts` - Module imports

**src/modules/users/entities/** (3 entities)
- `user.entity.ts` - User (id, email, username, passwordHash, firstName, lastName, avatarUrl, status, lastSeen, createdAt, updatedAt, deletedAt)
- `user-settings.entity.ts` - UserSettings (userId, theme, language, notificationsEnabled, emailNotifications, pushNotifications)
- `blocked-users.entity.ts` - BlockedUser (userId, blockedUserId, blockedAt)

**src/modules/users/dto/** (4 DTOs)
- `update-user.dto.ts` - { firstName?, lastName?, avatarUrl?, status? }
- `search-users.dto.ts` - { q, limit, offset }
- `update-password.dto.ts` - { oldPassword, newPassword }
- `update-settings.dto.ts` - { theme?, language?, notificationsEnabled? }
- `block-user.dto.ts` - { userId }

#### Messages Module (14 files)

**src/modules/messages/**
- `messages.controller.ts` - GET /messages/:conversationId, POST /messages, PUT /messages/:id, DELETE /messages/:id, POST /messages/:id/react, DELETE /messages/:id/reactions/:reactionId, POST /messages/:id/forward, POST /messages/:id/pin
- `messages.service.ts` - createMessage(), getMessages(), editMessage(), deleteMessage(), addReaction(), removeReaction(), forwardMessage(), pinMessage(), unpinMessage()
- `messages.gateway.ts` - WebSocket gateway, message:send, message:edit, message:delete, message:react events
- `messages.module.ts` - Module imports

**src/modules/messages/entities/** (5 entities)
- `message.entity.ts` - Message (id, conversationId, senderId, content, type, replyToId, attachments, isEdited, isPinned, createdAt, updatedAt, deletedAt)
- `message-reaction.entity.ts` - MessageReaction (id, messageId, userId, emoji, createdAt)
- `message-read.entity.ts` - MessageRead (id, messageId, userId, readAt)
- `message-edit-history.entity.ts` - MessageEditHistory (id, messageId, oldContent, editedAt)
- `pinned-message.entity.ts` - PinnedMessage (id, messageId, conversationId, pinnedBy, pinnedAt)

**src/modules/messages/dto/** (5 DTOs)
- `create-message.dto.ts` - { conversationId, content, type?, replyToId?, attachments? }
- `update-message.dto.ts` - { content }
- `message-reaction.dto.ts` - { emoji }
- `get-messages.dto.ts` - { limit, offset, before?, after? }
- `forward-message.dto.ts` - { conversationIds[] }

#### Conversations Module (10 files)

**src/modules/conversations/**
- `conversations.controller.ts` - GET /conversations, POST /conversations, GET /conversations/:id, DELETE /conversations/:id, POST /conversations/:id/participants, DELETE /conversations/:id/participants/:userId, PATCH /conversations/:id/participants/:userId
- `conversations.service.ts` - createConversation(), getConversations(), getConversationById(), addParticipant(), removeParticipant(), updateParticipant(), markAsRead()
- `conversations.module.ts` - Module imports

**src/modules/conversations/entities/** (2 entities)
- `conversation.entity.ts` - Conversation (id, name, type, avatarUrl, workspaceId, createdBy, lastMessageAt, createdAt, updatedAt, deletedAt)
- `conversation-participant.entity.ts` - ConversationParticipant (id, conversationId, userId, role, joinedAt, lastReadAt, isMuted, isPinned)

**src/modules/conversations/dto/** (5 DTOs)
- `create-conversation.dto.ts` - { type, participantIds[], name?, avatarUrl? }
- `get-conversations.dto.ts` - { type?, search?, limit, offset }
- `update-conversation.dto.ts` - { name?, avatarUrl? }
- `add-participant.dto.ts` - { userId }
- `update-participant.dto.ts` - { role?, isMuted?, isPinned? }

#### Groups Module (9 files)

**src/modules/groups/**
- `groups.controller.ts` - POST /groups, PUT /groups/:id, POST /groups/:id/members, DELETE /groups/:id/members/:userId, GET /groups/:id
- `groups.service.ts` - createGroup(), updateGroup(), addMembers(), removeMembers(), getGroupById(), updateMemberRole()
- `groups.module.ts` - Module imports

**src/modules/groups/entities/** (2 entities)
- `group.entity.ts` - Group (inherits from Conversation, adds maxMembers, isPrivate)
- `group-member.entity.ts` - GroupMember (id, groupId, userId, role, joinedAt, addedBy)

**src/modules/groups/dto/** (3 DTOs)
- `create-group.dto.ts` - { name, description?, avatarUrl?, participantIds[], isPrivate? }
- `update-group.dto.ts` - { name?, description?, avatarUrl? }
- `add-member.dto.ts` - { userIds[] }

#### Workspaces Module (13 files)

**src/modules/workspaces/**
- `workspaces.controller.ts` - GET /workspaces, POST /workspaces, GET /workspaces/:id, PUT /workspaces/:id, DELETE /workspaces/:id, POST /workspaces/:id/invite, DELETE /workspaces/:id/members/:userId, PATCH /workspaces/:id/members/:userId/role
- `workspaces.service.ts` - createWorkspace(), updateWorkspace(), deleteWorkspace(), inviteMembers(), removeMember(), updateMemberRole(), getWorkspaces()
- `workspaces.module.ts` - Module imports

**src/modules/workspaces/entities/** (2 entities)
- `workspace.entity.ts` - Workspace (id, name, description, avatarUrl, ownerId, plan, createdAt, updatedAt, deletedAt)
- `workspace-member.entity.ts` - WorkspaceMember (id, workspaceId, userId, role, joinedAt, invitedBy)

**src/modules/workspaces/guards/** (3 guards)
- `workspace-owner.guard.ts` - Ensures user is workspace owner
- `workspace-admin.guard.ts` - Ensures user is workspace admin or owner
- `workspace-member.guard.ts` - Ensures user is workspace member

**src/modules/workspaces/dto/** (5 DTOs)
- `create-workspace.dto.ts` - { name, description?, avatarUrl? }
- `get-workspaces.dto.ts` - { limit, offset }
- `update-workspace.dto.ts` - { name?, description?, avatarUrl? }
- `invite-member.dto.ts` - { emails[] }
- `update-member-role.dto.ts` - { role }

#### Channels Module (8 files)

**src/modules/channels/**
- `channels.controller.ts` - GET /channels, POST /channels, GET /channels/:id, PUT /channels/:id, DELETE /channels/:id, POST /channels/:id/subscribe, DELETE /channels/:id/subscribe
- `channels.service.ts` - createChannel(), updateChannel(), deleteChannel(), subscribe(), unsubscribe(), getChannelsByWorkspace()
- `channels.module.ts` - Module imports

**src/modules/channels/entities/** (2 entities)
- `channel.entity.ts` - Channel (id, workspaceId, name, description, isPrivate, createdBy, createdAt, updatedAt, deletedAt)
- `channel-subscriber.entity.ts` - ChannelSubscriber (id, channelId, userId, subscribedAt)

**src/modules/channels/dto/** (2 DTOs)
- `create-channel.dto.ts` - { workspaceId, name, description?, isPrivate? }
- `update-channel.dto.ts` - { name?, description?, isPrivate? }

#### Calls Module (9 files)

**src/modules/calls/**
- `calls.controller.ts` - GET /calls, POST /calls/initiate, POST /calls/:id/join, POST /calls/:id/end, GET /calls/history, GET /calls/missed
- `calls.service.ts` - initiateCall(), joinCall(), endCall(), getCallHistory(), getMissedCalls(), updateCallStatus()
- `calls.gateway.ts` - WebSocket events: call:initiate, call:accept, call:reject, call:end (delegates to realtime-service)
- `calls.module.ts` - Module imports

**src/modules/calls/entities/**
- `call.entity.ts` - Call (id, conversationId, initiatorId, callType, status, startedAt, endedAt, duration, recordingUrl, createdAt)

**src/modules/calls/dto/** (4 DTOs)
- `initiate-call.dto.ts` - { conversationId, callType, participants[] }
- `join-call.dto.ts` - { callId }
- `end-call.dto.ts` - { callId }
- `update-recording.dto.ts` - { recordingUrl }

#### Media Module (7 files)

**src/modules/media/**
- `media.controller.ts` - POST /media/upload, GET /media/:id, DELETE /media/:id, GET /media/:id/download
- `media.service.ts` - uploadFile(), getFileById(), deleteFile(), generatePresignedUrl()
- `media.module.ts` - Module imports

**src/modules/media/services/**
- `storage.service.ts` - MinIO S3 client, upload(), download(), delete(), generateThumbnail()

**src/modules/media/entities/**
- `media.entity.ts` - Media (id, userId, filename, originalName, mimeType, size, url, thumbnailUrl, createdAt)

**src/modules/media/dto/**
- `upload-media.dto.ts` - { file: File }

#### Notifications Module (11 files)

**src/modules/notifications/**
- `notifications.controller.ts` - GET /notifications, PUT /notifications/:id/read, PUT /notifications/read-all, DELETE /notifications/:id, PUT /notifications/settings
- `notifications.service.ts` - createNotification(), getNotifications(), markAsRead(), markAllAsRead(), deleteNotification(), sendPushNotification(), updateSettings()
- `notifications.gateway.ts` - WebSocket events: notification:new
- `notifications.module.ts` - Module imports

**src/modules/notifications/entities/**
- `notification.entity.ts` - Notification (id, userId, type, title, content, metadata, isRead, readAt, createdAt)

**src/modules/notifications/dto/** (2 DTOs)
- `create-notification.dto.ts` - { userId, type, title, content, metadata? }
- `get-notifications.dto.ts` - { limit, offset, type?, isRead? }

#### Presence Module (8 files)

**src/modules/presence/**
- `presence.controller.ts` - GET /presence/online, PUT /presence/status
- `presence.gateway.ts` - WebSocket events: presence:update, user:online, user:offline, typing:start, typing:stop
- `presence.service.ts` - updateStatus(), getOnlineUsers(), setTyping(), clearTyping(), getUserPresence()
- `presence.module.ts` - Module imports

**src/modules/presence/entities/** (2 entities)
- `presence.entity.ts` - Presence (userId, status, lastSeen, deviceInfo, createdAt, updatedAt)
- `typing-indicator.entity.ts` - TypingIndicator (userId, conversationId, startedAt, expiresAt)

**src/modules/presence/dto/** (2 DTOs)
- `update-presence.dto.ts` - { status }
- `typing-indicator.dto.ts` - { conversationId, isTyping }

#### AI Module (10 files)

**src/modules/ai/**
- `ai.controller.ts` - POST /ai/smart-replies, POST /ai/enhance, POST /ai/translate, POST /ai/summarize, POST /ai/chat
- `ai.service.ts` - generateSmartReplies() (GPT-3.5), enhanceMessage() (GPT-4), translate(), summarize(), chatCompletion(), transcribeAudio() (Whisper)
- `ai.module.ts` - Module imports, OpenAI client

**src/modules/ai/dto/** (5 DTOs)
- `smart-reply.dto.ts` - { messageId }
- `enhance-message.dto.ts` - { content, tone }
- `translate-message.dto.ts` - { content, targetLanguage }
- `summarize.dto.ts` - { conversationId, messageCount }
- `chat-completion.dto.ts` - { messages[], model? }

#### Search Module (6 files)

**src/modules/search/**
- `search.controller.ts` - GET /search?q=query&type=messages|files|users&limit=20
- `search.service.ts` - globalSearch(), searchMessages(), searchFiles(), searchUsers(), searchWithFilters()
- `search.module.ts` - Module imports

**src/modules/search/dto/**
- `search-query.dto.ts` - { q, type?, limit, offset, filters? }

#### Stories Module (13 files)

**src/modules/stories/**
- `stories.controller.ts` - GET /stories, POST /stories, GET /stories/:id, DELETE /stories/:id, POST /stories/:id/view, POST /stories/:id/reply
- `stories.service.ts` - createStory(), getStories(), viewStory(), deleteStory(), replyToStory(), deleteExpiredStories()
- `stories.module.ts` - Module imports

**src/modules/stories/entities/** (3 entities)
- `story.entity.ts` - Story (id, userId, content, mediaUrl, mediaType, duration, expiresAt, createdAt, deletedAt)
- `story-view.entity.ts` - StoryView (id, storyId, userId, viewedAt)
- `story-reply.entity.ts` - StoryReply (id, storyId, userId, content, createdAt)

**src/modules/stories/dto/** (4 DTOs)
- `create-story.dto.ts` - { content?, mediaUrl, mediaType, duration }
- `get-stories.dto.ts` - { userId?, limit, offset }
- `update-story.dto.ts` - { content? }
- `create-story-reply.dto.ts` - { content }

#### Webhooks Module (9 files)

**src/modules/webhooks/**
- `webhooks.controller.ts` - POST /webhooks, GET /webhooks, GET /webhooks/:id, PUT /webhooks/:id, DELETE /webhooks/:id
- `webhooks.service.ts` - createWebhook(), getWebhooks(), updateWebhook(), deleteWebhook(), triggerWebhook(), validateSignature(), retryFailedWebhooks()
- `webhooks.module.ts` - Module imports

**src/modules/webhooks/entities/** (2 entities)
- `webhook.entity.ts` - Webhook (id, userId, url, events[], secret, isActive, createdAt, updatedAt)
- `webhook-log.entity.ts` - WebhookLog (id, webhookId, event, payload, responseStatus, responseBody, attemptCount, createdAt)

**src/modules/webhooks/dto/** (2 DTOs)
- `create-webhook.dto.ts` - { url, events[] }
- `update-webhook.dto.ts` - { url?, events?, isActive? }

#### Email Module (2 files)

**src/modules/email/**
- `email.service.ts` - sendVerificationEmail(), sendPasswordResetEmail(), sendWelcomeEmail(), sendNotificationEmail()
- `email.module.ts` - Module imports, Nodemailer config

---

## Module 3: Realtime Service - WebRTC Signaling Server

### Tech Stack
- Node.js 18+, TypeScript
- Express 4.x (for health check endpoint)
- Socket.IO 4.7 with Redis adapter
- Redis 7 (for horizontal scaling and pub/sub)
- JWT authentication (shared secret with backend)
- TURN/STUN server (Coturn) integration for NAT traversal

### Complete File Structure (8 Files)

#### Core Files

**src/index.ts** - Express + Socket.IO server initialization, Redis adapter setup, authentication middleware, event handler registration, CORS configuration, health check endpoint, runs on port 4000

#### Configuration (1 file)

**src/config/**
- `environment.ts` - Environment variables loader, exports config: REALTIME_PORT, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, JWT_SECRET, CORS_ORIGIN, TURN_SERVER_URL, STUN_SERVER_URL, MAX_PARTICIPANTS_PER_CALL, CALL_TIMEOUT_MS

#### Middleware (1 file)

**src/middleware/**
- `auth.middleware.ts` - Socket.IO authentication middleware, JWT validation using shared secret, extracts userId and username from token, attaches to socket.data, rejects invalid tokens

#### Services (1 file)

**src/services/**
- `room.service.ts` - Call room management, methods: createRoom(callId, participants[]), getRoomParticipants(callId), addParticipant(callId, userId), removeParticipant(callId, userId), destroyRoom(callId), participant tracking with metadata (joinedAt, mediaState)

#### WebRTC Event Handlers (3 files)

**src/handlers/**
- `connection.handler.ts` - Socket connection/disconnection lifecycle, user room join/leave, presence broadcasting (user:online, user:offline events), cleanup on disconnect
- `webrtc.handler.ts` - WebRTC signaling events: call:initiate (create room, notify participants), call:accept, call:reject, call:end (cleanup room), offer (forward SDP to peer), answer (forward SDP to caller), ice-candidate (forward to peer), media:toggle-audio, media:toggle-video, screen:share-start, screen:share-stop
- `chat.handler.ts` - Real-time chat events during calls: message:send (broadcast to room), typing:start, typing:stop

#### Utilities (1 file)

**src/utils/**
- `logger.ts` - Winston logger configuration, formats: timestamp, level, message, colorize for console, file transports for error.log and combined.log

### Key Features

**Horizontal Scaling:**
- Uses Redis adapter for Socket.IO to enable multiple instances
- Pub/sub pattern for cross-instance communication
- Sticky sessions handled by Nginx

**Room Management:**
- Each call creates a unique room identified by callId
- Participants join rooms to receive targeted events
- Automatic cleanup when last participant leaves

**NAT Traversal:**
- Provides TURN/STUN server configuration to clients
- Fallback to TURN relay when P2P fails
- Supports Coturn server integration

**Security:**
- JWT authentication on connection
- Room access validation (only invited participants)
- Rate limiting to prevent abuse

**Health Monitoring:**
- `/health` endpoint returns: status, active connections count, uptime
- Prometheus metrics (optional integration point)

---

## API Endpoints (Quick Reference)

### Authentication
- POST /api/auth/register - {email, password, username, firstName, lastName}
- POST /api/auth/login - {email, password} → {accessToken, refreshToken, user}
- POST /api/auth/refresh - {refreshToken} → {accessToken}
- POST /api/auth/verify-email - {token}
- POST /api/auth/forgot-password - {email}
- POST /api/auth/reset-password - {token, newPassword}
- GET /api/auth/google - Google OAuth login
- GET /api/auth/github - GitHub OAuth login
- GET /api/auth/microsoft - Microsoft OAuth login

### Users
- GET /api/users/me - Get current user profile (Auth required)
- PUT /api/users/:id - Update user profile
- GET /api/users/search?q=term - Search users by name/email
- GET /api/users/:id - Get user by ID

### Conversations
- GET /api/conversations - Get user's conversations (Auth required)
- POST /api/conversations - Create conversation {participantIds[], type}
- GET /api/conversations/:id - Get conversation details
- DELETE /api/conversations/:id - Delete conversation
- GET /api/conversations/:id/messages - Get messages with pagination

### Messages
- GET /api/messages/:conversationId?limit=50&offset=0 - Get messages
- POST /api/messages - Send message {conversationId, content, type, attachments[]}
- PUT /api/messages/:id - Edit message {content}
- DELETE /api/messages/:id - Delete message
- POST /api/messages/:id/react - Add reaction {emoji}
- POST /api/messages/:id/forward - Forward message {conversationIds[]}

### Groups
- POST /api/groups - Create group {name, description, participantIds[]}
- PUT /api/groups/:id - Update group {name, description, avatarUrl}
- POST /api/groups/:id/members - Add members {userIds[]}
- DELETE /api/groups/:id/members/:userId - Remove member

### Channels (Workspace)
- GET /api/workspaces/:id/channels - Get workspace channels
- POST /api/channels - Create channel {workspaceId, name, description, isPrivate}
- PUT /api/channels/:id - Update channel
- DELETE /api/channels/:id - Delete channel

### Workspaces
- GET /api/workspaces - Get user's workspaces
- POST /api/workspaces - Create workspace {name, description}
- PUT /api/workspaces/:id - Update workspace
- POST /api/workspaces/:id/invite - Invite members {emails[]}

### Media
- POST /api/media/upload - Upload file (multipart/form-data) → {url, id, type, size}
- GET /api/media/:id - Get file metadata
- DELETE /api/media/:id - Delete file

### AI Features
- POST /api/ai/smart-replies - Generate replies {messageId} → {replies: string[]}
- POST /api/ai/enhance - Enhance message {content, tone} → {enhanced: string}
- POST /api/ai/translate - Translate message {content, targetLanguage} → {translated: string}
- POST /api/ai/transcribe - Transcribe audio {audioUrl} → {transcript: string}

### Notifications
- GET /api/notifications - Get notifications
- PUT /api/notifications/:id/read - Mark as read
- PUT /api/notifications/settings - Update settings {push, email, desktop}

### Search
- GET /api/search?q=query&type=messages|files|users&limit=20 - Global search

### Stories
- GET /api/stories - Get stories (24hr)
- POST /api/stories - Create story {content, mediaUrl, duration}
- POST /api/stories/:id/view - Mark story as viewed

### Calls (History)
- GET /api/calls - Get call history
- POST /api/calls/initiate - Initiate call {conversationId, callType} (triggers WebSocket)
- GET /api/calls/:id - Get call details

### Webhooks
- POST /api/webhooks - Create webhook {url, events[]}
- GET /api/webhooks - List webhooks
- PUT /api/webhooks/:id - Update webhook
- DELETE /api/webhooks/:id - Delete webhook

---

## WebSocket Events

### Messaging Socket (Port 3001)

**Client → Server:**
- `message:send` - {conversationId, content, type, attachments}
- `message:edit` - {messageId, content}
- `message:delete` - {messageId}
- `message:react` - {messageId, emoji}
- `typing:start` - {conversationId}
- `typing:stop` - {conversationId}
- `user:status:update` - {status: 'online' | 'away' | 'busy'}

**Server → Client:**
- `message:new` - {message: Message}
- `message:updated` - {messageId, content}
- `message:deleted` - {messageId}
- `message:reaction:added` - {messageId, reaction}
- `typing:start` - {conversationId, userId, username}
- `typing:stop` - {conversationId, userId}
- `user:online` - {userId, username}
- `user:offline` - {userId}
- `conversation:updated` - {conversationId, updates}

### WebRTC Signaling Socket (Port 4000)

**Client → Server:**
- `call:initiate` - {conversationId, callType, participants[]}
- `call:accept` - {callId}
- `call:reject` - {callId}
- `call:end` - {callId}
- `offer` - {callId, targetUserId, offer: RTCSessionDescription}
- `answer` - {callId, targetUserId, answer: RTCSessionDescription}
- `ice-candidate` - {callId, targetUserId, candidate: RTCIceCandidate}
- `call:media-toggle` - {callId, mediaType, enabled}

**Server → Client:**
- `call:initiated` - {callId, iceServers[]}
- `call:incoming` - {callId, from, conversationId, callType}
- `call:accepted` - {callId, userId}
- `call:rejected` - {callId, userId}
- `call:ended` - {callId, reason}
- `call:participant:joined` - {callId, participant}
- `call:participant:left` - {callId, userId}
- `offer` - {callId, from, offer}
- `answer` - {callId, from, answer}
- `ice-candidate` - {callId, from, candidate}
- `call:media-toggled` - {callId, userId, mediaType, enabled}

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
VITE_REALTIME_URL=http://localhost:4000
```

### Backend (.env)
```
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=chat_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_EXPIRY=7d

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_CALLBACK_URL=http://localhost:3001/api/auth/microsoft/callback

# MinIO Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=chat-uploads

# AI Services
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_PREMIUM_MODEL=gpt-4

# FCM Push Notifications
FCM_SERVER_KEY=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Realtime Service (.env)
```
# Server
REALTIME_PORT=4000
NODE_ENV=production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_ENABLED=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# TURN/STUN
TURN_ENABLED=true
TURN_SERVER_URL=turn:localhost:3478
TURN_USERNAME=username
TURN_PASSWORD=password
STUN_SERVER_URL=stun:localhost:3478

# Call Settings
MAX_PARTICIPANTS_PER_CALL=50
CALL_TIMEOUT_MS=3600000

# Logging
LOG_LEVEL=info
```

---

## Docker Setup

### Realtime Service Stack (docker-compose.realtime.yml)

**Services:**
- **realtime-service** - WebRTC signaling server (port 4000)
- **redis-realtime** - Redis for Socket.IO adapter (port 6380 mapped to 6379)
- **coturn** - TURN/STUN server for NAT traversal (ports 3478, 5349, 49152-49200)
- **nginx-realtime** - Reverse proxy (port 8080)

**Network:** chat-network (172.25.0.0/16)

**Volumes:** redis_realtime_data

### Commands
```bash
# Start realtime service stack
docker-compose -f docker-compose.realtime.yml up -d

# View logs
docker-compose -f docker-compose.realtime.yml logs -f

# Stop services
docker-compose -f docker-compose.realtime.yml down
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- MinIO (for file storage)
- Docker & Docker Compose (optional)

### Backend Setup
```bash
cd chat-backend
npm install

# Configure .env file
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migration:run

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
# Server runs on http://localhost:3001
```

### Realtime Service Setup
```bash
cd realtime-service
npm install

# Configure .env file
cp .env.example .env

# Start development server
npm run dev
# Service runs on http://localhost:4000

# OR use Docker
cd ..
docker-compose -f docker-compose.realtime.yml up -d
```

### Frontend Setup
```bash
cd chat-web-client
npm install

# Configure .env file
cp .env.example .env
# Set VITE_API_URL=http://localhost:3001/api
# Set VITE_REALTIME_URL=http://localhost:4000

# Start development server
npm run dev
# App runs on http://localhost:5173
```

### Full Stack Development
```bash
# Terminal 1: Backend
cd chat-backend && npm run start:dev

# Terminal 2: Realtime Service
cd realtime-service && npm run dev

# Terminal 3: Frontend
cd chat-web-client && npm run dev
```

---

## Key Architecture Patterns

### Frontend
- **Component Architecture:** Functional components with hooks, no class components
- **State Management:** Zustand for global state, TanStack Query for server state
- **Real-time:** Dual Socket.IO clients (messaging + WebRTC signaling)
- **WebRTC:** Custom service managing peer connections, media streams
- **API:** Axios with interceptors for auth, TanStack Query for caching
- **Routing:** React Router v6 with view-based routing
- **Styling:** Tailwind CSS v4 with CSS variables, mobile-first responsive design
- **UI Components:** ShadCN UI (Radix UI + Tailwind)

### Backend
- **Module Structure:** Feature-based modules (auth, messages, calls, etc.)
- **Database:** TypeORM with PostgreSQL, repository pattern
- **Caching:** Redis with cache-manager for frequently accessed data
- **Queues:** Bull queues for async processing (email, notifications, AI)
- **WebSocket:** Socket.IO gateway per module, JWT authentication
- **Auth:** JWT access tokens (15min) + refresh tokens (7 days)
- **Files:** MinIO S3-compatible storage with presigned URLs
- **API Docs:** Swagger/OpenAPI auto-generated

### Realtime Service
- **Standalone:** Separate Node.js process for WebRTC signaling
- **Scalability:** Redis adapter for horizontal scaling
- **Rooms:** Call room management with participant tracking
- **TURN/STUN:** Coturn server for NAT traversal

---

## Recent Changes

### Socket Connection Fixes (November 2, 2025)

**Problem:** Critical socket connection issues affecting WebRTC calls and real-time messaging
- Sockets disconnecting on every page refresh
- Silent connection failures (no auto-reconnection)
- Microphone not working in voice calls ("works in rare scenarios only")
- User reported: "mic is not working when a voice call started and attended"
- Console logs showing: `[RealtimeSocket] ❌ Not connected, cannot emit event: call:initiate`

**Root Cause Analysis:**
1. React useEffect cleanup was disconnecting sockets on every component re-render
2. No mechanism to differentiate intentional logout vs unexpected disconnection
3. Socket connection state not checked before creating new instances
4. No auto-reconnection strategy for network issues or server restarts
5. Dual socket management (messaging + WebRTC) lacked lifecycle coordination

**Files Modified:**

#### 1. chat-web-client/src/App.tsx (Major Rewrite)
**Changes:**
- Added connection state checks to prevent duplicate socket creation:
  ```typescript
  if (!messagingAlreadyConnected) {
    socketService.connect();
  }
  ```
- **REMOVED socket disconnect from useEffect cleanup** (sockets now persist across navigation)
- Added heartbeat interval (30 seconds) to monitor and restore connections:
  ```typescript
  setInterval(() => {
    if (!socketService.isConnected() && isAuthenticated) {
      socketService.connect();
    }
  }, 30000);
  ```
- Added dedicated logout event handler:
  ```typescript
  window.addEventListener('app:logout', () => {
    socketService.disconnect();
    realtimeSocket.disconnect();
  });
  ```
- Added realtime socket disconnection handler with auto-reconnect:
  ```typescript
  if (isAuthenticated && event.detail?.reason !== 'io client disconnect') {
    setTimeout(() => {
      if (!realtimeSocket.isConnected()) {
        realtimeSocket.connect();
      }
    }, 2000);
  }
  ```
- Event-driven WebRTC initialization (waits for actual socket connection)

#### 2. chat-web-client/src/lib/websocket/realtime-socket.ts
**Changes:**
- Added `intentionalDisconnect` flag to differentiate logout vs network issues:
  ```typescript
  private intentionalDisconnect = false;
  ```
- Enhanced `connect()` method with socket reuse logic:
  ```typescript
  // If socket exists but disconnected, reconnect it
  if (this.socket && !this.socket.connected) {
    console.log('[RealtimeSocket] 🔄 Socket exists but disconnected, attempting to reconnect...');
    this.socket.connect();
    return;
  }
  ```
- Improved `disconnect()` to set intentional flag:
  ```typescript
  disconnect() {
    this.intentionalDisconnect = true;
    this.socket.disconnect();
    this.socket = null;
  }
  ```
- Enhanced disconnect event handler to prevent reconnection on logout:
  ```typescript
  this.socket.on('disconnect', (reason) => {
    if (this.intentionalDisconnect) {
      console.log('[RealtimeSocket] Intentional disconnect, not attempting to reconnect');
      return;
    }
  });
  ```

#### 3. chat-web-client/src/lib/websocket/socket.ts (Messaging Socket)
**Changes:** Identical pattern to realtime-socket.ts
- Added `intentionalDisconnect` flag
- Enhanced connection logic with socket reuse
- Improved error handling and logging
- Better disconnect handling (only on explicit logout)

#### 4. chat-web-client/src/lib/stores/auth.store.ts
**Changes:**
- Added logout event emission for socket cleanup:
  ```typescript
  logout: () => {
    // ... clear state ...

    // Emit logout event for socket cleanup
    window.dispatchEvent(new CustomEvent('app:logout'));
  }
  ```

#### 5. chat-web-client/src/lib/webrtc/webrtc.service.ts
**Changes:**
- Added comprehensive logging in `toggleAudio()` and `toggleVideo()`:
  ```typescript
  console.log('[WebRTC] 🎤 toggleAudio() called');
  console.log('[WebRTC] Found', audioTracks.length, 'audio tracks');
  ```
- Better error messages when stream isn't ready
- Track-by-track logging for debugging

**Testing & Verification:**
All changes were tested in a live session with the following scenarios:
1. ✅ Page refresh maintains socket connections
2. ✅ Network interruption triggers auto-reconnect
3. ✅ Logout cleanly disconnects both sockets
4. ✅ Mic/video toggle works immediately after call connect
5. ✅ No duplicate socket connections on component re-renders

**Result:**
✅ Persistent connections across page reloads and navigation
✅ Auto-recovery after network issues (2-second delay + heartbeat)
✅ Clean logout with proper socket disconnection
✅ Comprehensive debugging logs for troubleshooting
✅ Zero duplicate connections
✅ **Mic/video controls now work reliably in all scenarios**
✅ WebRTC calls initiate successfully (call:initiate event emits)

**UI Visibility Fixes (Same Session):**

Also fixed call UI visibility issues reported by user:

#### VideoCallOverlay.tsx
**Problem:** Title bar icons and status badges barely visible on dark background
**Changes:**
- Title bar icons: `text-gray-400` → `text-gray-300`
- Status badges: `bg-green-500/20` → `bg-green-500/30` with `border border-green-500/50`
- Badge text: `text-green-400` → `text-green-200`
- Badge icons: `text-green-400` → `text-green-300`

**Result:** Significantly improved contrast and visibility of all call UI elements

---

## Testing Guide

### Unit Tests
- Run backend tests: `cd chat-backend && npm test`
- Run frontend tests: `cd chat-web-client && npm test`

### E2E Testing Checklist
1. Authentication flow (register, login, logout)
2. Real-time messaging (send, receive, edit, delete)
3. WebRTC calls (initiate, accept, reject, video toggle)
4. File uploads and previews
5. Search functionality (global, messages, files)
6. Workspace and channel management
7. Stories creation and viewing
8. AI features (smart replies, enhancement, translation)

---

## Documentation Maintenance

**Last Updated:** November 2, 2025
**Version:** 2.0.0
**Total Files Documented:** 318 files (130 frontend + 180 backend + 8 realtime)

**CRITICAL MAINTENANCE RULE:** This documentation MUST be updated with EVERY code change, no matter how small.

Update triggers:
- ✅ New files created
- ✅ Functions/methods added or modified
- ✅ API endpoints added, changed, or removed
- ✅ Database schema changes (entities, fields)
- ✅ WebSocket events added or modified
- ✅ Configuration changes (.env variables, ports)
- ✅ Dependencies added or updated
- ✅ Bug fixes and workarounds
- ✅ Performance optimizations
- ✅ UI/UX changes

This ensures accurate AI assistance, seamless team collaboration, and prevents knowledge loss.

---

**Generated with Claude Code - Comprehensive Project Documentation**
**For questions or updates, see CLAUDE.md**
