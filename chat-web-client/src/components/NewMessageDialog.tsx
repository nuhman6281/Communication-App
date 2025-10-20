import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Modal, ModalHeader, ModalBody } from "./ui/modal";
import { Search, Loader2, UserPlus, X } from "lucide-react";
import { useSearchUsers, useCreateConversation } from "@/hooks";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function NewMessageDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: NewMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Search users
  const {
    data: searchResults,
    isLoading,
    error,
  } = useSearchUsers({
    query: searchQuery,
    limit: 20,
  });

  // Create conversation mutation
  const createConversation = useCreateConversation();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleUserSelect = async (userId: string, username: string) => {
    try {
      const result = await createConversation.mutateAsync({
        type: "direct",
        participantIds: [userId],
      });

      toast.success(`Started conversation with ${username}`);
      onConversationCreated?.(result.id);
      onOpenChange(false);
      setSearchQuery(""); // Reset search
    } catch (err: any) {
      console.error("Failed to create conversation:", err);
      toast.error(err.message || "Failed to start conversation");
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

  const users = searchResults?.items || [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="2xl"
      footerContent={
        <>
          <span>Press ESC to close</span>
          <span>↵ to start conversation</span>
        </>
      }
    >
      {/* Search Input */}
      <ModalHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search by username or email..."
            className="pl-10 pr-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </ModalHeader>

      {/* Results */}
      <ModalBody>
        {!searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <UserPlus className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Start typing to search for users</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-destructive">
            <p className="text-sm">Failed to search users</p>
            <p className="text-xs mt-1">{(error as Error).message}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p>No users found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id, user.username)}
                disabled={createConversation.isPending}
                className="w-full p-4 flex items-start gap-3 hover:bg-muted/50 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback>
                    {user.username?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                    {user.email && ` • ${user.email}`}
                  </p>
                </div>
                {createConversation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
