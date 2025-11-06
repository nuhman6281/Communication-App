# Story Reply & Messaging Improvements

## Completed ✅

### 1. Story Expiration Constant
**File**: `chat-backend/src/common/constants/index.ts`
- Added `STORY_EXPIRATION_HOURS = 24`
- Added `MAX_STORY_FILE_SIZE_MB = 100`
- Added `MAX_STORY_DURATION_SECONDS = 60`

**Updated**: `chat-backend/src/modules/stories/stories.service.ts`
- Now uses `STORY_EXPIRATION_HOURS` instead of hardcoded `24`

---

### 2. Story Reply Messages with Image Preview
**File**: `chat-web-client/src/components/StoryReplyMessage.tsx`
- Created component with story thumbnail preview
- Supports image stories (displays image)
- Supports video stories (displays thumbnail with play icon overlay)
- Supports text stories (displays gradient background with text preview)
- Shows "Replied to your story" label for context

**File**: `chat-web-client/src/components/MessageBubble.tsx`
- Updated to detect story reply messages via `metadata.storyReply`
- Automatically renders `StoryReplyMessage` component for story replies
- Added story reply metadata fields to Message interface

---

### 3. Sound Notifications
**File**: `chat-web-client/src/lib/audio/sound.service.ts`
- Created sound service singleton for managing audio notifications
- Supports message notification sound and call ringtone
- Call ringtone loops until answered or ended
- Graceful degradation when sound files are missing
- Volume controls for message and call sounds
- Mute/unmute functionality with persistent state

**File**: `chat-web-client/src/lib/websocket/events.ts`
- Integrated sound service with WebSocket events
- Plays message sound on `message:new` event
- Plays call ringtone on `call:incoming` event
- Stops ringtone on `call:started` and `call:ended` events

**File**: `chat-web-client/src/components/SoundToggle.tsx`
- Created toggle button component for muting/unmuting sounds
- Supports icon-only and button-with-text variants
- Integrated with tooltip for better UX

**File**: `chat-web-client/src/components/Sidebar.tsx`
- Added SoundToggle button to sidebar for easy access
- Positioned between notifications and main navigation

**File**: `chat-web-client/public/sounds/README.md`
- Created documentation for required sound files
- Instructions for downloading free sound files
- File format and size requirements

**Note**: Sound files (message.mp3, call-incoming.mp3) need to be added to `/public/sounds/` directory. See README.md in that directory for download links and requirements.

---

### 4. Real-time Notifications & Sidebar Badge Updates
**File**: `chat-web-client/src/lib/stores/unread.store.ts`
- Created Zustand store for tracking unread message counts
- Supports per-conversation and total unread counts
- Persists to localStorage with Map serialization
- Provides `useConversationUnread()` and `useTotalUnread()` hooks

**File**: `chat-web-client/src/lib/stores/index.ts`
- Exported unread store hooks for easy access

**File**: `chat-web-client/src/lib/websocket/events.ts`
- Updated `message:new` handler to increment unread count
- Checks if user is viewing conversation before incrementing
- Only plays sound and shows toast if not viewing conversation

**File**: `chat-web-client/src/components/Sidebar.tsx`
- Updated to use `useTotalUnread()` for real-time badge on chat icon
- Badge updates instantly when messages arrive

**File**: `chat-web-client/src/components/ConversationList.tsx`
- Created `ConversationUnreadBadge` sub-component with per-conversation unread tracking
- Replaces static API-based unread counts with real-time store
- Updates instantly when messages arrive

**File**: `chat-web-client/src/components/ChatWindow.tsx`
- Resets unread count when conversation is opened
- Prevents double-counting messages viewed in real-time

---

## Pending Features 🚧

### 5. Edit/View Options for Own Stories

**What**: Add menu options when viewing your own stories to edit caption, change privacy, or delete.

**Implementation Plan**:

#### Update StoriesView Component
**File**: `chat-web-client/src/components/StoriesView.tsx`

Replace the MoreVertical button section (around line 207-216) with a DropdownMenu:

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Edit, Lock, Trash2, MoreVertical } from 'lucide-react';

// In the story header section:
{isMyStory && (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/20"
      >
        <MoreVertical className="w-5 h-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => handleViewStats(currentStory.id)}>
        <Eye className="w-4 h-4 mr-2" />
        View Statistics
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleEditPrivacy(currentStory.id)}>
        <Lock className="w-4 h-4 mr-2" />
        Change Privacy
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => handleDeleteStory(currentStory.id)}
        className="text-red-600 focus:text-red-600"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Story
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

Add handler functions:

```typescript
const handleViewStats = (storyId: string) => {
  // Show stats modal with views, reactions, etc.
  console.log('View stats for:', storyId);
};

const handleEditPrivacy = (storyId: string) => {
  // Show privacy dialog
  console.log('Edit privacy for:', storyId);
};
```

---

### 4. Real-time Notifications & Sidebar Badge

**What**: Show notification badge in sidebar when new messages arrive, even when not in chat.

**Implementation Plan**:

#### A. Create Unread Count Store
**File**: `chat-web-client/src/lib/stores/unread.store.ts` (NEW)

```typescript
import { create } from 'zustand';

interface UnreadState {
  unreadCounts: Map<string, number>; // conversationId -> count
  totalUnread: number;

  incrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
}

export const useUnreadStore = create<UnreadState>((set, get) => ({
  unreadCounts: new Map(),
  totalUnread: 0,

  incrementUnread: (conversationId) => {
    set((state) => {
      const newCounts = new Map(state.unreadCounts);
      const current = newCounts.get(conversationId) || 0;
      newCounts.set(conversationId, current + 1);

      return {
        unreadCounts: newCounts,
        totalUnread: Array.from(newCounts.values()).reduce((sum, count) => sum + count, 0),
      };
    });
  },

  resetUnread: (conversationId) => {
    set((state) => {
      const newCounts = new Map(state.unreadCounts);
      newCounts.delete(conversationId);

      return {
        unreadCounts: newCounts,
        totalUnread: Array.from(newCounts.values()).reduce((sum, count) => sum + count, 0),
      };
    });
  },

  setUnreadCount: (conversationId, count) => {
    set((state) => {
      const newCounts = new Map(state.unreadCounts);
      newCounts.set(conversationId, count);

      return {
        unreadCounts: newCounts,
        totalUnread: Array.from(newCounts.values()).reduce((sum, count) => sum + count, 0),
      };
    });
  },
}));
```

#### B. Update WebSocket Event Handler
**File**: `chat-web-client/src/lib/websocket/events.ts`

Update the `message:new` handler:

```typescript
import { useUnreadStore } from '@/lib/stores/unread.store';
import { useConversationStore } from '@/lib/stores/conversation.store'; // If you have this

socketService.on('message:new', (message: Message) => {
  console.log('[WebSocket] New message received:', message);

  // Invalidate messages query for the conversation
  invalidateQueries.message(message.conversationId);
  invalidateQueries.conversation(message.conversationId);

  // Check if user is currently viewing this conversation
  const currentConversationId = useConversationStore.getState().activeConversationId;

  // Only increment unread if not viewing this conversation
  if (currentConversationId !== message.conversationId) {
    useUnreadStore.getState().incrementUnread(message.conversationId);
  }
});
```

#### C. Update Sidebar/ConversationList
**File**: `chat-web-client/src/components/ConversationList.tsx` or `Sidebar.tsx`

Add badge to chat icon:

```typescript
import { useUnreadStore } from '@/lib/stores/unread.store';

export function Sidebar() {
  const totalUnread = useUnreadStore((state) => state.totalUnread);

  return (
    <div className="sidebar">
      {/* Chat icon with badge */}
      <div className="relative">
        <MessageSquare className="w-6 h-6" />
        {totalUnread > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalUnread > 99 ? '99+' : totalUnread}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### D. Reset Unread on Conversation Open
**File**: `chat-web-client/src/components/ChatWindow.tsx`

```typescript
import { useUnreadStore } from '@/lib/stores/unread.store';

useEffect(() => {
  if (conversationId) {
    // Reset unread count when opening conversation
    useUnreadStore.getState().resetUnread(conversationId);
  }
}, [conversationId]);
```

---

### 5. Sound Notifications

**What**: Play sounds when messages or calls arrive.

**Implementation Plan**:

#### A. Add Sound Files
**Location**: `chat-web-client/public/sounds/`

Create folder and add sound files:
- `message.mp3` - Message notification sound
- `call-incoming.mp3` - Incoming call sound

You can use free sounds from:
- https://pixabay.com/sound-effects/
- https://freesound.org/

#### B. Create Sound Service
**File**: `chat-web-client/src/lib/audio/sound.service.ts` (NEW)

```typescript
class SoundService {
  private messageSound: HTMLAudioElement;
  private callSound: HTMLAudioElement;
  private isMuted: boolean = false;

  constructor() {
    this.messageSound = new Audio('/sounds/message.mp3');
    this.callSound = new Audio('/sounds/call-incoming.mp3');

    // Preload sounds
    this.messageSound.load();
    this.callSound.load();
  }

  playMessageSound() {
    if (!this.isMuted) {
      this.messageSound.currentTime = 0;
      this.messageSound.play().catch(err => {
        console.warn('Failed to play message sound:', err);
      });
    }
  }

  playCallSound() {
    if (!this.isMuted) {
      this.callSound.loop = true; // Loop until answered
      this.callSound.play().catch(err => {
        console.warn('Failed to play call sound:', err);
      });
    }
  }

  stopCallSound() {
    this.callSound.pause();
    this.callSound.currentTime = 0;
    this.callSound.loop = false;
  }

  mute() {
    this.isMuted = true;
  }

  unmute() {
    this.isMuted = false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const soundService = new SoundService();
```

#### C. Update WebSocket Events
**File**: `chat-web-client/src/lib/websocket/events.ts`

```typescript
import { soundService } from '@/lib/audio/sound.service';

socketService.on('message:new', (message: Message) => {
  console.log('[WebSocket] New message received:', message);

  // Play sound for new message
  soundService.playMessageSound();

  // ... rest of handler
});

socketService.on('call:incoming', ({ call, initiator, callType }) => {
  console.log('[WebSocket] Incoming call from:', initiator?.username);

  // Play incoming call sound
  soundService.playCallSound();

  // ... rest of handler
});

socketService.on('call:ended', ({ callId }) => {
  console.log('[WebSocket] Call ended:', callId);

  // Stop call sound
  soundService.stopCallSound();

  // ... rest of handler
});
```

#### D. Add Mute/Unmute Button
**File**: `chat-web-client/src/components/Settings.tsx` or user menu

```typescript
import { Volume2, VolumeX } from 'lucide-react';
import { soundService } from '@/lib/audio/sound.service';
import { useState } from 'react';

export function SoundToggle() {
  const [isMuted, setIsMuted] = useState(false);

  const handleToggle = () => {
    const newMutedState = soundService.toggleMute();
    setIsMuted(newMutedState);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleToggle}>
      {isMuted ? (
        <VolumeX className="w-5 h-5" />
      ) : (
        <Volume2 className="w-5 h-5" />
      )}
    </Button>
  );
}
```

---

## Testing Checklist

### Story Reply Messages
- [ ] Reply to a story
- [ ] Check messages - should show story thumbnail
- [ ] Image stories show image preview
- [ ] Video stories show thumbnail with play icon
- [ ] Text stories show text preview
- [ ] "Replied to your story" label is visible

### Story Expiration
- [ ] Create a story
- [ ] Check database - `expiresAt` should be 24 hours from now
- [ ] Wait 24 hours (or manually modify) and verify story disappears

### Story Options
- [ ] View own story
- [ ] Click more menu - should show options
- [ ] View statistics shows view count
- [ ] Change privacy works
- [ ] Delete story works

### Notifications & Badges
- [ ] Open chat with User A
- [ ] User B sends message to User A
- [ ] Sidebar shows unread badge
- [ ] Open conversation - badge clears
- [ ] Switch to different conversation - badge shows again

### Sounds
- [ ] Receive message - sound plays
- [ ] Receive call - sound loops
- [ ] Answer call - sound stops
- [ ] Mute sounds - no sound plays
- [ ] Unmute - sounds work again

---

## Priority Order

1. ~~**Story Reply Messages with Preview**~~ ✅ COMPLETED
2. ~~**Sound Notifications**~~ ✅ COMPLETED
3. ~~**Sidebar Badge Updates**~~ ✅ COMPLETED
4. **Story Edit/View Options** (Last remaining feature)

---

## Notes

- All sound files should be small (<100KB) for fast loading
- Consider adding a setting to disable sounds
- Unread counts should persist across page refreshes (use localStorage)
- Story reply thumbnails should be lazy-loaded for performance
