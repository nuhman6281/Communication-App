import { useState } from "react";
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
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Search, Users, Phone, Video, X } from "lucide-react";
import { useInitiateCall } from "@/hooks";
import { Loader2 } from "lucide-react";

interface GroupCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId?: string;
  onCallInitiated?: (callData: {
    callId: string;
    recipientName: string;
    recipientAvatar?: string;
    callType: "audio" | "video";
  }) => void;
}

export function GroupCallDialog({
  open,
  onOpenChange,
  conversationId,
  onCallInitiated,
}: GroupCallDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const initiateCallMutation = useInitiateCall();

  // Mock users - In real app, fetch from API
  const mockUsers = [
    {
      id: "user1",
      firstName: "Alice",
      lastName: "Johnson",
      username: "alice",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
      isOnline: true,
    },
    {
      id: "user2",
      firstName: "Bob",
      lastName: "Smith",
      username: "bob",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
      isOnline: false,
    },
    {
      id: "user3",
      firstName: "Carol",
      lastName: "Williams",
      username: "carol",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
      isOnline: true,
    },
    {
      id: "user4",
      firstName: "David",
      lastName: "Brown",
      username: "david",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      isOnline: true,
    },
    {
      id: "user5",
      firstName: "Emma",
      lastName: "Davis",
      username: "emma",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      isOnline: false,
    },
  ];

  const filteredUsers = mockUsers.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  });

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleInitiateCall = async () => {
    if (selectedUsers.size < 2) {
      alert("Please select at least 2 participants for a group call");
      return;
    }

    try {
      const call = await initiateCallMutation.mutateAsync({
        conversationId,
        participantIds: Array.from(selectedUsers),
        type: callType,
      });

      onCallInitiated?.({
        callId: call.id,
        recipientName: `Group Call (${selectedUsers.size} participants)`,
        callType,
      });

      // Reset and close
      setSelectedUsers(new Set());
      setSearchQuery("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to initiate group call:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Start Group Call
          </DialogTitle>
          <DialogDescription>
            Select participants to include in the call (minimum 2)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Count */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <span className="text-sm font-medium">
                {selectedUsers.size} participant{selectedUsers.size !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          {/* User List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.has(user.id);
                const fullName = `${user.firstName} ${user.lastName}`;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-500/10 border border-blue-500/30"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />

                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                          {fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{fullName}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </div>
                    </div>

                    {user.isOnline && (
                      <Badge variant="secondary" className="text-xs">
                        Online
                      </Badge>
                    )}
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Call Type Selection */}
          <div className="flex gap-2">
            <Button
              variant={callType === "audio" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setCallType("audio")}
            >
              <Phone className="w-4 h-4 mr-2" />
              Audio Call
            </Button>
            <Button
              variant={callType === "video" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setCallType("video")}
            >
              <Video className="w-4 h-4 mr-2" />
              Video Call
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInitiateCall}
            disabled={selectedUsers.size < 2 || initiateCallMutation.isPending}
          >
            {initiateCallMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Start Call ({selectedUsers.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
