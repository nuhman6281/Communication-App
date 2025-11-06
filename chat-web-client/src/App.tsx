import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthScreen } from './components/AuthScreen';
import { ChatInterface } from './components/ChatInterface';
import { EmailVerification } from './components/EmailVerification';
import { GlobalCallContainer } from './components/GlobalCallContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore, useUIStore } from './lib/stores';
import { socketService, setupWebSocketEvents, cleanupWebSocketEvents } from './lib/websocket';
import { realtimeSocket } from './lib/websocket/realtime-socket';
import { webrtcService } from './lib/webrtc/webrtc.service';
import { startTypingCleanup } from './lib/stores/presence.store';

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useUIStore();

  // Initialize theme on mount
  useEffect(() => {
    setTheme(theme);
  }, []);

  // Handle logout - disconnect all sockets
  useEffect(() => {
    const handleLogout = () => {
      console.log('[App] 🚪 Logout event received, disconnecting all sockets...');
      socketService.disconnect();
      realtimeSocket.disconnect();
      cleanupWebSocketEvents();
      console.log('[App] ✅ All sockets disconnected on logout');
    };

    window.addEventListener('app:logout', handleLogout);

    return () => {
      window.removeEventListener('app:logout', handleLogout);
    };
  }, []);

  // Setup WebSocket when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[App] User not authenticated, skipping socket connection');
      return;
    }

    console.log('[App] 🔌 User authenticated, setting up socket connections...');

    // Check if already connected to prevent duplicate connections
    const messagingAlreadyConnected = socketService.isConnected();
    const realtimeAlreadyConnected = realtimeSocket.isConnected();

    console.log('[App] Socket status - Messaging:', messagingAlreadyConnected, 'Realtime:', realtimeAlreadyConnected);

    // Connect WebSocket for messaging (only if not already connected)
    if (!messagingAlreadyConnected) {
      console.log('[App] Connecting messaging socket...');
      socketService.connect();
    } else {
      console.log('[App] Messaging socket already connected');
    }

    // Connect Realtime WebSocket for WebRTC calls (only if not already connected)
    if (!realtimeAlreadyConnected) {
      console.log('[App] Connecting realtime socket...');
      realtimeSocket.connect();
    } else {
      console.log('[App] Realtime socket already connected');
    }

    // Event-driven WebRTC initialization - waits for socket to actually connect
    const handleRealtimeConnected = () => {
      console.log('[App] ✅ Realtime socket connected event received, initializing WebRTC service');
      webrtcService.initialize();
    };

    const handleRealtimeReconnected = () => {
      console.log('[App] 🔄 Realtime socket reconnected, re-initializing WebRTC service');
      webrtcService.initialize();
    };

    const handleRealtimeDisconnected = (e: Event) => {
      const event = e as CustomEvent;
      console.warn('[App] ⚠️ Realtime socket disconnected:', event.detail?.reason);

      // Auto-reconnect if disconnected unexpectedly (not due to logout)
      if (isAuthenticated && event.detail?.reason !== 'io client disconnect') {
        console.log('[App] 🔄 Attempting to reconnect realtime socket...');
        setTimeout(() => {
          if (!realtimeSocket.isConnected() && isAuthenticated) {
            console.log('[App] Reconnecting realtime socket...');
            realtimeSocket.connect();
          }
        }, 2000);
      }
    };

    // Listen for connection events
    window.addEventListener('realtime-socket:connected', handleRealtimeConnected);
    window.addEventListener('realtime-socket:reconnected', handleRealtimeReconnected);
    window.addEventListener('realtime-socket:disconnected', handleRealtimeDisconnected);

    // If already connected (e.g., fast connection or page refresh), initialize immediately
    if (realtimeSocket.isConnected()) {
      console.log('[App] ✅ Realtime socket already connected, initializing WebRTC service immediately');
      webrtcService.initialize();
    }

    // Setup event listeners (only if not already set up)
    if (!messagingAlreadyConnected) {
      setupWebSocketEvents();
    }

    // Set self-user presence to online when socket connects
    const handleSocketConnected = () => {
      console.log('[App] 📡 Socket connected, updating self presence to online');
      socketService.updatePresence('online');

      // CRITICAL: Re-register event listeners on reconnection
      // When socket reconnects, all event listeners are lost and must be re-registered
      console.log('[App] 🔄 Re-registering event listeners after reconnection');
      cleanupWebSocketEvents(); // Remove any stale listeners
      setupWebSocketEvents(); // Re-register all event listeners
    };

    // Listen for socket connection
    socketService.on('connect', handleSocketConnected);

    // If already connected, update presence immediately
    if (socketService.isConnected()) {
      socketService.updatePresence('online');
    }

    // Track user activity for presence (online/away)
    let activityTimeout: NodeJS.Timeout;
    const resetActivityTimer = () => {
      clearTimeout(activityTimeout);

      // Update to online if was away
      socketService.updatePresence('online');

      // Set to away after 5 minutes of inactivity
      activityTimeout = setTimeout(() => {
        console.log('[App] 👤 User inactive for 5 minutes, setting presence to away');
        socketService.updatePresence('away');
      }, 5 * 60 * 1000);
    };

    // Track mouse/keyboard activity
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetActivityTimer);
    });

    // Initialize activity timer
    resetActivityTimer();

    // Start typing indicator cleanup interval
    const cleanupInterval = startTypingCleanup();

    // Heartbeat interval to maintain connection
    const heartbeatInterval = setInterval(() => {
      if (socketService.isConnected()) {
        socketService.sendHeartbeat();
      } else {
        console.warn('[App] ⚠️ Messaging socket disconnected, attempting reconnect...');
        if (isAuthenticated) {
          socketService.connect();
        }
      }

      // Also check realtime socket
      if (!realtimeSocket.isConnected() && isAuthenticated) {
        console.warn('[App] ⚠️ Realtime socket disconnected, attempting reconnect...');
        realtimeSocket.connect();
      }
    }, 30000); // Every 30 seconds

    console.log('[App] ✅ Socket setup complete');

    // Cleanup function - ONLY run when component unmounts or user logs out
    return () => {
      console.log('[App] 🧹 Cleaning up socket connections...');
      clearInterval(heartbeatInterval);
      clearInterval(cleanupInterval);
      clearTimeout(activityTimeout);

      // Remove event listeners
      window.removeEventListener('realtime-socket:connected', handleRealtimeConnected);
      window.removeEventListener('realtime-socket:reconnected', handleRealtimeReconnected);
      window.removeEventListener('realtime-socket:disconnected', handleRealtimeDisconnected);
      socketService.off('connect', handleSocketConnected);

      activityEvents.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });

      // IMPORTANT: Only disconnect if user is actually logging out
      // Don't disconnect on component re-render or page navigation
      console.log('[App] Note: Sockets will remain connected for persistent connection');
      console.log('[App] Sockets will only disconnect on explicit logout');
    };
  }, [isAuthenticated]);

  return (
    <ErrorBoundary level="app" showDetails={process.env.NODE_ENV === 'development'}>
      <BrowserRouter>
        {/* Global Call Container - renders at root level for persistence */}
        {isAuthenticated && (
          <ErrorBoundary level="component" showDetails={false}>
            <GlobalCallContainer />
          </ErrorBoundary>
        )}

        <Routes>
          {/* Email verification route - accessible without authentication */}
          <Route
            path="/verify-email"
            element={
              <ErrorBoundary level="page">
                <EmailVerification />
              </ErrorBoundary>
            }
          />

          {/* Main app routes */}
          <Route
            path="/"
            element={
              <ErrorBoundary level="page">
                {isAuthenticated ? <ChatInterface /> : <AuthScreen onAuthenticate={() => {}} />}
              </ErrorBoundary>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
