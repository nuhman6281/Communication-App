import React, { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
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
  MessageSquare,
  X,
  Settings,
  MoreVertical,
  Grid3x3,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoCallOverlayProps {
  call: ActiveCall;
}

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({ call }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const [windowPosition, setWindowPosition] = useState(() => ({
    x: (window.innerWidth - 800) / 2,
    y: (window.innerHeight - 600) / 2 - 50
  }));

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

  // Setup local video - CRITICAL FIX: Also depend on call.callType to handle audio-to-video switch
  useEffect(() => {
    console.log('[VideoCallOverlay] 📹 ========================================');
    console.log('[VideoCallOverlay] 📹 LOCAL VIDEO UPDATE EFFECT');
    console.log('[VideoCallOverlay] ========================================');
    console.log('[VideoCallOverlay] Has localStream:', !!localStream);
    console.log('[VideoCallOverlay] Has localVideoRef:', !!localVideoRef.current);
    console.log('[VideoCallOverlay] Call type:', call.callType);
    console.log('[VideoCallOverlay] Video enabled:', isVideoEnabled);

    if (localVideoRef.current && localStream) {
      console.log('[VideoCallOverlay] Setting local video srcObject');
      console.log('[VideoCallOverlay] Local stream ID:', localStream.id);
      console.log('[VideoCallOverlay] Local stream tracks:', localStream.getTracks().length);

      localStream.getTracks().forEach((track, index) => {
        console.log(`[VideoCallOverlay]   Track ${index + 1}:`, track.kind, '-', track.label);
        console.log(`[VideoCallOverlay]     Enabled:`, track.enabled);
        console.log(`[VideoCallOverlay]     Ready state:`, track.readyState);
      });

      const videoElement = localVideoRef.current;
      videoElement.srcObject = localStream;

      // Force video to play
      console.log('[VideoCallOverlay] 🎬 Attempting to play local video element...');
      videoElement.play().then(() => {
        console.log('[VideoCallOverlay] ✅ Local video element playing successfully');
        console.log('[VideoCallOverlay] Video readyState:', videoElement.readyState);
      }).catch(err => {
        console.error('[VideoCallOverlay] ❌ Failed to play local video:', err.message);
      });

      console.log('[VideoCallOverlay] ✅ Local video srcObject set successfully');
    } else {
      if (!localVideoRef.current) {
        console.warn('[VideoCallOverlay] ⚠️ No local video ref available');
      }
      if (!localStream) {
        console.warn('[VideoCallOverlay] ⚠️ No local stream available');
      }
    }
  }, [localStream, call.callType, isVideoEnabled]); // CRITICAL FIX: Added call.callType and isVideoEnabled as dependencies

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Save current size and maximize
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      setWindowPosition({ x: 0, y: 0 });
      setIsFullscreen(true);
    } else {
      // Restore to windowed mode
      setWindowSize({ width: 1000, height: 700 });
      setWindowPosition({ x: 100, y: 50 });
      setIsFullscreen(false);
    }
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

  const participants = Array.from(call.participants.values());
  const participantCount = participants.length + 1; // +1 for self

  // Determine layout mode
  const shouldShowGrid = isScreenSharing ? false : true;

  return (
    <Rnd
      size={{ width: windowSize.width, height: windowSize.height }}
      position={{ x: windowPosition.x, y: windowPosition.y }}
      onDragStop={(e, d) => {
        if (!isFullscreen) {
          setWindowPosition({ x: d.x, y: d.y });
        }
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        if (!isFullscreen) {
          setWindowSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
          setWindowPosition(position);
        }
      }}
      minWidth={500}
      minHeight={350}
      bounds="window"
      disableDragging={isFullscreen}
      enableResizing={!isFullscreen}
      style={{
        pointerEvents: 'auto',
        zIndex: 9999,
        backgroundColor: '#111827',
      }}
      className="shadow-2xl"
    >
      <div className="w-full h-full flex flex-col bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700/40"
        style={{ backgroundColor: '#111827' }}
      >
        {/* Window Title Bar - Draggable */}
        <div
          className="flex-shrink-0 h-16 bg-gradient-to-r from-gray-800 via-gray-850 to-gray-800 border-b border-gray-600/50 flex items-center justify-between px-5 cursor-move shadow-lg"
          onDoubleClick={toggleFullscreen}
          style={{ backgroundColor: '#1f2937' }}
        >
          <div className="flex items-center space-x-4">
            {/* Call Type Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-400/30">
              {call.callType === 'video' ? (
                <Video className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </div>
            {/* Call Info */}
            <div>
              <h3 className="text-white text-base font-bold tracking-wide">
                {participants.length > 0 ? participants[0].username : 'Call'}
              </h3>
              <div className="flex items-center space-x-3 text-sm mt-0.5">
                {/* Call Duration */}
                <div className="flex items-center space-x-1.5 bg-red-600/50 px-3 py-1.5 rounded-full border border-red-400/50 shadow-lg">
                  <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse shadow-lg shadow-red-400/80"></div>
                  <span className="font-bold text-white drop-shadow-lg">{formatDuration(callDuration)}</span>
                </div>
                {/* Participant Count */}
                <div className="flex items-center space-x-1.5 bg-blue-600/50 px-3 py-1.5 rounded-full border border-blue-400/50 shadow-lg">
                  <Users className="w-3.5 h-3.5 text-white drop-shadow-lg" />
                  <span className="font-bold text-white drop-shadow-lg">{participantCount} {participantCount === 1 ? 'person' : 'people'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              className="w-9 h-9 rounded-lg hover:bg-gray-700/60 flex items-center justify-center transition-all text-gray-100 hover:text-white hover:scale-110"
              onClick={() => setShowParticipants(!showParticipants)}
              title="Participants"
            >
              <Users className="w-5 h-5 drop-shadow-lg" />
            </button>
            <button
              className="w-9 h-9 rounded-lg hover:bg-gray-700/60 flex items-center justify-center transition-all text-gray-100 hover:text-white hover:scale-110"
              onClick={() => setShowChat(!showChat)}
              title="Chat"
            >
              <MessageSquare className="w-5 h-5 drop-shadow-lg" />
            </button>
            <button
              className="w-9 h-9 rounded-lg hover:bg-gray-700/60 flex items-center justify-center transition-all text-gray-100 hover:text-white hover:scale-110"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 drop-shadow-lg" />
              ) : (
                <Maximize2 className="w-5 h-5 drop-shadow-lg" />
              )}
            </button>
            <button
              className="w-9 h-9 rounded-lg hover:bg-gray-700/60 flex items-center justify-center transition-all text-gray-100 hover:text-white hover:scale-110"
              onClick={minimizeCall}
              title="Minimize"
            >
              <Minimize2 className="w-5 h-5 drop-shadow-lg" />
            </button>
            <button
              className="w-9 h-9 rounded-lg hover:bg-red-600 flex items-center justify-center transition-all text-gray-100 hover:text-white hover:scale-110"
              onClick={() => {
                console.log('[VideoCallOverlay] 🔴 Close button clicked');
                webrtcService.endCall();
              }}
              title="Close"
            >
              <X className="w-5 h-5 drop-shadow-lg" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Participants Sidebar */}
          {showParticipants && (
            <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto" style={{ backgroundColor: '#1f2937' }}>
              <div className="p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Participants ({participantCount})</span>
                </h4>
                <div className="space-y-2">
                  {/* Self */}
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">You</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        {!isAudioEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                        {!isVideoEnabled && <VideoOff className="w-3 h-3 text-red-400" />}
                        {isScreenSharing && <Monitor className="w-3 h-3 text-blue-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Remote participants */}
                  {participants.map((participant) => (
                    <div key={participant.userId} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        {participant.avatarUrl ? (
                          <img src={participant.avatarUrl} alt={participant.username} className="w-full h-full rounded-full" />
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {participant.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{participant.username}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          {!participant.isAudioEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                          {!participant.isVideoEnabled && <VideoOff className="w-3 h-3 text-red-400" />}
                          {participant.isScreenSharing && <Monitor className="w-3 h-3 text-blue-400" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Video/Content Area */}
          <div className="flex-1 flex flex-col bg-gray-900" style={{ backgroundColor: '#111827' }}>
            {/* Screen Sharing View or Video Grid */}
            <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: '#111827' }}>
              {isScreenSharing ? (
                /* Screen Sharing Layout */
                <div className="h-full flex space-x-3">
                  {/* Main screen share view */}
                  <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden relative">
                    {/* Find the screen sharing participant */}
                    {(() => {
                      const screenSharer = participants.find(p => p.isScreenSharing);
                      if (screenSharer && screenSharer.stream) {
                        return (
                          <ScreenShareDisplay
                            participantId={screenSharer.userId}
                            username={screenSharer.username}
                            stream={screenSharer.stream}
                          />
                        );
                      } else if (isScreenSharing) {
                        // Local user is screen sharing
                        return (
                          <ScreenShareDisplay
                            participantId="local"
                            username="You"
                            stream={localStream}
                            isLocal
                          />
                        );
                      } else {
                        // Fallback - shouldn't happen if isScreenSharing is true
                        return (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4">
                              <Monitor className="w-16 h-16 text-gray-500 mx-auto" />
                              <p className="text-gray-400 text-lg">Waiting for screen share...</p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                  {/* Thumbnail sidebar */}
                  <div className="w-48 space-y-3 overflow-y-auto">
                    <ParticipantThumbnail
                      participant={null}
                      isLocal
                      localVideoRef={localVideoRef}
                      localStream={localStream}
                      isVideoEnabled={isVideoEnabled}
                      isAudioEnabled={isAudioEnabled}
                    />
                    {participants.map((participant) => (
                      <ParticipantThumbnail
                        key={participant.userId}
                        participant={participant}
                      />
                    ))}
                  </div>
                </div>
              ) : (!isVideoEnabled && participants.every(p => !p.isVideoEnabled || !p.stream)) ? (
                /* Voice Call / All Videos Off - Avatar Grid */
                /* CRITICAL FIX: Check both isVideoEnabled and actual stream presence */
                <div className="h-full flex items-center justify-center p-8" style={{ backgroundColor: '#1e293b' }}>
                  {/* CRITICAL FIX: Hidden audio elements for remote participants */}
                  {/* These play the remote audio streams even when video is off */}
                  {participants.map((participant) => (
                    participant.stream && (
                      <RemoteAudio
                        key={`audio-${participant.userId}`}
                        participantId={participant.userId}
                        stream={participant.stream}
                      />
                    )
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 max-w-5xl w-full">
                    {/* Local user */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div
                          className="w-48 h-48 rounded-full flex items-center justify-center shadow-2xl ring-8 ring-blue-400/40"
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          }}
                        >
                          <User className="w-24 h-24 text-white" />
                        </div>
                        {/* Animated ring for speaking */}
                        {isAudioEnabled && (
                          <div className="absolute inset-0 rounded-full ring-4 ring-green-400 animate-pulse"></div>
                        )}
                      </div>
                      <div className="text-center space-y-3">
                        <p className="text-white text-xl font-bold">You</p>
                        <div className="flex items-center justify-center">
                          {!isAudioEnabled ? (
                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-600 shadow-lg">
                              <MicOff className="w-5 h-5 text-white" />
                              <span className="text-white text-sm font-semibold">Muted</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-green-600 shadow-lg">
                              <Mic className="w-5 h-5 text-white" />
                              <span className="text-white text-sm font-semibold">Speaking</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remote participants */}
                    {participants.map((participant, index) => {
                      // Generate unique gradient colors for each participant
                      const gradients = [
                        { from: '#10b981', to: '#047857', ring: 'ring-emerald-400/40' }, // Green
                        { from: '#f59e0b', to: '#d97706', ring: 'ring-amber-400/40' },   // Amber
                        { from: '#8b5cf6', to: '#6d28d9', ring: 'ring-purple-400/40' },  // Purple
                        { from: '#ec4899', to: '#be185d', ring: 'ring-pink-400/40' },   // Pink
                        { from: '#06b6d4', to: '#0891b2', ring: 'ring-cyan-400/40' },    // Cyan
                      ];
                      const gradient = gradients[index % gradients.length];

                      return (
                        <div key={participant.userId} className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            {participant.avatarUrl ? (
                              <div className={`w-48 h-48 rounded-full overflow-hidden shadow-2xl ring-8 ${gradient.ring}`}>
                                <img
                                  src={participant.avatarUrl}
                                  alt={participant.username}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-48 h-48 rounded-full flex items-center justify-center shadow-2xl ring-8 ${gradient.ring}`}
                                style={{
                                  background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                                }}
                              >
                                <div className="flex items-center justify-center w-32 h-32 bg-white/20 rounded-full backdrop-blur-sm">
                                  <span className="text-white text-6xl font-bold drop-shadow-lg">
                                    {participant.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            )}
                            {/* Animated ring for speaking */}
                            {participant.isAudioEnabled && (
                              <div className="absolute inset-0 rounded-full ring-4 ring-green-400 animate-pulse"></div>
                            )}
                          </div>
                          <div className="text-center space-y-3">
                            <p className="text-white text-xl font-bold">{participant.username}</p>
                            <div className="flex items-center justify-center">
                              {!participant.isAudioEnabled ? (
                                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-600 shadow-lg">
                                  <MicOff className="w-5 h-5 text-white" />
                                  <span className="text-white text-sm font-semibold">Muted</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-green-600 shadow-lg">
                                  <Mic className="w-5 h-5 text-white" />
                                  <span className="text-white text-sm font-semibold">Speaking</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Video Grid */
                <div className={cn(
                  "grid gap-3 h-full",
                  participantCount === 1 ? "grid-cols-1" :
                  participantCount === 2 ? "grid-cols-1 md:grid-cols-2" :
                  participantCount <= 4 ? "grid-cols-2" :
                  participantCount <= 6 ? "grid-cols-2 md:grid-cols-3" :
                  "grid-cols-3"
                )}>
                  {/* Local video */}
                  <VideoTile
                    localVideoRef={localVideoRef}
                    localStream={localStream}
                    isLocal
                    isVideoEnabled={isVideoEnabled}
                    isAudioEnabled={isAudioEnabled}
                    username="You"
                  />

                  {/* Remote participants */}
                  {participants.map((participant) => (
                    <VideoTile
                      key={participant.userId}
                      participant={participant}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="flex-shrink-0 h-24 bg-gray-800 border-t border-gray-700/50 flex items-center justify-center px-6"
              style={{ backgroundColor: '#1f2937' }}
            >
              <div className="flex items-center space-x-4">
                {/* Microphone */}
                <button
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg",
                    isAudioEnabled
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  )}
                  onClick={() => webrtcService.toggleAudio()}
                  title={isAudioEnabled ? "Mute" : "Unmute"}
                >
                  {isAudioEnabled ? (
                    <Mic className="w-6 h-6" />
                  ) : (
                    <MicOff className="w-6 h-6" />
                  )}
                </button>

                {/* Video */}
                {call.callType === 'video' ? (
                  <button
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg",
                      isVideoEnabled
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    )}
                    onClick={() => webrtcService.toggleVideo()}
                    title={isVideoEnabled ? "Stop video" : "Start video"}
                  >
                    {isVideoEnabled ? (
                      <Video className="w-6 h-6" />
                    ) : (
                      <VideoOff className="w-6 h-6" />
                    )}
                  </button>
                ) : (
                  <button
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg text-white"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                    onClick={() => {
                      console.log('[VideoCallOverlay] 📹 SWITCH TO VIDEO BUTTON CLICKED');
                      webrtcService.switchToVideo();
                    }}
                    title="Add video"
                  >
                    <Video className="w-6 h-6" />
                  </button>
                )}

                {/* Screen Share */}
                <button
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg",
                    isScreenSharing
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  )}
                  onClick={() => webrtcService.toggleScreenShare()}
                  title={isScreenSharing ? "Stop sharing" : "Share screen"}
                >
                  {isScreenSharing ? (
                    <MonitorOff className="w-6 h-6" />
                  ) : (
                    <Monitor className="w-6 h-6" />
                  )}
                </button>

                {/* More Options */}
                <button
                  className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg text-white"
                  title="More options"
                >
                  <MoreVertical className="w-6 h-6" />
                </button>

                {/* Divider */}
                <div className="w-px h-10 bg-gray-600 mx-2"></div>

                {/* End Call */}
                <button
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg text-white"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  }}
                  onClick={() => {
                    console.log('[VideoCallOverlay] 🔴 END CALL BUTTON CLICKED');
                    webrtcService.endCall();
                  }}
                  title="End call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col" style={{ backgroundColor: '#1f2937' }}>
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h4 className="text-white font-semibold flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </h4>
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowChat(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-sm">Chat coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
};

// Participant Thumbnail Component (for screen sharing sidebar)
interface ParticipantThumbnailProps {
  participant?: CallParticipant | null;
  isLocal?: boolean;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  localStream?: MediaStream | null;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
}

const ParticipantThumbnail: React.FC<ParticipantThumbnailProps> = ({
  participant,
  isLocal,
  localVideoRef,
  localStream,
  isVideoEnabled,
  isAudioEnabled
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isLocal && videoRef.current && participant?.stream) {
      videoRef.current.srcObject = participant.stream;
      videoRef.current.play().catch(console.error);
    }
  }, [participant?.stream, isLocal]);

  const showVideo = isLocal ? isVideoEnabled : participant?.isVideoEnabled;
  const showAudioIcon = isLocal ? !isAudioEnabled : !participant?.isAudioEnabled;
  const displayName = isLocal ? 'You' : participant?.username || '';

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video border border-gray-700">
      {showVideo ? (
        <video
          ref={isLocal ? localVideoRef : videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-1 left-1 right-1 bg-black/70 backdrop-blur-sm rounded px-2 py-1 flex items-center justify-between">
        <span className="text-white text-xs font-medium truncate">{displayName}</span>
        {showAudioIcon && <MicOff className="w-3 h-3 text-red-400 flex-shrink-0 ml-1" />}
      </div>
    </div>
  );
};

// Video Tile Component
interface VideoTileProps {
  participant?: CallParticipant;
  isLocal?: boolean;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  localStream?: MediaStream | null;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
  username?: string;
}

const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  isLocal,
  localVideoRef,
  localStream,
  isVideoEnabled,
  isAudioEnabled,
  username
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup local video
  useEffect(() => {
    if (isLocal && localVideoRef?.current && localStream) {
      console.log('[VideoTile] 🎥 Setting up LOCAL video');
      console.log('[VideoTile] Local stream:', localStream);
      console.log('[VideoTile] Local stream tracks:', localStream.getTracks().length);

      const videoElement = localVideoRef.current;
      videoElement.srcObject = localStream;

      videoElement.play().then(() => {
        console.log('[VideoTile] ✅ Local video playing');
      }).catch(err => {
        console.error('[VideoTile] ❌ Local video play error:', err);
      });
    }
  }, [isLocal, localStream, localVideoRef]);

  useEffect(() => {
    console.log('[VideoTile] 📺 ========================================');
    console.log('[VideoTile] 📺 STREAM UPDATE EFFECT');
    console.log('[VideoTile] ========================================');
    console.log('[VideoTile] Participant:', participant?.username || 'Local');
    console.log('[VideoTile] Has stream:', !!participant?.stream);
    console.log('[VideoTile] Has videoRef:', !!videoRef.current);

    if (!isLocal && videoRef.current && participant?.stream) {
      console.log('[VideoTile] Setting srcObject on video element');
      console.log('[VideoTile] Stream ID:', participant.stream.id);
      console.log('[VideoTile] Stream active:', participant.stream.active);
      console.log('[VideoTile] Stream tracks:', participant.stream.getTracks().length);

      participant.stream.getTracks().forEach((track, index) => {
        console.log(`[VideoTile]   Track ${index + 1}:`, track.kind, '-', track.label);
        console.log(`[VideoTile]     Enabled:`, track.enabled);
        console.log(`[VideoTile]     Ready state:`, track.readyState);
      });

      const videoElement = videoRef.current;
      videoElement.srcObject = participant.stream;

      // CRITICAL FIX: Force video to play for remote streams
      console.log('[VideoTile] 🎬 Attempting to play video element...');
      videoElement.play().then(() => {
        console.log('[VideoTile] ✅ Video element playing successfully');
        console.log('[VideoTile] Video readyState:', videoElement.readyState);
        console.log('[VideoTile] Video paused:', videoElement.paused);
      }).catch(err => {
        console.error('[VideoTile] ❌ Failed to play video:', err.message);
        console.error('[VideoTile] Video error code:', videoElement.error?.code);
        console.error('[VideoTile] Video error message:', videoElement.error?.message);
      });

      // Add loadedmetadata event listener
      const handleLoadedMetadata = () => {
        console.log('[VideoTile] 📹 Video metadata loaded');
        console.log('[VideoTile] Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
        console.log('[VideoTile] Video duration:', videoElement.duration);
      };

      const handleCanPlay = () => {
        console.log('[VideoTile] 🎬 Video can play');
        console.log('[VideoTile] Video readyState:', videoElement.readyState);
      };

      const handlePlaying = () => {
        console.log('[VideoTile] ▶️ Video is playing');
      };

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('playing', handlePlaying);

      console.log('[VideoTile] ✅ srcObject set successfully');

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('playing', handlePlaying);
      };
    } else {
      if (!isLocal && !videoRef.current) {
        console.warn('[VideoTile] ⚠️ No video ref available');
      }
      if (!isLocal && !participant?.stream) {
        console.warn('[VideoTile] ⚠️ No stream available for participant');
      }
    }
  }, [participant?.stream, participant?.username, isLocal]);

  // CRITICAL FIX: Check both isVideoEnabled and actual video track presence
  const hasVideoTrack = isLocal
    ? (localStream?.getVideoTracks().length || 0) > 0
    : (participant?.stream?.getVideoTracks().length || 0) > 0;

  const showVideo = isLocal
    ? (isVideoEnabled && hasVideoTrack)
    : (participant?.isVideoEnabled && hasVideoTrack);

  const showAudioIcon = isLocal ? !isAudioEnabled : !participant?.isAudioEnabled;
  const displayName = isLocal ? username || 'You' : participant?.username || '';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700/30 hover:border-gray-600/50 transition-colors h-full min-h-[200px] flex items-center justify-center shadow-lg">
      {showVideo ? (
        <video
          ref={isLocal ? localVideoRef : videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="w-full h-full object-cover"
          style={{
            transform: isLocal ? 'scaleX(-1)' : 'none', // Mirror local video for natural view
            backgroundColor: '#1f2937'
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className={cn(
            "bg-gradient-to-br rounded-full flex items-center justify-center shadow-2xl ring-4",
            isLocal
              ? "from-blue-500 to-blue-600 ring-blue-500/20 w-24 h-24"
              : "from-green-500 to-emerald-600 ring-green-500/20 w-24 h-24"
          )}>
            {participant?.avatarUrl && !isLocal ? (
              <img
                src={participant.avatarUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl font-bold">
                {displayInitial}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center space-x-2 shadow-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">{displayName}</span>
          {showAudioIcon && (
            <MicOff className="w-3.5 h-3.5 text-red-400" />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * RemoteAudio Component
 *
 * CRITICAL FIX: This component renders a hidden audio element to play remote participant audio
 * during audio-only calls. Without this, audio would only work when video is enabled
 * (because video elements play both audio and video tracks).
 *
 * This ensures audio works in all scenarios:
 * - Audio-only calls (avatar view)
 * - Video calls with video disabled
 * - Mixed scenarios (some participants with video, some without)
 */
interface RemoteAudioProps {
  participantId: string;
  stream: MediaStream;
}

const RemoteAudio: React.FC<RemoteAudioProps> = ({ participantId, stream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    console.log(`[RemoteAudio] 🔊 Setting up audio for participant: ${participantId}`);
    console.log(`[RemoteAudio] Stream ID: ${stream.id}`);
    console.log(`[RemoteAudio] Audio tracks: ${stream.getAudioTracks().length}`);

    if (audioRef.current && stream) {
      const audioElement = audioRef.current;
      audioElement.srcObject = stream;

      audioElement.play().then(() => {
        console.log(`[RemoteAudio] ✅ Audio playing for participant: ${participantId}`);
      }).catch(err => {
        console.error(`[RemoteAudio] ❌ Failed to play audio for ${participantId}:`, err.message);
      });
    }

    return () => {
      console.log(`[RemoteAudio] 🧹 Cleaning up audio for participant: ${participantId}`);
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [participantId, stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      style={{ display: 'none' }} // Hidden - only for audio playback
    />
  );
};

/**
 * ScreenShareDisplay Component
 *
 * Displays the screen sharing stream in a video element with proper styling and controls.
 */
interface ScreenShareDisplayProps {
  participantId: string;
  username: string;
  stream: MediaStream | null;
  isLocal?: boolean;
}

const ScreenShareDisplay: React.FC<ScreenShareDisplayProps> = ({
  participantId,
  username,
  stream,
  isLocal = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log(`[ScreenShare] 🖥️ Setting up screen share for: ${username}`);
    console.log(`[ScreenShare] Participant ID: ${participantId}`);
    console.log(`[ScreenShare] Has stream:`, !!stream);

    if (videoRef.current && stream) {
      const videoElement = videoRef.current;
      videoElement.srcObject = stream;

      videoElement.play().then(() => {
        console.log(`[ScreenShare] ✅ Screen share playing for: ${username}`);
      }).catch(err => {
        console.error(`[ScreenShare] ❌ Failed to play screen share:`, err.message);
      });
    }

    return () => {
      console.log(`[ScreenShare] 🧹 Cleaning up screen share for: ${username}`);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [participantId, username, stream]);

  if (!stream) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Monitor className="w-16 h-16 text-gray-500 mx-auto" />
          <p className="text-gray-400 text-lg">No screen share stream available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      {/* Screen share indicator */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center space-x-3 shadow-lg">
        <Monitor className="w-5 h-5 text-blue-400" />
        <div>
          <p className="text-white text-sm font-semibold">
            {isLocal ? 'You are' : `${username} is`} sharing screen
          </p>
        </div>
      </div>
    </div>
  );
};
