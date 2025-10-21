/**
 * Video Call Screen
 * Integrated with Jitsi Meet for video/audio calling
 */

import { useEffect, useRef, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Loader2, Circle, Wifi, WifiOff, Signal } from 'lucide-react';
import { Badge } from './ui/badge';

interface VideoCallScreenProps {
  onEnd: () => void;
  jitsiConfig?: any;
}

export function VideoCallScreen({ onEnd, jitsiConfig }: VideoCallScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'file' | 'stream' | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<number>(100);
  const [bitrate, setBitrate] = useState<{ audio: number; video: number } | null>(null);
  const [packetLoss, setPacketLoss] = useState<number>(0);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, []);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold">Call Error</h2>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={onEnd}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  if (!jitsiConfig) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="text-5xl mb-4">📞</div>
          <h2 className="text-2xl font-semibold">No Active Call</h2>
          <p className="text-slate-400">Please initiate or accept a call first</p>
          <button
            onClick={onEnd}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  // Helper to get quality info
  const getQualityInfo = () => {
    if (connectionQuality >= 80) {
      return { color: 'bg-green-500', icon: Wifi, text: 'Excellent' };
    } else if (connectionQuality >= 60) {
      return { color: 'bg-yellow-500', icon: Signal, text: 'Good' };
    } else if (connectionQuality >= 40) {
      return { color: 'bg-orange-500', icon: Signal, text: 'Fair' };
    } else {
      return { color: 'bg-red-500', icon: WifiOff, text: 'Poor' };
    }
  };

  const qualityInfo = getQualityInfo();
  const QualityIcon = qualityInfo.icon;

  return (
    <div className="h-full relative bg-slate-900">
      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <Badge variant="destructive" className="px-4 py-2 text-sm flex items-center gap-2">
            <Circle className="w-3 h-3 fill-current animate-pulse" />
            <span>Recording {recordingMode === 'stream' ? '(Live)' : ''}</span>
          </Badge>
        </div>
      )}

      {/* Connection Quality Indicator */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <Badge className={`${qualityInfo.color} px-3 py-2 text-sm flex items-center gap-2`}>
          <QualityIcon className="w-4 h-4" />
          <span>{qualityInfo.text}</span>
        </Badge>

        {/* Detailed Stats (shown when quality is poor) */}
        {connectionQuality < 60 && bitrate && (
          <div className="bg-black/70 text-white text-xs px-3 py-2 rounded-lg space-y-1">
            <div>Quality: {connectionQuality}%</div>
            {bitrate.video > 0 && <div>Video: {Math.round(bitrate.video / 1000)} kbps</div>}
            {bitrate.audio > 0 && <div>Audio: {Math.round(bitrate.audio / 1000)} kbps</div>}
            {packetLoss > 0 && <div>Packet Loss: {packetLoss.toFixed(1)}%</div>}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <p className="text-white">Connecting to call...</p>
          </div>
        </div>
      )}

      {/* Jitsi Meeting Component */}
      <JitsiMeeting
        domain={jitsiConfig.jitsiUrl?.replace(/^https?:\/\//, '') || 'meet.jit.si'}
        roomName={jitsiConfig.roomName}
        configOverwrite={{
          ...jitsiConfig.configOverwrite,
          prejoinPageEnabled: false,
          startWithAudioMuted: jitsiConfig.configOverwrite?.startWithAudioMuted ?? false,
          startWithVideoMuted: jitsiConfig.configOverwrite?.startWithVideoMuted ?? false,
        }}
        interfaceConfigOverwrite={{
          ...jitsiConfig.interfaceConfigOverwrite,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_BACKGROUND: '#1e293b',
        }}
        userInfo={{
          displayName: jitsiConfig.userInfo?.displayName || 'User',
          email: jitsiConfig.userInfo?.email,
        }}
        jwt={jitsiConfig.jwt}
        onApiReady={(externalApi) => {
          console.log('[Jitsi] API Ready');
          apiRef.current = externalApi;
          setIsLoading(false);

          // Add event listeners
          externalApi.addListener('videoConferenceJoined', (event: any) => {
            console.log('[Jitsi] Conference joined:', event);
          });

          externalApi.addListener('videoConferenceLeft', (event: any) => {
            console.log('[Jitsi] Conference left:', event);
            onEnd();
          });

          externalApi.addListener('readyToClose', () => {
            console.log('[Jitsi] Ready to close');
            onEnd();
          });

          externalApi.addListener('errorOccurred', (error: any) => {
            console.error('[Jitsi] Error occurred:', error);
            setError(error.message || 'An error occurred during the call');
          });

          // Recording event listeners
          externalApi.addListener('recordingStatusChanged', (event: any) => {
            console.log('[Jitsi] Recording status changed:', event);
            setIsRecording(event.on);
            setRecordingMode(event.mode || null);

            // TODO: Update call recording status in backend when recording starts/stops
            if (event.on) {
              console.log(`[Jitsi] Recording started (mode: ${event.mode})`);
            } else {
              console.log('[Jitsi] Recording stopped');
              // TODO: If recording URL is available, update it in the backend
            }
          });

          externalApi.addListener('recordingLinkAvailable', (event: any) => {
            console.log('[Jitsi] Recording link available:', event);
            // TODO: Save recording URL to backend
            // event.link contains the recording URL
          });

          // Quality monitoring listeners
          externalApi.addListener('connectionQualityChanged', (event: any) => {
            console.log('[Jitsi] Connection quality changed:', event);
            // event.quality is a number from 0-100
            setConnectionQuality(event.quality || 100);
          });

          externalApi.addListener('bitrateChanged', (event: any) => {
            console.log('[Jitsi] Bitrate changed:', event);
            setBitrate({
              audio: event.audio || 0,
              video: event.video || 0,
            });
          });

          externalApi.addListener('packetLossChanged', (event: any) => {
            console.log('[Jitsi] Packet loss:', event);
            setPacketLoss(event.packetLoss || 0);
          });

          // Poll for stats periodically (fallback if events don't fire)
          const statsInterval = setInterval(async () => {
            try {
              const stats = await externalApi.executeCommand('getStats');
              if (stats) {
                console.log('[Jitsi] Stats:', stats);
              }
            } catch (err) {
              // Stats API might not be available
            }
          }, 5000);

          // Cleanup interval on unmount
          return () => clearInterval(statsInterval);
        }}
        onReadyToClose={() => {
          console.log('[Jitsi] Ready to close (callback)');
          onEnd();
        }}
        getIFrameRef={(iframeRef) => {
          if (iframeRef) {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }
        }}
      />
    </div>
  );
}
