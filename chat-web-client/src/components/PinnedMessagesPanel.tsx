/**
 * Pinned Messages Panel Component
 * Displays pinned messages for a conversation in a side panel
 */

import { X, Pin, User } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { usePinnedMessages } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import { MessageContentRenderer } from './MessageContentRenderer';

interface PinnedMessagesPanelProps {
  conversationId: string;
  onClose: () => void;
  onMessageClick?: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
}

export function PinnedMessagesPanel({
  conversationId,
  onClose,
  onMessageClick,
  onUnpin,
}: PinnedMessagesPanelProps) {
  const { data, isLoading } = usePinnedMessages(conversationId);

  const pinnedMessages = data?.pinnedMessages || [];
  const count = data?.count || 0;

  return (
    <div className="h-full flex flex-col bg-background border-l border-border w-80 lg:w-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Pin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Pinned Messages</h3>
          {count > 0 && (
            <span className="text-xs text-muted-foreground">({count})</span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading ? (
            // Loading skeletons
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </>
          ) : pinnedMessages.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Pin className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">No pinned messages</p>
              <p className="text-xs mt-1 text-center px-4">
                Pin important messages to find them easily later
              </p>
            </div>
          ) : (
            // Pinned messages list
            pinnedMessages.map((pinnedMessage: any) => {
              const message = pinnedMessage.message;
              const sender = message?.sender;
              const pinnedBy = pinnedMessage.pinnedBy;

              return (
                <div
                  key={pinnedMessage.id}
                  className="group p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onMessageClick?.(message.id)}
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={sender?.avatarUrl} />
                        <AvatarFallback>
                          {sender?.username?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {sender?.username || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    {onUnpin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpin(message.id);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="pl-10">
                    <div className="text-sm break-words line-clamp-4">
                      <MessageContentRenderer message={message} />
                    </div>

                    {/* Message metadata */}
                    {message.isEdited && (
                      <span className="text-xs text-muted-foreground mt-1 inline-block">
                        (edited)
                      </span>
                    )}
                  </div>

                  {/* Pinned by info */}
                  <div className="pl-10 mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Pin className="w-3 h-3" />
                    <span>
                      Pinned by {pinnedBy?.username || 'someone'}
                    </span>
                    {pinnedMessage.pinnedAt && (
                      <span>
                        • {formatDistanceToNow(new Date(pinnedMessage.pinnedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
