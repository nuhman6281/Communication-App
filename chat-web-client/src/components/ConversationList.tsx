import { useState, useMemo, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Search,
  Plus,
  MoreVertical,
  Users,
  Hash,
  Volume2,
  Loader2,
  Bookmark,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useConversations, useSelfConversation } from "@/hooks";
import { useAuthStore, usePresenceStore, useConversationUnread } from "@/lib/stores";
import { socketService } from "@/lib/websocket";
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { WorkspaceSelector } from "./workspace/WorkspaceSelector";
import { NewMessageDialog } from "./NewMessageDialog";
import { CreateChannelDialog } from "./CreateChannelDialog";
import { UserStatusBadge } from "./UserStatusBadge";

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateGroup: () => void;
  onSearch?: () => void;
}

// Sub-component for real-time unread badge
function ConversationUnreadBadge({ conversationId }: { conversationId: string }) {
  const unreadCount = useConversationUnread(conversationId);

  if (unreadCount === 0) return null;

  return (
    <Badge className="bg-blue-600 hover:bg-blue-700">
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}

export function ConversationList({
  selectedId,
  onSelect,
  onCreateGroup,
  onSearch,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "direct" | "groups" | "channels"
  >("all");
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
  const { user } = useAuthStore();
  // Subscribe to entire presenceMap to trigger re-renders when ANY presence changes
  const presenceMap = usePresenceStore((state) => state.presenceMap);

  // Fetch conversations from API
  const { data, isLoading, error } = useConversations({
    type:
      filter === "all"
        ? undefined
        : filter === "direct"
        ? "direct"
        : filter === "groups"
        ? "group"
        : "channel",
    search: searchQuery || undefined,
  });

  // Fetch self-conversation
  const { data: selfConversation } = useSelfConversation();

  // Format timestamp helper
  const formatTimestamp = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  // Get the other participant in a direct conversation
  const getOtherParticipant = (conversation: any) => {
    if (conversation.type !== "direct" || !conversation.participants) {
      return null;
    }
    // Find the participant that is not the current user
    return conversation.participants.find(
      (p: any) => p.user?.id !== user?.id
    )?.user;
  };

  // Get conversation name helper
  const getConversationName = (conversation: any) => {
    if (conversation.type === "direct") {
      // For direct conversations, get the other participant's name
      const otherUser = getOtherParticipant(conversation);
      if (!otherUser) return "Unknown User";

      if (otherUser.firstName && otherUser.lastName) {
        return `${otherUser.firstName} ${otherUser.lastName}`;
      }
      return otherUser.username || "Unknown User";
    }
    return conversation.name || "Unnamed";
  };

  // Get conversation avatar helper
  const getConversationAvatar = (conversation: any) => {
    if (conversation.type === "direct") {
      const otherUser = getOtherParticipant(conversation);
      return otherUser?.avatarUrl;
    }
    return conversation.avatarUrl;
  };

  // Get online status for direct conversations
  const isOnline = (conversation: any) => {
    if (conversation.type === "direct") {
      const otherUser = getOtherParticipant(conversation);
      return otherUser?.isOnline || false;
    }
    return false;
  };

  // Check if conversation is self-conversation (for personal notes)
  const isSelfConversation = (conversation: any) => {
    return (
      conversation.type === "direct" &&
      conversation.participants?.length === 1 &&
      conversation.participants[0]?.id === user?.id
    );
  };

  // Get presence status from store (real-time) or API data (fallback)
  const getPresenceStatus = (otherUser: any) => {
    if (!otherUser?.id) return 'offline';

    // Try to get from presence store first (real-time updates)
    const presence = presenceMap[otherUser.id];
    if (presence) {
      console.log('[ConversationList] 🟢 Using presence from store for user', otherUser.id, ':', presence.status);
      return presence.status;
    }

    // Fallback to API data
    console.log('[ConversationList] ⚪ Using fallback presence from API for user', otherUser.id, ':', otherUser.presenceStatus || 'offline');
    return otherUser.presenceStatus || 'offline';
  };

  const filteredConversations = data?.items || [];

  // Debug: Log presenceMap changes
  useEffect(() => {
    console.log('[ConversationList] 📊 Presence map updated. Total users:', Object.keys(presenceMap).length);
    console.log('[ConversationList] Current presence states:', presenceMap);
  }, [presenceMap]);

  // Subscribe to presence updates for all direct conversation participants
  useEffect(() => {
    if (!filteredConversations || filteredConversations.length === 0) {
      console.log('[ConversationList] ⏭️  No conversations to subscribe to');
      return;
    }

    // Collect all user IDs from direct conversations
    const userIds: string[] = [];
    filteredConversations.forEach((conv) => {
      if (conv.type === 'direct') {
        const otherUser = getOtherParticipant(conv);
        if (otherUser?.id) {
          userIds.push(otherUser.id);
        }
      }
    });

    if (userIds.length === 0) {
      console.log('[ConversationList] ⏭️  No direct conversations with valid user IDs');
      return;
    }

    // Function to subscribe to presence
    const subscribeToUsers = () => {
      if (socketService.isConnected()) {
        console.log('[ConversationList] 📡 Subscribing to presence for', userIds.length, 'users:', userIds);
        socketService.subscribeToPresence(userIds);
      } else {
        console.warn('[ConversationList] ⚠️ Cannot subscribe - socket not connected');
      }
    };

    // Subscribe immediately if socket is already connected
    subscribeToUsers();

    // Also resubscribe on socket reconnection
    const handleReconnect = () => {
      console.log('[ConversationList] 🔄 Socket reconnected, resubscribing to presence for', userIds.length, 'users');
      subscribeToUsers();
    };

    socketService.on('connect', handleReconnect);

    // Cleanup: remove listener and unsubscribe
    return () => {
      socketService.off('connect', handleReconnect);

      if (socketService.isConnected()) {
        console.log('[ConversationList] 🔌 Unsubscribing from presence for', userIds.length, 'users');
        socketService.unsubscribeFromPresence(userIds);
      }
    };
  }, [filteredConversations]);

  const getConversationIcon = (type: string) => {
    if (type === "group") return <Users className="w-3 h-3" />;
    if (type === "channel") return <Hash className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Workspace Selector */}
        <WorkspaceSelector />

        <div className="flex items-center justify-between">
          <h2 className="text-xl">Messages</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowNewMessageDialog(true)}>
                New Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateGroup}>
                Create Group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCreateChannelDialog(true)}>
                Create Channel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onSearch}
          />
        </div>

        {/* Quick Access - My Notes */}
        {selfConversation && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-left h-auto py-2 px-3"
            onClick={() => onSelect(selfConversation.id)}
          >
            <Bookmark className="w-4 h-4 text-primary" />
            <div className="flex-1 min-w-0">
              <span className="font-medium">My Notes</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                You
              </Badge>
            </div>
          </Button>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "direct", "groups", "channels"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize shrink-0"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-red-500">Failed to load conversations</p>
            <p className="text-xs mt-1">{error.message}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const convName = getConversationName(conversation);
              const convAvatar = getConversationAvatar(conversation);
              const convOnline = isOnline(conversation);
              const isSelf = isSelfConversation(conversation);
              const otherUser = getOtherParticipant(conversation);
              const userPresence = getPresenceStatus(otherUser);

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
                    selectedId === conversation.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={convAvatar} />
                      <AvatarFallback>
                        {isSelf ? (
                          <Bookmark className="w-5 h-5 text-primary" />
                        ) : (
                          convName.slice(0, 2).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.type === "direct" && !isSelf && (
                      <UserStatusBadge
                        status={userPresence}
                        size="md"
                        showBorder={true}
                        className="absolute bottom-0 right-0"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {isSelf ? (
                          <>
                            <Bookmark className="w-3 h-3 text-primary" />
                            <span className="truncate font-medium">
                              {user?.firstName || "You"}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Notes
                            </Badge>
                          </>
                        ) : (
                          <>
                            {getConversationIcon(conversation.type) && (
                              <span className="text-muted-foreground">
                                {getConversationIcon(conversation.type)}
                              </span>
                            )}
                            <span className="truncate font-medium">
                              {convName}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatTimestamp(conversation.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage?.content || "No messages yet"}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ConversationUnreadBadge conversationId={conversation.id} />
                      </div>
                    </div>

                    {conversation.type === "group" &&
                      conversation.memberCount && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversation.memberCount} members
                        </p>
                      )}
                    {conversation.type === "channel" &&
                      conversation.subscriberCount && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversation.subscriberCount} subscribers
                        </p>
                      )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        onConversationCreated={(conversationId) => {
          onSelect(conversationId);
        }}
      />

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={showCreateChannelDialog}
        onOpenChange={setShowCreateChannelDialog}
        onChannelCreated={(channelId) => {
          onSelect(channelId);
        }}
      />
    </div>
  );
}
