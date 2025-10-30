import React, { useEffect, useRef, useState } from 'react';
import { ActiveCall, CallParticipant, useCallStore } from '@/lib/stores/call.store';
import { webrtcService } from '@/lib/webrtc/webrtc.service';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Users,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoCallOverlayProps {
  call: ActiveCall;
}

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({ call }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    minimizeCall,
    endCall,
  } = useCallStore();

  // Update call duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(useCallStore.getState().getCallDuration());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Setup local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle fullscreen
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get grid layout class based on participant count
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  };

  const participants = Array.from(call.participants.values());
  const participantCount = participants.length + 1; // +1 for self

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        pointerEvents: 'auto',
        zIndex: 9999,
        backgroundColor: '#111827',
      }}
    >
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 p-4 z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-white text-lg font-semibold">
              {call.callType === 'video' ? 'Video Call' : 'Voice Call'}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm">{formatDuration(callDuration)}</span>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <Users className="w-4 h-4" />
              <span className="text-sm">{participantCount}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={minimizeCall}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative p-4 pt-20 pb-24">
        <div className={cn(
          "grid gap-2 h-full",
          getGridClass(participantCount),
          selectedParticipant && "lg:grid-cols-4"
        )}>
          {/* Selected participant (large view) */}
          {selectedParticipant && (
            <div
              className="lg:col-span-3 relative rounded-lg overflow-hidden"
              style={{ backgroundColor: '#1f2937' }}
            >
              <VideoTile
                participant={participants.find(p => p.userId === selectedParticipant)}
                isLarge
                onClick={() => setSelectedParticipant(null)}
              />
            </div>
          )}

          {/* Participant tiles */}
          <div className={cn(
            selectedParticipant && "lg:col-span-1",
            "grid gap-2",
            selectedParticipant ? "grid-cols-1" : getGridClass(participantCount)
          )}>
            {/* Local video */}
            <div
              className="relative rounded-lg overflow-hidden cursor-pointer"
              style={{ backgroundColor: '#1f2937', minHeight: '200px' }}
              onClick={() => setSelectedParticipant('local')}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={cn(
                  "w-full h-full object-cover",
                  !isVideoEnabled && "hidden"
                )}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">You</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                You {!isAudioEnabled && '🔇'}
              </div>
            </div>

            {/* Remote participants */}
            {participants.map((participant) => (
              <VideoTile
                key={participant.userId}
                participant={participant}
                onClick={() => setSelectedParticipant(participant.userId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        className="absolute bottom-0 left-0 right-0 p-6"
        style={{
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center justify-center space-x-6">
          <Button
            size="lg"
            variant={isAudioEnabled ? "secondary" : "destructive"}
            className="rounded-full p-3"
            onClick={() => webrtcService.toggleAudio()}
          >
            {isAudioEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </Button>

          {call.callType === 'video' ? (
            <Button
              size="lg"
              variant={isVideoEnabled ? "secondary" : "destructive"}
              className="rounded-full p-3"
              onClick={() => webrtcService.toggleVideo()}
            >
              {isVideoEnabled ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full p-3"
              onClick={() => webrtcService.switchToVideo()}
              title="Switch to video call"
            >
              <Video className="w-5 h-5" />
            </Button>
          )}

          <Button
            size="lg"
            variant={isScreenSharing ? "secondary" : "outline"}
            className="rounded-full p-3"
            onClick={() => webrtcService.toggleScreenShare()}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            className="rounded-full p-3"
            onClick={() => {
              console.log('[VideoCallOverlay] 🔴 END CALL BUTTON CLICKED');
              console.log('[VideoCallOverlay] CallId:', call.callId);
              console.log('[VideoCallOverlay] Calling webrtcService.endCall()');
              webrtcService.endCall();
            }}
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div
          className="absolute top-0 right-0 w-80 h-full p-4"
          style={{
            backgroundColor: '#1f2937',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Chat</h3>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setShowChat(false)}
            >
              ×
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Chat coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Video Tile Component
interface VideoTileProps {
  participant?: CallParticipant;
  isLarge?: boolean;
  onClick?: () => void;
}

const VideoTile: React.FC<VideoTileProps> = ({ participant, isLarge, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant?.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant?.stream]);

  if (!participant) return null;

  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer h-full"
      style={{ backgroundColor: '#1f2937', minHeight: '200px' }}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={cn(
          "w-full h-full object-cover",
          !participant.isVideoEnabled && "hidden"
        )}
      />
      {!participant.isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "bg-gray-700 rounded-full flex items-center justify-center",
            isLarge ? "w-32 h-32" : "w-20 h-20"
          )}>
            {participant.avatarUrl ? (
              <img
                src={participant.avatarUrl}
                alt={participant.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className={cn(
                "text-white",
                isLarge ? "text-4xl" : "text-2xl"
              )}>
                {participant.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded">
        <span className="text-white text-sm">
          {participant.username}
          {!participant.isAudioEnabled && ' 🔇'}
          {participant.isScreenSharing && ' 🖥️'}
        </span>
      </div>
    </div>
  );
};