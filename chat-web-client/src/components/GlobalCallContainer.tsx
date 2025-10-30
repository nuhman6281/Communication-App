import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
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

      {/* Minimized Call Indicator */}
      {activeCall && activeCall.isMinimized && (
        <div
          className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg p-3 shadow-lg cursor-pointer hover:bg-gray-800 transition-colors"
          style={{ pointerEvents: 'auto' }}
          onClick={() => useCallStore.getState().maximizeCall()}
        >
          <div className="flex items-center space-x-3">
            <div className="animate-pulse">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium">Call in progress</p>
              <p className="text-xs text-gray-400">
                {activeCall.participants.size} participant{activeCall.participants.size !== 1 ? 's' : ''}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 11l5-5 5 5M7 17l5-5 5 5"
              />
            </svg>
          </div>
        </div>
      )}
    </>,
    portalRoot
  );
};