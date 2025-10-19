// Message Types
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  CONTACT = 'contact',
  POLL = 'poll',
  CODE = 'code',
  GIF = 'gif',
  STICKER = 'sticker',
}

// Conversation Types
export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}

// User Roles (in groups/workspaces)
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

// Presence Status
export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  DO_NOT_DISTURB = 'do_not_disturb',
  OFFLINE = 'offline',
}

// Message Status
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

// Call Status
export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  MISSED = 'missed',
}

// Call Type
export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

// Subscription Status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PAST_DUE = 'past_due',
}

// Billing Cycle
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// Subscription Plan Names
export enum PlanName {
  FREE = 'free',
  PREMIUM = 'premium',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}
