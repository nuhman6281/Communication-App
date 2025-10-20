import React, { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Reply,
  Forward,
  Copy,
  Edit3,
  Trash2,
  MoreVertical,
  Pin,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { MessageContentRenderer } from "./MessageContentRenderer";

// Markdown rendering for message content

interface Message {
  id: string;
  content?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messageType:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "file"
    | "poll"
    | "code"
    | "gif"
    | "sticker"
    | "location"
    | "contact";
  createdAt: string | Date;
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
    userNames?: string[];
    hasReacted: boolean;
  }[];
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
    mimeType?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
    language?: string; // for code
    latitude?: number; // for location
    longitude?: number;
    contactName?: string; // for contact
    contactPhone?: string;
    pollQuestion?: string; // for poll
    pollOptions?: { id: string; text: string; votes: number }[];
    pollTotalVotes?: number;
    // Multiple files support
    files?: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      fileUrl: string;
      mimeType: string;
      thumbnailUrl?: string;
    }>;
  };
}

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  isGroupChat?: boolean;
  showAvatar?: boolean;
  showSenderName?: boolean;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string) => void;
  className?: string;
}

export function MessageBubble({
  message,
  currentUserId,
  isGroupChat = false,
  showAvatar = true,
  showSenderName = true,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onReact,
  onPin,
  className,
}: MessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const isOwnMessage = message.senderId === currentUserId;
  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`;
    } else {
      return format(date, "MMM dd, HH:mm");
    }
  };

  const renderMessageContent = () => {
    return (
      <MessageContentRenderer
        message={message}
        isOwnMessage={isOwnMessage}
        showFullContent={true}
      />
    );
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        "group flex gap-2 mb-4",
        isOwnMessage ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback>
            {message.senderName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content wrapper */}
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {/* Sender name and timestamp */}
        {!isOwnMessage && (showSenderName || isGroupChat) && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {message.senderName}
          </span>
        )}

        {/* Reply indicator */}
        {message.replyTo && (
          <div
            className={cn(
              "mb-1 pl-2 border-l-2 border-blue-500 text-xs",
              isOwnMessage ? "mr-2" : "ml-2"
            )}
          >
            <div className="font-medium text-blue-500">
              {message.replyTo.senderName}
            </div>
            <div className="text-muted-foreground line-clamp-1">
              {message.replyTo.content}
            </div>
          </div>
        )}

        {/* Pin indicator - positioned above message */}
        {message.isPinned && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-1 w-fit",
              "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
            )}
          >
            <Pin className="h-3 w-3 fill-current" />
            <span className="font-medium">Pinned</span>
          </div>
        )}

        {/* Message bubble with hover actions */}
        <div className="relative">
          {/* Hover actions - positioned to not shift message */}
          {!message.isDeleted && (
            <div
              className={cn(
                "absolute -top-8 flex items-center gap-1 bg-background border border-border rounded-lg shadow-lg p-1",
                "opacity-0 group-hover:opacity-100 transition-opacity z-[100]",
                isOwnMessage ? "right-0" : "left-0"
              )}
              style={{
                top: "auto",
                bottom: "100%",
                marginBottom: "4px",
              }}
            >
              {/* Quick emoji reaction */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <div className="flex gap-2">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        className="text-xl hover:bg-muted rounded-lg p-2 transition-colors hover:scale-110"
                        onClick={() => {
                          onReact?.(message.id, emoji);
                          setShowEmojiPicker(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* More actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                  {onReply && (
                    <DropdownMenuItem onClick={() => onReply(message)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                  )}
                  {onForward && (
                    <DropdownMenuItem onClick={() => onForward(message)}>
                      <Forward className="h-4 w-4 mr-2" />
                      Forward
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() =>
                      navigator.clipboard.writeText(message.content || "")
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy text
                  </DropdownMenuItem>
                  {onPin && (
                    <DropdownMenuItem onClick={() => onPin(message.id)}>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin message
                    </DropdownMenuItem>
                  )}
                  {isOwnMessage && (
                    <>
                      <DropdownMenuSeparator />
                      {onEdit && message.messageType === "text" && (
                        <DropdownMenuItem onClick={() => onEdit(message)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(message.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Message body */}
          <div
            className={cn(
              "rounded-2xl px-4 py-2",
              message.messageType === "image" ||
                message.messageType === "video" ||
                (message.metadata?.files && message.metadata.files.length > 0)
                ? "p-2 overflow-hidden bg-transparent"
                : "",
              isOwnMessage &&
                !(message.metadata?.files && message.metadata.files.length > 0)
                ? "bg-blue-600 text-white"
                : !isOwnMessage &&
                  !(
                    message.metadata?.files && message.metadata.files.length > 0
                  )
                ? "bg-muted"
                : ""
            )}
          >
            {renderMessageContent()}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map((reaction, idx) => {
                // Format the tooltip text with user names
                const tooltipText =
                  reaction.userNames && reaction.userNames.length > 0
                    ? reaction.userNames.join(", ")
                    : `${reaction.count} ${
                        reaction.count === 1 ? "person" : "people"
                      } reacted`;

                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-105",
                          reaction.hasReacted
                            ? "bg-blue-600/10 border-blue-600 text-blue-600 dark:bg-blue-500/20"
                            : "bg-muted border-border hover:bg-muted/80 hover:border-muted-foreground/30"
                        )}
                        onClick={() => onReact?.(message.id, reaction.emoji)}
                      >
                        <span>{reaction.emoji}</span>
                        <span className="font-medium">{reaction.count}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-slate-900 dark:bg-slate-800 text-white border-slate-700 px-3 py-2 max-w-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium">{tooltipText}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}

        {/* Timestamp and status */}
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-xs text-muted-foreground italic">
              (edited)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
