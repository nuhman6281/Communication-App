import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthScreen } from './components/AuthScreen';
import { ChatInterface } from './components/ChatInterface';
import { EmailVerification } from './components/EmailVerification';
import { GlobalCallContainer } from './components/GlobalCallContainer';
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

  // Setup WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[App] User authenticated, connecting WebSocket');

      // Connect WebSocket for messaging
      socketService.connect();

      // Connect Realtime WebSocket for WebRTC calls
      realtimeSocket.connect();

      // Event-driven WebRTC initialization - waits for socket to actually connect
      const handleRealtimeConnected = () => {
        console.log('[App] Realtime socket connected event received, initializing WebRTC service');
        webrtcService.initialize();
      };

      const handleRealtimeReconnected = () => {
        console.log('[App] Realtime socket reconnected, re-initializing WebRTC service');
        webrtcService.initialize();
      };

      // Listen for connection events
      window.addEventListener('realtime-socket:connected', handleRealtimeConnected);
      window.addEventListener('realtime-socket:reconnected', handleRealtimeReconnected);

      // If already connected (e.g., fast connection), initialize immediately
      if (realtimeSocket.isConnected()) {
        console.log('[App] Realtime socket already connected, initializing WebRTC service immediately');
        webrtcService.initialize();
      }

      // Setup event listeners
      setupWebSocketEvents();

      // Start typing indicator cleanup interval
      const cleanupInterval = startTypingCleanup();

      // Heartbeat interval to maintain connection
      const heartbeatInterval = setInterval(() => {
        if (socketService.isConnected()) {
          socketService.sendHeartbeat();
        }
      }, 30000); // Every 30 seconds

      return () => {
        console.log('[App] Cleaning up WebSocket');
        cleanupWebSocketEvents();
        socketService.disconnect();
        realtimeSocket.disconnect();
        clearInterval(heartbeatInterval);
        clearInterval(cleanupInterval);
        window.removeEventListener('realtime-socket:connected', handleRealtimeConnected);
        window.removeEventListener('realtime-socket:reconnected', handleRealtimeReconnected);
      };
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      {/* Global Call Container - renders at root level for persistence */}
      {isAuthenticated && <GlobalCallContainer />}

      <Routes>
        {/* Email verification route - accessible without authentication */}
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* Main app routes */}
        <Route
          path="/"
          element={isAuthenticated ? <ChatInterface /> : <AuthScreen onAuthenticate={() => {}} />}
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
