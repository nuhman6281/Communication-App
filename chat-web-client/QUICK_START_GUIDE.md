# Quick Start Guide - Web Client API Integration

**For Developers**: How to use the integrated API in your components

---

## 🚀 Quick Import Reference

```typescript
// Hooks
import {
  useLogin,
  useRegister,
  useLogout,
  useConversations,
  useMessages,
  useSendMessage,
  useGroups,
  useChannels,
  useUploadFile,
  // ... more hooks
} from '@/hooks';

// Stores
import {
  useAuthStore,
  useUIStore,
  useConversationStore,
  usePresenceStore,
} from '@/lib/stores';

// WebSocket
import { socketService } from '@/lib/websocket';

// API Services (direct usage - not recommended, use hooks instead)
import { messagesApi, conversationsApi } from '@/lib/api/endpoints';
```

---

## 📖 Common Patterns

### 1. Authentication

```typescript
function LoginForm() {
  const login = useLogin();

  const handleSubmit = (credentials) => {
    login.mutate(credentials, {
      onSuccess: () => {
        // Auto-redirected by App.tsx
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button disabled={login.isPending}>
        {login.isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### 2. List Data with Loading States

```typescript
function ConversationList() {
  const { data, isLoading, error } = useConversations();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data.items.map((conv) => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}
    </div>
  );
}
```

### 3. Infinite Scroll

```typescript
function MessageList({ conversationId }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  return (
    <div>
      {data?.pages.map((page) =>
        page.items.map((message) => (
          <Message key={message.id} message={message} />
        ))
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### 4. Mutations with Optimistic Updates

```typescript
function ChatInput({ conversationId }) {
  const [content, setContent] = useState('');
  const sendMessage = useSendMessage(conversationId);

  const handleSend = () => {
    sendMessage.mutate(
      {
        conversationId,
        content,
        type: 'text',
      },
      {
        onSuccess: () => {
          setContent(''); // Clear input
        },
      }
    );
    // Message appears instantly in UI (optimistic)!
  };

  return (
    <div>
      <input value={content} onChange={(e) => setContent(e.target.value)} />
      <button onClick={handleSend} disabled={sendMessage.isPending}>
        Send
      </button>
    </div>
  );
}
```

### 5. File Upload with Progress

```typescript
function FileUploader() {
  const { mutate: upload, uploadProgress, isPending } = useUploadFile();

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      {isPending && (
        <div>
          <progress value={uploadProgress} max={100} />
          {uploadProgress}%
        </div>
      )}
    </div>
  );
}
```

### 6. Using Zustand Stores

```typescript
function UserProfile() {
  // Get entire auth store
  const { user, logout } = useAuthStore();

  // Or use selector hooks (optimized re-renders)
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  return (
    <div>
      <p>Welcome {user?.username}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 7. UI State Management

```typescript
function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}

function ModalExample() {
  const { modals, openModal, closeModal } = useUIStore();

  return (
    <>
      <button onClick={() => openModal('createGroup')}>
        Create Group
      </button>

      {modals.createGroup && (
        <Modal onClose={() => closeModal('createGroup')}>
          {/* ... */}
        </Modal>
      )}
    </>
  );
}
```

### 8. Conversation Store (Drafts)

```typescript
function ChatInput({ conversationId }) {
  const { getDraft, setDraft, clearDraft } = useConversationStore();
  const [content, setContent] = useState(getDraft(conversationId));

  // Save draft on every change
  useEffect(() => {
    setDraft(conversationId, content);
  }, [content]);

  const handleSend = () => {
    // Send message...
    clearDraft(conversationId);
    setContent('');
  };

  return <textarea value={content} onChange={(e) => setContent(e.target.value)} />;
}
```

### 9. Presence & Typing Indicators

```typescript
function UserAvatar({ userId }) {
  const presence = useUserPresence(userId);

  return (
    <div className="relative">
      <Avatar src={presence?.avatarUrl} />
      <StatusDot online={presence?.isOnline} />
    </div>
  );
}

function TypingIndicator({ conversationId }) {
  const typingUsers = useTypingUsers(conversationId);

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.username).join(', ');

  return <div>{names} {typingUsers.length === 1 ? 'is' : 'are'} typing...</div>;
}
```

### 10. WebSocket Events

```typescript
function ChatInput({ conversationId }) {
  const [isTyping, setIsTyping] = useState(false);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(conversationId, true);

      // Stop typing after 3 seconds of inactivity
      setTimeout(() => {
        setIsTyping(false);
        socketService.sendTyping(conversationId, false);
      }, 3000);
    }
  };

  return <input onChange={handleTyping} />;
}
```

### 11. Real-time Updates (Automatic)

No code needed! Just use the hooks:

```typescript
function MessageList({ conversationId }) {
  const { data } = useMessages(conversationId);

  // When WebSocket receives 'message:new' event,
  // the query is automatically invalidated and refetched.
  // Your UI updates automatically! ✨

  return <div>{/* render messages */}</div>;
}
```

### 12. Error Handling

```typescript
function MyComponent() {
  const { data, error, isError } = useConversations();

  if (isError) {
    return (
      <div className="error">
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  // Or errors are automatically shown as toasts!
  // No need for manual error handling in most cases.
}
```

---

## 🎯 Component Refactoring Checklist

When refactoring a component to use real API:

### Before:
```typescript
function ConversationList() {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);

  return (
    <div>
      {conversations.map((conv) => (
        <div key={conv.id}>{conv.name}</div>
      ))}
    </div>
  );
}
```

### After:
```typescript
import { useConversations } from '@/hooks';

function ConversationList() {
  const { data, isLoading } = useConversations();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {data.items.map((conv) => (
        <div key={conv.id}>{conv.name}</div>
      ))}
    </div>
  );
}
```

**Steps**:
1. ✅ Remove mock data
2. ✅ Import appropriate hook
3. ✅ Use hook to fetch data
4. ✅ Add loading/error states
5. ✅ Update data access (e.g., `conversations` → `data.items`)
6. ✅ Test real API integration

---

## 🔍 Debugging Tips

### 1. Check Query Cache
Open React Query DevTools (bottom-right) to see:
- All active queries
- Cached data
- Loading/error states
- Refetch manually

### 2. Check WebSocket Connection
```javascript
// In browser console
import { socketService } from '@/lib/websocket';
console.log(socketService.isConnected()); // true/false
```

### 3. Check Auth State
```javascript
// In browser console
localStorage.getItem('accessToken'); // Should show token
localStorage.getItem('auth-storage'); // Should show user data
```

### 4. Monitor Network Requests
- Open DevTools → Network tab
- Filter by "Fetch/XHR"
- Check API calls to `http://localhost:3000`

### 5. Check Query Keys
```typescript
import { queryKeys } from '@/lib/query-client';

console.log(queryKeys.messages.all('conv-123'));
// Output: ['messages', 'conv-123', undefined]
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Call API Services Directly
```typescript
// BAD
import { messagesApi } from '@/lib/api/endpoints';
const messages = await messagesApi.getByConversation('123');
```

### ✅ Use Hooks Instead
```typescript
// GOOD
import { useMessages } from '@/hooks';
const { data: messages } = useMessages('123');
```

### ❌ Don't Manually Refetch
```typescript
// BAD
const fetchMessages = async () => {
  const data = await messagesApi.getByConversation('123');
  setMessages(data);
};
```

### ✅ Let TanStack Query Handle It
```typescript
// GOOD
const { data, refetch } = useMessages('123');
// Auto-refetches on window focus, reconnect, etc.
```

### ❌ Don't Forget to Invalidate
```typescript
// BAD
await messagesApi.send(message);
// UI doesn't update!
```

### ✅ Use Mutation Hooks
```typescript
// GOOD
const sendMessage = useSendMessage(conversationId);
sendMessage.mutate(message);
// Auto-invalidates and refetches!
```

---

## 📚 Full Hook Reference

### Auth Hooks (`useAuth.ts`)
- `useLogin()` - Login user
- `useRegister()` - Register user
- `useLogout()` - Logout user
- `useCurrentUser()` - Get current user
- `useVerifyEmail()` - Verify email
- `useRequestPasswordReset()` - Request reset
- `useResetPassword()` - Reset password
- `useUpdateProfile()` - Update profile

### Conversation Hooks (`useConversations.ts`)
- `useConversations(params?)` - List conversations
- `useInfiniteConversations()` - Infinite scroll
- `useConversation(id)` - Get single conversation
- `useCreateConversation()` - Create new
- `useUpdateConversation()` - Update
- `useDeleteConversation()` - Delete
- `useLeaveConversation()` - Leave
- `useMarkConversationAsRead()` - Mark read
- `useAddParticipants()` - Add members
- `useRemoveParticipant()` - Remove member

### Message Hooks (`useMessages.ts`)
- `useMessages(conversationId, params?)` - Infinite scroll messages
- `useMessage(id)` - Get single message
- `useSendMessage(conversationId)` - Send (optimistic)
- `useUpdateMessage(conversationId)` - Edit message
- `useDeleteMessage(conversationId)` - Delete message
- `useAddReaction(conversationId)` - Add reaction
- `useRemoveReaction(conversationId)` - Remove reaction
- `usePinMessage(conversationId)` - Pin message
- `useUnpinMessage(conversationId)` - Unpin message
- `useForwardMessage()` - Forward message
- `useMessageThread(messageId)` - Get replies

### Group Hooks (`useGroups.ts`)
- `useGroups(params?)` - List groups
- `useGroup(id)` - Get single group
- `useGroupMembers(id, params?)` - List members
- `useCreateGroup()` - Create group
- `useUpdateGroup()` - Update group
- `useDeleteGroup()` - Delete group
- `useAddGroupMembers()` - Add members
- `useRemoveGroupMember()` - Remove member
- `useUpdateGroupMemberRole()` - Update role

### Channel Hooks (`useChannels.ts`)
- `useChannels(params?)` - List channels
- `useChannel(id)` - Get single channel
- `useCreateChannel()` - Create channel
- `useSubscribeChannel()` - Subscribe
- `useUnsubscribeChannel()` - Unsubscribe

### Media Hooks (`useMedia.ts`)
- `useMedia(params?)` - List files
- `useUploadFile()` - Upload with progress
- `useMediaStats()` - Storage statistics

### Call Hooks (`useCalls.ts`)
- `useCallHistory(params?)` - Call history
- `useActiveCalls()` - Active calls (auto-refetch)
- `useInitiateCall()` - Start call
- `useJoinCall()` - Join call
- `useEndCall()` - End call

---

## 🎨 UI Patterns

### Loading States
```typescript
if (isLoading) return <Skeleton />;
if (isFetching) return <LoadingSpinner />;
```

### Error States
```typescript
if (error) return <ErrorMessage message={error.message} />;
```

### Empty States
```typescript
if (data?.items.length === 0) return <EmptyState />;
```

### Pagination
```typescript
{data && (
  <Pagination
    currentPage={data.currentPage}
    totalPages={data.totalPages}
    onPageChange={(page) => setPage(page)}
  />
)}
```

---

## ⚡ Performance Tips

1. **Use Selector Hooks** (avoid unnecessary re-renders):
```typescript
// ❌ Entire store re-renders
const store = useAuthStore();

// ✅ Only re-renders when user changes
const user = useUser();
```

2. **Memo Expensive Components**:
```typescript
const Message = memo(({ message }) => {
  // Expensive rendering logic
});
```

3. **Use React Query's `select`** (transform data):
```typescript
const usernames = useConversations({
  select: (data) => data.items.map((c) => c.name),
});
```

4. **Prefetch Data**:
```typescript
const queryClient = useQueryClient();

// Prefetch on hover
const handleHover = () => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.conversation.detail('123'),
    queryFn: () => conversationsApi.getById('123'),
  });
};
```

---

## 🎉 You're Ready!

Use this guide as a reference when integrating components with the API. The patterns are consistent across all hooks, so once you understand one, you understand them all!

**Happy coding! 🚀**
