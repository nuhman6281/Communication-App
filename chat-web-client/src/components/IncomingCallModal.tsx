/**
 * Incoming Call Modal
 * Displays incoming call notification with accept/reject options
 */

import { useState } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IncomingCall } from '@/hooks/useCallWebSocket';
import { useAcceptCall, useRejectCall } from '@/hooks/useCalls';

interface IncomingCallModalProps {
  incomingCall: IncomingCall | null;
  onAccept?: (callId: string, jitsiConfig: any) => void;
  onReject?: () => void;
}

export function IncomingCallModal({ incomingCall, onAccept, onReject }: IncomingCallModalProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const acceptCallMutation = useAcceptCall();
  const rejectCallMutation = useRejectCall();

  if (!incomingCall) return null;

  const { call, initiator, callType } = incomingCall;

  const handleAccept = async () => {
    try {
      const response = await acceptCallMutation.mutateAsync({
        callId: call.id,
        audioEnabled,
        videoEnabled: callType === 'video' ? videoEnabled : false,
      });

      onAccept?.(call.id, response.jitsiConfig);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectCallMutation.mutateAsync(call.id);
      onReject?.();
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <div className="flex flex-col items-center space-y-6 py-6">
          {/* Caller Avatar with Pulse Animation */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20"></div>
            <Avatar className="h-24 w-24 border-4 border-green-500">
              <AvatarImage src={initiator.avatarUrl} alt={initiator.displayName || initiator.username} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                {getInitials(initiator.displayName || initiator.username)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Info */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-semibold">
              {initiator.displayName || initiator.username}
            </h2>
            <p className="text-muted-foreground">
              Incoming {callType === 'video' ? 'video' : 'audio'} call...
            </p>
          </div>

          {/* Media Controls (for video calls) */}
          {callType === 'video' && (
            <div className="flex items-center gap-4">
              <Button
                variant={audioEnabled ? 'outline' : 'secondary'}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5 text-destructive" />
                )}
              </Button>
              <Button
                variant={videoEnabled ? 'outline' : 'secondary'}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <Video className="h-5 w-5 text-destructive" />
                )}
              </Button>
            </div>
          )}

          {/* Accept/Reject Buttons */}
          <div className="flex items-center gap-6 pt-4">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-16 w-16"
              onClick={handleReject}
              disabled={rejectCallMutation.isPending}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="lg"
              className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600"
              onClick={handleAccept}
              disabled={acceptCallMutation.isPending}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>

          {/* Loading State */}
          {(acceptCallMutation.isPending || rejectCallMutation.isPending) && (
            <p className="text-sm text-muted-foreground">Processing...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
