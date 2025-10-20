import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { Search, Send, Loader2, X } from "lucide-react";
import { useConversations, useForwardMessage } from "@/hooks";
import { useAuthStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  messagePreview: string;
}

export function ForwardMessageDialog({
  open,
  onOpenChange,
  messageId,
  messagePreview,
}: ForwardMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

  const { user } = useAuthStore();
  const { data: conversationsData, isLoading } = useConversations();
  const forwardMutation = useForwardMessage();

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!conversationsData?.items) return [];

    const conversations = conversationsData.items;

    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      // Search by conversation name
      if (conv.name?.toLowerCase().includes(query)) return true;

      // Search by participant names (for direct conversations)
      if (conv.type === "direct") {
        const otherParticipant = conv.participants?.find(
          (p: any) => p.user?.id !== user?.id
        );
        const otherUser = otherParticipant?.user;

        if (otherUser) {
          const displayName =
            otherUser.firstName && otherUser.lastName
              ? `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase()
              : otherUser.username.toLowerCase();

          return displayName.includes(query);
        }
      }

      return false;
    });
  }, [conversationsData, searchQuery, user?.id]);

  const handleToggleConversation = (conversationId: string) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleForward = async () => {
    if (selectedConversations.length === 0) return;

    try {
      await forwardMutation.mutateAsync({
        id: messageId,
        conversationIds: selectedConversations,
      });

      // Close dialog and reset state
      onOpenChange(false);
      setSelectedConversations([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to forward message:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedConversations([]);
    setSearchQuery("");
  };

  const getConversationDisplay = (conversation: any) => {
    if (conversation.type === "direct") {
      // Check if this is a self-conversation (My Notes)
      const isSelfConversation =
        conversation.participants?.length === 1 &&
        conversation.participants[0]?.user?.id === user?.id;

      if (isSelfConversation) {
        return {
          name: "My Notes",
          avatar: user?.avatarUrl,
          subtitle: "Save to My Notes",
        };
      }

      // Find the other participant
      const otherParticipant = conversation.participants?.find(
        (p: any) => p.user?.id !== user?.id
      );
      const otherUser = otherParticipant?.user;

      if (!otherUser) {
        return { name: "Unknown User", avatar: "", subtitle: "Direct message" };
      }

      const displayName =
        otherUser.firstName && otherUser.lastName
          ? `${otherUser.firstName} ${otherUser.lastName}`
          : otherUser.username;

      return {
        name: displayName,
        avatar: otherUser.avatarUrl,
        subtitle: `@${otherUser.username}`,
      };
    }

    return {
      name: conversation.name || "Group Chat",
      avatar: conversation.avatarUrl,
      subtitle:
        conversation.type === "group"
          ? `${conversation.participants?.length || 0} members`
          : "Channel",
    };
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>
            Select conversations to forward this message to
          </DialogDescription>
        </DialogHeader>

        {/* Message Preview */}
        <div className="p-3 bg-muted rounded-lg border border-border">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {messagePreview}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selected Count Badge */}
        {selectedConversations.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <Badge variant="secondary" className="text-xs">
              {selectedConversations.length} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversations([])}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Conversations List */}
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No conversations found" : "No conversations available"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => {
                const display = getConversationDisplay(conversation);
                const isSelected = selectedConversations.includes(conversation.id);

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleToggleConversation(conversation.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/10 border-2 border-primary"
                        : "hover:bg-muted border-2 border-transparent"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleConversation(conversation.id)}
                      className="shrink-0"
                    />

                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={display.avatar || ""} />
                      <AvatarFallback>
                        {display.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {display.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {display.subtitle}
                      </p>
                    </div>

                    {conversation.type === "group" && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Group
                      </Badge>
                    )}
                    {conversation.type === "channel" && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Channel
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={selectedConversations.length === 0 || forwardMutation.isPending}
          >
            {forwardMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Forwarding...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Forward to {selectedConversations.length}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
