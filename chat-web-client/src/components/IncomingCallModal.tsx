import React, { useEffect, useState } from 'react';
import { IncomingCall } from '@/lib/stores/call.store';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
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
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        pointerEvents: 'auto',
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
        style={{
          backgroundColor: '#1f2937',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Call Type Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            >
              {call.callType === 'video' ? (
                <Video className="w-14 h-14 text-white" />
              ) : (
                <Phone className="w-14 h-14 text-white" />
              )}
            </div>
            {/* Ripple effect */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: '4px solid #10b981',
                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            ></div>
          </div>
        </div>

        {/* Caller Info */}
        <div className="text-center mb-8">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: '#ffffff' }}
          >
            Incoming {call.callType === 'video' ? 'Video' : 'Voice'} Call
          </h2>

          <div className="flex items-center justify-center space-x-4 mb-6">
            {call.from.avatarUrl ? (
              <img
                src={call.from.avatarUrl}
                alt={call.from.username}
                className="w-16 h-16 rounded-full ring-4 ring-green-500"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center ring-4 ring-green-500"
                style={{ backgroundColor: '#374151' }}
              >
                <span className="text-white text-2xl font-semibold">
                  {call.from.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-left">
              <p className="text-white text-2xl font-bold">{call.from.username}</p>
              <p className="text-gray-300 text-base">is calling you...</p>
            </div>
          </div>

          <div
            className="inline-flex items-center justify-center px-4 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <p className="text-white text-lg font-medium">
              {ringTime < 10 ? `0${ringTime}` : ringTime} seconds
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <button
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: '#dc2626' }}
            onClick={onReject}
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </button>

          <button
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: '#10b981' }}
            onClick={onAccept}
          >
            <Phone className="w-8 h-8 text-white" />
          </button>
        </div>

        {/* Quick Message Options */}
        <div
          className="pt-6"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <p
            className="text-sm text-center mb-4"
            style={{ color: '#9ca3af' }}
          >
            Quick reply with message
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "Can't talk now",
              "Call you back",
              "In a meeting",
            ].map((message) => (
              <button
                key={message}
                className="text-sm px-4 py-2 rounded-full transition-all hover:scale-105"
                style={{
                  backgroundColor: '#374151',
                  color: '#d1d5db',
                }}
                onClick={() => {
                  console.log('[IncomingCallModal] Sending quick reply:', message);
                  onReject();
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
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
  );
};