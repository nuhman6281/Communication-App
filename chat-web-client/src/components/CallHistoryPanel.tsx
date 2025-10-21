import { useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  X,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { useCallHistory } from "@/hooks";
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface CallHistoryPanelProps {
  onClose: () => void;
  onCallInitiate?: (callData: {
    callId: string;
    recipientName: string;
    recipientAvatar?: string;
    callType: "audio" | "video";
  }) => void;
}

export function CallHistoryPanel({
  onClose,
  onCallInitiate,
}: CallHistoryPanelProps) {
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const { data: callHistory, isLoading } = useCallHistory({ limit: 50 });

  // Format call duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  };

  // Format timestamp
  const formatTimestamp = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  // Get call icon and color based on status
  const getCallIcon = (call: any) => {
    const isVideo = call.type === "video";
    const Icon = isVideo ? Video : Phone;

    if (call.status === "missed") {
      return {
        icon: <PhoneMissed className="w-4 h-4" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
      };
    }

    // Determine if call was incoming or outgoing
    // For now, we'll use a simple heuristic
    const isIncoming = call.initiatorId !== call.id;

    if (isIncoming) {
      return {
        icon: <PhoneIncoming className="w-4 h-4" />,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      };
    }

    return {
      icon: <PhoneOutgoing className="w-4 h-4" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    };
  };

  // Get call status text
  const getCallStatusText = (call: any) => {
    switch (call.status) {
      case "missed":
        return "Missed call";
      case "declined":
        return "Declined";
      case "failed":
        return "Failed";
      case "ended":
        return call.duration > 0
          ? formatDuration(call.duration)
          : "No answer";
      default:
        return call.status;
    }
  };

  // Filter calls
  const filteredCalls =
    filter === "all"
      ? callHistory?.calls || []
      : (callHistory?.calls || []).filter((call) => call.status === "missed");

  return (
    <div className="h-full flex flex-col bg-background border-l border-border w-96">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Call History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="missed" className="flex-1">
              Missed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Phone className="w-12 h-12 mb-2 opacity-50" />
            <p>
              {filter === "missed" ? "No missed calls" : "No call history"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredCalls.map((call) => {
              const callIcon = getCallIcon(call);
              const statusText = getCallStatusText(call);

              // Get participant name (for now, using initiator)
              const participantName = call.initiator
                ? `${call.initiator.firstName || ""} ${
                    call.initiator.lastName || ""
                  }`.trim() || call.initiator.username
                : "Unknown";

              return (
                <div
                  key={call.id}
                  className="p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={call.initiator?.avatarUrl} />
                      <AvatarFallback>
                        {participantName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${callIcon.bgColor} ${callIcon.color} flex items-center justify-center border-2 border-background`}
                    >
                      {callIcon.icon}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        {participantName}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatTimestamp(call.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {call.type === "video" && (
                        <Video className="w-3 h-3" />
                      )}
                      {call.type === "audio" && (
                        <Phone className="w-3 h-3" />
                      )}
                      <span className="truncate">{statusText}</span>
                      {call.duration > 0 && (
                        <>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(call.duration)}</span>
                        </>
                      )}
                    </div>

                    {call.status === "missed" && (
                      <Badge
                        variant="destructive"
                        className="mt-2 text-xs"
                      >
                        Missed
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Voice call"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Video call"
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
