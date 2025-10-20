import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  Mic,
  MoreHorizontal,
  Reply,
  Forward,
  Trash2,
  Copy,
  ThumbsUp,
  Heart,
  Laugh,
  Loader2,
} from 'lucide-react';
import { useMessages, useSendMessage, useConversation } from '@/hooks';
import { useAuthStore } from '@/lib/stores';
import { useTypingUsers } from '@/lib/stores/presence.store';
import { socketService } from '@/lib/websocket';
import { Skeleton } from './ui/skeleton';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatWindowProps {
  conversationId: string;
  onBack: () => void;
  onVideoCall: () => void;
}

export function ChatWindow({ conversationId, onBack, onVideoCall }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auth store
  const { user } = useAuthStore();

  // Fetch conversation details
  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);

  // Fetch messages with infinite scroll
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  // Send message mutation
  const sendMessageMutation = useSendMessage(conversationId);

  // Presence store for typing indicators
  const typingUsers = useTypingUsers(conversationId) || [];

  // Flatten all messages from pages
  const allMessages = messagesData?.pages.flatMap((page) => page.items) || [];

  // Get conversation info
  const getConversationInfo = () => {
    if (!conversation) return { name: 'Loading...', avatar: '', isOnline: false };

    if (conversation.type === 'direct') {
      const otherUser = conversation.participants?.[0];
      return {
        name: otherUser?.username || 'Unknown User',
        avatar: otherUser?.avatarUrl,
        isOnline: otherUser?.isOnline || false,
      };
    }

    return {
      name: conversation.name || 'Group Chat',
      avatar: conversation.avatarUrl,
      isOnline: false,
    };
  };

  const { name: conversationName, avatar: conversationAvatar, isOnline } = getConversationInfo();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length]);

  // Join conversation room on mount
  useEffect(() => {
    if (conversationId) {
      socketService.joinRoom(conversationId);
    }

    return () => {
      if (conversationId) {
        socketService.leaveRoom(conversationId);
      }
    };
  }, [conversationId]);

  // Handle typing indicator
  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start event
    socketService.sendTyping(conversationId, true);

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(conversationId, false);
    }, 3000);
  };

  const handleSend = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(
        {
          conversationId,
          content: message.trim(),
          type: 'text',
        },
        {
          onSuccess: () => {
            setMessage('');
            // Stop typing indicator
            socketService.sendTyping(conversationId, false);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            scrollToBottom();
          },
        }
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  // Format message timestamp
  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };

  const MessageBubble = ({ msg }: { msg: any }) => {
    const isMe = msg.senderId === user?.id;

    return (
      <div className={`flex gap-2 mb-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={msg.sender?.avatarUrl} />
            <AvatarFallback>
              {msg.sender?.username?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
          {!isMe && (
            <span className="text-xs text-muted-foreground mb-1">
              {msg.sender?.username || 'Unknown'}
            </span>
          )}

          <div className="group relative">
            <div
              className={`rounded-2xl px-4 py-2 ${
                isMe ? 'bg-blue-600 text-white' : 'bg-muted'
              } ${msg.type === 'image' ? 'p-0 overflow-hidden' : ''}`}
            >
              {msg.type === 'image' && msg.fileUrl ? (
                <img
                  src={msg.fileUrl}
                  alt="Shared image"
                  className="max-w-xs rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                />
              ) : (
                <p className="break-words whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>

            {/* Message actions */}
            <div className="absolute -top-8 right-0 hidden group-hover:flex items-center gap-1 bg-background border border-border rounded-lg shadow-lg p-1">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Reply className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Smile className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Reactions */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {msg.reactions.map((reaction: any, idx: number) => (
                <button
                  key={idx}
                  className="flex items-center gap-1 px-2 py-0.5 bg-muted hover:bg-muted/80 rounded-full text-xs"
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">{formatMessageTime(msg.createdAt)}</span>
            {isMe && (
              <span className="text-xs text-muted-foreground">
                {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓' : '⏱'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {conversationLoading ? (
            <>
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="w-10 h-10">
                <AvatarImage src={conversationAvatar} />
                <AvatarFallback>{conversationName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-medium">{conversationName}</h3>
                <p className="text-xs text-muted-foreground">
                  {typingUsers.length > 0
                    ? `${typingUsers.map((u) => u.username).join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`
                    : isOnline
                    ? 'Online'
                    : 'Offline'}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onVideoCall}>
            <Video className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Search in Conversation</DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Block User</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete Chat</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messagesLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
                <div className={`flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'} max-w-[70%]`}>
                  <Skeleton className="h-16 w-48 rounded-2xl" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-5xl mb-4">💬</div>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more messages'
                  )}
                </Button>
              </div>
            )}

            {allMessages
              .slice()
              .reverse()
              .map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={typingUsers[0]?.avatarUrl} />
              <AvatarFallback>{typingUsers[0]?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex gap-1 bg-muted rounded-full px-3 py-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ImageIcon className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              className="pr-10 min-h-[40px] resize-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>

          {message.trim() ? (
            <Button
              onClick={handleSend}
              size="icon"
              className="h-10 w-10"
              disabled={sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
