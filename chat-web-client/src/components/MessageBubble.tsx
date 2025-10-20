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
  Download,
  ExternalLink,
  FileText,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Film,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { format, isToday, isYesterday } from "date-fns";
import "highlight.js/styles/github-dark.css";

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType.startsWith("video/")) return Film;
    if (mimeType.startsWith("audio/")) return Music;
    if (mimeType.includes("pdf")) return FileText;
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return FileArchive;
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return FileSpreadsheet;
    if (mimeType.includes("code") || mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("python")) return FileCode;
    return FileText;
  };

  const renderImageFiles = (images: any[]) => {
    return (
      <div className="space-y-2">
        {images.length > 0 && (
          <div className={cn(
            "grid gap-2",
            images.length === 1 ? "grid-cols-1" :
            images.length === 2 ? "grid-cols-2" :
            images.length === 3 ? "grid-cols-3" :
            "grid-cols-2"
          )}>
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.thumbnailUrl || img.fileUrl}
                  alt={img.fileName}
                  className="rounded-lg max-w-full max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(img.fileUrl, "_blank")}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(img.fileUrl, "_blank");
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {message.content && (
          <div className="text-sm px-2">{message.content}</div>
        )}
      </div>
    );
  };

  const renderVideoFiles = (videos: any[]) => {
    return (
      <div className="space-y-2">
        {videos.map((video, idx) => (
          <div key={idx} className="relative group">
            <video
              controls
              className="rounded-lg max-w-sm max-h-96 w-full"
              src={video.fileUrl}
              poster={video.thumbnailUrl}
            />
            <div className="text-xs text-muted-foreground mt-1 px-1">
              {video.fileName} • {formatFileSize(video.fileSize)}
            </div>
          </div>
        ))}
        {message.content && (
          <div className="text-sm px-2">{message.content}</div>
        )}
      </div>
    );
  };

  const renderAudioFiles = (audios: any[]) => {
    return (
      <div className="space-y-2">
        {audios.map((audio, idx) => (
          <div key={idx} className="space-y-2">
            <audio controls className="w-full max-w-sm">
              <source src={audio.fileUrl} type={audio.mimeType} />
            </audio>
            <div className="text-xs text-muted-foreground px-1">
              {audio.fileName} • {formatFileSize(audio.fileSize)}
            </div>
          </div>
        ))}
        {message.content && (
          <div className="text-sm px-2">{message.content}</div>
        )}
      </div>
    );
  };

  const renderFileAttachments = (files: any[]) => {
    return (
      <div className="space-y-2">
        {files.map((file, idx) => {
          const FileIcon = getFileIcon(file.mimeType);
          const mimeType = file.mimeType || "";
          // Extract just the original filename from the long stored filename
          const displayName = file.fileName?.split('-').slice(5).join('-') || file.fileName || 'Unknown file';

          return (
            <div key={idx} className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer max-w-md",
              isOwnMessage
                ? "bg-white/95 dark:bg-slate-800 border-white/20 dark:border-slate-700"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            )}
            onClick={() => window.open(file.fileUrl, "_blank")}
            >
              <div className={cn(
                "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm",
                mimeType.includes("pdf") ? "bg-red-100 dark:bg-red-900/40" :
                mimeType.includes("zip") || mimeType.includes("rar") ? "bg-yellow-100 dark:bg-yellow-900/40" :
                mimeType.includes("sheet") || mimeType.includes("excel") ? "bg-green-100 dark:bg-green-900/40" :
                mimeType.includes("doc") || mimeType.includes("word") ? "bg-blue-100 dark:bg-blue-900/40" :
                mimeType.includes("json") || mimeType.includes("xml") ? "bg-purple-100 dark:bg-purple-900/40" :
                "bg-slate-100 dark:bg-slate-700"
              )}>
                <FileIcon className={cn(
                  "h-6 w-6",
                  mimeType.includes("pdf") ? "text-red-600 dark:text-red-400" :
                  mimeType.includes("zip") || mimeType.includes("rar") ? "text-yellow-600 dark:text-yellow-400" :
                  mimeType.includes("sheet") || mimeType.includes("excel") ? "text-green-600 dark:text-green-400" :
                  mimeType.includes("doc") || mimeType.includes("word") ? "text-blue-600 dark:text-blue-400" :
                  mimeType.includes("json") || mimeType.includes("xml") ? "text-purple-600 dark:text-purple-400" :
                  "text-slate-600 dark:text-slate-400"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-sm truncate",
                  isOwnMessage ? "text-slate-900 dark:text-slate-100" : "text-slate-900 dark:text-slate-100"
                )}>
                  {displayName}
                </div>
                <div className={cn(
                  "text-xs mt-0.5",
                  isOwnMessage ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"
                )}>
                  {formatFileSize(file.fileSize)} • {mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "shrink-0 h-8 w-8",
                  isOwnMessage ? "hover:bg-slate-100 dark:hover:bg-slate-700" : "hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(file.fileUrl, "_blank");
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {message.content && (
          <div className={cn(
            "text-sm mt-2",
            isOwnMessage ? "text-white" : "text-slate-900 dark:text-slate-100"
          )}>{message.content}</div>
        )}
      </div>
    );
  };

  const renderMessageContent = () => {
    if (message.isDeleted) {
      return (
        <div className="italic text-muted-foreground text-sm">
          This message was deleted
        </div>
      );
    }

    // Check if message has file attachments regardless of messageType
    const hasFiles = message.metadata?.files && message.metadata.files.length > 0;

    // If there are files, render them with appropriate handlers
    if (hasFiles) {
      const files = message.metadata!.files!;
      const hasImages = files.some(f => f.mimeType?.startsWith("image/"));
      const hasVideos = files.some(f => f.mimeType?.startsWith("video/"));
      const hasAudio = files.some(f => f.mimeType?.startsWith("audio/"));

      // Separate files by type for proper rendering
      if (hasImages && !hasVideos && !hasAudio) {
        // Render as image message
        return renderImageFiles(files.filter(f => f.mimeType?.startsWith("image/")));
      } else if (hasVideos && !hasImages && !hasAudio) {
        // Render as video message
        return renderVideoFiles(files.filter(f => f.mimeType?.startsWith("video/")));
      } else if (hasAudio && !hasImages && !hasVideos) {
        // Render as audio message
        return renderAudioFiles(files.filter(f => f.mimeType?.startsWith("audio/")));
      } else {
        // Mixed types or other files - render as file attachments
        return renderFileAttachments(files);
      }
    }

    switch (message.messageType) {
      case "text":
        const markdownComponents: Components = {
          // INLINE CODE (single backtick `) - ORANGE/AMBER BADGE
          code: (props) => {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const inline = !match;

            return !inline ? (
              // Code block content (inside pre)
              <code className={cn("block", className)} {...rest}>
                {children}
              </code>
            ) : (
              // Inline code with distinctive AMBER/ORANGE badge style
              <code
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md font-mono text-[11px] font-semibold shadow-sm",
                  isOwnMessage
                    ? "bg-orange-500/25 text-orange-100 ring-2 ring-orange-400/40"
                    : "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 ring-2 ring-orange-400/50"
                )}
                {...rest}
              >
                {children}
              </code>
            );
          },

          p: ({ children }) => <p className="leading-relaxed mb-1">{children}</p>,

          // CODE BLOCK (triple backtick ```) - DARK TERMINAL WITH GREEN ACCENT AND DRAMATIC STYLING
          pre: ({ children }) => (
            <div
              className={cn(
                "relative mt-4 mb-3 rounded-xl overflow-hidden shadow-2xl border-2",
                isOwnMessage
                  ? "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border-emerald-500/50 shadow-emerald-500/20"
                  : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-emerald-400/60 shadow-emerald-400/30"
              )}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              {/* Code block header with terminal dots and title */}
              <div
                className={cn(
                  "px-4 py-2.5 text-[11px] font-bold border-b-2 flex items-center justify-between",
                  isOwnMessage
                    ? "bg-slate-900/60 border-emerald-600/50 text-emerald-300"
                    : "bg-slate-900/80 border-emerald-500/60 text-emerald-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                  </div>
                  <span className="uppercase tracking-wider">Code Block</span>
                </div>
                <div className="text-[9px] px-2 py-0.5 bg-emerald-600/30 rounded">SYNTAX</div>
              </div>
              <pre className={cn(
                "p-4 overflow-x-auto font-mono text-xs leading-relaxed min-h-[60px]",
                isOwnMessage
                  ? "text-emerald-300 bg-slate-950/40"
                  : "text-emerald-400 bg-slate-950/60"
              )}>
                {children}
              </pre>
            </div>
          ),

          // BOLD (**text**) - EXTRA BOLD WITH SLIGHT YELLOW TINT
          strong: ({ children }) => (
            <strong
              className={cn(
                "font-extrabold px-0.5 tracking-tight",
                isOwnMessage
                  ? "text-yellow-100 drop-shadow-sm"
                  : "text-gray-900 dark:text-yellow-50"
              )}
            >
              {children}
            </strong>
          ),

          // ITALIC (*text*) - PURPLE/VIOLET SLANT
          em: ({ children }) => (
            <em
              className={cn(
                "italic px-1 font-medium",
                isOwnMessage
                  ? "text-purple-200 not-italic"
                  : "text-purple-700 dark:text-purple-300 not-italic"
              )}
              style={{ fontStyle: "italic" }}
            >
              {children}
            </em>
          ),

          // STRIKETHROUGH (~~text~~) - BOLD RED STRIKE
          del: ({ children }) => (
            <del
              className={cn(
                "line-through decoration-[2.5px] px-0.5",
                isOwnMessage
                  ? "decoration-red-400 text-red-100/70"
                  : "decoration-red-600 dark:decoration-red-500 text-red-700 dark:text-red-400"
              )}
            >
              {children}
            </del>
          ),

          // LINKS ([text](url)) - CYAN/SKY BLUE WITH ICON
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1 underline decoration-2 underline-offset-2 hover:underline-offset-4 transition-all font-semibold",
                isOwnMessage
                  ? "text-cyan-200 decoration-cyan-300/70 hover:decoration-cyan-100 hover:text-cyan-100"
                  : "text-cyan-600 dark:text-cyan-400 decoration-cyan-500/60 hover:decoration-cyan-700 dark:hover:decoration-cyan-300"
              )}
            >
              {children}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ),

          // UNORDERED LISTS (- item) - TEAL BULLETS
          ul: ({ children }) => (
            <ul
              className={cn(
                "space-y-1 my-2 ml-4 list-disc list-outside",
                isOwnMessage
                  ? "marker:text-teal-300 marker:text-lg"
                  : "marker:text-teal-600 dark:marker:text-teal-400 marker:text-lg"
              )}
            >
              {children}
            </ul>
          ),

          // ORDERED LISTS (1. item) - INDIGO NUMBERS
          ol: ({ children }) => (
            <ol
              className={cn(
                "space-y-1 my-2 ml-4 list-decimal list-outside",
                isOwnMessage
                  ? "marker:text-indigo-300 marker:font-bold marker:text-sm"
                  : "marker:text-indigo-600 dark:marker:text-indigo-400 marker:font-bold marker:text-sm"
              )}
            >
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),

          // BLOCKQUOTE (> text) - PINK/ROSE SIDEBAR CARD
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "relative pl-4 pr-3 py-2 my-2 italic rounded-lg shadow-sm",
                isOwnMessage
                  ? "border-l-[5px] border-pink-400/60 bg-pink-500/15 text-pink-50"
                  : "border-l-[5px] border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-200"
              )}
            >
              <div className="text-sm font-medium opacity-90">{children}</div>
            </blockquote>
          ),

          // HEADINGS - VIOLET/PURPLE WITH GRADIENT UNDERLINES
          h1: ({ children }) => (
            <h1
              className={cn(
                "text-lg font-black mt-3 mb-2 pb-2 border-b-[3px]",
                isOwnMessage
                  ? "border-violet-400/60 text-violet-50 tracking-tight"
                  : "border-violet-500 dark:border-violet-400 text-violet-900 dark:text-violet-100 tracking-tight"
              )}
            >
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2
              className={cn(
                "text-base font-black mt-3 mb-1.5 pb-1 border-b-[2px]",
                isOwnMessage
                  ? "border-purple-400/50 text-purple-50"
                  : "border-purple-500 dark:border-purple-400 text-purple-900 dark:text-purple-100"
              )}
            >
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3
              className={cn(
                "text-sm font-extrabold mt-2 mb-1",
                isOwnMessage
                  ? "text-fuchsia-200"
                  : "text-fuchsia-700 dark:text-fuchsia-300"
              )}
            >
              {children}
            </h3>
          ),

          // HORIZONTAL RULE (---) - LIME/GREEN GRADIENT WITH GLOW
          hr: () => (
            <hr
              className={cn(
                "my-4 border-0 h-1 rounded-full shadow-md",
                isOwnMessage
                  ? "bg-gradient-to-r from-transparent via-lime-400/70 to-transparent shadow-lime-400/30"
                  : "bg-gradient-to-r from-transparent via-lime-500 to-transparent dark:via-lime-400 shadow-lime-500/40"
              )}
            />
          ),

          // TABLES - SKY/BLUE BORDERS WITH STRIPED ROWS
          table: ({ children }) => (
            <div
              className={cn(
                "overflow-x-auto my-3 rounded-lg border-2 shadow-lg",
                isOwnMessage
                  ? "border-sky-400/60 shadow-sky-400/20"
                  : "border-sky-500 dark:border-sky-400 shadow-sky-500/30"
              )}
            >
              <table className="min-w-full text-xs">{children}</table>
            </div>
          ),

          th: ({ children }) => (
            <th
              className={cn(
                "border-b-2 px-3 py-2.5 text-left font-extrabold uppercase tracking-wider text-[10px]",
                isOwnMessage
                  ? "border-sky-400/60 bg-sky-600/30 text-sky-50"
                  : "border-sky-500 dark:border-sky-400 bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-100"
              )}
            >
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td
              className={cn(
                "border-b px-3 py-2",
                isOwnMessage
                  ? "border-sky-400/30 text-sky-50 even:bg-sky-500/10"
                  : "border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-100 even:bg-sky-50/50 dark:even:bg-sky-900/20"
              )}
            >
              {children}
            </td>
          ),
        };

        return (
          <div className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {message.content || ""}
            </ReactMarkdown>
          </div>
        );

      case "image":
        const images = message.metadata?.files?.filter(f => f.mimeType.startsWith("image/")) ||
                      (message.metadata?.fileUrl ? [{
                        id: "single",
                        fileName: message.metadata.fileName || "Image",
                        fileSize: message.metadata.fileSize || 0,
                        fileUrl: message.metadata.fileUrl,
                        mimeType: message.metadata.mimeType || "image/*",
                        thumbnailUrl: message.metadata.thumbnailUrl
                      }] : []);

        return (
          <div className="space-y-2">
            {images.length > 0 && (
              <div className={cn(
                "grid gap-2",
                images.length === 1 ? "grid-cols-1" :
                images.length === 2 ? "grid-cols-2" :
                images.length === 3 ? "grid-cols-3" :
                "grid-cols-2"
              )}>
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.thumbnailUrl || img.fileUrl}
                      alt={img.fileName}
                      className="rounded-lg max-w-full max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(img.fileUrl, "_blank")}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(img.fileUrl, "_blank");
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {message.content && (
              <div className="text-sm px-2">{message.content}</div>
            )}
          </div>
        );

      case "video":
        const videos = message.metadata?.files?.filter(f => f.mimeType.startsWith("video/")) ||
                      (message.metadata?.fileUrl ? [{
                        id: "single",
                        fileName: message.metadata.fileName || "Video",
                        fileSize: message.metadata.fileSize || 0,
                        fileUrl: message.metadata.fileUrl,
                        mimeType: message.metadata.mimeType || "video/*",
                        thumbnailUrl: message.metadata.thumbnailUrl
                      }] : []);

        return (
          <div className="space-y-2">
            {videos.map((video, idx) => (
              <div key={idx} className="relative group">
                <video
                  controls
                  className="rounded-lg max-w-sm max-h-96 w-full"
                  src={video.fileUrl}
                  poster={video.thumbnailUrl}
                />
                <div className="text-xs text-muted-foreground mt-1 px-1">
                  {video.fileName} • {formatFileSize(video.fileSize)}
                </div>
              </div>
            ))}
            {message.content && (
              <div className="text-sm px-2">{message.content}</div>
            )}
          </div>
        );

      case "audio":
        return (
          <div className="space-y-2">
            {message.metadata?.fileUrl && (
              <audio controls className="w-full max-w-sm">
                <source
                  src={message.metadata.fileUrl}
                  type={message.metadata.mimeType}
                />
              </audio>
            )}
            {message.content && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        );

      case "file":
        const files = message.metadata?.files ||
                     (message.metadata?.fileUrl ? [{
                       id: "single",
                       fileName: message.metadata.fileName || "File",
                       fileSize: message.metadata.fileSize || 0,
                       fileUrl: message.metadata.fileUrl,
                       mimeType: message.metadata.mimeType || "application/octet-stream"
                     }] : []);

        return (
          <div className="space-y-2">
            {files.map((file, idx) => {
              const FileIcon = getFileIcon(file.mimeType);
              const mimeType = file.mimeType || "";
              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg max-w-sm hover:bg-muted/70 transition-colors">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                    mimeType.includes("pdf") ? "bg-red-100 dark:bg-red-900/30" :
                    mimeType.includes("zip") || mimeType.includes("rar") ? "bg-yellow-100 dark:bg-yellow-900/30" :
                    mimeType.includes("sheet") || mimeType.includes("excel") ? "bg-green-100 dark:bg-green-900/30" :
                    mimeType.includes("doc") || mimeType.includes("word") ? "bg-blue-100 dark:bg-blue-900/30" :
                    "bg-primary/10"
                  )}>
                    <FileIcon className={cn(
                      "h-6 w-6",
                      mimeType.includes("pdf") ? "text-red-600 dark:text-red-400" :
                      mimeType.includes("zip") || mimeType.includes("rar") ? "text-yellow-600 dark:text-yellow-400" :
                      mimeType.includes("sheet") || mimeType.includes("excel") ? "text-green-600 dark:text-green-400" :
                      mimeType.includes("doc") || mimeType.includes("word") ? "text-blue-600 dark:text-blue-400" :
                      "text-primary"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {file.fileName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)} • {mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 hover:bg-primary/10"
                    onClick={() => window.open(file.fileUrl, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {message.content && (
              <div className="text-sm px-2">{message.content}</div>
            )}
          </div>
        );

      case "code":
        return (
          <div className="rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-3 py-1 text-xs font-mono text-muted-foreground">
              {message.metadata?.language || "code"}
            </div>
            <pre className="bg-muted p-3 overflow-x-auto">
              <code className="text-sm font-mono">{message.content}</code>
            </pre>
          </div>
        );

      case "poll":
        return (
          <div className="space-y-3">
            <div className="font-medium">{message.metadata?.pollQuestion}</div>
            <div className="space-y-2">
              {message.metadata?.pollOptions?.map((option) => {
                const percentage = message.metadata?.pollTotalVotes
                  ? (option.votes / message.metadata.pollTotalVotes) * 100
                  : 0;
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{option.text}</span>
                      <span className="text-muted-foreground">
                        {option.votes} votes
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {message.metadata?.pollTotalVotes || 0} total votes
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-2">
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
              📍 Location: {message.metadata?.latitude},{" "}
              {message.metadata?.longitude}
            </div>
            {message.content && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        );

      case "gif":
      case "sticker":
        return (
          <div>
            {message.metadata?.fileUrl && (
              <img
                src={message.metadata.fileUrl}
                alt="GIF"
                className="rounded-lg max-w-xs"
              />
            )}
          </div>
        );

      default:
        return <div>{message.content}</div>;
    }
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
                <PopoverContent className="w-auto p-2">
                  <div className="flex gap-1">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        className="text-lg hover:bg-muted rounded p-1 transition-colors"
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
              isOwnMessage && !(message.metadata?.files && message.metadata.files.length > 0)
                ? "bg-blue-600 text-white"
                : !isOwnMessage && !(message.metadata?.files && message.metadata.files.length > 0)
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
                const tooltipText = reaction.userNames && reaction.userNames.length > 0
                  ? reaction.userNames.join(', ')
                  : `${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted`;

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
                        <p className="text-xs font-medium">
                          {tooltipText}
                        </p>
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
