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
} from 'lucide-react';

interface ChatWindowProps {
  conversationId: string;
  onBack: () => void;
  onVideoCall: () => void;
}

const mockMessages = [
  {
    id: '1',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Hey! How are you doing?',
    timestamp: '10:30 AM',
    status: 'read',
    type: 'text',
  },
  {
    id: '2',
    senderId: 'me',
    senderName: 'You',
    content: "I'm doing great! Working on the new project",
    timestamp: '10:32 AM',
    status: 'read',
    type: 'text',
  },
  {
    id: '3',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'That sounds exciting! Can you share some details?',
    timestamp: '10:33 AM',
    status: 'read',
    type: 'text',
  },
  {
    id: '4',
    senderId: 'me',
    senderName: 'You',
    content: 'Sure! Here are some screenshots of the interface',
    timestamp: '10:35 AM',
    status: 'read',
    type: 'text',
  },
  {
    id: '5',
    senderId: 'me',
    senderName: 'You',
    content: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400',
    timestamp: '10:35 AM',
    status: 'read',
    type: 'image',
  },
  {
    id: '6',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Wow, this looks amazing! 🎉',
    timestamp: '10:37 AM',
    status: 'read',
    type: 'text',
    reactions: [
      { emoji: '👍', count: 1, users: ['me'] },
      { emoji: '❤️', count: 1, users: ['user3'] },
    ],
  },
  {
    id: '7',
    senderId: 'me',
    senderName: 'You',
    content: 'Thanks! Let me know if you have any feedback',
    timestamp: '10:38 AM',
    status: 'delivered',
    type: 'text',
  },
];

export function ChatWindow({ conversationId, onBack, onVideoCall }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const MessageBubble = ({ msg }: { msg: any }) => {
    const isMe = msg.senderId === 'me';

    return (
      <div className={`flex gap-2 mb-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={msg.senderAvatar} />
            <AvatarFallback>{msg.senderName.slice(0, 2)}</AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
          {!isMe && <span className="text-xs text-muted-foreground mb-1">{msg.senderName}</span>}

          <div className="group relative">
            <div
              className={`rounded-2xl px-4 py-2 ${
                isMe
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted'
              } ${msg.type === 'image' ? 'p-0 overflow-hidden' : ''}`}
            >
              {msg.type === 'image' ? (
                <img
                  src={msg.content}
                  alt="Shared image"
                  className="max-w-xs rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                />
              ) : (
                <p className="break-words">{msg.content}</p>
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
            <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
            {isMe && (
              <span className="text-xs text-muted-foreground">
                {msg.status === 'read' ? '✓✓' : '✓'}
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
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Avatar className="w-10 h-10">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
            <AvatarFallback>SJ</AvatarFallback>
          </Avatar>

          <div>
            <h3>Sarah Johnson</h3>
            <p className="text-xs text-muted-foreground">
              {isTyping ? 'typing...' : 'Online'}
            </p>
          </div>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
              <AvatarFallback>SJ</AvatarFallback>
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
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
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
            <Button onClick={handleSend} size="icon" className="h-10 w-10">
              <Send className="w-5 h-5" />
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
