/**
 * API Response Type Definitions
 * These types match the backend API response format
 */

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: {
    message: string | string[];
    error: string;
    statusCode: number;
  };
}

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    bio: string | null;
    status: string | null;
    isVerified: boolean;
    isOnline: boolean;
    lastSeen: string;
    presenceStatus: string;
    mfaEnabled: boolean;
    subscriptionTier: string;
    subscriptionExpiresAt: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// ============================================================================
// Message Types
// ============================================================================

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type: string;
  metadata?: Record<string, unknown>;
  parentMessageId?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface AddReactionRequest {
  emoji: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface CreateConversationRequest {
  participantIds: string[];
  name?: string;
  avatarUrl?: string;
}

export interface UpdateConversationRequest {
  name?: string;
  avatarUrl?: string;
  isPinned?: boolean;
  isMuted?: boolean;
}

// ============================================================================
// Group Types
// ============================================================================

export interface CreateGroupRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  maxMembers?: number;
  settings?: {
    whoCanSendMessages?: 'all' | 'admins';
    whoCanAddMembers?: 'all' | 'admins';
    whoCanEditGroup?: 'all' | 'admins';
  };
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
  settings?: {
    whoCanSendMessages?: 'all' | 'admins';
    whoCanAddMembers?: 'all' | 'admins';
    whoCanEditGroup?: 'all' | 'admins';
  };
}

export interface AddMemberRequest {
  userId: string;
}

export interface AddParticipantsRequest {
  userIds: string[];
}

export interface UpdateMemberRoleRequest {
  role: string;
}

export interface UpdateGroupMemberRoleRequest {
  role: 'member' | 'admin' | 'moderator';
}

// ============================================================================
// Channel Types
// ============================================================================

export interface CreateChannelRequest {
  name: string;
  handle: string;
  description?: string;
  avatarUrl?: string;
  type: 'public' | 'private';
  settings?: {
    whoCanPost?: 'owner' | 'admins' | 'all';
  };
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
  settings?: {
    whoCanPost?: 'owner' | 'admins' | 'all';
  };
}

// ============================================================================
// Story Types
// ============================================================================

export interface CreateStoryRequest {
  type: 'text' | 'image' | 'video';
  content: string;
  mediaUrl?: string;
  backgroundColor?: string;
  duration?: number;
}

// ============================================================================
// Call Types
// ============================================================================

export interface InitiateCallRequest {
  conversationId: string;
  type: 'audio' | 'video';
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchQueryParams {
  q: string;
  type?: 'all' | 'users' | 'messages' | 'conversations' | 'channels' | 'groups' | 'media';
  page?: number;
  limit?: number;
  conversationId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// AI Types
// ============================================================================

export interface SmartReplyRequest {
  message: string;
  context?: string;
  count?: number;
}

export interface EnhanceMessageRequest {
  message: string;
  tone: 'professional' | 'casual' | 'formal' | 'friendly';
  context?: string;
}

export interface TranslateMessageRequest {
  message: string;
  targetLanguage: string;
}

export interface SummarizeRequest {
  text: string;
  type?: 'brief' | 'detailed' | 'bullet_points' | 'action_items';
  context?: string;
}

export interface ModerateContentRequest {
  content: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface CreateWebhookRequest {
  url: string;
  events: string[];
  description?: string;
  secret?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: string[];
  description?: string;
  isActive?: boolean;
}

// ============================================================================
// File Upload Types
// ============================================================================

export type UploadProgressCallback = (
  percent: number,
  loaded: number,
  total: number
) => void;

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}
