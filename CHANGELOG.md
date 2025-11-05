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

### Fixed
- **Critical: Presence subscription timing** - ConversationList now waits for socket connection before subscribing, prevents "Cannot subscribe - socket not connected" error
- **Critical: Presence UI not re-rendering** - ConversationList now properly subscribes to presenceMap changes using Zustand selector, triggering React re-renders when presence updates
- **Critical: Missing presence subscription** - Client now actively subscribes to presence updates for conversation participants
- **Stories error toast crash** - Fixed React error "Objects are not valid as a React child" by properly extracting error message string
- **Stories API error handling** - Added retry logic and silent failure for background story queries (backend returns 500/404)
- Self-user presence not updating (now sends presence on connect and activity)
- Presence status not showing real-time updates (added subscription mechanism + proper store observation)
- Avatar badge design improved with better visibility and styling
- Socket event handlers comprehensively reviewed and validated

### Changed
- ConversationList uses `presenceMap` selector instead of `getPresence()` function for reactive updates
- UserStatusBadge no longer shows badge for offline users (cleaner UI)
- Badge colors updated for better contrast (yellow-400 for away)
- Presence update events now use correct format (`presence:update` instead of `presence_update`)
- Activity tracking added for mouse, keyboard, scroll, and touch events
- Enhanced logging in presence event handlers and ConversationList for debugging

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
