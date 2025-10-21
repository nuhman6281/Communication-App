/**
 * Call WebSocket Hook
 * Handles real-time call notifications and events
 */

import { useEffect, useState, useCallback } from 'react';
import { socketService } from '@/lib/websocket/socket';
import { useAuthStore } from '@/lib/stores';

export interface IncomingCall {
  call: {
    id: string;
    initiatorId: string;
    conversationId?: string;
    type: 'audio' | 'video';
    status: string;
    jitsiRoomId: string;
    jitsiRoomUrl: string;
    participants: string[];
    createdAt: string;
  };
  initiator: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
  };
  callType: 'audio' | 'video';
}

interface CallAcceptedEvent {
  callId: string;
  acceptedBy: string;
}

interface CallRejectedEvent {
  callId: string;
  rejectedBy: string;
}

interface CallEndedEvent {
  callId: string;
  endedBy: string;
  duration?: number;
}

interface CallMissedEvent {
  callId: string;
  initiatorId: string;
  callType: 'audio' | 'video';
}

export function useCallWebSocket() {
  const { user } = useAuthStore();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callAccepted, setCallAccepted] = useState<{
    callId: string;
    acceptedBy: string;
  } | null>(null);

  // Handle incoming call
  const handleIncomingCall = useCallback((data: IncomingCall) => {
    console.log('[Call WS] Incoming call:', data);

    // Don't show notification if user is the initiator
    if (data.initiator.id === user?.id) {
      return;
    }

    setIncomingCall(data);

    // Play ringtone (optional)
    try {
      const audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      audio.play().catch(err => console.warn('Could not play ringtone:', err));

      // Store audio ref to stop later
      (window as any).__incomingCallAudio = audio;
    } catch (err) {
      console.warn('Error playing ringtone:', err);
    }
  }, [user?.id]);

  // Handle call accepted
  const handleCallAccepted = useCallback((data: CallAcceptedEvent) => {
    console.log('[Call WS] Call accepted:', data);
    setActiveCallId(data.callId);
    setIncomingCall(null);
    setCallAccepted(data); // Store acceptance event for initiator

    // Stop ringtone
    const audio = (window as any).__incomingCallAudio;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete (window as any).__incomingCallAudio;
    }
  }, []);

  // Handle call rejected
  const handleCallRejected = useCallback((data: CallRejectedEvent) => {
    console.log('[Call WS] Call rejected:', data);
    setIncomingCall(null);
    setActiveCallId(null);

    // Stop ringtone
    const audio = (window as any).__incomingCallAudio;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete (window as any).__incomingCallAudio;
    }
  }, []);

  // Handle call ended
  const handleCallEnded = useCallback((data: CallEndedEvent) => {
    console.log('[Call WS] Call ended:', data);
    setIncomingCall(null);
    setActiveCallId(null);

    // Stop ringtone
    const audio = (window as any).__incomingCallAudio;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete (window as any).__incomingCallAudio;
    }
  }, []);

  // Handle call missed
  const handleCallMissed = useCallback((data: CallMissedEvent) => {
    console.log('[Call WS] Call missed:', data);
    // Could show a toast notification here
    // The conversation list will show the missed call badge from the API data
  }, []);

  // Clear incoming call
  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);

    // Stop ringtone
    const audio = (window as any).__incomingCallAudio;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete (window as any).__incomingCallAudio;
    }
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!socketService.isConnected()) {
      console.warn('[Call WS] Socket not connected');
      return;
    }

    console.log('[Call WS] Setting up call event listeners');

    socketService.on('call:incoming', handleIncomingCall);
    socketService.on('call:accepted', handleCallAccepted);
    socketService.on('call:rejected', handleCallRejected);
    socketService.on('call:ended', handleCallEnded);
    socketService.on('call:missed', handleCallMissed);

    return () => {
      console.log('[Call WS] Cleaning up call event listeners');
      socketService.off('call:incoming', handleIncomingCall);
      socketService.off('call:accepted', handleCallAccepted);
      socketService.off('call:rejected', handleCallRejected);
      socketService.off('call:ended', handleCallEnded);
      socketService.off('call:missed', handleCallMissed);

      // Stop ringtone on cleanup
      const audio = (window as any).__incomingCallAudio;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        delete (window as any).__incomingCallAudio;
      }
    };
  }, [handleIncomingCall, handleCallAccepted, handleCallRejected, handleCallEnded, handleCallMissed]);

  // Clear call accepted event
  const clearCallAccepted = useCallback(() => {
    setCallAccepted(null);
  }, []);

  return {
    incomingCall,
    activeCallId,
    callAccepted,
    clearIncomingCall,
    clearCallAccepted,
  };
}
