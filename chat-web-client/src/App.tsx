import { useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { ChatInterface } from './components/ChatInterface';
import { useAuthStore, useUIStore } from './lib/stores';
import { socketService, setupWebSocketEvents, cleanupWebSocketEvents } from './lib/websocket';
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

      // Connect WebSocket
      socketService.connect();

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
        clearInterval(heartbeatInterval);
        clearInterval(cleanupInterval);
      };
    }
  }, [isAuthenticated]);

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={() => {}} />;
  }

  return <ChatInterface />;
}
