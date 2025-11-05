/**
 * WebSocket Service
 * Socket.IO client for real-time communication
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api.config';
import { useAuthStore } from '@/lib/stores';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private intentionalDisconnect = false; // Track if disconnect was intentional (logout)

  /**
   * Initialize WebSocket connection
   */
  connect() {
    console.log('[WebSocket] 🔌 connect() called');

    // Reset intentional disconnect flag
    this.intentionalDisconnect = false;

    // Try to get token from localStorage directly as fallback
    const { accessToken } = useAuthStore.getState();
    const token = accessToken || localStorage.getItem('accessToken');

    if (!token) {
      console.error('[WebSocket] ❌ No access token available');
      console.error('[WebSocket] Cannot connect without authentication token');
      return;
    }

    if (this.socket?.connected) {
      console.log('[WebSocket] ✅ Already connected, socket ID:', this.socket.id);
      return;
    }

    // If socket exists but is disconnected, try to reconnect it
    if (this.socket && !this.socket.connected) {
      console.log('[WebSocket] 🔄 Socket exists but disconnected, attempting to reconnect...');
      this.socket.connect();
      return;
    }

    console.log('[WebSocket] 🌐 Creating new socket connection to', API_CONFIG.wsURL);
    console.log('[WebSocket] Using token:', token.substring(0, 20) + '...');

    this.socket = io(API_CONFIG.wsURL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      autoConnect: true,
    });

    this.setupEventListeners();
    console.log('[WebSocket] ⏳ Socket created, waiting for connection...');
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] ✅ Connected successfully');
      console.log('[WebSocket] Socket ID:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] ⚠️ Disconnected, reason:', reason);
      console.log('[WebSocket] Intentional disconnect?', this.intentionalDisconnect);

      // Don't try to reconnect if it was an intentional disconnect (logout)
      if (this.intentionalDisconnect) {
        console.log('[WebSocket] This was an intentional disconnect, not attempting to reconnect');
        return;
      }

      // Auto-reconnect on unexpected disconnection
      if (reason === 'transport close' || reason === 'transport error') {
        console.log('[WebSocket] 🔄 Connection lost, socket will auto-reconnect...');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] ❌ Connection error:', error.message);
      this.reconnectAttempts++;

      console.log('[WebSocket] Reconnect attempts:', this.reconnectAttempts, '/', this.maxReconnectAttempts);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] ❌ Max reconnection attempts reached');
        console.error('[WebSocket] Please check:');
        console.error('[WebSocket] 1. Backend server is running');
        console.error('[WebSocket] 2. Token is valid');
        console.error('[WebSocket] 3. Network connection is stable');
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] ❌ Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] ✅ Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] ❌ Reconnection failed');
    });
  }

  /**
   * Disconnect WebSocket
   * Call this only on logout or when user explicitly wants to disconnect
   */
  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] 🔌 Disconnecting socket (intentional)...');
      this.intentionalDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
      console.log('[WebSocket] ✅ Socket disconnected and cleared');
    } else {
      console.log('[WebSocket] No socket to disconnect');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Not connected, cannot emit event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Listen to event from server
   */
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('[WebSocket] Socket not initialized');
      return;
    }

    this.socket.on(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Join conversation room (for receiving real-time messages)
   */
  joinConversation(conversationId: string) {
    this.emit('conversation:join', { conversationId });
  }

  /**
   * Leave conversation room
   */
  leaveConversation(conversationId: string) {
    this.emit('conversation:leave', { conversationId });
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean) {
    if (isTyping) {
      this.emit('typing:start', { conversationId });
    } else {
      this.emit('typing:stop', { conversationId });
    }
  }

  /**
   * @deprecated Use joinConversation instead
   */
  joinRoom(roomId: string) {
    this.joinConversation(roomId);
  }

  /**
   * @deprecated Use leaveConversation instead
   */
  leaveRoom(roomId: string) {
    this.leaveConversation(roomId);
  }

  /**
   * Update presence status
   */
  updatePresence(status: 'online' | 'away' | 'do_not_disturb' | 'offline', customStatus?: string) {
    console.log('[WebSocket] Updating presence status:', status);
    this.emit('presence:update', { status, customStatus });
  }

  /**
   * Subscribe to presence updates for specific users
   */
  subscribeToPresence(userIds: string[]) {
    if (userIds.length === 0) return;
    console.log('[WebSocket] Subscribing to presence for', userIds.length, 'users');
    this.emit('presence:subscribe', { userIds });
  }

  /**
   * Unsubscribe from presence updates
   */
  unsubscribeFromPresence(userIds: string[]) {
    if (userIds.length === 0) return;
    console.log('[WebSocket] Unsubscribing from presence for', userIds.length, 'users');
    this.emit('presence:unsubscribe', { userIds });
  }

  /**
   * Send heartbeat to maintain connection
   */
  sendHeartbeat() {
    this.emit('heartbeat');
  }
}

// Export singleton instance
export const socketService = new WebSocketService();

// Auto-reconnect on auth changes
if (typeof window !== 'undefined') {
  // Listen for auth changes
  useAuthStore.subscribe((state, prevState) => {
    if (state.isAuthenticated && !prevState.isAuthenticated) {
      // User logged in
      socketService.connect();
    } else if (!state.isAuthenticated && prevState.isAuthenticated) {
      // User logged out
      socketService.disconnect();
    }
  });

  // Listen for logout event
  window.addEventListener('auth:logout', () => {
    socketService.disconnect();
  });
}
