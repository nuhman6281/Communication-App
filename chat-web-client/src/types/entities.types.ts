/**
 * Entity Type Definitions
 * These types match the backend API response structures
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
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
  presenceStatus: PresenceStatus;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  DO_NOT_DISTURB = 'do_not_disturb',
  OFFLINE = 'offline',
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  lastMessage: Message | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  participants: User[];
  createdAt: string;
  updatedAt: string;
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  messageType: MessageType; // Changed from 'type' to 'messageType' to match backend
  metadata: MessageMetadata | null;
  parentMessageId: string | null;
  parentMessage: Message | null;
  reactions: MessageReaction[];
  isEdited: boolean;
  isPinned: boolean;
  isForwarded: boolean;
  readBy: MessageRead[];
  attachments?: any[]; // Added for file attachments
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted?: boolean; // Added for soft delete flag
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  CONTACT = 'contact',
  POLL = 'poll',
  SYSTEM = 'system',
}

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  pollQuestion?: string;
  pollOptions?: string[];
  [key: string]: unknown;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  user: User;
  emoji: string;
  createdAt: string;
}

export interface MessageRead {
  id: string;
  messageId: string;
  userId: string;
  user: User;
  readAt: string;
}

// ============================================================================
// Group Types
// ============================================================================

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  ownerId: string;
  owner: User;
  memberCount: number;
  maxMembers: number;
  inviteLink: string | null;
  settings: GroupSettings;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupSettings {
  whoCanSendMessages: 'all' | 'admins';
  whoCanAddMembers: 'all' | 'admins';
  whoCanEditGroup: 'all' | 'admins';
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user: User;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: string;
}

export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

export enum GroupMemberStatus {
  ACTIVE = 'active',
  LEFT = 'left',
  REMOVED = 'removed',
  BANNED = 'banned',
}

// ============================================================================
// Channel Types
// ============================================================================

export interface Channel {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatarUrl: string | null;
  ownerId: string;
  owner: User;
  subscriberCount: number;
  type: ChannelType;
  isVerified: boolean;
  settings: ChannelSettings;
  createdAt: string;
  updatedAt: string;
}

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface ChannelSettings {
  whoCanPost: 'owner' | 'admins' | 'all';
}

// ============================================================================
// Story Types
// ============================================================================

export interface Story {
  id: string;
  userId: string;
  user: User;
  type: StoryType;
  content: string;
  mediaUrl: string | null;
  backgroundColor: string | null;
  duration: number;
  viewCount: number;
  replyCount: number;
  views: StoryView[];
  expiresAt: string;
  createdAt: string;
}

export enum StoryType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface StoryView {
  id: string;
  storyId: string;
  userId: string;
  user: User;
  viewedAt: string;
}

// ============================================================================
// Call Types
// ============================================================================

export interface Call {
  id: string;
  conversationId: string;
  conversation: Conversation;
  initiatorId: string;
  initiator: User;
  type: CallType;
  status: CallStatus;
  jitsiRoomName: string;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  participants: string[];
  createdAt: string;
}

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum CallStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  CALL_MISSED = 'call_missed',
  CALL_INCOMING = 'call_incoming',
  GROUP_INVITE = 'group_invite',
  GROUP_MENTION = 'group_mention',
  CHANNEL_POST = 'channel_post',
  STORY_REPLY = 'story_reply',
  SYSTEM = 'system',
}

// ============================================================================
// Media Types
// ============================================================================

export interface Media {
  id: string;
  userId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  metadata: MediaMetadata | null;
  createdAt: string;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  [key: string]: unknown;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  description: string | null;
  events: WebhookEvent[];
  isActive: boolean;
  secret: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum WebhookEvent {
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  USER_JOINED = 'user.joined',
  USER_LEFT = 'user.left',
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResult {
  query: string;
  type: SearchType;
  users?: PaginatedResponse<User>;
  messages?: PaginatedResponse<Message>;
  conversations?: PaginatedResponse<Conversation>;
  channels?: PaginatedResponse<Channel>;
  groups?: PaginatedResponse<Group>;
  media?: PaginatedResponse<Media>;
}

export enum SearchType {
  ALL = 'all',
  USERS = 'users',
  MESSAGES = 'messages',
  CONVERSATIONS = 'conversations',
  CHANNELS = 'channels',
  GROUPS = 'groups',
  MEDIA = 'media',
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Typing Indicator Types
// ============================================================================

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  user: User;
  timestamp: number;
}

// ============================================================================
// Workspace Types
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  ownerId: string;
  owner?: User;
  settings: WorkspaceSettings;
  memberCount: number;
  channelCount: number;
  groupCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  currentUserMembership?: WorkspaceMember;
  currentUserRole?: WorkspaceRole;
}

export interface WorkspaceSettings {
  allowPersonalDms?: boolean;
  allowExternalGroups?: boolean;
  requireEmailDomain?: string[];
  ssoEnabled?: boolean;
  samlConfig?: Record<string, any>;
  defaultMemberPermissions?: string[];
  allowGuestInvites?: boolean;
  maxMembers?: number;
  customBranding?: {
    primaryColor?: string;
    logo?: string;
    theme?: 'light' | 'dark' | 'auto';
  };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  user?: User;
  workspace?: Workspace;
  role: WorkspaceRole;
  customPermissions: string[];
  status: MemberStatus;
  invitedById: string | null;
  invitedBy?: User | null;
  inviteCode: string | null;
  invitedAt: string | null;
  joinedAt: string | null;
  lastSeenAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
  LEFT = 'left',
}

// Workspace API Data Types
export interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  settings?: Partial<WorkspaceSettings>;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  settings?: Partial<WorkspaceSettings>;
  isActive?: boolean;
}

export interface InviteMemberData {
  email: string;
  role?: WorkspaceRole;
  customPermissions?: string[];
}

export interface UpdateMemberRoleData {
  role?: WorkspaceRole;
  customPermissions?: string[];
  status?: MemberStatus;
}

// Workspace API Response Types
export interface WorkspaceListResponse {
  workspaces: Workspace[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkspaceMembersResponse {
  members: WorkspaceMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InviteLinkResponse {
  inviteCode: string;
  inviteUrl: string;
  workspaceId: string;
  workspaceName: string;
}

export interface JoinWorkspaceResponse {
  message: string;
  workspace: Workspace;
  membership: WorkspaceMember;
}

export interface WorkspaceGroupsResponse {
  groups: Group[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkspaceChannelsResponse {
  channels: Channel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
