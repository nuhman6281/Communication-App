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

  /**
   * Initialize WebSocket connection
   */
  connect() {
    // Try to get token from localStorage directly as fallback
    const { accessToken } = useAuthStore.getState();
    const token = accessToken || localStorage.getItem('accessToken');

    if (!token) {
      console.warn('[WebSocket] No access token, skipping connection');
      return;
    }

    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to', API_CONFIG.wsURL);

    this.socket = io(API_CONFIG.wsURL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
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
   * Join room (conversation, group, channel)
   */
  joinRoom(roomId: string) {
    this.emit('join_room', { roomId });
  }

  /**
   * Leave room
   */
  leaveRoom(roomId: string) {
    this.emit('leave_room', { roomId });
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean) {
    this.emit('typing', { conversationId, isTyping });
  }

  /**
   * Update presence status
   */
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline') {
    this.emit('presence_update', { status });
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
