import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
  ChangeEvent,
} from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Send,
  Smile,
  Paperclip,
  Image,
  Mic,
  Code,
  AtSign,
  Hash,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  X,
  File,
  Video,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  onSendMessage: (
    content: string,
    attachments?: File[],
    messageType?: string
  ) => void | Promise<void>;
  conversationId: string;
  replyingTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  editingMessage?: {
    id: string;
    content: string;
  } | null;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  initialValue?: string;
}

export function MessageComposer({
  onSendMessage,
  conversationId,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  placeholder = "Type a message...",
  disabled = false,
  initialValue,
}: MessageComposerProps) {
  const [message, setMessage] = useState(initialValue || "");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Update message when initialValue changes (for editing)
  useEffect(() => {
    if (initialValue !== undefined) {
      setMessage(initialValue);
      // Auto-resize textarea after setting message
      setTimeout(() => adjustTextareaHeight(), 0);
    }
  }, [initialValue]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Format shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          insertFormatting("**", "**", "bold text");
          break;
        case "i":
          e.preventDefault();
          insertFormatting("_", "_", "italic text");
          break;
        case "k":
          e.preventDefault();
          insertFormatting("[", "](url)", "link text");
          break;
      }
    }
  };

  const insertFormatting = (
    before: string,
    after: string,
    placeholder: string
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newMessage =
      message.substring(0, start) +
      before +
      textToInsert +
      after +
      message.substring(end);

    setMessage(newMessage);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && attachments.length === 0) return;
    if (disabled) return;

    try {
      // Determine message type based on attachments
      let messageType = "text";
      if (attachments.length > 0) {
        const firstFile = attachments[0];
        if (firstFile.type.startsWith("image/")) messageType = "image";
        else if (firstFile.type.startsWith("video/")) messageType = "video";
        else if (firstFile.type.startsWith("audio/")) messageType = "audio";
        else messageType = "file";
      }

      await onSendMessage(trimmedMessage, attachments, messageType);

      // Clear inputs
      setMessage("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFileSelect = (
    e: ChangeEvent<HTMLInputElement>,
    type?: string
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    // Reset input
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newMessage =
      message.substring(0, start) + emoji + message.substring(end);

    setMessage(newMessage);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);

    setShowEmojiPicker(false);
  };

  // Common emojis for quick access
  const quickEmojis = [
    "😀",
    "😂",
    "❤️",
    "👍",
    "🎉",
    "🔥",
    "💯",
    "👏",
    "🤔",
    "😍",
  ];

  return (
    <div className="border-t border-border bg-background">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">Replying to </span>
            <span className="font-medium">{replyingTo.senderName}</span>
            <p className="text-muted-foreground truncate">
              {replyingTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit indicator */}
      {editingMessage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
          <div className="flex-1 text-sm">
            <span className="text-amber-700 dark:text-amber-400 font-medium">Editing message</span>
            <p className="text-amber-600 dark:text-amber-500 truncate text-xs">
              {editingMessage.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            onClick={onCancelEdit}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 p-4 pb-2 flex-wrap">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative group flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
            >
              {file.type.startsWith("image/") ? (
                <Image className="h-4 w-4 text-muted-foreground" />
              ) : file.type.startsWith("video/") ? (
                <Video className="h-4 w-4 text-muted-foreground" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm max-w-[150px] truncate">
                {file.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 absolute -top-2 -right-2 bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 p-4">
        {/* Attachment buttons */}
        <div className="flex gap-1 items-center">
          <TooltipProvider>
            {/* File attachment */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>

            {/* Image attachment */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Image className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach image</TooltipContent>
            </Tooltip>

            {/* Emoji picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      disabled={disabled}
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Add emoji</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-5 gap-2">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-2xl hover:bg-muted rounded p-1 transition-colors"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Type : to see more emojis
                </div>
              </PopoverContent>
            </Popover>
          </TooltipProvider>
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full resize-none bg-muted rounded-lg px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] max-h-[200px]"
            rows={1}
            style={{ paddingTop: '10px', paddingBottom: '10px', lineHeight: '20px' }}
          />

          {/* Formatting toolbar */}
          <Popover open={showFormatting} onOpenChange={setShowFormatting}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8"
                disabled={disabled}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("**", "**", "bold")}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("_", "_", "italic")}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("~~", "~~", "strikethrough")}
                  title="Strikethrough"
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("`", "`", "code")}
                  title="Inline code"
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("[", "](url)", "link")}
                  title="Link (Ctrl+K)"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          size="icon"
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileSelect}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        className="hidden"
        accept="video/*"
        onChange={handleFileSelect}
      />
    </div>
  );
}
