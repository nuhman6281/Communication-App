import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'initiating' | 'ringing' | 'ongoing' | 'ended' | 'failed' | 'missed' | 'declined';

export interface CallParticipant {
  userId: string;
  username: string;
  avatarUrl?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

export interface ActiveCall {
  callId: string;
  conversationId: string;
  callType: CallType;
  status: CallStatus;
  participants: Map<string, CallParticipant>;
  initiatorId: string;
  initiatorName: string;
  startedAt: Date;
  endedAt?: Date;
  isMinimized: boolean;
}

export interface IncomingCall {
  callId: string;
  conversationId: string;
  callType: CallType;
  from: {
    userId: string;
    username: string;
    avatarUrl?: string;
  };
  receivedAt: Date;
}

interface CallState {
  // Call state
  activeCall: ActiveCall | null;
  incomingCall: IncomingCall | null;

  // Local media state
  localStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;

  // UI state
  isCallOverlayVisible: boolean;
  isIncomingCallModalVisible: boolean;

  // Actions - Call Management
  initiateCall: (conversationId: string, callType: CallType, participants: string[]) => void;
  setCallId: (callId: string) => void;
  receiveIncomingCall: (call: IncomingCall) => void;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  endCall: (callId: string) => void;

  // Actions - Media Control
  setLocalStream: (stream: MediaStream | null) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;

  // Actions - Participant Management
  addParticipant: (userId: string, participant: CallParticipant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, updates: Partial<CallParticipant>) => void;

  // Actions - UI Control
  minimizeCall: () => void;
  maximizeCall: () => void;
  hideIncomingCallModal: () => void;

  // Actions - Call Recovery
  restoreCall: (call: ActiveCall) => void;
  clearCall: () => void;

  // Getters
  getParticipant: (userId: string) => CallParticipant | undefined;
  getCallDuration: () => number;
}

const initialState = {
  activeCall: null,
  incomingCall: null,
  localStream: null,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  isCallOverlayVisible: false,
  isIncomingCallModalVisible: false,
};

export const useCallStore = create<CallState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initiate a new call (callId will be set by server)
      initiateCall: (conversationId, callType, participantIds) => {
        const activeCall: ActiveCall = {
          callId: 'pending', // Temporary - will be replaced by server's callId
          conversationId,
          callType,
          status: 'initiating',
          participants: new Map(),
          initiatorId: '', // Will be set from auth store
          initiatorName: '',
          startedAt: new Date(),
          isMinimized: false,
        };

        set({
          activeCall,
          isCallOverlayVisible: true,
        });
      },

      // Set call ID from server response
      setCallId: (callId) => {
        set(state => {
          if (!state.activeCall) return state;

          return {
            activeCall: {
              ...state.activeCall,
              callId,
              status: 'ringing',
            },
          };
        });
      },

      // Receive incoming call
      receiveIncomingCall: (call) => {
        set({
          incomingCall: call,
          isIncomingCallModalVisible: true,
        });
      },

      // Accept incoming call
      acceptCall: (callId) => {
        const { incomingCall } = get();
        if (incomingCall && incomingCall.callId === callId) {
          const activeCall: ActiveCall = {
            callId: incomingCall.callId,
            conversationId: incomingCall.conversationId,
            callType: incomingCall.callType,
            status: 'ongoing',
            participants: new Map(),
            initiatorId: incomingCall.from.userId,
            initiatorName: incomingCall.from.username,
            startedAt: new Date(),
            isMinimized: false,
          };

          set({
            activeCall,
            incomingCall: null,
            isCallOverlayVisible: true,
            isIncomingCallModalVisible: false,
          });
        }
      },

      // Reject incoming call
      rejectCall: (callId) => {
        set({
          incomingCall: null,
          isIncomingCallModalVisible: false,
        });
      },

      // End current call
      endCall: (callId) => {
        const { activeCall, localStream } = get();

        // Stop all local media tracks
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }

        // Close all peer connections
        if (activeCall) {
          activeCall.participants.forEach(participant => {
            if (participant.peerConnection) {
              participant.peerConnection.close();
            }
            if (participant.stream) {
              participant.stream.getTracks().forEach(track => track.stop());
            }
          });
        }

        set({
          activeCall: null,
          localStream: null,
          isCallOverlayVisible: false,
          isScreenSharing: false,
        });
      },

      // Set local media stream
      setLocalStream: (stream) => {
        set({ localStream: stream });
      },

      // Toggle audio
      toggleAudio: () => {
        const { localStream, isAudioEnabled } = get();
        if (localStream) {
          const audioTracks = localStream.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = !isAudioEnabled;
          });
          set({ isAudioEnabled: !isAudioEnabled });
        }
      },

      // Toggle video
      toggleVideo: () => {
        const { localStream, isVideoEnabled } = get();
        if (localStream) {
          const videoTracks = localStream.getVideoTracks();
          videoTracks.forEach(track => {
            track.enabled = !isVideoEnabled;
          });
          set({ isVideoEnabled: !isVideoEnabled });
        }
      },

      // Toggle screen share
      toggleScreenShare: () => {
        // Screen share logic will be implemented in the WebRTC service
        set(state => ({ isScreenSharing: !state.isScreenSharing }));
      },

      // Add participant to call
      addParticipant: (userId, participant) => {
        set(state => {
          if (!state.activeCall) return state;

          const newParticipants = new Map(state.activeCall.participants);
          newParticipants.set(userId, participant);

          return {
            activeCall: {
              ...state.activeCall,
              participants: newParticipants,
            },
          };
        });
      },

      // Remove participant from call
      removeParticipant: (userId) => {
        set(state => {
          if (!state.activeCall) return state;

          const participant = state.activeCall.participants.get(userId);
          if (participant) {
            // Clean up peer connection and stream
            if (participant.peerConnection) {
              participant.peerConnection.close();
            }
            if (participant.stream) {
              participant.stream.getTracks().forEach(track => track.stop());
            }
          }

          const newParticipants = new Map(state.activeCall.participants);
          newParticipants.delete(userId);

          return {
            activeCall: {
              ...state.activeCall,
              participants: newParticipants,
            },
          };
        });
      },

      // Update participant
      updateParticipant: (userId, updates) => {
        set(state => {
          if (!state.activeCall) return state;

          const participant = state.activeCall.participants.get(userId);
          if (!participant) return state;

          const newParticipants = new Map(state.activeCall.participants);
          newParticipants.set(userId, { ...participant, ...updates });

          return {
            activeCall: {
              ...state.activeCall,
              participants: newParticipants,
            },
          };
        });
      },

      // Minimize call overlay
      minimizeCall: () => {
        set(state => ({
          activeCall: state.activeCall
            ? { ...state.activeCall, isMinimized: true }
            : null,
          isCallOverlayVisible: false,
        }));
      },

      // Maximize call overlay
      maximizeCall: () => {
        set(state => ({
          activeCall: state.activeCall
            ? { ...state.activeCall, isMinimized: false }
            : null,
          isCallOverlayVisible: true,
        }));
      },

      // Hide incoming call modal
      hideIncomingCallModal: () => {
        set({ isIncomingCallModalVisible: false });
      },

      // Restore call (for persistence)
      restoreCall: (call) => {
        set({
          activeCall: call,
          isCallOverlayVisible: !call.isMinimized,
        });
      },

      // Clear call state
      clearCall: () => {
        set(initialState);
      },

      // Get specific participant
      getParticipant: (userId) => {
        const { activeCall } = get();
        return activeCall?.participants.get(userId);
      },

      // Get call duration in seconds
      getCallDuration: () => {
        const { activeCall } = get();
        if (!activeCall || !activeCall.startedAt) return 0;

        const endTime = activeCall.endedAt || new Date();
        return Math.floor((endTime.getTime() - activeCall.startedAt.getTime()) / 1000);
      },
    }),
    {
      name: 'call-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential call data for recovery
        activeCall: state.activeCall ? {
          ...state.activeCall,
          participants: Array.from(state.activeCall.participants.entries()).map(([id, p]) => ({
            id,
            userId: p.userId,
            username: p.username,
            avatarUrl: p.avatarUrl,
          })),
        } : null,
      }),
      // Custom serialization for Map
      onRehydrateStorage: () => (state) => {
        if (state && state.activeCall && Array.isArray((state.activeCall as any).participants)) {
          const participants = new Map();
          (state.activeCall as any).participants.forEach((p: any) => {
            participants.set(p.id, {
              userId: p.userId,
              username: p.username,
              avatarUrl: p.avatarUrl,
              isAudioEnabled: true,
              isVideoEnabled: true,
              isScreenSharing: false,
            });
          });
          state.activeCall.participants = participants;
        }
      },
    }
  )
);

// Selector hooks for better performance
export const useActiveCall = () => useCallStore(state => state.activeCall);
export const useIncomingCall = () => useCallStore(state => state.incomingCall);
export const useLocalStream = () => useCallStore(state => state.localStream);
export const useCallActions = () => useCallStore(state => ({
  initiateCall: state.initiateCall,
  acceptCall: state.acceptCall,
  rejectCall: state.rejectCall,
  endCall: state.endCall,
  toggleAudio: state.toggleAudio,
  toggleVideo: state.toggleVideo,
  toggleScreenShare: state.toggleScreenShare,
}));