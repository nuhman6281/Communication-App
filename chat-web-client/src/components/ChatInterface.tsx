import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { UserProfile } from './UserProfile';
import { Settings } from './Settings';
import { VideoCallScreen } from './VideoCallScreen';
import { StoriesView } from './StoriesView';
import { WorkspaceView } from './WorkspaceView';
import { GroupCreation } from './GroupCreation';
import { NotificationsPanel } from './NotificationsPanel';
import { GlobalSearch } from './GlobalSearch';
import { useConversations } from '@/hooks';

type View = 'chat' | 'profile' | 'settings' | 'video-call' | 'stories' | 'workspace' | 'create-group';

export function ChatInterface() {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Fetch conversations to auto-select the first one
  const { data: conversationsData } = useConversations({});

  // Auto-select first conversation when data loads
  useEffect(() => {
    if (conversationsData?.items && conversationsData.items.length > 0 && !selectedConversation) {
      const firstConversation = conversationsData.items[0];
      console.log('[ChatInterface] Auto-selecting first conversation:', firstConversation.id);
      setSelectedConversation(firstConversation.id);
    }
  }, [conversationsData, selectedConversation]);

  const renderMainContent = () => {
    switch (currentView) {
      case 'profile':
        return <UserProfile onBack={() => setCurrentView('chat')} />;
      case 'settings':
        return <Settings onBack={() => setCurrentView('chat')} />;
      case 'video-call':
        return <VideoCallScreen onEnd={() => setCurrentView('chat')} />;
      case 'stories':
        return <StoriesView onBack={() => setCurrentView('chat')} />;
      case 'workspace':
        return <WorkspaceView onBack={() => setCurrentView('chat')} />;
      case 'create-group':
        return (
          <GroupCreation
            onBack={() => setCurrentView('chat')}
            onGroupCreated={(groupId) => {
              setCurrentView('chat');
              setSelectedConversation(groupId);
            }}
          />
        );
      case 'chat':
      default:
        return (
          <div className="flex h-full">
            {/* Conversation List - Hidden on mobile when chat is selected */}
            <div
              className={`${
                selectedConversation && !showConversationList
                  ? 'hidden md:block'
                  : 'block'
              } w-full md:w-80 lg:w-96 border-r border-border flex-shrink-0`}
            >
              <ConversationList
                selectedId={selectedConversation}
                onSelect={(id) => {
                  setSelectedConversation(id);
                  setShowConversationList(false);
                }}
                onCreateGroup={() => setCurrentView('create-group')}
                onSearch={() => setShowSearch(true)}
              />
            </div>

            {/* Chat Window - Hidden on mobile when no chat selected */}
            <div
              className={`${
                selectedConversation && !showConversationList
                  ? 'block'
                  : 'hidden md:block'
              } flex-1`}
            >
              {selectedConversation ? (
                <ChatWindow
                  conversationId={selectedConversation}
                  onBack={() => setShowConversationList(true)}
                  onVideoCall={() => setCurrentView('video-call')}
                />
              ) : (
                <div className="hidden md:flex h-full items-center justify-center bg-muted/20">
                  <div className="text-center space-y-2">
                    <div className="text-5xl mb-4">💬</div>
                    <h3>Select a conversation</h3>
                    <p className="text-muted-foreground text-sm">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Panel */}
            {showNotifications && (
              <NotificationsPanel
                onClose={() => setShowNotifications(false)}
                onNotificationClick={(notification) => {
                  if (notification.conversationId) {
                    setSelectedConversation(notification.conversationId);
                    setShowConversationList(false);
                  }
                  setShowNotifications(false);
                }}
              />
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setShowConversationList(true);
        }}
        onNotificationsClick={() => setShowNotifications(!showNotifications)}
        onSearchClick={() => setShowSearch(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderMainContent()}
      </div>

      {/* Global Search Overlay */}
      {showSearch && (
        <GlobalSearch
          onClose={() => setShowSearch(false)}
          onResultClick={(result) => {
            if (result.type === 'message' || result.type === 'conversation') {
              setSelectedConversation(result.id);
              setShowConversationList(false);
              setCurrentView('chat');
            }
          }}
        />
      )}
    </div>
  );
}