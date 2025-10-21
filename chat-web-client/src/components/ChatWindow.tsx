import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Loader2,
  Pin,
  Users,
} from "lucide-react";
import { useMessages, useSendMessage, useConversation, useAddReaction, useRemoveReaction, useUpdateMessage, useDeleteMessage, usePinMessage, useUnpinMessage, useInitiateCall } from "@/hooks";
import { useAuthStore } from "@/lib/stores";
import { useTypingUsers } from "@/lib/stores/presence.store";
import { socketService } from "@/lib/websocket";
import { mediaApi } from "@/lib/api/endpoints/media.api";
import { Skeleton } from "./ui/skeleton";
import { MessageComposer } from "./MessageComposer";
import { MessageBubble as MessageBubbleComponent } from "./MessageBubble";
import { ForwardMessageDialog } from "./ForwardMessageDialog";
import { PinnedMessagesPanel } from "./PinnedMessagesPanel";
import { GroupCallDialog } from "./GroupCallDialog";

interface ChatWindowProps {
  conversationId: string;
  onBack: () => void;
  onVideoCall: () => void;
  onCallInitiated?: (callData: {
    callId: string;
    recipientName: string;
    recipientAvatar?: string;
    callType: 'audio' | 'video';
  }) => void;
}

export function ChatWindow({
  conversationId,
  onBack,
  onVideoCall,
  onCallInitiated,
}: ChatWindowProps) {
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [showGroupCallDialog, setShowGroupCallDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auth store
  const { user } = useAuthStore();

  // Fetch conversation details
  const { data: conversation, isLoading: conversationLoading } =
    useConversation(conversationId);

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

  // Message action mutations
  const addReactionMutation = useAddReaction(conversationId);
  const removeReactionMutation = useRemoveReaction(conversationId);
  const updateMessageMutation = useUpdateMessage(conversationId);
  const deleteMessageMutation = useDeleteMessage(conversationId);
  const pinMessageMutation = usePinMessage(conversationId);
  const unpinMessageMutation = useUnpinMessage(conversationId);

  // Call initiation mutation
  const initiateCallMutation = useInitiateCall();

  // Presence store for typing indicators
  const typingUsers = useTypingUsers(conversationId) || [];

  // Flatten all messages from pages and filter out any undefined/null values
  const allMessages =
    messagesData?.pages
      .flatMap((page) => page.items)
      .filter((msg) => msg && msg.id) || [];

  // Helper function to transform reactions from backend format to UI format
  const transformReactions = (backendReactions: any[]) => {
    if (!backendReactions || backendReactions.length === 0) return [];

    // Group reactions by emoji
    const reactionMap = new Map<string, { emoji: string; userIds: string[]; userNames: string[]; count: number }>();

    backendReactions.forEach((reaction) => {
      const emoji = reaction.emoji;
      if (!reactionMap.has(emoji)) {
        reactionMap.set(emoji, { emoji, userIds: [], userNames: [], count: 0 });
      }
      const group = reactionMap.get(emoji)!;
      group.userIds.push(reaction.userId);
      // Get user's display name from the user object if available
      const displayName = reaction.user
        ? `${reaction.user.firstName || ''} ${reaction.user.lastName || ''}`.trim() || reaction.user.username
        : 'Unknown User';
      group.userNames.push(displayName);
      group.count++;
    });

    // Convert to UI format
    return Array.from(reactionMap.values()).map((group) => ({
      emoji: group.emoji,
      count: group.count,
      hasReacted: group.userIds.includes(user?.id || ""),
      users: group.userIds, // Include user IDs for removal
      userNames: group.userNames, // Include user names for tooltip
    }));
  };

  // Get conversation info
  const getConversationInfo = () => {
    if (!conversation)
      return { name: "Loading...", avatar: "", isOnline: false };

    if (conversation.type === "direct") {
      // Check if this is a self-conversation (My Notes)
      const isSelfConversation =
        conversation.participants?.length === 1 &&
        conversation.participants[0]?.user?.id === user?.id;

      if (isSelfConversation) {
        return {
          name: "My Notes",
          avatar: user?.avatarUrl,
          isOnline: false,
        };
      }

      // Find the other participant (not the current user)
      const otherParticipant = conversation.participants?.find(
        (p: any) => p.user?.id !== user?.id
      );
      const otherUser = otherParticipant?.user;

      if (!otherUser) {
        return { name: "Unknown User", avatar: "", isOnline: false };
      }

      const displayName =
        otherUser.firstName && otherUser.lastName
          ? `${otherUser.firstName} ${otherUser.lastName}`
          : otherUser.username;

      return {
        name: displayName || "Unknown User",
        avatar: otherUser.avatarUrl,
        isOnline: otherUser.isOnline || false,
      };
    }

    return {
      name: conversation.name || "Group Chat",
      avatar: conversation.avatarUrl,
      isOnline: false,
    };
  };

  const {
    name: conversationName,
    avatar: conversationAvatar,
    isOnline,
  } = getConversationInfo();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length]);

  // Join conversation room on mount for real-time message updates
  useEffect(() => {
    if (conversationId && socketService.isConnected()) {
      console.log('[ChatWindow] Joining conversation:', conversationId);
      socketService.joinConversation(conversationId);
    }

    return () => {
      if (conversationId && socketService.isConnected()) {
        console.log('[ChatWindow] Leaving conversation:', conversationId);
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId]);


  // Message action handlers
  const handleReply = (msg: any) => {
    setReplyingTo({
      id: msg.id,
      content: msg.content || "",
      senderName: msg.sender?.username || "Unknown",
    });
  };

  const handleForward = (msg: any) => {
    setForwardingMessage({
      id: msg.id,
      content: msg.content || "",
    });
  };

  const handleEdit = (msg: any) => {
    setEditingMessage({
      id: msg.id,
      content: msg.content || "",
    });
    // Clear reply state when editing
    setReplyingTo(null);
  };

  const handleDelete = async (messageId: string) => {
    // TODO: Add confirmation dialog
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessageMutation.mutateAsync(messageId);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      // Find if user already reacted with this emoji
      const message = allMessages.find(m => m.id === messageId);
      const transformedReactions = transformReactions(message?.reactions || []);
      const existingReaction = transformedReactions.find(
        r => r.emoji === emoji && r.hasReacted
      );

      if (existingReaction) {
        // Remove reaction - backend expects emoji, not reactionId
        await removeReactionMutation.mutateAsync({
          messageId,
          emoji,
        });
      } else {
        // Add reaction
        await addReactionMutation.mutateAsync({
          id: messageId,
          data: { emoji },
        });
      }
    } catch (error) {
      console.error("Failed to react to message:", error);
    }
  };

  const handlePin = async (messageId: string) => {
    try {
      // TODO: Check if message is already pinned and call unpin if so
      await pinMessageMutation.mutateAsync(messageId);
    } catch (error) {
      console.error("Failed to pin message:", error);
    }
  };

  return (
    <div className="h-full flex bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
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
                <AvatarFallback>
                  {conversationName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-medium">{conversationName}</h3>
                <p className="text-xs text-muted-foreground">
                  {typingUsers.length > 0
                    ? `${typingUsers.map((u) => u.username).join(", ")} ${
                        typingUsers.length === 1 ? "is" : "are"
                      } typing...`
                    : isOnline
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowPinnedPanel(!showPinnedPanel)}
            title="View pinned messages"
          >
            <Pin className={`w-5 h-5 ${showPinnedPanel ? 'text-primary fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={async () => {
              try {
                const call = await initiateCallMutation.mutateAsync({
                  conversationId,
                  type: 'audio' as const,
                });

                // Get recipient info from conversation
                const { name: conversationName, avatar } = getConversationInfo();

                // Show outgoing call modal
                onCallInitiated?.({
                  callId: call.id,
                  recipientName: conversationName,
                  recipientAvatar: avatar,
                  callType: 'audio',
                });
              } catch (error) {
                console.error('Failed to initiate audio call:', error);
              }
            }}
            disabled={initiateCallMutation.isPending}
            title="Start audio call"
          >
            {initiateCallMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={async () => {
              try {
                const call = await initiateCallMutation.mutateAsync({
                  conversationId,
                  type: 'video' as const,
                });

                // Get recipient info from conversation
                const { name: conversationName, avatar } = getConversationInfo();

                // Show outgoing call modal
                onCallInitiated?.({
                  callId: call.id,
                  recipientName: conversationName,
                  recipientAvatar: avatar,
                  callType: 'video',
                });
              } catch (error) {
                console.error('Failed to initiate video call:', error);
              }
            }}
            disabled={initiateCallMutation.isPending}
            title="Start video call"
          >
            {initiateCallMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowGroupCallDialog(true)}>
                <Users className="w-4 h-4 mr-2" />
                Start Group Call
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Search in Conversation</DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Block User</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messagesLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {i % 2 === 0 && (
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                )}
                <div
                  className={`flex flex-col ${
                    i % 2 === 0 ? "items-start" : "items-end"
                  } max-w-[70%]`}
                >
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
                    "Load more messages"
                  )}
                </Button>
              </div>
            )}

            {allMessages.map((msg) => (
              <MessageBubbleComponent
                key={msg.id}
                message={{
                  id: msg.id,
                  content: msg.content,
                  senderId: msg.senderId,
                  senderName: msg.sender?.username || "Unknown",
                  senderAvatar: msg.sender?.avatarUrl,
                  messageType: msg.messageType as any,
                  createdAt: msg.createdAt,
                  isEdited: msg.isEdited,
                  isDeleted: msg.isDeleted,
                  isPinned: (msg as any).isPinned,
                  replyTo: msg.replyTo ? {
                    id: msg.replyTo.id,
                    content: msg.replyTo.content,
                    senderName: msg.replyTo.sender?.username || "Unknown",
                  } : undefined,
                  reactions: transformReactions(msg.reactions || []),
                  metadata: msg.metadata,
                }}
                currentUserId={user?.id || ""}
                isGroupChat={conversation?.type === "group"}
                onReply={handleReply}
                onForward={handleForward}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReact={handleReact}
                onPin={handlePin}
              />
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
              <AvatarFallback>
                {typingUsers[0]?.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-1 bg-muted rounded-full px-3 py-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      )}

      {/* Message Composer */}
      <MessageComposer
        conversationId={conversationId}
        onSendMessage={async (content, attachments, messageType) => {
          try {
            // Check if we're editing a message
            if (editingMessage) {
              // Update existing message
              await updateMessageMutation.mutateAsync({
                id: editingMessage.id,
                data: { content: content.trim() },
              });
              setEditingMessage(null);
              return;
            }

            // Handle file uploads first if there are attachments
            let uploadedFiles: any[] = [];
            if (attachments && attachments.length > 0) {
              // Upload files to media service
              const uploadPromises = attachments.map((file) =>
                mediaApi.upload(file)
              );
              const responses = await Promise.all(uploadPromises);
              // Extract the actual data from nested response structure
              uploadedFiles = responses.map(response => response.data || response);
            }

            // Send new message with uploaded file URLs
            await sendMessageMutation.mutateAsync({
              conversationId,
              content: content.trim(),
              type: messageType || (uploadedFiles.length > 0 ? "file" : "text"),
              replyToId: replyingTo?.id,
              metadata: uploadedFiles.length > 0 ? {
                files: uploadedFiles.map(f => ({
                  id: f.id,
                  fileName: f.filename || f.originalName, // API uses 'filename' not 'fileName'
                  fileSize: parseInt(f.size) || 0,
                  fileUrl: f.url,
                  mimeType: f.mimeType,
                  thumbnailUrl: f.thumbnailUrl,
                }))
              } : undefined,
            });

            // Clear reply state after sending
            setReplyingTo(null);

            // Stop typing indicator
            socketService.sendTyping(conversationId, false);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }

            scrollToBottom();
          } catch (error) {
            console.error("Failed to send/edit message:", error);
          }
        }}
        replyingTo={replyingTo}
        editingMessage={editingMessage}
        onCancelReply={() => setReplyingTo(null)}
        onCancelEdit={() => setEditingMessage(null)}
        placeholder={editingMessage ? "Edit message..." : "Type a message..."}
        disabled={sendMessageMutation.isPending || updateMessageMutation.isPending}
        initialValue={editingMessage?.content}
      />

      {/* Forward Message Dialog */}
        {forwardingMessage && (
          <ForwardMessageDialog
            open={!!forwardingMessage}
            onOpenChange={(open) => {
              if (!open) setForwardingMessage(null);
            }}
            messageId={forwardingMessage.id}
            messagePreview={forwardingMessage.content}
          />
        )}
      </div>

      {/* Pinned Messages Panel */}
      {showPinnedPanel && (
        <PinnedMessagesPanel
          conversationId={conversationId}
          onClose={() => setShowPinnedPanel(false)}
          onMessageClick={(messageId) => {
            // TODO: Scroll to message in chat
            console.log('Scroll to message:', messageId);
          }}
          onUnpin={async (messageId) => {
            try {
              await unpinMessageMutation.mutateAsync(messageId);
            } catch (error) {
              console.error('Failed to unpin message:', error);
            }
          }}
        />
      )}

      {/* Group Call Dialog */}
      <GroupCallDialog
        open={showGroupCallDialog}
        onOpenChange={setShowGroupCallDialog}
        conversationId={conversationId}
        onCallInitiated={onCallInitiated}
      />
    </div>
  );
}
