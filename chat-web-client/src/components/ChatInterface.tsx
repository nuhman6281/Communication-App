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
import { IncomingCallModal } from './IncomingCallModal';
import { OutgoingCallModal } from './OutgoingCallModal';
import { CallHistoryPanel } from './CallHistoryPanel';
import { useConversations, useJoinCall } from '@/hooks';
import { useCallWebSocket } from '@/hooks/useCallWebSocket';

type View = 'chat' | 'profile' | 'settings' | 'video-call' | 'stories' | 'workspace' | 'create-group';

export function ChatInterface() {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [activeCallJitsiConfig, setActiveCallJitsiConfig] = useState<any>(null);
  const [outgoingCall, setOutgoingCall] = useState<{
    callId: string;
    recipientName: string;
    recipientAvatar?: string;
    callType: 'audio' | 'video';
  } | null>(null);

  // Fetch conversations to auto-select the first one
  const { data: conversationsData } = useConversations({});

  // Call notifications
  const { incomingCall, clearIncomingCall, callAccepted, clearCallAccepted } = useCallWebSocket();

  // Join call mutation (for initiator when call is accepted)
  const joinCallMutation = useJoinCall();

  // Auto-select first conversation when data loads
  useEffect(() => {
    if (conversationsData?.items && conversationsData.items.length > 0 && !selectedConversation) {
      const firstConversation = conversationsData.items[0];
      console.log('[ChatInterface] Auto-selecting first conversation:', firstConversation.id);
      setSelectedConversation(firstConversation.id);
    }
  }, [conversationsData, selectedConversation]);

  // Handle call accepted (for initiator)
  useEffect(() => {
    if (callAccepted && outgoingCall?.callId === callAccepted.callId) {
      console.log('[ChatInterface] Call accepted by recipient, joining call...');

      // Join the call to get Jitsi config
      joinCallMutation.mutate(callAccepted.callId, {
        onSuccess: (data) => {
          console.log('[ChatInterface] Joined call successfully:', data);
          setActiveCallJitsiConfig(data.jitsiConfig);
          setCurrentView('video-call');
          setOutgoingCall(null);
          clearCallAccepted();
        },
        onError: (error) => {
          console.error('[ChatInterface] Failed to join call:', error);
          setOutgoingCall(null);
          clearCallAccepted();
        },
      });
    }
  }, [callAccepted, outgoingCall, clearCallAccepted, joinCallMutation]);

  const renderMainContent = () => {
    switch (currentView) {
      case 'profile':
        return <UserProfile onBack={() => setCurrentView('chat')} />;
      case 'settings':
        return <Settings onBack={() => setCurrentView('chat')} />;
      case 'video-call':
        return (
          <VideoCallScreen
            onEnd={() => {
              setCurrentView('chat');
              setActiveCallJitsiConfig(null);
            }}
            jitsiConfig={activeCallJitsiConfig}
          />
        );
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
                  onCallInitiated={(callData) => setOutgoingCall(callData)}
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

            {/* Call History Panel */}
            {showCallHistory && (
              <CallHistoryPanel
                onClose={() => setShowCallHistory(false)}
                onCallInitiated={(callData) => {
                  setOutgoingCall(callData);
                  setShowCallHistory(false);
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
        onCallHistoryClick={() => setShowCallHistory(!showCallHistory)}
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

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={(callId, jitsiConfig) => {
            setActiveCallJitsiConfig(jitsiConfig);
            setCurrentView('video-call');
            clearIncomingCall();
            setOutgoingCall(null); // Clear outgoing if accepting
          }}
          onReject={() => {
            clearIncomingCall();
          }}
        />
      )}

      {/* Outgoing Call Modal */}
      {outgoingCall && (
        <OutgoingCallModal
          callId={outgoingCall.callId}
          recipientName={outgoingCall.recipientName}
          recipientAvatar={outgoingCall.recipientAvatar}
          callType={outgoingCall.callType}
          onCancel={() => {
            setOutgoingCall(null);
          }}
        />
      )}
    </div>
  );
}