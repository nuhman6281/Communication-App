import React, { useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import { IncomingCall } from '@/lib/stores/call.store';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncomingCallModalProps {
  call: IncomingCall;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onReject,
}) => {
  const [ringTime, setRingTime] = useState(0);
  const [windowPosition, setWindowPosition] = useState({
    x: window.innerWidth / 2 - 220, // Center horizontally (440px width / 2)
    y: window.innerHeight / 2 - 300  // Center vertically (approximate height)
  });

  useEffect(() => {
    // Play ringtone
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(console.error);

    // Update ring time
    const interval = setInterval(() => {
      setRingTime((prev) => prev + 1);
    }, 1000);

    return () => {
      audio.pause();
      audio.remove();
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm animate-in fade-in duration-300"
        style={{
          pointerEvents: 'auto',
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* Floating Draggable Modal */}
      <Rnd
        position={{ x: windowPosition.x, y: windowPosition.y }}
        onDragStop={(e, d) => {
          setWindowPosition({ x: d.x, y: d.y });
        }}
        enableResizing={false}
        bounds="window"
        style={{
          pointerEvents: 'auto',
          zIndex: 9999,
        }}
        className="shadow-2xl"
      >
        <div
          className="w-[440px] flex flex-col bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700/40 animate-in zoom-in-95 duration-300"
          style={{ backgroundColor: '#111827' }}
        >
          {/* Title Bar - Draggable */}
          <div
            className="flex-shrink-0 h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 cursor-move"
            style={{ backgroundColor: '#1f2937' }}
          >
            <div className="flex items-center space-x-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                {call.callType === 'video' ? (
                  <Video className="w-4 h-4 text-white" />
                ) : (
                  <Phone className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-white text-sm font-semibold">
                Incoming {call.callType === 'video' ? 'Video' : 'Voice'} Call
              </span>
            </div>

            <button
              className="w-7 h-7 rounded-lg hover:bg-red-600 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
              onClick={onReject}
              title="Decline"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6" style={{ backgroundColor: '#111827' }}>
            {/* Caller Info */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-3">
                {call.from.avatarUrl ? (
                  <img
                    src={call.from.avatarUrl}
                    alt={call.from.username}
                    className="w-16 h-16 rounded-full ring-4 ring-green-500/50 shadow-xl"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center ring-4 ring-green-500/50 shadow-xl"
                    style={{
                      background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                    }}
                  >
                    <span className="text-white text-2xl font-bold">
                      {call.from.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="text-left">
                  <p className="text-white text-xl font-bold">{call.from.username}</p>
                  <p className="text-gray-400 text-sm">is calling you...</p>
                </div>
              </div>
            </div>

            {/* Call Type Badge */}
            <div className="flex justify-center">
              <div
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                }}
              >
                {call.callType === 'video' ? (
                  <Video className="w-5 h-5 text-white" />
                ) : (
                  <Phone className="w-5 h-5 text-white" />
                )}
                <span className="text-white text-sm font-semibold">
                  {call.callType === 'video' ? 'Video Call' : 'Voice Call'}
                </span>
              </div>
            </div>

            {/* Ring Timer */}
            <div className="flex justify-center">
              <div
                className="inline-flex items-center justify-center px-4 py-2 rounded-full"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <div className="relative mr-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 animate-ping">
                    <div className="w-2 h-2 bg-red-500/50 rounded-full"></div>
                  </div>
                </div>
                <p className="text-white text-sm font-medium">
                  {ringTime < 10 ? `0${ringTime}` : ringTime} seconds
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-8">
              {/* Reject Button */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl group"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                  }}
                  onClick={onReject}
                >
                  <div className="absolute inset-0 rounded-full blur-xl opacity-50 bg-red-500 group-hover:opacity-75 transition-opacity"></div>
                  <PhoneOff className="w-6 h-6 text-white relative z-10" />
                </button>
                <span className="text-xs text-gray-400 font-medium">Decline</span>
              </div>

              {/* Accept Button */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl group animate-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                  onClick={onAccept}
                >
                  <div className="absolute inset-0 rounded-full blur-xl opacity-50 bg-green-500 group-hover:opacity-75 transition-opacity"></div>
                  <Phone className="w-6 h-6 text-white relative z-10" />
                </button>
                <span className="text-xs text-gray-400 font-medium">Accept</span>
              </div>
            </div>

            {/* Quick Message Options */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-center mb-3 text-gray-400 font-medium">
                Quick reply with message
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Can't talk now",
                  "Call you back",
                  "In a meeting",
                ].map((message) => (
                  <button
                    key={message}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm border border-gray-600/50 hover:border-blue-500/50 shadow-lg group"
                    style={{
                      background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                      color: '#d1d5db',
                    }}
                    onClick={() => {
                      console.log('[IncomingCallModal] Sending quick reply:', message);
                      onReject();
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #374151 0%, #1f2937 100%)';
                      e.currentTarget.style.color = '#d1d5db';
                    }}
                  >
                    {message}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Rnd>
    </>
  );
};
