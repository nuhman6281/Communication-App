/**
 * Outgoing Call Modal
 * Displays "Calling..." UI when user initiates a call
 */

import { useState, useEffect } from 'react';
import { PhoneOff } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEndCall, useMarkCallAsMissed } from '@/hooks/useCalls';

interface OutgoingCallModalProps {
  callId: string;
  recipientName: string;
  recipientAvatar?: string;
  callType: 'audio' | 'video';
  onCancel?: () => void;
}

export function OutgoingCallModal({
  callId,
  recipientName,
  recipientAvatar,
  callType,
  onCancel,
}: OutgoingCallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const endCallMutation = useEndCall();
  const markMissedMutation = useMarkCallAsMissed();

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-mark as missed after 30 seconds
  useEffect(() => {
    const missedTimeout = setTimeout(async () => {
      console.log('[OutgoingCall] No answer after 30s, marking as missed');
      try {
        await markMissedMutation.mutateAsync(callId);
        onCancel?.();
      } catch (error) {
        console.error('Failed to mark call as missed:', error);
        // Still cancel the modal even if marking as missed fails
        onCancel?.();
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(missedTimeout);
  }, [callId, markMissedMutation, onCancel]);

  const handleCancel = async () => {
    try {
      await endCallMutation.mutateAsync(callId);
      onCancel?.();
    } catch (error) {
      console.error('Failed to cancel call:', error);
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Modal
      open={true}
      onClose={handleCancel}
      maxWidth="md"
      showFooter={false}
      className="overflow-visible"
    >
      <div className="flex flex-col items-center space-y-6 py-8 px-6">
        {/* Recipient Avatar with Pulse Animation */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
          <Avatar className="h-24 w-24 border-4 border-blue-500">
            <AvatarImage src={recipientAvatar} alt={recipientName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
              {getInitials(recipientName)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Call Info */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold">{recipientName}</h2>
          <p className="text-muted-foreground">
            Calling... {formatDuration(callDuration)}
          </p>
          <p className="text-sm text-muted-foreground">
            {callType === 'video' ? 'Video call' : 'Audio call'}
          </p>
        </div>

        {/* Call Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Ringing...</span>
        </div>

        {/* Cancel Button */}
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-16 w-16"
          onClick={handleCancel}
          disabled={endCallMutation.isPending}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>

        {/* Loading State */}
        {endCallMutation.isPending && (
          <p className="text-sm text-muted-foreground">Ending call...</p>
        )}
      </div>
    </Modal>
  );
}
