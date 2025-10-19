import { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { ChatInterface } from './components/ChatInterface';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return <ChatInterface />;
}
