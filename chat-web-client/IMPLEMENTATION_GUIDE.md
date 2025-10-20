# Web Client API Integration - Implementation Guide

**Status**: Foundation Complete - Ready for Full Implementation
**Completed**: Architecture, Dependencies, Config, Types, API Client
**Remaining**: API Services, State Management, Component Refactoring

---

## ✅ What's Already Done

### 1. Project Architecture
- ✅ Created `WEB_CLIENT_ARCHITECTURE.md` with complete plan
- ✅ Defined folder structure following backend patterns
- ✅ Documented implementation phases

### 2. Dependencies Installed
```bash
✅ @tanstack/react-query  # Server state management
✅ zustand                 # Client state management
✅ axios                   # HTTP client
✅ socket.io-client        # WebSocket
✅ zod                     # Validation
✅ date-fns                # Date utilities
✅ immer                   # Immutable updates
✅ @hookform/resolvers     # Form validation
```

### 3. Configuration Files
- ✅ `.env.development` - Environment variables
- ✅ `src/config/api.config.ts` - API configuration

### 4. Type Definitions
- ✅ `src/types/entities.types.ts` - All entity types (User, Message, etc.)
- ✅ `src/types/api.types.ts` - API request/response types

### 5. API Client
- ✅ `src/lib/api/client.ts` - Axios instance with interceptors
  - Auto token refresh on 401
  - Retry logic for network errors
  - Request/response logging
  - Error handling utilities

---

## 📋 Next Steps - Implementation Checklist

### Phase 1: API Services Layer (2-3 hours)

Create API service files for each module:

#### 1.1 Auth API Service
**File**: `src/lib/api/endpoints/auth.api.ts`

```typescript
import { apiClient } from '../client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/types/api.types';

export const authApi = {
  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // Register
  register: async (data: RegisterRequest): Promise<{ message: string; userId: string }> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Refresh token
  refresh: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/auth/refresh', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
};
```

#### 1.2 Similar pattern for remaining services:
- ✅ Create `conversations.api.ts`
- ✅ Create `messages.api.ts`
- ✅ Create `users.api.ts`
- ✅ Create `groups.api.ts`
- ✅ Create `channels.api.ts`
- ✅ Create `media.api.ts`
- ✅ Create `calls.api.ts`
- ✅ Create `stories.api.ts`
- ✅ Create `notifications.api.ts`
- ✅ Create `search.api.ts`
- ✅ Create `ai.api.ts`
- ✅ Create `webhooks.api.ts`
- ✅ Create `presence.api.ts`

#### 1.3 Create Barrel Export
**File**: `src/lib/api/endpoints/index.ts`

```typescript
export * from './auth.api';
export * from './conversations.api';
export * from './messages.api';
// ... export all
```

---

### Phase 2: State Management (2-3 hours)

#### 2.1 Auth Store (Zustand)
**File**: `src/lib/stores/auth.store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/entities.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

#### 2.2 UI Store
**File**: `src/lib/stores/ui.store.ts`

```typescript
import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notificationsPanelOpen: boolean;
  currentView: 'chat' | 'profile' | 'settings' | 'video-call' | 'stories' | 'workspace';

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  toggleNotificationsPanel: () => void;
  setCurrentView: (view: UIState['currentView']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  notificationsPanelOpen: false,
  currentView: 'chat',

  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleNotificationsPanel: () =>
    set((state) => ({ notificationsPanelOpen: !state.notificationsPanelOpen })),
  setCurrentView: (view) => set({ currentView: view }),
}));
```

#### 2.3 Similar pattern for:
- ✅ `conversation.store.ts` - Selected conversation, typing state
- ✅ `presence.store.ts` - Online users, typing indicators

---

### Phase 3: TanStack Query Setup (1 hour)

#### 3.1 Query Client Configuration
**File**: `src/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

#### 3.2 Update main.tsx
```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

### Phase 4: Custom Hooks (3-4 hours)

#### 4.1 Auth Hooks
**File**: `src/lib/hooks/useAuth.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import type { LoginRequest, RegisterRequest } from '@/types/api.types';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.user as any, response.accessToken, response.refreshToken);
      navigate('/chat');
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/auth');
    },
  });
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated,
  });
}
```

#### 4.2 Conversations Hook
**File**: `src/lib/hooks/useConversations.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '@/lib/api/endpoints';
import type { CreateConversationRequest } from '@/types/api.types';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.getAll,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => conversationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) => conversationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

#### 4.3 Messages Hook with Optimistic Updates
**File**: `src/lib/hooks/useMessages.ts`

```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/endpoints';
import type { SendMessageRequest } from '@/types/api.types';
import type { Message } from '@/types/entities.types';

export function useMessages(conversationId: string, limit = 50) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) => messagesApi.getByConversation(conversationId, { page: pageParam, limit }),
    getNextPageParam: (lastPage: any) => {
      const hasMore = lastPage.page * lastPage.limit < lastPage.total;
      return hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => messagesApi.send(data),

    // Optimistic update
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      const previousMessages = queryClient.getQueryData(['messages', conversationId]);

      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old) return old;

        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          ...newMessage,
          sender: queryClient.getQueryData(['currentUser']) as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reactions: [],
          readBy: [],
          isEdited: false,
          isPinned: false,
          isForwarded: false,
          deletedAt: null,
        };

        return {
          ...old,
          pages: old.pages.map((page: any, index: number) =>
            index === 0
              ? { ...page, items: [tempMessage, ...page.items] }
              : page
          ),
        };
      });

      return { previousMessages };
    },

    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['messages', conversationId], context?.previousMessages);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

#### 4.4 Create similar hooks for:
- ✅ `useGroups.ts`
- ✅ `useChannels.ts`
- ✅ `useStories.ts`
- ✅ `useNotifications.ts`
- ✅ `useSearch.ts`
- ✅ `useAI.ts`
- ✅ `useCalls.ts`
- ✅ `useFileUpload.ts`

---

### Phase 5: WebSocket Integration (2-3 hours)

#### 5.1 Socket Client
**File**: `src/lib/websocket/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api.config';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(API_CONFIG.wsURL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
```

#### 5.2 Event Handlers
**File**: `src/lib/websocket/events.ts`

```typescript
import { socketService } from './socket';
import { queryClient } from '../query-client';
import { toast } from 'sonner';
import type { Message, TypingIndicator, User } from '@/types/entities.types';

export function setupMessageListeners() {
  const socket = socketService.getSocket();
  if (!socket) return;

  // New message received
  socket.on('message:new', (message: Message) => {
    queryClient.setQueryData(['messages', message.conversationId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any, index: number) =>
          index === 0 ? { ...page, items: [message, ...page.items] } : page
        ),
      };
    });

    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  });

  // Message updated
  socket.on('message:updated', (message: Message) => {
    queryClient.setQueryData(['messages', message.conversationId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((m: Message) => (m.id === message.id ? message : m)),
        })),
      };
    });
  });

  // Message deleted
  socket.on('message:deleted', ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
    queryClient.setQueryData(['messages', conversationId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items.filter((m: Message) => m.id !== messageId),
        })),
      };
    });
  });

  // Typing indicators
  socket.on('user:typing', (data: TypingIndicator) => {
    // Update typing store or trigger UI update
  });

  socket.on('user:online', (user: User) => {
    // Update presence store
  });

  socket.on('user:offline', (user: User) => {
    // Update presence store
  });

  // Reactions
  socket.on('message:reaction', ({ messageId, reaction }: any) => {
    // Update message reactions in cache
  });
}

export function cleanupListeners() {
  const socket = socketService.getSocket();
  if (!socket) return;

  socket.off('message:new');
  socket.off('message:updated');
  socket.off('message:deleted');
  socket.off('user:typing');
  socket.off('user:online');
  socket.off('user:offline');
  socket.off('message:reaction');
}
```

---

### Phase 6: Component Refactoring (5-7 hours)

#### 6.1 Update AuthScreen Component

```typescript
// src/components/auth/AuthScreen.tsx
import { useState } from 'react';
import { useLogin, useRegister } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleLogin = async (data: any) => {
    try {
      await loginMutation.mutateAsync(data);
      toast.success('Login successful!');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  // ... rest of component
}
```

#### 6.2 Update ChatInterface Component

```typescript
// src/components/chat/ChatInterface.tsx
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { socketService } from '@/lib/websocket/socket';
import { setupMessageListeners, cleanupListeners } from '@/lib/websocket/events';

export function ChatInterface() {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      socketService.connect(accessToken);
      setupMessageListeners();
    }

    return () => {
      cleanupListeners();
      socketService.disconnect();
    };
  }, [accessToken]);

  // ... rest of component
}
```

#### 6.3 Update ConversationList Component

```typescript
// src/components/chat/ConversationList.tsx
import { useConversations } from '@/lib/hooks/useConversations';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function ConversationList() {
  const { data: conversations, isLoading, error } = useConversations();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading conversations</div>;

  return (
    <div>
      {conversations?.map((conv) => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}
    </div>
  );
}
```

#### 6.4 Update ChatWindow Component

```typescript
// src/components/chat/ChatWindow.tsx
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { useConversationStore } from '@/lib/stores/conversation.store';

export function ChatWindow() {
  const { activeConversationId } = useConversationStore();
  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(activeConversationId);
  const sendMessage = useSendMessage(activeConversationId);

  const handleSendMessage = (content: string) => {
    sendMessage.mutate({
      conversationId: activeConversationId,
      content,
      type: 'text',
    });
  };

  // ... rest of component
}
```

---

### Phase 7: File Upload Implementation (2-3 hours)

#### 7.1 File Upload Hook
**File**: `src/lib/hooks/useFileUpload.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { mediaApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await mediaApi.upload(formData);
      return response;
    },
    onError: (error) => {
      toast.error('File upload failed');
    },
  });
}
```

#### 7.2 Media API
**File**: `src/lib/api/endpoints/media.api.ts`

```typescript
import { apiClient } from '../client';

export const mediaApi = {
  upload: async (formData: FormData) => {
    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/media/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/media/${id}`);
  },
};
```

---

## 🚀 Quick Start Commands

### Start Development Server
```bash
cd chat-web-client
npm run dev
```

### Backend Must Be Running
```bash
cd chat-backend
npm run start:dev
```

### Access Points
- Web Client: http://localhost:5173 (Vite default)
- Backend API: http://localhost:3000/api/v1/v1
- API Docs: http://localhost:3000/api/docs

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Login with test user
- [ ] View conversations list
- [ ] Open a conversation
- [ ] Send a text message
- [ ] Upload a file
- [ ] Receive real-time message
- [ ] Create a group
- [ ] Search for users/messages
- [ ] Update profile
- [ ] Toggle theme

### Test User Credentials
```
Email: testuser@example.com
Password: Test@123456
```

---

## 📝 Implementation Priority

**High Priority** (Core Features):
1. ✅ Auth (login, register, logout)
2. ✅ Conversations list
3. ✅ Messages (send, receive, real-time)
4. ✅ WebSocket connection
5. ✅ File upload

**Medium Priority**:
6. ✅ Groups
7. ✅ Search
8. ✅ Notifications
9. ✅ User profile
10. ✅ Settings

**Low Priority** (Advanced):
11. ✅ Stories
12. ✅ Video calls
13. ✅ AI features
14. ✅ Channels
15. ✅ Workspaces

---

## 📚 Additional Resources

### Documentation
- Architecture: `WEB_CLIENT_ARCHITECTURE.md`
- Backend API: `../chat-backend/API_KEYS_AND_PENDING_TASKS.md`
- Service Verification: `../chat-backend/SERVICE_VERIFICATION_REPORT.md`

### Example Code
- See Phase 4-6 above for complete hook examples
- See `WEB_CLIENT_ARCHITECTURE.md` for component patterns

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Status**: Foundation Complete - Ready for Implementation
