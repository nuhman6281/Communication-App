import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Rnd } from 'react-rnd';
import { useCallStore, useActiveCall, useIncomingCall } from '@/lib/stores/call.store';
import { VideoCallOverlay } from './VideoCallOverlay';
import { IncomingCallModal } from './IncomingCallModal';
import { webrtcService } from '@/lib/webrtc/webrtc.service';

/**
 * GlobalCallContainer
 * Root-level component that renders call UI through React Portal
 * Persists across navigation and survives page refreshes
 */
export const GlobalCallContainer: React.FC = () => {
  const activeCall = useActiveCall();
  const incomingCall = useIncomingCall();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create portal root if it doesn't exist
    let root = document.getElementById('call-portal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'call-portal-root';
      root.style.position = 'fixed';
      root.style.top = '0';
      root.style.left = '0';
      root.style.width = '100%';
      root.style.height = '100%';
      root.style.pointerEvents = 'none';
      root.style.zIndex = '9999';
      document.body.appendChild(root);
    }
    setPortalRoot(root);

    // Cleanup on unmount
    return () => {
      const existingRoot = document.getElementById('call-portal-root');
      if (existingRoot && existingRoot.childNodes.length === 0) {
        existingRoot.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Handle call recovery on mount - validate and clear stale calls
    const storedCall = localStorage.getItem('call-storage');
    if (storedCall) {
      try {
        const parsed = JSON.parse(storedCall);
        if (parsed.state?.activeCall) {
          const call = parsed.state.activeCall;
          const now = new Date().getTime();
          const callAge = call.startedAt ? now - new Date(call.startedAt).getTime() : Infinity;
          const MAX_CALL_AGE = 5 * 60 * 1000; // 5 minutes
          const PENDING_TIMEOUT = 30 * 1000; // 30 seconds - grace period for new calls

          console.log('[GlobalCallContainer] Checking stored call:', {
            callId: call.callId,
            ageSeconds: Math.floor(callAge / 1000),
            status: call.status,
          });

          // Clear stale calls with more intelligent logic:
          // - If callId is 'pending' AND older than 30 seconds, clear it (call initialization failed)
          // - If call is older than 5 minutes, clear it (call was abandoned)
          const isPendingAndStale = call.callId === 'pending' && callAge > PENDING_TIMEOUT;
          const isTooOld = callAge > MAX_CALL_AGE;

          if (isPendingAndStale || isTooOld) {
            console.warn('[GlobalCallContainer] Clearing stale call from storage:', {
              callId: call.callId,
              ageSeconds: Math.floor(callAge / 1000),
              reason: isPendingAndStale ? 'pending timeout' : 'too old',
            });
            useCallStore.getState().clearCall();
          } else {
            console.log('[GlobalCallContainer] ✅ Call is valid, keeping it');
            // Call store will auto-recover from localStorage via persist middleware
          }
        }
      } catch (error) {
        console.error('[GlobalCallContainer] Failed to recover call:', error);
        useCallStore.getState().clearCall();
      }
    }

    // Handle page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeCall) {
        e.preventDefault();
        e.returnValue = 'You have an active call. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeCall]);

  useEffect(() => {
    // Handle visibility change to pause/resume video
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[GlobalCallContainer] Page hidden, pausing video');
        // Optionally pause video to save bandwidth
      } else {
        console.log('[GlobalCallContainer] Page visible, resuming video');
        // Resume video if it was paused
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle incoming call auto-reject after timeout
  useEffect(() => {
    if (!incomingCall) return;

    const timeout = setTimeout(() => {
      console.log('[GlobalCallContainer] Auto-rejecting call due to timeout');
      webrtcService.rejectCall(incomingCall.callId);
    }, 30000); // 30 seconds timeout

    return () => clearTimeout(timeout);
  }, [incomingCall]);

  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <>
      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={() => webrtcService.acceptCall(incomingCall.callId)}
          onReject={() => webrtcService.rejectCall(incomingCall.callId)}
        />
      )}

      {/* Active Call Overlay */}
      {activeCall && !activeCall.isMinimized && (
        <VideoCallOverlay call={activeCall} />
      )}

      {/* Minimized Call Indicator - Draggable */}
      {activeCall && activeCall.isMinimized && (
        <Rnd
          default={{
            x: window.innerWidth - 320 - 24, // 320px width + 24px margin
            y: window.innerHeight - 120 - 24, // 120px height + 24px margin
            width: 320,
            height: 120,
          }}
          minWidth={280}
          minHeight={100}
          maxWidth={400}
          maxHeight={150}
          bounds="window"
          dragHandleClassName="drag-handle"
          enableResizing={false} // Disable resizing for minimized window
          style={{
            pointerEvents: 'auto',
            zIndex: 9999,
          }}
        >
          <div
            className="drag-handle w-full h-full text-white rounded-2xl p-4 shadow-2xl cursor-move hover:shadow-green-500/20 hover:scale-[1.02] transition-all duration-300 border border-gray-700/50 backdrop-blur-xl group"
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
            }}
            onDoubleClick={() => useCallStore.getState().maximizeCall()}
          >
            <div className="flex items-center space-x-3 h-full">
              {/* Animated Call Indicator */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 animate-ping">
                  <div className="w-12 h-12 bg-green-500/30 rounded-full"></div>
                </div>
                <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
                  </svg>
                </div>
              </div>

              {/* Call Info */}
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-white group-hover:text-green-400 transition-colors truncate drop-shadow-md">
                  Call in progress
                </p>
                <p className="text-sm text-gray-100 flex items-center gap-1.5 mt-1 drop-shadow">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                  <span className="truncate font-medium">
                    {activeCall.participants.size} participant{activeCall.participants.size !== 1 ? 's' : ''}
                  </span>
                </p>
                <p className="text-xs text-gray-300 mt-1 italic drop-shadow">
                  Double-click to expand
                </p>
              </div>

              {/* Expand Button */}
              <button
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gray-700/50 hover:bg-green-600 transition-all duration-200 group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  useCallStore.getState().maximizeCall();
                }}
                title="Expand call window"
              >
                <svg
                  className="w-5 h-5 text-gray-300 group-hover/btn:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </Rnd>
      )}
    </>,
    portalRoot
  );
};