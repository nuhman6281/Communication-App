/**
 * WebSocket Event Handlers
 * Handles real-time events from Socket.IO server
 */

import { socketService } from './socket';
import { queryClient, queryKeys, invalidateQueries } from '@/lib/query-client';
import { usePresenceStore } from '@/lib/stores';
import { toast } from 'sonner';
import type { Message, Notification } from '@/types/entities.types';

/**
 * Setup all WebSocket event listeners
 */
export function setupWebSocketEvents() {
  console.log('[WebSocket Events] Setting up event listeners');

  // ============================================================================
  // Message Events
  // ============================================================================

  socketService.on('message:new', (message: Message) => {
    console.log('[WebSocket] New message received:', message);

    // Invalidate messages query for the conversation
    invalidateQueries.message(message.conversationId);

    // Invalidate conversations list (for last message update)
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all() });

    // Show notification if not in the conversation
    // (you can add logic to check if user is currently viewing this conversation)
    // toast.info(`New message from ${message.sender.username}`);
  });

  socketService.on('message:updated', (message: Message) => {
    console.log('[WebSocket] Message updated:', message);
    invalidateQueries.message(message.conversationId, message.id);
  });

  socketService.on('message:deleted', ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
    console.log('[WebSocket] Message deleted:', messageId);
    invalidateQueries.message(conversationId);
  });

  socketService.on('message:reaction', ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
    console.log('[WebSocket] Message reaction updated:', messageId);
    invalidateQueries.message(conversationId, messageId);
  });

  // ============================================================================
  // Typing Indicators
  // ============================================================================

  socketService.on('typing:start', ({ userId, username, avatarUrl, conversationId }: {
    userId: string;
    username: string;
    avatarUrl: string | null;
    conversationId: string;
  }) => {
    console.log('[WebSocket] User started typing:', username);
    usePresenceStore.getState().addTypingUser(conversationId, { userId, username, avatarUrl });
  });

  socketService.on('typing:stop', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
    console.log('[WebSocket] User stopped typing:', userId);
    usePresenceStore.getState().removeTypingUser(conversationId, userId);
  });

  // ============================================================================
  // Presence Events
  // ============================================================================

  socketService.on('presence:update', ({ userId, status, customStatus }: {
    userId: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    customStatus: string | null;
  }) => {
    console.log('[WebSocket] Presence updated:', userId, status);
    usePresenceStore.getState().setPresence(userId, {
      userId,
      status,
      customStatus,
      isOnline: status !== 'offline',
      lastSeenAt: status === 'offline' ? new Date().toISOString() : null,
    });
  });

  socketService.on('presence:batch', (presences: Array<{
    userId: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    customStatus: string | null;
  }>) => {
    console.log('[WebSocket] Batch presence update:', presences.length, 'users');
    const presenceData = presences.map((p) => ({
      userId: p.userId,
      status: p.status,
      customStatus: p.customStatus,
      isOnline: p.status !== 'offline',
      lastSeenAt: p.status === 'offline' ? new Date().toISOString() : null,
    }));
    usePresenceStore.getState().setBatchPresence(presenceData);
  });

  // ============================================================================
  // Conversation Events
  // ============================================================================

  socketService.on('conversation:updated', ({ conversationId }: { conversationId: string }) => {
    console.log('[WebSocket] Conversation updated:', conversationId);
    invalidateQueries.conversation(conversationId);
  });

  socketService.on('conversation:participant_added', ({ conversationId }: { conversationId: string }) => {
    console.log('[WebSocket] Participant added to conversation:', conversationId);
    invalidateQueries.conversation(conversationId);
  });

  socketService.on('conversation:participant_removed', ({ conversationId }: { conversationId: string }) => {
    console.log('[WebSocket] Participant removed from conversation:', conversationId);
    invalidateQueries.conversation(conversationId);
  });

  // ============================================================================
  // Notification Events
  // ============================================================================

  socketService.on('notification:new', (notification: Notification) => {
    console.log('[WebSocket] New notification:', notification);

    // Invalidate notifications query
    invalidateQueries.notifications();

    // Show toast notification
    toast(notification.title, {
      description: notification.content,
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => window.location.href = notification.actionUrl!,
      } : undefined,
    });
  });

  // ============================================================================
  // Call Events
  // ============================================================================

  socketService.on('call:incoming', ({ call, initiator, callType }: { call: any; initiator: any; callType: string }) => {
    console.log('[WebSocket] Incoming call from:', initiator?.username || initiator?.email || 'Unknown');

    // Invalidate active calls
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.active });

    // Show incoming call notification
    const callerName = initiator?.username || initiator?.email || 'Unknown';
    toast.info(`Incoming ${callType} call from ${callerName}`, {
      duration: 30000, // 30 seconds
      action: {
        label: 'Answer',
        onClick: () => {
          // Handle call answer
          window.location.href = `/call/${call.id}`;
        },
      },
    });
  });

  socketService.on('call:started', ({ callId }: { callId: string }) => {
    console.log('[WebSocket] Call started:', callId);
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.active });
  });

  socketService.on('call:ended', ({ callId }: { callId: string }) => {
    console.log('[WebSocket] Call ended:', callId);
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.active });
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.history() });
  });

  socketService.on('call:participant_joined', ({ callId }: { callId: string }) => {
    console.log('[WebSocket] Participant joined call:', callId);
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.participants(callId) });
  });

  socketService.on('call:participant_left', ({ callId }: { callId: string }) => {
    console.log('[WebSocket] Participant left call:', callId);
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.participants(callId) });
  });

  // ============================================================================
  // Group/Channel Events
  // ============================================================================

  socketService.on('group:updated', ({ groupId }: { groupId: string }) => {
    console.log('[WebSocket] Group updated:', groupId);
    invalidateQueries.group(groupId);
  });

  socketService.on('channel:updated', ({ channelId }: { channelId: string }) => {
    console.log('[WebSocket] Channel updated:', channelId);
    invalidateQueries.channel(channelId);
  });

  // ============================================================================
  // Story Events
  // ============================================================================

  socketService.on('story:new', ({ userId }: { userId: string }) => {
    console.log('[WebSocket] New story from user:', userId);
    queryClient.invalidateQueries({ queryKey: queryKeys.stories.active });
    queryClient.invalidateQueries({ queryKey: queryKeys.stories.byUser(userId) });
  });

  socketService.on('story:viewed', ({ storyId }: { storyId: string }) => {
    console.log('[WebSocket] Story viewed:', storyId);
    queryClient.invalidateQueries({ queryKey: queryKeys.stories.views(storyId) });
  });

  // ============================================================================
  // System Events
  // ============================================================================

  socketService.on('error', (error: { message: string; code?: string }) => {
    console.error('[WebSocket] Server error:', error);
    toast.error(`Server Error: ${error.message}`);
  });

  socketService.on('maintenance', ({ message }: { message: string }) => {
    console.warn('[WebSocket] Maintenance mode:', message);
    toast.warning('Maintenance Mode', {
      description: message,
      duration: 10000,
    });
  });

  console.log('[WebSocket Events] All event listeners setup complete');
}

/**
 * Cleanup all WebSocket event listeners
 */
export function cleanupWebSocketEvents() {
  console.log('[WebSocket Events] Cleaning up event listeners');

  // Remove all listeners
  const events = [
    'message:new',
    'message:updated',
    'message:deleted',
    'message:reaction',
    'typing:start',
    'typing:stop',
    'presence:update',
    'presence:batch',
    'conversation:updated',
    'conversation:participant_added',
    'conversation:participant_removed',
    'notification:new',
    'call:incoming',
    'call:started',
    'call:ended',
    'call:participant_joined',
    'call:participant_left',
    'group:updated',
    'channel:updated',
    'story:new',
    'story:viewed',
    'error',
    'maintenance',
  ];

  events.forEach((event) => {
    socketService.off(event);
  });

  console.log('[WebSocket Events] Cleanup complete');
}
