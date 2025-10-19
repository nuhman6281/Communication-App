# Comprehensive Enterprise Chat Application - Complete Development Guide

## Project Overview
Build a production-ready, enterprise-grade messaging and collaboration platform combining features from Slack, Zoho Cliq, WhatsApp, Instagram, and Microsoft Teams. The application must be fully functional, scalable, secure, and bug-free using Flutter for cross-platform frontend and NestJS for backend with all open-source technologies.

---

## Tech Stack Requirements

### Frontend
- **Framework**: Flutter (latest stable version)
- **State Management**: Riverpod 2.x or Bloc 8.x
- **Local Storage**: Hive or Drift (SQLite)
- **Network**: Dio with retry interceptors
- **WebSocket**: socket_io_client
- **Video Calls**: Jitsi Meet SDK for Flutter
- **Media**: cached_network_image, image_picker, file_picker
- **Notifications**: firebase_messaging or OneSignal
- **UI**: Material Design 3 with custom theming

### Backend
- **Framework**: NestJS (latest LTS)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15+ with TypeORM
- **Cache**: Redis 7+
- **Message Queue**: Bull Queue with Redis
- **Real-time**: Socket.IO
- **Video Infrastructure**: Jitsi Meet (self-hosted)
- **File Storage**: MinIO (S3-compatible)
- **Authentication**: JWT + Refresh Tokens
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Logging**: Winston + Morgan
- **Testing**: Jest, Supertest

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt with Certbot
- **Monitoring**: Prometheus + Grafana (optional)
- **CI/CD**: GitHub Actions or GitLab CI

---

## Core Features to Implement

### 1. Authentication & User Management
- Email/password registration with email verification
- Phone number authentication with OTP
- Multi-factor authentication (TOTP)
- OAuth2 integration (Google, GitHub, Microsoft)
- Password reset and account recovery
- User profiles with avatars, status, bio
- Privacy settings (last seen, profile photo visibility, read receipts)
- Block/unblock users
- Account deletion with data export

### 2. Messaging Features
- **One-on-One Chat**
  - Text messages with markdown support
  - Emoji reactions (multiple per message)
  - Message threading/replies
  - Message editing and deletion
  - Forward messages
  - Copy, select, and bulk operations
  
- **Group Chats**
  - Create groups with up to 256 members
  - Group admins and roles (admin, moderator, member)
  - Group info, description, and avatar
  - Add/remove members
  - Leave group
  - Mute notifications per group
  - Pin important messages
  - Group invite links
  
- **Channels (Broadcast)**
  - One-way broadcast channels
  - Unlimited subscribers
  - Admin-only posting
  - Channel verification badge
  
- **Message Types**
  - Text with rich formatting
  - Images (single and albums)
  - Videos (with thumbnail generation)
  - Audio messages (voice notes)
  - Documents (PDF, DOC, XLS, etc.)
  - Location sharing
  - Contact cards
  - Polls and surveys
  - Code snippets with syntax highlighting
  - GIF integration (Giphy/Tenor API)
  - Stickers and custom emoji packs

### 3. Real-Time Features
- Online/offline status indicators
- Typing indicators
- Message delivery status (sent, delivered, read)
- Read receipts (with privacy controls)
- Live location sharing
- Real-time message updates across devices
- Presence system (online, away, do not disturb, offline)

### 4. Video & Voice Calls
- **Jitsi Integration**
  - One-on-one video calls
  - Group video calls (up to 50 participants)
  - Screen sharing
  - Virtual backgrounds
  - Audio-only calls
  - Picture-in-picture mode
  - Call history and missed call notifications
  - In-call chat
  - Hand raise and reactions
  - Recording (server-side, optional)
  - Breakout rooms (optional)

### 5. Workspace/Organization Features
- Create and manage workspaces
- Workspace channels (public and private)
- Department/team organization
- Workspace-wide announcements
- Workspace settings and branding
- Member directory
- Roles and permissions system
- SSO for enterprise (SAML 2.0)

### 6. File Management
- File upload with drag-and-drop
- Multiple file selection
- File preview (images, videos, PDFs)
- File download and sharing
- File organization by type
- Search files across conversations
- Storage quota management
- Automatic media compression
- Thumbnail generation

### 7. Search & Discovery
- Global search (messages, files, contacts)
- Filter by date, sender, file type
- Search within conversation
- Hashtag support
- Saved messages/bookmarks
- Search history
- Advanced filters (boolean operators)

### 8. Notifications
- Push notifications (FCM/OneSignal)
- In-app notifications
- Notification preferences per chat
- Scheduled do-not-disturb
- Custom notification sounds
- Notification badges
- Email notifications for missed messages

### 9. Stories/Status Updates (Instagram-style)
- 24-hour disappearing stories
- Photo/video/text stories
- Story viewers list
- Reply to stories
- Story privacy controls
- Story highlights

### 10. Advanced Features
- End-to-end encryption option (Signal Protocol)
- Self-destructing messages
- Screenshot detection
- Message scheduling
- Auto-reply/away messages
- Chatbots and webhook integration
- Custom themes (light/dark/custom colors)
- Multi-language support (i18n)
- Accessibility features (screen reader support)
- Data export (GDPR compliance)
- Message backups to cloud
- Desktop sync and multi-device support

---

## Backend Architecture & File Structure

```
backend/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── config/                          # Configuration management
│   │   ├── configuration.ts             # Environment configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   ├── storage.config.ts
│   │   └── jitsi.config.ts
│   │
│   ├── common/                          # Shared utilities
│   │   ├── decorators/                  # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/                     # Exception filters
│   │   │   ├── http-exception.filter.ts
│   │   │   └── websocket-exception.filter.ts
│   │   ├── guards/                      # Authentication guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── ws-jwt.guard.ts
│   │   ├── interceptors/                # Request/response interceptors
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/                       # Validation pipes
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-objectid.pipe.ts
│   │   ├── middleware/                  # Custom middleware
│   │   │   ├── logger.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── interfaces/                  # Shared interfaces
│   │   ├── types/                       # Type definitions
│   │   ├── constants/                   # Application constants
│   │   └── utils/                       # Utility functions
│   │       ├── encryption.util.ts
│   │       ├── file.util.ts
│   │       └── date.util.ts
│   │
│   ├── database/                        # Database layer
│   │   ├── database.module.ts
│   │   ├── database.service.ts
│   │   ├── migrations/
│   │   └── seeds/
│   │
│   ├── modules/
│   │   ├── auth/                        # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── refresh-token.strategy.ts
│   │   │   │   └── oauth.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── entities/
│   │   │       └── refresh-token.entity.ts
│   │   │
│   │   ├── users/                       # User management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user-response.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── messages/                    # Messaging system
│   │   │   ├── messages.module.ts
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   ├── messages.repository.ts
│   │   │   ├── messages.gateway.ts      # WebSocket gateway
│   │   │   ├── dto/
│   │   │   │   ├── create-message.dto.ts
│   │   │   │   ├── update-message.dto.ts
│   │   │   │   └── message-response.dto.ts
│   │   │   └── entities/
│   │   │       ├── message.entity.ts
│   │   │       └── message-reaction.entity.ts
│   │   │
│   │   ├── conversations/               # Conversations/Chats
│   │   │   ├── conversations.module.ts
│   │   │   ├── conversations.controller.ts
│   │   │   ├── conversations.service.ts
│   │   │   ├── conversations.repository.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │       ├── conversation.entity.ts
│   │   │       └── participant.entity.ts
│   │   │
│   │   ├── groups/                      # Group management
│   │   │   ├── groups.module.ts
│   │   │   ├── groups.controller.ts
│   │   │   ├── groups.service.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │       ├── group.entity.ts
│   │   │       └── group-member.entity.ts
│   │   │
│   │   ├── channels/                    # Broadcast channels
│   │   │   ├── channels.module.ts
│   │   │   ├── channels.controller.ts
│   │   │   ├── channels.service.ts
│   │   │   └── entities/
│   │   │       └── channel.entity.ts
│   │   │
│   │   ├── calls/                       # Video/Voice calls
│   │   │   ├── calls.module.ts
│   │   │   ├── calls.controller.ts
│   │   │   ├── calls.service.ts
│   │   │   ├── calls.gateway.ts
│   │   │   ├── jitsi.service.ts         # Jitsi integration
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │       └── call.entity.ts
│   │   │
│   │   ├── media/                       # File/Media handling
│   │   │   ├── media.module.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── media.service.ts
│   │   │   ├── storage.service.ts       # MinIO integration
│   │   │   ├── processors/
│   │   │   │   ├── image.processor.ts
│   │   │   │   ├── video.processor.ts
│   │   │   │   └── thumbnail.processor.ts
│   │   │   └── entities/
│   │   │       └── media.entity.ts
│   │   │
│   │   ├── workspaces/                  # Workspace/Organization
│   │   │   ├── workspaces.module.ts
│   │   │   ├── workspaces.controller.ts
│   │   │   ├── workspaces.service.ts
│   │   │   └── entities/
│   │   │       ├── workspace.entity.ts
│   │   │       └── workspace-member.entity.ts
│   │   │
│   │   ├── notifications/               # Notification system
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.gateway.ts
│   │   │   ├── push-notification.service.ts
│   │   │   └── entities/
│   │   │       └── notification.entity.ts
│   │   │
│   │   ├── stories/                     # Status/Stories feature
│   │   │   ├── stories.module.ts
│   │   │   ├── stories.controller.ts
│   │   │   ├── stories.service.ts
│   │   │   └── entities/
│   │   │       ├── story.entity.ts
│   │   │       └── story-view.entity.ts
│   │   │
│   │   ├── presence/                    # Online status
│   │   │   ├── presence.module.ts
│   │   │   ├── presence.service.ts
│   │   │   ├── presence.gateway.ts
│   │   │   └── entities/
│   │   │       └── presence.entity.ts
│   │   │
│   │   ├── search/                      # Search functionality
│   │   │   ├── search.module.ts
│   │   │   ├── search.controller.ts
│   │   │   └── search.service.ts
│   │   │
│   │   └── webhooks/                    # Webhook integrations
│   │       ├── webhooks.module.ts
│   │       ├── webhooks.controller.ts
│   │       └── webhooks.service.ts
│   │
│   └── jobs/                            # Background jobs
│       ├── jobs.module.ts
│       ├── processors/
│       │   ├── email.processor.ts
│       │   ├── media-processing.processor.ts
│       │   └── cleanup.processor.ts
│       └── schedulers/
│           └── story-cleanup.scheduler.ts
│
├── test/                                # Testing
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── package.json
└── README.md
```

---

## Flutter Frontend Architecture & File Structure

```
frontend/
├── lib/
│   ├── main.dart                        # Application entry
│   │
│   ├── app.dart                         # Root app widget
│   │
│   ├── core/                            # Core functionality
│   │   ├── constants/
│   │   │   ├── api_constants.dart
│   │   │   ├── app_constants.dart
│   │   │   ├── storage_constants.dart
│   │   │   └── route_constants.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   ├── colors.dart
│   │   │   ├── text_styles.dart
│   │   │   └── dimensions.dart
│   │   ├── config/
│   │   │   ├── app_config.dart
│   │   │   └── environment.dart
│   │   ├── routes/
│   │   │   ├── app_router.dart
│   │   │   └── route_guards.dart
│   │   ├── errors/
│   │   │   ├── exceptions.dart
│   │   │   ├── failures.dart
│   │   │   └── error_handler.dart
│   │   ├── network/
│   │   │   ├── dio_client.dart
│   │   │   ├── api_client.dart
│   │   │   ├── interceptors/
│   │   │   │   ├── auth_interceptor.dart
│   │   │   │   ├── logging_interceptor.dart
│   │   │   │   └── retry_interceptor.dart
│   │   │   └── response_handler.dart
│   │   ├── websocket/
│   │   │   ├── socket_client.dart
│   │   │   ├── socket_events.dart
│   │   │   └── socket_handlers.dart
│   │   ├── utils/
│   │   │   ├── validators.dart
│   │   │   ├── formatters.dart
│   │   │   ├── date_utils.dart
│   │   │   ├── file_utils.dart
│   │   │   ├── encryption_utils.dart
│   │   │   └── permission_utils.dart
│   │   └── extensions/
│   │       ├── context_extension.dart
│   │       ├── string_extension.dart
│   │       ├── datetime_extension.dart
│   │       └── widget_extension.dart
│   │
│   ├── data/                            # Data layer
│   │   ├── models/                      # Data models
│   │   │   ├── user_model.dart
│   │   │   ├── message_model.dart
│   │   │   ├── conversation_model.dart
│   │   │   ├── group_model.dart
│   │   │   ├── call_model.dart
│   │   │   ├── media_model.dart
│   │   │   ├── notification_model.dart
│   │   │   └── story_model.dart
│   │   │
│   │   ├── repositories/                # Repository implementations
│   │   │   ├── auth_repository.dart
│   │   │   ├── user_repository.dart
│   │   │   ├── message_repository.dart
│   │   │   ├── conversation_repository.dart
│   │   │   ├── group_repository.dart
│   │   │   ├── call_repository.dart
│   │   │   ├── media_repository.dart
│   │   │   └── story_repository.dart
│   │   │
│   │   ├── data_sources/                # Data sources
│   │   │   ├── local/
│   │   │   │   ├── local_storage.dart
│   │   │   │   ├── secure_storage.dart
│   │   │   │   ├── database/
│   │   │   │   │   ├── app_database.dart
│   │   │   │   │   ├── daos/
│   │   │   │   │   └── tables/
│   │   │   │   └── preferences.dart
│   │   │   │
│   │   │   └── remote/
│   │   │       ├── auth_api.dart
│   │   │       ├── user_api.dart
│   │   │       ├── message_api.dart
│   │   │       ├── conversation_api.dart
│   │   │       ├── group_api.dart
│   │   │       ├── call_api.dart
│   │   │       ├── media_api.dart
│   │   │       └── story_api.dart
│   │   │
│   │   └── services/                    # Business services
│   │       ├── auth_service.dart
│   │       ├── encryption_service.dart
│   │       ├── notification_service.dart
│   │       ├── media_service.dart
│   │       ├── jitsi_service.dart
│   │       ├── background_service.dart
│   │       └── sync_service.dart
│   │
│   ├── domain/                          # Business logic layer
│   │   ├── entities/                    # Domain entities
│   │   │   ├── user.dart
│   │   │   ├── message.dart
│   │   │   ├── conversation.dart
│   │   │   └── ...
│   │   │
│   │   ├── repositories/                # Repository interfaces
│   │   │   └── ...
│   │   │
│   │   └── usecases/                    # Use cases
│   │       ├── auth/
│   │       │   ├── login_usecase.dart
│   │       │   ├── register_usecase.dart
│   │       │   └── logout_usecase.dart
│   │       ├── messages/
│   │       │   ├── send_message_usecase.dart
│   │       │   ├── get_messages_usecase.dart
│   │       │   ├── edit_message_usecase.dart
│   │       │   └── delete_message_usecase.dart
│   │       └── ...
│   │
│   ├── presentation/                    # UI layer
│   │   ├── providers/                   # Riverpod providers
│   │   │   ├── auth_provider.dart
│   │   │   ├── user_provider.dart
│   │   │   ├── message_provider.dart
│   │   │   ├── conversation_provider.dart
│   │   │   ├── call_provider.dart
│   │   │   ├── theme_provider.dart
│   │   │   └── websocket_provider.dart
│   │   │
│   │   ├── screens/                     # App screens
│   │   │   ├── splash/
│   │   │   │   └── splash_screen.dart
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── login_screen.dart
│   │   │   │   ├── register_screen.dart
│   │   │   │   ├── verify_email_screen.dart
│   │   │   │   └── forgot_password_screen.dart
│   │   │   │
│   │   │   ├── home/
│   │   │   │   ├── home_screen.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── conversations/
│   │   │   │   ├── conversations_screen.dart
│   │   │   │   ├── chat_screen.dart
│   │   │   │   └── widgets/
│   │   │   │       ├── message_bubble.dart
│   │   │   │       ├── message_input.dart
│   │   │   │       ├── typing_indicator.dart
│   │   │   │       └── date_separator.dart
│   │   │   │
│   │   │   ├── groups/
│   │   │   │   ├── create_group_screen.dart
│   │   │   │   ├── group_info_screen.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── calls/
│   │   │   │   ├── call_screen.dart
│   │   │   │   ├── incoming_call_screen.dart
│   │   │   │   ├── call_history_screen.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── stories/
│   │   │   │   ├── stories_screen.dart
│   │   │   │   ├── create_story_screen.dart
│   │   │   │   ├── view_story_screen.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── workspaces/
│   │   │   │   ├── workspace_screen.dart
│   │   │   │   ├── create_workspace_screen.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── profile/
│   │   │   │   ├── profile_screen.dart
│   │   │   │   ├── edit_profile_screen.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── settings_screen.dart
│   │   │   │   ├── privacy_settings_screen.dart
│   │   │   │   ├── notification_settings_screen.dart
│   │   │   │   └── widgets/
│   │   │   │
│   │   │   └── search/
│   │   │       ├── search_screen.dart
│   │   │       └── widgets/
│   │   │
│   │   └── widgets/                     # Shared widgets
│   │       ├── common/
│   │       │   ├── custom_button.dart
│   │       │   ├── custom_text_field.dart
│   │       │   ├── loading_indicator.dart
│   │       │   ├── error_widget.dart
│   │       │   ├── empty_state.dart
│   │       │   └── avatar_widget.dart
│   │       ├── media/
│   │       │   ├── image_viewer.dart
│   │       │   ├── video_player_widget.dart
│   │       │   ├── audio_player_widget.dart
│   │       │   └── file_preview.dart
│   │       └── animations/
│   │           ├── fade_animation.dart
│   │           └── slide_animation.dart
│   │
│   └── l10n/                            # Localization
│       ├── app_en.arb
│       ├── app_es.arb
│       └── ...
│
├── assets/                              # Static assets
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── animations/
│
├── test/                                # Tests
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── pubspec.yaml
├── analysis_options.yaml
└── README.md
```

---

## Database Schema Design

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    status VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL, -- 'direct', 'group', 'channel'
    name VARCHAR(255),
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reply_to_id UUID REFERENCES messages(id),
    content TEXT,
    message_type VARCHAR(20) NOT NULL, -- 'text', 'image', 'video', 'audio', 'file', 'location', etc.
    metadata JSONB, -- For storing additional data
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Message reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Message status (delivery/read receipts)
CREATE TABLE message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'read'
    timestamp TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Media/Files table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- For audio/video in seconds
    width INTEGER, -- For images/videos
    height INTEGER, -- For images/videos
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Calls table
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    call_type VARCHAR(20) NOT NULL, -- 'audio', 'video'
    jitsi_room_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'initiated', -- 'initiated', 'ringing', 'ongoing', 'ended', 'missed'
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration INTEGER, -- In seconds
    created_at TIMESTAMP DEFAULT NOW()
);

-- Call participants
CREATE TABLE call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    UNIQUE(call_id, user_id)
);

-- Workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    owner_id UUID REFERENCES users(id),
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workspace members
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Stories table
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL, -- 'image', 'video', 'text'
    content_url TEXT,
    text_content TEXT,
    background_color VARCHAR(7),
    duration INTEGER DEFAULT 24, -- Hours before expiration
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Story views
CREATE TABLE story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User settings/preferences
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    theme VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Blocked users
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_participants_conversation ON participants(conversation_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_stories_user ON stories(user_id);
CREATE INDEX idx_stories_expires ON stories(expires_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

---

## Best Practices & Coding Standards

### Backend (NestJS) Standards

#### 1. Code Structure & Organization
```typescript
// ✅ CORRECT: Proper dependency injection and separation of concerns
@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly conversationService: ConversationService,
    private readonly notificationService: NotificationService,
    private readonly cacheManager: Cache,
  ) {}

  async createMessage(dto: CreateMessageDto, userId: string): Promise<MessageResponseDto> {
    // Validate conversation access
    await this.conversationService.validateUserAccess(dto.conversationId, userId);
    
    // Create message
    const message = this.messageRepository.create({
      ...dto,
      senderId: userId,
    });
    
    await this.messageRepository.save(message);
    
    // Invalidate cache
    await this.cacheManager.del(`conversation:${dto.conversationId}:messages`);
    
    // Send notification asynchronously
    this.notificationService.notifyNewMessage(message).catch(console.error);
    
    return this.toResponseDto(message);
  }
}
```

#### 2. Error Handling
```typescript
// Custom exception filters
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    this.logger.error(`${request.method} ${request.url}`, exception);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

#### 3. Validation with DTOs
```typescript
// DTOs with proper validation
export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10000)
  content: string;

  @IsEnum(MessageType)
  @IsNotEmpty()
  messageType: MessageType;

  @IsUUID()
  @IsOptional()
  replyToId?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MessageMetadataDto)
  metadata?: MessageMetadataDto;
}
```

#### 4. Database Transactions
```typescript
async deleteMessage(messageId: string, userId: string): Promise<void> {
  await this.dataSource.transaction(async (manager) => {
    const message = await manager.findOne(Message, {
      where: { id: messageId, senderId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Soft delete message
    message.isDeleted = true;
    message.deletedAt = new Date();
    await manager.save(message);

    // Delete associated media
    await manager.delete(Media, { messageId });

    // Delete reactions
    await manager.delete(MessageReaction, { messageId });
  });
}
```

#### 5. Caching Strategy
```typescript
@Injectable()
export class MessagesService {
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedMessagesDto> {
    const cacheKey = `conversation:${conversationId}:messages:${page}:${limit}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get<PaginatedMessagesDto>(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId, isDeleted: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['sender', 'reactions', 'media'],
    });

    const result = {
      data: messages.map(this.toResponseDto),
      total,
      page,
      limit,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }
}
```

#### 6. WebSocket Implementation
```typescript
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = await this.jwtService.verifyAsync(token);
      client.data.userId = payload.sub;
      
      // Join user to their conversations
      const conversations = await this.messagesService.getUserConversations(payload.sub);
      conversations.forEach(conv => client.join(`conversation:${conv.id}`));
      
      // Emit online status
      this.server.emit('user:online', { userId: payload.sub });
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ) {
    try {
      const message = await this.messagesService.createMessage(dto, client.data.userId);
      
      // Emit to conversation room
      this.server
        .to(`conversation:${dto.conversationId}`)
        .emit('message:new', message);
      
      return { success: true, data: message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.broadcast
      .to(`conversation:${data.conversationId}`)
      .emit('user:typing', { userId: client.data.userId, conversationId: data.conversationId });
  }
}
```

### Flutter Standards

#### 1. State Management (Riverpod)
```dart
// ✅ CORRECT: Proper provider structure
@riverpod
class MessagesNotifier extends _$MessagesNotifier {
  @override
  Future<List<Message>> build(String conversationId) async {
    return _fetchMessages(conversationId);
  }

  Future<void> sendMessage(CreateMessageDto dto) async {
    state = const AsyncValue.loading();
    
    state = await AsyncValue.guard(() async {
      final message = await ref.read(messageRepositoryProvider).createMessage(dto);
      
      final currentMessages = await future;
      return [message, ...currentMessages];
    });
  }

  Future<List<Message>> _fetchMessages(String conversationId) async {
    final repository = ref.read(messageRepositoryProvider);
    return repository.getMessages(conversationId);
  }
}
```

#### 2. Repository Pattern
```dart
// Repository interface
abstract class MessageRepository {
  Future<List<Message>> getMessages(String conversationId, {int page, int limit});
  Future<Message> createMessage(CreateMessageDto dto);
  Future<void> deleteMessage(String messageId);
  Future<Message> updateMessage(String messageId, UpdateMessageDto dto);
}

// Implementation
class MessageRepositoryImpl implements MessageRepository {
  final ApiClient _apiClient;
  final LocalDatabase _localDb;
  final NetworkInfo _networkInfo;

  MessageRepositoryImpl(this._apiClient, this._localDb, this._networkInfo);

  @override
  Future<List<Message>> getMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
  }) async {
    try {
      // Try to fetch from API if online
      if (await _networkInfo.isConnected) {
        final response = await _apiClient.get(
          '/conversations/$conversationId/messages',
          queryParameters: {'page': page, 'limit': limit},
        );
        
        final messages = (response.data['data'] as List)
            .map((json) => Message.fromJson(json))
            .toList();
        
        // Cache locally
        await _localDb.cacheMessages(conversationId, messages);
        
        return messages;
      }
      
      // Fallback to local cache
      return _localDb.getMessages(conversationId, page: page, limit: limit);
    } catch (e) {
      // Return cached data on error
      return _localDb.getMessages(conversationId, page: page, limit: limit);
    }
  }
}
```

#### 3. Clean Widget Structure
```dart
// ✅ CORRECT: Widget composition and separation
class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatScreen({required this.conversationId, super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent * 0.9) {
      ref.read(messagesProvider(widget.conversationId).notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(messagesProvider(widget.conversationId));

    return Scaffold(
      appBar: _buildAppBar(),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) => MessagesList(
                messages: messages,
                scrollController: _scrollController,
              ),
              loading: () => const LoadingIndicator(),
              error: (error, stack) => ErrorView(error: error),
            ),
          ),
          MessageInput(
            controller: _messageController,
            onSend: _handleSendMessage,
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final conversation = ref.watch(conversationProvider(widget.conversationId));
    
    return AppBar(
      title: conversation.when(
        data: (conv) => ConversationAppBarTitle(conversation: conv),
        loading: () => const SizedBox.shrink(),
        error: (_, __) => const Text('Error'),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.videocam),
          onPressed: () => _startVideoCall(),
        ),
        IconButton(
          icon: const Icon(Icons.call),
          onPressed: () => _startAudioCall(),
        ),
      ],
    );
  }

  Future<void> _handleSendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    _messageController.clear();

    await ref.read(messagesProvider(widget.conversationId).notifier).sendMessage(
      CreateMessageDto(
        conversationId: widget.conversationId,
        content: content,
        messageType: MessageType.text,
      ),
    );
  }
}
```

#### 4. Error Handling & Retry Logic
```dart
class ApiClient {
  final Dio _dio;

  ApiClient(this._dio) {
    _dio.interceptors.addAll([
      RetryInterceptor(
        dio: _dio,
        logPrint: print,
        retries: 3,
        retryDelays: const [
          Duration(seconds: 1),
          Duration(seconds: 2),
          Duration(seconds: 3),
        ],
      ),
      LoggingInterceptor(),
      AuthInterceptor(),
    ]);
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  AppException _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkException('Connection timeout');
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        if (statusCode == 401) {
          return UnauthorizedException('Session expired');
        } else if (statusCode == 404) {
          return NotFoundException('Resource not found');
        }
        return ServerException('Server error: $statusCode');
      case DioExceptionType.cancel:
        return CancelException('Request cancelled');
      default:
        return NetworkException('Network error');
    }
  }
}
```

#### 5. Local Database (Drift)
```dart
@DriftDatabase(tables: [Messages, Users, Conversations])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  // Queries
  Future<List<MessageData>> getConversationMessages(
    String conversationId, {
    int limit = 50,
    int offset = 0,
  }) {
    return (select(messages)
          ..where((m) => m.conversationId.equals(conversationId))
          ..orderBy([(m) => OrderingTerm.desc(m.createdAt)])
          ..limit(limit, offset: offset))
        .get();
  }

  Future<void> insertMessage(MessageData message) {
    return into(messages).insert(message, mode: InsertMode.insertOrReplace);
  }

  Future<void> deleteMessage(String messageId) {
    return (delete(messages)..where((m) => m.id.equals(messageId))).go();
  }

  static LazyDatabase _openConnection() {
    return LazyDatabase(() async {
      final dbFolder = await getApplicationDocumentsDirectory();
      final file = File(p.join(dbFolder.path, 'app.db'));
      return NativeDatabase(file);
    });
  }
}
```

---

## Security Implementation

### 1. JWT Authentication
```typescript
// Backend: JWT strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
```

### 2. Password Hashing
```typescript
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

### 3. Rate Limiting
```typescript
// Apply rate limiting
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Throttle(5, 60) // 5 requests per minute
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

### 4. Input Sanitization
```typescript
import { sanitize } from 'class-sanitizer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any) {
    sanitize(value);
    return value;
  }
}
```

### 5. E2E Encryption (Flutter - Signal Protocol)
```dart
class EncryptionService {
  Future<String> encryptMessage(String message, String recipientPublicKey) async {
    // Implement Signal Protocol encryption
    final encrypted = await SignalProtocol.encrypt(
      message,
      recipientPublicKey,
    );
    return encrypted;
  }

  Future<String> decryptMessage(String encryptedMessage, String senderPublicKey) async {
    final decrypted = await SignalProtocol.decrypt(
      encryptedMessage,
      senderPublicKey,
    );
    return decrypted;
  }
}
```

---

## Testing Strategy

### Backend Testing

#### Unit Tests
```typescript
describe('MessagesService', () => {
  let service: MessagesService;
  let repository: Repository<Message>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    repository = module.get<Repository<Message>>(getRepositoryToken(Message));
  });

  it('should create a message', async () => {
    const dto: CreateMessageDto = {
      conversationId: 'conv-123',
      content: 'Test message',
      messageType: MessageType.TEXT,
    };

    jest.spyOn(repository, 'create').mockReturnValue({} as Message);
    jest.spyson(repository, 'save').mockResolvedValue({} as Message);

    const result = await service.createMessage(dto, 'user-123');
    
    expect(result).toBeDefined();
    expect(repository.create).toHaveBeenCalledWith({
      ...dto,
      senderId: 'user-123',
    });
  });
});
```

#### Integration Tests
```typescript
describe('Messages API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    
    authToken = response.body.accessToken;
  });

  it('/messages (POST) should create a message', () => {
    return request(app.getHttpServer())
      .post('/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        conversationId: 'conv-123',
        content: 'Test message',
        messageType: 'text',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.content).toBe('Test message');
      });
  });
});
```

### Flutter Testing

#### Unit Tests
```dart
void main() {
  group('MessageRepository', () {
    late MessageRepository repository;
    late MockApiClient mockApiClient;
    late MockLocalDatabase mockLocalDb;

    setUp(() {
      mockApiClient = MockApiClient();
      mockLocalDb = MockLocalDatabase();
      repository = MessageRepositoryImpl(mockApiClient, mockLocalDb);
    });

    test('should return messages from API when online', () async {
      // Arrange
      when(mockApiClient.get(any, queryParameters: anyNamed('queryParameters')))
          .thenAnswer((_) async => Response(data: {
                'data': [
                  {'id': '1', 'content': 'Test'},
                ]
              }));

      // Act
      final result = await repository.getMessages('conv-123');

      // Assert
      expect(result, isA<List<Message>>());
      expect(result.length, 1);
      verify(mockApiClient.get('/conversations/conv-123/messages')).called(1);
    });
  });
}
```

#### Widget Tests
```dart
void main() {
  testWidgets('ChatScreen displays messages', (tester) async {
    // Arrange
    final mockMessages = [
      Message(id: '1', content: 'Hello', senderId: 'user1'),
      Message(id: '2', content: 'Hi', senderId: 'user2'),
    ];

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          messagesProvider('conv-123').overrideWith((ref) => mockMessages),
        ],
        child: MaterialApp(
          home: ChatScreen(conversationId: 'conv-123'),
        ),
      ),
    );

    // Act
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Hello'), findsOneWidget);
    expect(find.text('Hi'), findsOneWidget);
  });
}
```

---

## Deployment Configuration

### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: chatapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  jitsi:
    image: jitsi/web:latest
    ports:
      - "8000:80"
      - "8443:443"
    environment:
      - ENABLE_AUTH=1
      - ENABLE_GUESTS=1
    volumes:
      - jitsi_config:/config

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/chatapp
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin123
      JITSI_URL: http://jitsi:8000
    depends_on:
      - postgres
      - redis
      - minio
    volumes:
      - ./backend:/app
      - /app/node_modules

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  minio_data:
  jitsi_config:
```

### Backend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Nginx Configuration
```nginx
upstream backend {
    server backend:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 100M;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Environment Variables

### Backend (.env)
```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chatapp
DATABASE_SYNC=false
DATABASE_LOGGING=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-token-secret-change-this
JWT_REFRESH_EXPIRATION=7d

# MinIO/S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false
MINIO_BUCKET=chatapp-media

# Jitsi
JITSI_URL=https://meet.jit.si
JITSI_APP_ID=your-jitsi-app-id
JITSI_APP_SECRET=your-jitsi-app-secret

# Push Notifications
FCM_SERVER_KEY=your-fcm-server-key
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_API_KEY=your-onesignal-api-key

# Email (for notifications and verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# File Upload
MAX_FILE_SIZE=104857600  # 100MB in bytes
ALLOWED_FILE_TYPES=image/*,video/*,audio/*,application/pdf,application/msword
```

### Flutter (.env)
```env
# API Configuration
API_BASE_URL=https://api.yourdomain.com/api/v1
WEBSOCKET_URL=wss://api.yourdomain.com
API_TIMEOUT=30000

# Jitsi
JITSI_SERVER_URL=https://meet.jit.si

# Push Notifications
FCM_SENDER_ID=your-fcm-sender-id
ONESIGNAL_APP_ID=your-onesignal-app-id

# Features
ENABLE_E2E_ENCRYPTION=true
ENABLE_STORIES=true
ENABLE_CALLS=true
ENABLE_WORKSPACES=true

# Storage
MAX_CACHE_SIZE=524288000  # 500MB
CACHE_EXPIRATION_DAYS=7

# Debug
ENABLE_LOGGING=false
```

---

## Performance Optimization Guidelines

### Backend Optimization

#### 1. Database Query Optimization
```typescript
// ✅ Use select to fetch only needed fields
async getMessages(conversationId: string): Promise<Message[]> {
  return this.messageRepository
    .createQueryBuilder('message')
    .select([
      'message.id',
      'message.content',
      'message.messageType',
      'message.createdAt',
      'sender.id',
      'sender.username',
      'sender.avatarUrl',
    ])
    .leftJoin('message.sender', 'sender')
    .where('message.conversationId = :conversationId', { conversationId })
    .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
    .orderBy('message.createdAt', 'DESC')
    .limit(50)
    .getMany();
}

// ✅ Use pagination with cursor-based approach for large datasets
async getMessagesPaginated(
  conversationId: string,
  cursor?: string,
  limit: number = 50,
): Promise<PaginatedResult<Message>> {
  const qb = this.messageRepository
    .createQueryBuilder('message')
    .where('message.conversationId = :conversationId', { conversationId });

  if (cursor) {
    qb.andWhere('message.createdAt < :cursor', { cursor: new Date(cursor) });
  }

  const messages = await qb
    .orderBy('message.createdAt', 'DESC')
    .limit(limit + 1)
    .getMany();

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, -1) : messages;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  return { data, nextCursor, hasMore };
}
```

#### 2. Caching Strategy
```typescript
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Cache frequently accessed data
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 300,
  ): Promise<T> {
    const cached = await this.cacheManager.get<T>(key);
    if (cached) return cached;

    const fresh = await factory();
    await this.cacheManager.set(key, fresh, ttl);
    return fresh;
  }

  // Invalidate related caches
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.cacheManager.store.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    await Promise.all(matchingKeys.map(key => this.cacheManager.del(key)));
  }
}
```

#### 3. Message Queue for Heavy Operations
```typescript
@Processor('media-processing')
export class MediaProcessor {
  @Process('generate-thumbnail')
  async generateThumbnail(job: Job<{ fileUrl: string; mediaId: string }>) {
    const { fileUrl, mediaId } = job.data;
    
    try {
      // Download file
      const buffer = await this.downloadFile(fileUrl);
      
      // Generate thumbnail
      const thumbnail = await sharp(buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Upload thumbnail
      const thumbnailUrl = await this.storageService.upload(thumbnail, 'thumbnails');
      
      // Update media record
      await this.mediaRepository.update(mediaId, { thumbnailUrl });
      
      return { success: true, thumbnailUrl };
    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  @Process('compress-video')
  async compressVideo(job: Job<{ fileUrl: string; mediaId: string }>) {
    // Implement video compression using FFmpeg
    // This is a CPU-intensive operation that should run in background
  }
}
```

#### 4. WebSocket Connection Pooling
```typescript
@WebSocketGateway()
export class OptimizedGateway {
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  
  handleConnection(client: Socket) {
    const userId = client.data.userId;
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(client.id);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    const sockets = this.userSockets.get(userId);
    
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        // User is truly offline
        this.presenceService.setOffline(userId);
      }
    }
  }

  // Emit to specific user across all their devices
  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
```

### Flutter Optimization

#### 1. Lazy Loading & Pagination
```dart
class MessagesListView extends ConsumerStatefulWidget {
  final String conversationId;

  const MessagesListView({required this.conversationId, super.key});

  @override
  ConsumerState<MessagesListView> createState() => _MessagesListViewState();
}

class _MessagesListViewState extends ConsumerState<MessagesListView> {
  final ScrollController _scrollController = ScrollController();
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_isLoadingMore) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    
    if (currentScroll >= maxScroll * 0.9) {
      _loadMore();
    }
  }

  Future<void> _loadMore() async {
    setState(() => _isLoadingMore = true);
    
    await ref
        .read(messagesProvider(widget.conversationId).notifier)
        .loadMore();
    
    setState(() => _isLoadingMore = false);
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(messagesProvider(widget.conversationId));

    return messagesAsync.when(
      data: (messages) => ListView.builder(
        controller: _scrollController,
        reverse: true,
        itemCount: messages.length + (_isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == messages.length) {
            return const Center(child: CircularProgressIndicator());
          }
          
          return MessageBubble(
            message: messages[index],
            key: ValueKey(messages[index].id),
          );
        },
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorView(error: error),
    );
  }
}
```

#### 2. Image Caching & Optimization
```dart
class OptimizedImageWidget extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;

  const OptimizedImageWidget({
    required this.imageUrl,
    this.width,
    this.height,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: BoxFit.cover,
      placeholder: (context, url) => const ShimmerPlaceholder(),
      errorWidget: (context, url, error) => const Icon(Icons.error),
      memCacheWidth: width?.toInt(),
      memCacheHeight: height?.toInt(),
      maxWidthDiskCache: 1000,
      maxHeightDiskCache: 1000,
      cacheManager: CustomCacheManager.instance,
    );
  }
}

class CustomCacheManager extends CacheManager {
  static const key = 'chatAppImageCache';
  static CustomCacheManager? _instance;

  factory CustomCacheManager() {
    _instance ??= CustomCacheManager._();
    return _instance!;
  }

  CustomCacheManager._()
      : super(
          Config(
            key,
            stalePeriod: const Duration(days: 7),
            maxNrOfCacheObjects: 200,
            repo: JsonCacheInfoRepository(databaseName: key),
            fileSystem: IOFileSystem(key),
            fileService: HttpFileService(),
          ),
        );

  static CustomCacheManager get instance => CustomCacheManager();
}
```

#### 3. Debouncing & Throttling
```dart
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    // Cancel previous timer
    _debounce?.cancel();
    
    // Start new timer
    _debounce = Timer(const Duration(milliseconds: 500), () {
      final query = _searchController.text.trim();
      if (query.isNotEmpty) {
        ref.read(searchProvider.notifier).search(query);
      }
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            hintText: 'Search messages...',
            border: InputBorder.none,
          ),
        ),
      ),
      body: _buildSearchResults(),
    );
  }
}
```

#### 4. Background Sync
```dart
class BackgroundSyncService {
  static Future<void> initialize() async {
    await Workmanager().initialize(callbackDispatcher, isInDebugMode: false);
    
    // Schedule periodic sync
    await Workmanager().registerPeriodicTask(
      'sync-messages',
      'syncMessages',
      frequency: const Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: true,
      ),
    );
  }
}

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    switch (task) {
      case 'syncMessages':
        await _syncMessages();
        break;
      case 'cleanupCache':
        await _cleanupCache();
        break;
    }
    return Future.value(true);
  });
}

Future<void> _syncMessages() async {
  // Sync undelivered messages
  // Update message statuses
  // Fetch new messages
}
```

---

## Additional Features Implementation

### 1. Message Reactions
```typescript
// Backend
@Post(':messageId/reactions')
async addReaction(
  @Param('messageId') messageId: string,
  @Body() dto: AddReactionDto,
  @CurrentUser() user: User,
) {
  const reaction = await this.reactionsService.addReaction(
    messageId,
    user.id,
    dto.emoji,
  );
  
  // Emit via WebSocket
  this.messagesGateway.emitReaction(messageId, reaction);
  
  return { success: true, data: reaction };
}
```

```dart
// Flutter
class MessageReactions extends StatelessWidget {
  final Message message;

  const MessageReactions({required this.message, super.key});

  @override
  Widget build(BuildContext context) {
    if (message.reactions.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 4,
      children: message.reactions.entries.map((entry) {
        return GestureDetector(
          onTap: () => _handleReactionTap(context, entry.key),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(entry.key, style: const TextStyle(fontSize: 16)),
                const SizedBox(width: 4),
                Text('${entry.value.length}', style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  void _handleReactionTap(BuildContext context, String emoji) {
    // Toggle reaction
  }
}
```

### 2. File Upload with Progress
```dart
class FileUploadService {
  final Dio _dio;

  Future<Media> uploadFile(
    File file,
    String conversationId, {
    Function(double)? onProgress,
  }) async {
    final fileName = basename(file.path);
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: fileName),
      'conversationId': conversationId,
    });

    final response = await _dio.post(
      '/media/upload',
      data: formData,
      onSendProgress: (sent, total) {
        final progress = sent / total;
        onProgress?.call(progress);
      },
    );

    return Media.fromJson(response.data['data']);
  }
}

// Usage in UI
class FileUploadWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final uploadProgress = ref.watch(fileUploadProgressProvider);

    return uploadProgress.when(
      data: (progress) {
        if (progress == null) return const SizedBox.shrink();
        
        return LinearProgressIndicator(value: progress);
      },
      loading: () => const CircularProgressIndicator(),
      error: (error, stack) => Text('Upload failed: $error'),
    );
  }
}
```

### 3. Push Notifications
```typescript
// Backend
@Injectable()
export class PushNotificationService {
  constructor(
    @Inject('FCM') private fcm: admin.messaging.Messaging,
  ) {}

  async sendMessageNotification(
    userId: string,
    message: Message,
  ): Promise<void> {
    const user = await this.userService.findById(userId);
    const deviceTokens = await this.getDeviceTokens(userId);

    if (deviceTokens.length === 0) return;

    const payload: admin.messaging.MulticastMessage = {
      tokens: deviceTokens,
      notification: {
        title: message.sender.username,
        body: this.formatMessageBody(message),
        imageUrl: message.sender.avatarUrl,
      },
      data: {
        type: 'new_message',
        messageId: message.id,
        conversationId: message.conversationId,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'messages',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: await this.getUnreadCount(userId),
          },
        },
      },
    };

    await this.fcm.sendMulticast(payload);
  }

  private formatMessageBody(message: Message): string {
    switch (message.messageType) {
      case MessageType.TEXT:
        return message.content;
      case MessageType.IMAGE:
        return '📷 Photo';
      case MessageType.VIDEO:
        return '🎥 Video';
      case MessageType.AUDIO:
        return '🎵 Audio';
      default:
        return '📎 File';
    }
  }
}
```

```dart
// Flutter
class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Request permission
    await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Get FCM token
    final token = await _fcm.getToken();
    await _saveFcmToken(token);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle notification tap
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    // Show local notification
    final notification = message.notification;
    if (notification != null) {
      _showLocalNotification(
        title: notification.title ?? '',
        body: notification.body ?? '',
        payload: message.data,
      );
    }
  }

  Future<void> _showLocalNotification({
    required String title,
    required String body,
    Map<String, dynamic>? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'messages',
      'Messages',
      channelDescription: 'New message notifications',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await FlutterLocalNotificationsPlugin().show(
      0,
      title,
      body,
      details,
      payload: jsonEncode(payload),
    );
  }
}

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Handle background message
}
```

### 4. Voice Messages
```dart
class VoiceRecordingWidget extends StatefulWidget {
  final Function(String audioPath) onRecordingComplete;

  const VoiceRecordingWidget({
    required this.onRecordingComplete,
    super.key,
  });

  @override
  State<VoiceRecordingWidget> createState() => _VoiceRecordingWidgetState();
}

class _VoiceRecordingWidgetState extends State<VoiceRecordingWidget> {
  final AudioRecorder _recorder = AudioRecorder();
  bool _isRecording = false;
  Duration _duration = Duration.zero;
  Timer? _timer;

  Future<void> _startRecording() async {
    if (await _recorder.hasPermission()) {
      final path = await _getFilePath();
      await _recorder.start(const RecordConfig(), path: path);
      
      setState(() => _isRecording = true);
      
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() => _duration = Duration(seconds: timer.tick));
      });
    }
  }

  Future<void> _stopRecording() async {
    _timer?.cancel();
    
    final path = await _recorder.stop();
    setState(() {
      _isRecording = false;
      _duration = Duration.zero;
    });

    if (path != null) {
      widget.onRecordingComplete(path);
    }
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          if (_isRecording)
            Text(
              _formatDuration(_duration),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          const Spacer(),
          GestureDetector(
            onLongPressStart: (_) => _startRecording(),
            onLongPressEnd: (_) => _stopRecording(),
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: _isRecording ? Colors.red : Colors.blue,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _isRecording ? Icons.stop : Icons.mic,
                color: Colors.white,
                size: 32,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _recorder.dispose();
    super.dispose();
  }
}
```

---

## Code Quality & Bug Prevention

### 1. Strict TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true
  }
}
```

### 2. ESLint Configuration
```json
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "tsconfig.json",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint/eslint-plugin"],
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "root": true,
  "env": {
    "node": true,
    "jest": true
  },
  "ignorePatterns": [".eslintrc.js"],
  "rules": {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 3. Flutter Analysis Options
```yaml
# analysis_options.yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  strong-mode:
    implicit-casts: false
    implicit-dynamic: false
  errors:
    missing_required_param: error
    missing_return: error
    todo: ignore
    invalid_annotation_target: ignore

linter:
  rules:
    - always_declare_return_types
    - always_require_non_null_named_parameters
    - annotate_overrides
    - avoid_empty_else
    - avoid_init_to_null
    - avoid_null_checks_in_equality_operators
    - avoid_relative_lib_imports
    - avoid_return_types_on_setters
    - avoid_shadowing_type_parameters
    - avoid_types_as_parameter_names
    - await_only_futures
    - camel_case_extensions
    - cancel_subscriptions
    - close_sinks
    - constant_identifier_names
    - control_flow_in_finally
    - empty_catches
    - empty_constructor_bodies
    - exhaustive_cases
    - implementation_imports
    - library_names
    - library_prefixes
    - no_duplicate_case_values
    - null_closures
    - prefer_adjacent_string_concatenation
    - prefer_collection_literals
    - prefer_conditional_assignment
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_final_fields
    - prefer_final_locals
    - prefer_is_empty
    - prefer_is_not_empty
    - prefer_single_quotes
    - sort_child_properties_last
    - use_full_hex_values_for_flutter_colors
    - use_function_type_syntax_for_parameters
    - use_rethrow_when_possible
    - valid_regexps
```

### 4. Pre-commit Hooks
```json
// package.json (Backend)
{
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## Final Implementation Checklist

### Must-Have Features
- [x] User authentication (email, phone, OAuth)
- [x] One-on-one messaging
- [x] Group chats
- [x] File sharing (images, videos, documents)
- [x] Voice messages
- [x] Video/audio calls (Jitsi)
- [x] Push notifications
- [x] Message reactions
- [x] Message replies/threading
- [x] Online/offline status
- [x] Typing indicators
- [x] Read receipts
- [x] Search functionality
- [x] Stories/Status updates
- [x] Workspaces/Organizations

### Security Features
- [x] JWT authentication with refresh tokens
- [x] Password hashing (bcrypt)
- [x] Rate limiting
- [x] Input validation and sanitization
- [x] CORS configuration
- [x] HTTPS/SSL
- [x] Optional E2E encryption

### Performance Features
- [x] Database query optimization
- [x] Caching (Redis)
- [x] Message queues for heavy operations
- [x] Image compression and thumbnails
- [x] Lazy loading and pagination
- [x] Background sync
- [x] WebSocket connection pooling

### Code Quality
- [x] TypeScript strict mode
- [x] Comprehensive error handling
- [x] Unit tests
- [x] Integration tests
- [x] E2E tests
- [x] Code linting (ESLint/Dart analyzer)
- [x] Pre-commit hooks
- [x] API documentation (Swagger)

### DevOps
- [x] Docker containerization
- [x] Docker Compose for local development
- [x] Nginx reverse proxy
- [x] SSL certificates (Let's Encrypt)
- [x] Environment configuration
- [x] Database migrations
- [x] CI/CD pipeline ready

---

## Development Workflow

### 1. Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd chat-app

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configurations
npm run migration:run
npm run seed

# Flutter setup
cd ../frontend
flutter pub get
flutter pub run build_runner build
cp .env.example .env
# Edit .env with your configurations

# Start services with Docker
cd ..
docker-compose up -d

# Run backend
cd backend
npm run start:dev

# Run Flutter (in another terminal)
cd frontend
flutter run
```

### 2. Development Commands
```bash
# Backend
npm run start:dev          # Start development server
npm run build              # Build for production
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run lint               # Lint code
npm run format             # Format code
npm run migration:generate # Generate migration
npm run migration:run      # Run migrations

# Flutter
flutter run                # Run on connected device
flutter build apk          # Build Android APK
flutter build ios          # Build iOS app
flutter test               # Run tests
flutter analyze            # Analyze code
flutter pub run build_runner watch  # Watch for code generation
```

### 3. Git Workflow
```bash
# Feature development
git checkout -b feature/your-feature-name
# Make changes
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
# Create pull request

# Commit message conventions
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code style changes
# refactor: Code refactoring
# test: Test changes
# chore: Build/config changes
```

---

## Monitoring & Logging

### Backend Logging
```typescript
// logger.service.ts
@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }
}

// Usage in controllers
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  async createMessage(@Body() dto: CreateMessageDto, @CurrentUser() user: User) {
    this.logger.log(
      `User ${user.id} creating message in conversation ${dto.conversationId}`,
      'MessagesController',
    );
    
    try {
      const message = await this.messagesService.createMessage(dto, user.id);
      return { success: true, data: message };
    } catch (error) {
      this.logger.error(
        `Failed to create message: ${error.message}`,
        error.stack,
        'MessagesController',
      );
      throw error;
    }
  }
}
```

### Request Logging Middleware
```typescript
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const duration = Date.now() - startTime;

      const logMessage = `${method} ${originalUrl} ${statusCode} ${contentLength || 0} - ${userAgent} ${ip} - ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(logMessage, '', 'HTTP');
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage, 'HTTP');
      } else {
        this.logger.log(logMessage, 'HTTP');
      }
    });

    next();
  }
}
```

---

## API Documentation (Swagger)

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Chat Application API')
    .setDescription('Comprehensive chat application API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Messages', 'Messaging endpoints')
    .addTag('Conversations', 'Conversation management')
    .addTag('Groups', 'Group chat endpoints')
    .addTag('Calls', 'Video/Audio call endpoints')
    .addTag('Media', 'File upload and management')
    .addTag('Workspaces', 'Workspace/Organization endpoints')
    .addTag('Stories', 'Stories/Status endpoints')
    .addTag('Notifications', 'Notification endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}

// Example controller with Swagger decorators
@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MessagesController {
  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async createMessage(
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<MessageResponseDto>> {
    const message = await this.messagesService.createMessage(dto, user.id);
    return { success: true, data: message };
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<ApiResponse<PaginatedMessagesDto>> {
    const messages = await this.messagesService.getMessages(
      conversationId,
      page,
      limit,
    );
    return { success: true, data: messages };
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<void>> {
    await this.messagesService.deleteMessage(messageId, user.id);
    return { success: true, message: 'Message deleted successfully' };
  }
}
```

---

## Common Issues & Solutions

### 1. WebSocket Connection Issues
```typescript
// Backend: Ensure CORS is properly configured
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  namespace: '/chat',
  transports: ['websocket', 'polling'],
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  afterInit() {
    this.server.use((socket, next) => {
      // Add authentication middleware
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      next();
    });
  }
}
```

```dart
// Flutter: Proper socket connection with reconnection
class SocketService {
  IO.Socket? _socket;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const _maxReconnectAttempts = 5;

  Future<void> connect(String token) async {
    try {
      _socket = IO.io(
        AppConfig.websocketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .setReconnectionAttempts(_maxReconnectAttempts)
            .setAuth({'token': token})
            .build(),
      );

      _socket!.onConnect((_) {
        print('Socket connected');
        _reconnectAttempts = 0;
        _reconnectTimer?.cancel();
      });

      _socket!.onDisconnect((_) {
        print('Socket disconnected');
        _handleReconnect();
      });

      _socket!.onConnectError((error) {
        print('Connection error: $error');
        _handleReconnect();
      });

      _setupEventListeners();
    } catch (e) {
      print('Socket connection failed: $e');
      _handleReconnect();
    }
  }

  void _handleReconnect() {
    if (_reconnectAttempts < _maxReconnectAttempts) {
      _reconnectTimer?.cancel();
      _reconnectTimer = Timer(
        Duration(seconds: math.min(30, math.pow(2, _reconnectAttempts).toInt())),
        () {
          _reconnectAttempts++;
          connect(_getStoredToken());
        },
      );
    }
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
  }
}
```

### 2. File Upload Issues
```typescript
// Backend: Handle large file uploads
@Post('upload')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'audio/mpeg',
        'application/pdf',
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type'), false);
      }
    },
  }),
)
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UploadFileDto,
) {
  if (!file) {
    throw new BadRequestException('No file provided');
  }

  try {
    const media = await this.mediaService.uploadFile(file, dto);
    return { success: true, data: media };
  } catch (error) {
    throw new InternalServerErrorException('File upload failed');
  }
}
```

### 3. Memory Management in Flutter
```dart
// Proper disposal of resources
class ChatScreen extends StatefulWidget {
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _textController = TextEditingController();
  StreamSubscription? _messageSubscription;
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _setupMessageListener();
  }

  @override
  void dispose() {
    // CRITICAL: Always dispose of resources
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _textController.dispose();
    _messageSubscription?.cancel();
    _typingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Widget implementation
  }
}
```

### 4. Database Performance Issues
```typescript
// Use proper indexing and query optimization
@Entity()
@Index(['conversationId', 'createdAt'])
@Index(['senderId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  conversationId: string;

  @Column()
  senderId: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  // Use proper relations with lazy loading
  @ManyToOne(() => User, { lazy: true })
  sender: Promise<User>;

  @ManyToOne(() => Conversation, { lazy: true })
  conversation: Promise<Conversation>;

  @OneToMany(() => MessageReaction, reaction => reaction.message, { lazy: true })
  reactions: Promise<MessageReaction[]>;
}

// Batch operations for better performance
async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
  await this.messageStatusRepository
    .createQueryBuilder()
    .insert()
    .into(MessageStatus)
    .values(
      messageIds.map(messageId => ({
        messageId,
        userId,
        status: MessageStatus.READ,
      })),
    )
    .orUpdate(['status'], ['message_id', 'user_id'])
    .execute();
}
```

---

## Production Deployment Guide

### 1. Pre-deployment Checklist
```bash
# Backend
□ Environment variables configured
□ Database migrations up to date
□ All tests passing
□ Security headers configured
□ Rate limiting enabled
□ CORS properly configured
□ SSL certificates installed
□ Logging configured
□ Error tracking setup (Sentry)
□ Database backups configured
□ Redis persistence enabled
□ MinIO buckets created

# Flutter
□ App icons and splash screens
□ App signing configured
□ API endpoints pointing to production
□ Error tracking setup
□ Analytics setup
□ Push notification certificates
□ App Store/Play Store assets ready
```

### 2. Production Environment Variables
```env
# Backend Production .env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://user:password@production-db:5432/chatapp
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://:password@production-redis:6379
REDIS_MAX_CONNECTIONS=50

# JWT - Use strong secrets in production
JWT_SECRET=<generate-strong-secret-256-bit>
JWT_REFRESH_SECRET=<generate-strong-secret-256-bit>

# MinIO/S3
MINIO_ENDPOINT=s3.yourdomain.com
MINIO_USE_SSL=true

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Security
ENABLE_HELMET=true
ENABLE_CSRF=true
```

### 3. Kubernetes Deployment (Optional)
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-backend
  template:
    metadata:
      labels:
        app: chat-backend
    spec:
      containers:
      - name: backend
        image: your-registry/chat-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: chat-backend-service
spec:
  selector:
    app: chat-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 4. CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run linter
        run: cd backend && npm run lint
      - name: Run tests
        run: cd backend && npm run test:cov
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-flutter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
      - name: Install dependencies
        run: cd frontend && flutter pub get
      - name: Run analyzer
        run: cd frontend && flutter analyze
      - name: Run tests
        run: cd frontend && flutter test

  deploy-backend:
    needs: [test-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build -t ${{ secrets.REGISTRY }}/chat-backend:latest ./backend
      - name: Push to registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login -u "${{ secrets.REGISTRY_USERNAME }}" --password-stdin
          docker push ${{ secrets.REGISTRY }}/chat-backend:latest
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/chat-app
            docker-compose pull
            docker-compose up -d
            docker system prune -f

  build-android:
    needs: [test-flutter]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '11'
      - name: Build APK
        run: |
          cd frontend
          flutter build apk --release
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release.apk
          path: frontend/build/app/outputs/flutter-apk/app-release.apk

  build-ios:
    needs: [test-flutter]
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - name: Build iOS
        run: |
          cd frontend
          flutter build ios --release --no-codesign
```

---

## Maintenance & Scaling Considerations

### 1. Database Optimization
- Regular VACUUM and ANALYZE operations
- Monitor query performance with pg_stat_statements
- Implement partitioning for messages table as it grows
- Archive old data periodically

### 2. Horizontal Scaling
- Use Redis for session management across instances
- Implement sticky sessions for WebSocket connections
- Use message queues for background jobs
- Separate read replicas for analytics

### 3. Monitoring Metrics
- API response times
- WebSocket connection count
- Database query performance
- Cache hit/miss ratio
- Error rates
- Active user count
- Message throughput

### 4. Backup Strategy
- Automated daily database backups
- Backup media files to separate storage
- Test restore procedures regularly
- Keep backups for 30 days minimum

---

## Support & Troubleshooting

### Common Error Messages

**"WebSocket connection failed"**
- Check firewall rules
- Verify SSL certificates
- Ensure CORS is configured
- Check authentication token

**"Database connection timeout"**
- Check connection pool size
- Verify database credentials
- Check network connectivity
- Monitor active connections

**"File upload failed"**
- Check file size limits
- Verify MIME types allowed
- Check storage space
- Verify MinIO/S3 credentials

**"Push notifications not working"**
- Verify FCM/OneSignal configuration
- Check device token registration
- Verify app certificates (iOS)
- Check notification permissions

---

---

## 🤖 AI Features Integration

### Free Tier AI Features
```typescript
// Backend: AI service structure
@Injectable()
export class AIService {
  constructor(
    private readonly openaiClient: OpenAI,
    private readonly cacheManager: Cache,
  ) {}

  // Smart Replies (Free)
  async generateSmartReplies(conversationId: string): Promise<string[]> {
    const recentMessages = await this.getRecentMessages(conversationId, 5);
    const prompt = `Generate 3 short reply suggestions for: "${recentMessages[0].content}"`;
    
    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
    });
    
    return this.parseReplies(response.choices[0].message.content);
  }

  // Basic Translation (Free)
  async translateMessage(text: string, targetLang: string): Promise<string> {
    // Use free LibreTranslate API or Google Translate
    return await this.translationService.translate(text, targetLang);
  }

  // Spam Detection (Free)
  async detectSpam(message: string): Promise<boolean> {
    const score = await this.moderationService.checkSpam(message);
    return score > 0.8;
  }
}
```

### Premium AI Features
```typescript
@Injectable()
export class PremiumAIService {
  // AI Writing Assistant (Premium)
  async enhanceMessage(text: string, style: 'professional' | 'casual' | 'formal'): Promise<string> {
    const prompt = `Rewrite in ${style} tone: "${text}"`;
    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message.content;
  }

  // Meeting Transcription (Premium)
  async transcribeCall(audioUrl: string): Promise<Transcription> {
    const response = await this.openaiClient.audio.transcriptions.create({
      file: await this.downloadAudio(audioUrl),
      model: 'whisper-1',
      language: 'en',
    });
    return this.formatTranscription(response);
  }

  // Smart Search with Embeddings (Premium)
  async semanticSearch(query: string, workspaceId: string): Promise<Message[]> {
    const embedding = await this.generateEmbedding(query);
    return await this.vectorDb.similaritySearch(embedding, workspaceId);
  }

  // Conversation Summarization (Premium)
  async summarizeConversation(conversationId: string): Promise<Summary> {
    const messages = await this.getMessages(conversationId);
    const prompt = `Summarize key points and action items from: ${JSON.stringify(messages)}`;
    
    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    
    return this.parseSummary(response.choices[0].message.content);
  }

  // AI Image Generation (Premium)
  async generateImage(prompt: string): Promise<string> {
    const response = await this.openaiClient.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
    });
    return response.data[0].url;
  }
}
```

### Flutter AI Integration
```dart
// AI Features Provider
@riverpod
class AIFeaturesNotifier extends _$AIFeaturesNotifier {
  @override
  Future<AIFeatures> build() async {
    final isPremium = await ref.read(subscriptionProvider.future);
    return AIFeatures(isPremium: isPremium);
  }

  // Smart Replies
  Future<List<String>> getSmartReplies(String conversationId) async {
    final response = await ref.read(apiClientProvider).get(
      '/ai/smart-replies/$conversationId',
    );
    return (response.data['suggestions'] as List).cast<String>();
  }

  // Premium: Message Enhancement
  Future<String> enhanceMessage(String text, String style) async {
    await _checkPremiumAccess();
    
    final response = await ref.read(apiClientProvider).post(
      '/ai/enhance-message',
      data: {'text': text, 'style': style},
    );
    return response.data['enhanced'];
  }

  // Premium: Meeting Transcription
  Future<Transcription> transcribeCall(String callId) async {
    await _checkPremiumAccess();
    
    final response = await ref.read(apiClientProvider).post(
      '/ai/transcribe/$callId',
    );
    return Transcription.fromJson(response.data);
  }

  Future<void> _checkPremiumAccess() async {
    final isPremium = await ref.read(subscriptionProvider.future);
    if (!isPremium) {
      throw PremiumRequiredException('This feature requires premium subscription');
    }
  }
}
```

### AI Features Summary
| Feature | Tier | API |
|---------|------|-----|
| Smart Replies | Free | GPT-3.5 Turbo |
| Basic Translation | Free | LibreTranslate |
| Spam Detection | Free | Custom Model |
| Content Moderation | Free | Perspective API |
| **AI Writing Assistant** | **Premium** | **GPT-4** |
| **Meeting Transcription** | **Premium** | **Whisper** |
| **Smart Search (Semantic)** | **Premium** | **Embeddings + Vector DB** |
| **Conversation Summary** | **Premium** | **GPT-4** |
| **Image Generation** | **Premium** | **DALL-E 3** |
| **Voice Enhancement** | **Premium** | **Krisp/Custom** |
| **Advanced Analytics** | **Premium** | **Custom ML** |

---

## 💳 Subscription & Monetization System

### Database Schema for Subscriptions
```sql
-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    features JSONB NOT NULL,
    ai_credits INTEGER, -- Monthly AI feature credits
    storage_gb INTEGER,
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, past_due
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    ai_credits_remaining INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Feature usage tracking
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    credits_used INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, ai_credits, storage_gb, max_participants) VALUES
('free', 'Free', 'Perfect for personal use', 0, 0, 
 '{"smart_replies": true, "basic_translation": true, "spam_detection": true, "max_file_size_mb": 25}', 
 50, 5, 10),
('premium', 'Premium', 'Advanced AI features for professionals', 9.99, 99.99, 
 '{"all_free_features": true, "ai_assistant": true, "meeting_transcription": true, "smart_search": true, "conversation_summary": true, "priority_support": true, "max_file_size_mb": 100}', 
 500, 50, 50),
('business', 'Business', 'Complete solution for teams', 19.99, 199.99, 
 '{"all_premium_features": true, "advanced_analytics": true, "custom_branding": true, "sso": true, "dedicated_support": true, "max_file_size_mb": 500}', 
 2000, 200, 200);
```

### Backend Subscription Service
```typescript
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepo: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string,
  ): Promise<UserSubscription> {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    
    // Create Stripe subscription
    const stripeSubscription = await this.stripeService.createSubscription({
      customerId: await this.getOrCreateStripeCustomer(userId),
      priceId: plan.stripePriceId,
      paymentMethodId,
    });

    // Create local subscription record
    return this.subscriptionRepo.save({
      userId,
      planId,
      status: 'active',
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      aiCreditsRemaining: plan.aiCredits,
    });
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      return this.isFeatureFree(feature);
    }

    const plan = await this.planRepo.findOne({ where: { id: subscription.planId } });
    return plan.features[feature] === true;
  }

  async consumeAICredits(userId: string, credits: number): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      throw new ForbiddenException('No active subscription');
    }

    if (subscription.aiCreditsRemaining < credits) {
      throw new ForbiddenException('Insufficient AI credits');
    }

    await this.subscriptionRepo.update(subscription.id, {
      aiCreditsRemaining: subscription.aiCreditsRemaining - credits,
    });

    await this.featureUsageRepo.save({
      userId,
      featureName: 'ai_credits',
      creditsUsed: credits,
    });
  }
}

// Middleware to check feature access
@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const feature = this.reflector.get<string>('feature', context.getHandler());
    
    const hasAccess = await this.subscriptionService.checkFeatureAccess(
      request.user.id,
      feature,
    );

    if (!hasAccess) {
      throw new ForbiddenException('Premium subscription required');
    }

    return true;
  }
}

// Usage in controllers
@Post('enhance-message')
@RequireFeature('ai_assistant')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
async enhanceMessage(@Body() dto: EnhanceMessageDto, @CurrentUser() user: User) {
  await this.subscriptionService.consumeAICredits(user.id, 1);
  return this.aiService.enhanceMessage(dto.text, dto.style);
}
```

### Flutter Subscription UI
```dart
// Subscription Provider
@riverpod
class SubscriptionNotifier extends _$SubscriptionNotifier {
  @override
  Future<Subscription?> build() async {
    return _fetchSubscription();
  }

  Future<Subscription?> _fetchSubscription() async {
    try {
      final response = await ref.read(apiClientProvider).get('/subscriptions/current');
      return Subscription.fromJson(response.data);
    } catch (e) {
      return null;
    }
  }

  Future<void> subscribe(String planId, String paymentMethodId) async {
    state = const AsyncValue.loading();
    
    state = await AsyncValue.guard(() async {
      final response = await ref.read(apiClientProvider).post(
        '/subscriptions',
        data: {'planId': planId, 'paymentMethodId': paymentMethodId},
      );
      return Subscription.fromJson(response.data);
    });
  }

  bool hasFeatureAccess(String feature) {
    final subscription = state.value;
    if (subscription == null) return _isFreeFeature(feature);
    return subscription.plan.features.contains(feature);
  }
}

// Subscription Plans Screen
class SubscriptionPlansScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(subscriptionPlansProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Choose Your Plan')),
      body: plansAsync.when(
        data: (plans) => ListView(
          padding: const EdgeInsets.all(16),
          children: plans.map((plan) => PlanCard(plan: plan)).toList(),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorView(error: error),
      ),
    );
  }
}

class PlanCard extends ConsumerWidget {
  final SubscriptionPlan plan;

  const PlanCard({required this.plan, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentSubscription = ref.watch(subscriptionProvider).value;
    final isCurrentPlan = currentSubscription?.plan.id == plan.id;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  plan.displayName,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                if (plan.name == 'premium') ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text('POPULAR', style: TextStyle(fontSize: 10)),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(plan.description, style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 16),
            Text(
              '\${plan.priceMonthly}/month',
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            if (plan.priceYearly != null) ...[
              const SizedBox(height: 4),
              Text(
                'or \${plan.priceYearly}/year (Save 17%)',
                style: TextStyle(color: Colors.green[700], fontWeight: FontWeight.w500),
              ),
            ],
            const SizedBox(height: 20),
            ...plan.features.map((feature) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text(feature)),
                ],
              ),
            )),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isCurrentPlan
                    ? null
                    : () => _handleSubscribe(context, ref),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: plan.name == 'premium' ? Colors.amber : null,
                ),
                child: Text(
                  isCurrentPlan ? 'Current Plan' : 'Subscribe Now',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSubscribe(BuildContext context, WidgetRef ref) async {
    // Show payment method selection
    final paymentMethodId = await showPaymentMethodSheet(context);
    if (paymentMethodId == null) return;

    await ref.read(subscriptionProvider.notifier).subscribe(plan.id, paymentMethodId);
    
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Subscription activated successfully!')),
      );
      Navigator.pop(context);
    }
  }
}

// Feature gate widget
class PremiumFeatureGate extends ConsumerWidget {
  final String feature;
  final Widget child;
  final Widget? fallback;

  const PremiumFeatureGate({
    required this.feature,
    required this.child,
    this.fallback,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasAccess = ref.watch(
      subscriptionProvider.select((s) => s.value?.plan.features.contains(feature) ?? false),
    );

    if (hasAccess) return child;

    return fallback ?? PremiumPrompt(feature: feature);
  }
}

// Usage example
class ChatScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Regular chat messages
          Expanded(child: MessagesList()),
          
          // AI features with premium gate
          PremiumFeatureGate(
            feature: 'ai_assistant',
            child: AIWritingAssistant(),
            fallback: UpgradePromptBanner(),
          ),
          
          MessageInput(),
        ],
      ),
    );
  }
}
```

---

## 📋 Complete Best Practices & Coding Rules

### Universal Coding Standards (Apply to ALL Code)

#### 1. **Naming Conventions**
```typescript
// ✅ CORRECT
class UserService {}                    // PascalCase for classes
interface IUserRepository {}           // PascalCase with I prefix for interfaces
const MAX_RETRY_ATTEMPTS = 3;          // UPPER_SNAKE_CASE for constants
let userName: string;                  // camelCase for variables
function getUserById(id: string) {}    // camelCase for functions

// ❌ INCORRECT
class user_service {}
const maxRetryAttempts = 3;
let UserName: string;
```

```dart
// ✅ CORRECT
class UserRepository {}                // PascalCase for classes
const kMaxRetryAttempts = 3;          // k prefix for constants
String userName;                       // camelCase for variables
void getUserById(String id) {}        // camelCase for functions
final _privateField = '';             // Underscore prefix for private

// ❌ INCORRECT
class user_repository {}
const MAX_RETRY_ATTEMPTS = 3;
String UserName;
```

#### 2. **File Structure Rules**
```
✅ One class/component per file
✅ File name matches class name (snake_case for Flutter, kebab-case for NestJS)
✅ Maximum 300 lines per file (split if larger)
✅ Group related files in feature folders
✅ Keep folder depth ≤ 4 levels
```

#### 3. **Function/Method Rules**
```typescript
// ✅ CORRECT: Single responsibility, clear purpose
async function getUserProfile(userId: string): Promise<UserProfile> {
  if (!userId) throw new ValidationException('User ID required');
  
  const user = await this.userRepository.findById(userId);
  if (!user) throw new NotFoundException('User not found');
  
  return this.mapToProfile(user);
}

// ❌ INCORRECT: Doing too much
async function getUser(id: string) {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  const posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [id]);
  const friends = await db.query('SELECT * FROM friends WHERE user_id = ?', [id]);
  // ... too many responsibilities
}
```

**Rules:**
- Maximum 50 lines per function
- Maximum 4 parameters (use objects for more)
- One level of abstraction per function
- Always specify return types
- Pure functions when possible (no side effects)

#### 4. **Error Handling (MANDATORY)**
```typescript
// ✅ CORRECT: Proper error handling at every level
@Post()
async createUser(@Body() dto: CreateUserDto): Promise<ApiResponse<User>> {
  try {
    // Validate input
    await this.validateUserDto(dto);
    
    // Business logic
    const user = await this.userService.createUser(dto);
    
    // Log success
    this.logger.log(`User created: ${user.id}`);
    
    return { success: true, data: user };
  } catch (error) {
    // Log error with context
    this.logger.error(`Failed to create user: ${error.message}`, error.stack);
    
    // Throw appropriate exception
    if (error instanceof ValidationError) {
      throw new BadRequestException(error.message);
    }
    if (error instanceof DuplicateError) {
      throw new ConflictException('User already exists');
    }
    throw new InternalServerErrorException('Failed to create user');
  }
}

// ❌ INCORRECT: No error handling
@Post()
async createUser(@Body() dto: CreateUserDto) {
  const user = await this.userService.createUser(dto);
  return user;
}
```

```dart
// ✅ CORRECT: Flutter error handling
Future<User> createUser(CreateUserDto dto) async {
  try {
    final response = await _apiClient.post('/users', data: dto.toJson());
    return User.fromJson(response.data);
  } on DioException catch (e) {
    if (e.response?.statusCode == 400) {
      throw ValidationException(e.response?.data['message']);
    }
    if (e.response?.statusCode == 409) {
      throw DuplicateException('User already exists');
    }
    throw NetworkException('Failed to create user');
  } catch (e) {
    throw UnexpectedException('Unexpected error: $e');
  }
}
```

**Error Handling Rules:**
- NEVER use empty catch blocks
- Always log errors with context
- Use specific exception types
- Provide user-friendly error messages
- Include stack traces in logs (not in responses)

#### 5. **Comments & Documentation**
```typescript
// ✅ CORRECT: Document complex logic, not obvious code
/**
 * Calculates user engagement score based on activity patterns
 * 
 * Algorithm:
 * - Weight recent activity higher (exponential decay)
 * - Consider message frequency, call participation, reactions
 * - Normalize to 0-100 scale
 * 
 * @param userId - User UUID
 * @param days - Number of days to analyze (default: 30)
 * @returns Engagement score (0-100)
 * @throws NotFoundException if user doesn't exist
 */
async calculateEngagementScore(userId: string, days: number = 30): Promise<number> {
  // Complex algorithm here...
}

// ❌ INCORRECT: Obvious comments
// Get user by ID
const user = await this.userRepository.findById(id);

// Add 1 to counter
counter += 1;
```

**Documentation Rules:**
- Document WHY, not WHAT
- JSDoc/DartDoc for public APIs
- Explain complex algorithms
- Note performance implications
- Document assumptions and constraints

#### 6. **Code Organization**
```typescript
// ✅ CORRECT: Logical grouping
export class UserService {
  // 1. Constructor & Dependencies
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  // 2. Public Methods (alphabetical)
  async createUser(dto: CreateUserDto): Promise<User> {}
  async deleteUser(id: string): Promise<void> {}
  async getUserById(id: string): Promise<User> {}
  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {}

  // 3. Private Methods (alphabetical)
  private async hashPassword(password: string): Promise<string> {}
  private async sendWelcomeEmail(user: User): Promise<void> {}
  private validateUserDto(dto: CreateUserDto): void {}
}
```

#### 7. **Constants & Magic Numbers**
```typescript
// ❌ INCORRECT: Magic numbers
if (users.length > 100) {
  showPagination();
}
setTimeout(callback, 5000);

// ✅ CORRECT: Named constants
const MAX_USERS_PER_PAGE = 100;
const AUTO_SAVE_DELAY_MS = 5000;

if (users.length > MAX_USERS_PER_PAGE) {
  showPagination();
}
setTimeout(callback, AUTO_SAVE_DELAY_MS);
```

#### 8. **Null Safety**
```typescript
// ✅ CORRECT: Always check for null/undefined
async function getUserEmail(userId: string): Promise<string | null> {
  const user = await this.userRepository.findById(userId);
  if (!user) return null;
  
  return user.email ?? user.backupEmail ?? null;
}

// ❌ INCORRECT: Assuming values exist
async function getUserEmail(userId: string): Promise<string> {
  const user = await this.userRepository.findById(userId);
  return user.email; // Could crash!
}
```

```dart
// ✅ CORRECT: Null-safe operations
String? getUserEmail(User? user) {
  return user?.email ?? user?.backupEmail;
}

// Use null-aware operators
final name = user?.name ?? 'Guest';
final email = user?.email ?? throw Exception('Email required');
```

#### 9. **Async/Await Best Practices**
```typescript
// ✅ CORRECT: Parallel execution when possible
async function getUserData(userId: string) {
  const [user, posts, friends] = await Promise.all([
    this.userRepository.findById(userId),
    this.postRepository.findByUserId(userId),
    this.friendRepository.findByUserId(userId),
  ]);
  
  return { user, posts, friends };
}

// ❌ INCORRECT: Sequential execution (slower)
async function getUserData(userId: string) {
  const user = await this.userRepository.findById(userId);
  const posts = await this.postRepository.findByUserId(userId);
  const friends = await this.friendRepository.findByUserId(userId);
  
  return { user, posts, friends };
}
```

#### 10. **Testing Requirements**
```typescript
// Every service must have tests
describe('UserService', () => {
  // ✅ Test happy path
  it('should create user successfully', async () => {
    const dto = { email: 'test@test.com', password: 'password123' };
    const result = await service.createUser(dto);
    expect(result).toBeDefined();
    expect(result.email).toBe(dto.email);
  });

  // ✅ Test error cases
  it('should throw error for duplicate email', async () => {
    const dto = { email: 'existing@test.com', password: 'password123' };
    await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
  });

  // ✅ Test edge cases
  it('should handle empty email', async () => {
    const dto = { email: '', password: 'password123' };
    await expect(service.createUser(dto)).rejects.toThrow(ValidationException);
  });
});
```

**Testing Rules:**
- Minimum 80% code coverage
- Test happy path + error cases + edge cases
- Mock external dependencies
- Keep tests independent
- Use descriptive test names

#### 11. **Performance Rules**
```typescript
// ✅ CORRECT: Efficient database queries
async function getActiveUsers(): Promise<User[]> {
  return this.userRepository
    .createQueryBuilder('user')
    .select(['user.id', 'user.username', 'user.avatarUrl']) // Select only needed fields
    .where('user.isActive = :isActive', { isActive: true })
    .andWhere('user.lastSeen > :threshold', { 
      threshold: new Date(Date.now() - 24 * 60 * 60 * 1000) 
    })
    .limit(100)
    .getMany();
}

// ❌ INCORRECT: N+1 query problem
async function getUsersWithPosts(): Promise<User[]> {
  const users = await this.userRepository.find();
  
  for (const user of users) {
    user.posts = await this.postRepository.findByUserId(user.id); // N+1!
  }
  
  return users;
}
```

**Performance Rules:**
- Avoid N+1 queries
- Use pagination for large datasets
- Implement caching for frequently accessed data
- Lazy load heavy resources
-