/**
 * Realtime WebSocket Service
 * Socket.IO client for WebRTC signaling and real-time calls
 * Connects to the dedicated realtime service on port 4000
 */

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores';

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:4000';

class RealtimeSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased from 5
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private intentionalDisconnect = false; // Track if disconnect was intentional (logout)

  /**
   * Initialize WebSocket connection to realtime service
   */
  connect() {
    console.log('[RealtimeSocket] 🔌 connect() called');

    // Reset intentional disconnect flag
    this.intentionalDisconnect = false;

    // Try to get token from localStorage directly as fallback
    const { accessToken } = useAuthStore.getState();
    const token = accessToken || localStorage.getItem('accessToken');

    if (!token) {
      console.error('[RealtimeSocket] ❌ No access token available');
      console.error('[RealtimeSocket] Cannot connect without authentication token');
      return;
    }

    if (this.socket?.connected) {
      console.log('[RealtimeSocket] ✅ Already connected, socket ID:', this.socket.id);
      return;
    }

    // If socket exists but is disconnected, try to reconnect it
    if (this.socket && !this.socket.connected) {
      console.log('[RealtimeSocket] 🔄 Socket exists but disconnected, attempting to reconnect...');
      this.socket.connect();
      return;
    }

    console.log('[RealtimeSocket] 🌐 Creating new socket connection to', REALTIME_URL);
    console.log('[RealtimeSocket] Using token:', token.substring(0, 20) + '...');

    this.socket = io(REALTIME_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000, // Increased timeout
      autoConnect: true,
    });

    this.setupEventListeners();
    console.log('[RealtimeSocket] ⏳ Socket created, waiting for connection...');
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[RealtimeSocket] ✅ Connected to WebRTC signaling server');
      console.log('[RealtimeSocket] Socket ID:', this.socket?.id);
      this.reconnectAttempts = 0;

      // Emit custom event for WebRTC initialization
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('realtime-socket:connected'));
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[RealtimeSocket] ⚠️ Disconnected, reason:', reason);
      console.log('[RealtimeSocket] Intentional disconnect?', this.intentionalDisconnect);

      // Emit custom event for cleanup
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('realtime-socket:disconnected', { detail: { reason } }));
      }

      // Don't try to reconnect if it was an intentional disconnect (logout)
      if (this.intentionalDisconnect) {
        console.log('[RealtimeSocket] This was an intentional disconnect, not attempting to reconnect');
        return;
      }

      // Auto-reconnect on unexpected disconnection
      if (reason === 'transport close' || reason === 'transport error') {
        console.log('[RealtimeSocket] 🔄 Connection lost, socket will auto-reconnect...');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[RealtimeSocket] ❌ Connection error:', error.message);
      this.reconnectAttempts++;

      console.log('[RealtimeSocket] Reconnect attempts:', this.reconnectAttempts, '/', this.maxReconnectAttempts);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[RealtimeSocket] ❌ Max reconnection attempts reached');
        console.error('[RealtimeSocket] Please check:');
        console.error('[RealtimeSocket] 1. Backend server is running');
        console.error('[RealtimeSocket] 2. Token is valid');
        console.error('[RealtimeSocket] 3. Network connection is stable');
      }
    });

    this.socket.on('error', (error) => {
      console.error('[RealtimeSocket] Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[RealtimeSocket] Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;

      // Emit custom event for WebRTC re-initialization
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('realtime-socket:reconnected'));
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[RealtimeSocket] Reconnection failed');
    });
  }

  /**
   * Disconnect WebSocket
   * Call this only on logout or when user explicitly wants to disconnect
   */
  disconnect() {
    if (this.socket) {
      console.log('[RealtimeSocket] 🔌 Disconnecting socket (intentional)...');
      this.intentionalDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
      console.log('[RealtimeSocket] ✅ Socket disconnected and cleared');
    } else {
      console.log('[RealtimeSocket] No socket to disconnect');
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
    console.log('[RealtimeSocket] 📤 ========================================');
    console.log('[RealtimeSocket] 📤 EMITTING EVENT:', event);
    console.log('[RealtimeSocket] 📤 ========================================');

    if (!this.socket?.connected) {
      console.error('[RealtimeSocket] ❌ Not connected, cannot emit event:', event);
      console.error('[RealtimeSocket] Socket state:', this.socket ? 'exists but disconnected' : 'null');
      return;
    }

    console.log('[RealtimeSocket] Socket ID:', this.socket.id);
    console.log('[RealtimeSocket] Event name:', event);
    console.log('[RealtimeSocket] Event data:', JSON.stringify(data, null, 2));
    console.log('[RealtimeSocket] Timestamp:', new Date().toISOString());

    this.socket.emit(event, data);

    console.log('[RealtimeSocket] ✅ Event emitted successfully');
  }

  /**
   * Listen to event from server
   */
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('[RealtimeSocket] Socket not initialized');
      return;
    }

    // Wrap callback to log every event received
    const wrappedCallback = (...args: any[]) => {
      console.log('[RealtimeSocket] 📥 EVENT RECEIVED:', event);
      console.log('[RealtimeSocket] Event data:', args);
      callback(...args);
    };

    this.socket.on(event, wrappedCallback);
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
}

// Export singleton instance
export const realtimeSocket = new RealtimeSocketService();

// Listen for logout event to cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    console.log('[RealtimeSocket] Logout event detected, disconnecting');
    realtimeSocket.disconnect();
  });
}
