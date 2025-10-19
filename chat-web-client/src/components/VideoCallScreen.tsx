import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Phone,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Users,
  MoreVertical,
  MessageSquare,
  Grid,
  Maximize2,
} from 'lucide-react';

interface VideoCallScreenProps {
  onEnd: () => void;
}

export function VideoCallScreen({ onEnd }: VideoCallScreenProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const participants = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      isMuted: false,
      isVideoOff: false,
    },
    {
      id: '2',
      name: 'Michael Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      isMuted: true,
      isVideoOff: false,
    },
    {
      id: '3',
      name: 'Emma Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      isMuted: false,
      isVideoOff: true,
    },
  ];

  return (
    <div className="h-full bg-slate-900 text-white relative overflow-hidden">
      {/* Main Video Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Remote Video (Main) */}
        <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
          {/* Placeholder for video stream */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 ring-4 ring-blue-500">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <h3 className="text-2xl mb-1">Sarah Johnson</h3>
              <p className="text-sm text-slate-400">{formatDuration(callDuration)}</p>
            </div>
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">{formatDuration(callDuration)}</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <Users className="w-5 h-5" />
                <span className="ml-1 text-sm">{participants.length}</span>
              </Button>
            </div>
          </div>

          {/* Participant Grid (when enabled) */}
          {showParticipants && (
            <div className="absolute top-16 right-4 bg-slate-800/90 rounded-lg p-2 space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback>{participant.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant.name}</span>
                  <div className="flex gap-1 ml-auto">
                    {participant.isMuted && <MicOff className="w-3 h-3" />}
                    {participant.isVideoOff && <VideoOff className="w-3 h-3" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Self Video (Picture-in-Picture) */}
          <div className="absolute bottom-24 right-4 w-48 h-36 bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl">
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-700">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                <span className="text-xs text-white/70">Your Video</span>
              </div>
            )}
            {isMuted && (
              <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                <MicOff className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center gap-3">
          {/* Microphone Toggle */}
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {/* Video Toggle */}
          <Button
            variant={isVideoOff ? 'destructive' : 'secondary'}
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => setIsVideoOff(!isVideoOff)}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? 'default' : 'secondary'}
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
          >
            <Monitor className="w-6 h-6" />
          </Button>

          {/* Chat */}
          <Button variant="secondary" size="icon" className="h-14 w-14 rounded-full">
            <MessageSquare className="w-6 h-6" />
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="icon"
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
            onClick={onEnd}
          >
            <Phone className="w-6 h-6 rotate-135" />
          </Button>

          {/* More Options */}
          <Button variant="secondary" size="icon" className="h-14 w-14 rounded-full">
            <MoreVertical className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
