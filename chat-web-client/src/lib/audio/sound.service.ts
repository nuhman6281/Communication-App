/**
 * Sound Notification Service
 *
 * Manages audio notifications for messages and calls.
 * Handles muting, volume control, and graceful degradation when sound files are missing.
 * Falls back to Web Audio API beeps if sound files are not available.
 */

class SoundService {
  private messageSound: HTMLAudioElement | null = null;
  private callSound: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private callOscillator: OscillatorNode | null = null;
  private callGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private useFallbackSounds: boolean = false;

  constructor() {
    // Initialize sounds lazily to avoid autoplay restrictions
    this.initializeSounds();
    // Initialize Web Audio API for fallback sounds
    this.initializeAudioContext();
  }

  /**
   * Initialize Web Audio API for fallback sounds
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('[SoundService] Web Audio API initialized for fallback sounds');
    } catch (error) {
      console.warn('[SoundService] Web Audio API not available:', error);
    }
  }

  /**
   * Initialize audio elements and preload sounds
   */
  private initializeSounds(): void {
    try {
      // Create audio elements
      this.messageSound = new Audio('/sounds/message.mp3');
      this.callSound = new Audio('/sounds/call-incoming.mp3');

      // Set volume
      this.messageSound.volume = 0.5;
      this.callSound.volume = 0.7;

      // Preload sounds
      this.messageSound.load();
      this.callSound.load();

      // Handle load errors gracefully - switch to fallback sounds
      this.messageSound.addEventListener('error', () => {
        console.warn('[SoundService] Message sound file not found. Using fallback beep sound.');
        this.messageSound = null;
        this.useFallbackSounds = true;
      });

      this.callSound.addEventListener('error', () => {
        console.warn('[SoundService] Call sound file not found. Using fallback beep sound.');
        this.callSound = null;
        this.useFallbackSounds = true;
      });

      this.isInitialized = true;
    } catch (error) {
      console.warn('[SoundService] Failed to initialize sound files. Using fallback beeps:', error);
      this.isInitialized = true;
      this.useFallbackSounds = true;
    }
  }

  /**
   * Play a simple beep using Web Audio API
   */
  private playBeep(frequency: number = 800, duration: number = 200): void {
    if (!this.audioContext || this.isMuted) return;

    try {
      // Resume audio context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('[SoundService] Failed to play beep:', error);
    }
  }

  /**
   * Play message notification sound
   */
  playMessageSound(): void {
    if (this.isMuted) return;

    // Use fallback beep if sound file not available
    if (!this.messageSound || this.useFallbackSounds) {
      this.playBeep(800, 150); // Quick high-pitched beep
      return;
    }

    try {
      // Reset to start in case it's already playing
      this.messageSound.currentTime = 0;

      // Play the sound
      const playPromise = this.messageSound.play();

      // Handle autoplay restrictions
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('[SoundService] Failed to play message sound:', error.message);
          // Try fallback beep on error
          this.playBeep(800, 150);
        });
      }
    } catch (error) {
      console.warn('[SoundService] Error playing message sound:', error);
      // Try fallback beep on error
      this.playBeep(800, 150);
    }
  }

  /**
   * Play incoming call ringtone (loops until stopped)
   */
  playCallSound(): void {
    if (this.isMuted) return;

    // Use fallback beep pattern if sound file not available
    if (!this.callSound || this.useFallbackSounds) {
      this.playCallBeepPattern();
      return;
    }

    try {
      // Set to loop
      this.callSound.loop = true;

      // Reset to start
      this.callSound.currentTime = 0;

      // Play the sound
      const playPromise = this.callSound.play();

      // Handle autoplay restrictions
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('[SoundService] Failed to play call sound:', error.message);
          // Try fallback beep pattern on error
          this.playCallBeepPattern();
        });
      }
    } catch (error) {
      console.warn('[SoundService] Error playing call sound:', error);
      // Try fallback beep pattern on error
      this.playCallBeepPattern();
    }
  }

  /**
   * Play a looping beep pattern for incoming calls using Web Audio API
   */
  private callBeepInterval: any = null;

  private playCallBeepPattern(): void {
    if (!this.audioContext || this.isMuted) return;

    // Stop any existing pattern
    this.stopCallBeepPattern();

    // Play beep pattern: two beeps with a pause
    const playPattern = () => {
      if (this.isMuted) {
        this.stopCallBeepPattern();
        return;
      }

      // First beep
      this.playBeep(600, 300);

      // Second beep after a short delay
      setTimeout(() => {
        if (!this.isMuted) {
          this.playBeep(600, 300);
        }
      }, 400);
    };

    // Play immediately
    playPattern();

    // Repeat every 2 seconds
    this.callBeepInterval = setInterval(playPattern, 2000);
  }

  /**
   * Stop the call beep pattern
   */
  private stopCallBeepPattern(): void {
    if (this.callBeepInterval) {
      clearInterval(this.callBeepInterval);
      this.callBeepInterval = null;
    }
  }

  /**
   * Stop incoming call ringtone
   */
  stopCallSound(): void {
    // Stop fallback beep pattern
    this.stopCallBeepPattern();

    if (!this.callSound) return;

    try {
      this.callSound.pause();
      this.callSound.currentTime = 0;
      this.callSound.loop = false;
    } catch (error) {
      console.warn('[SoundService] Error stopping call sound:', error);
    }
  }

  /**
   * Mute all sounds
   */
  mute(): void {
    this.isMuted = true;

    // Stop any currently playing sounds
    this.stopCallSound();
    this.stopCallBeepPattern();
  }

  /**
   * Unmute all sounds
   */
  unmute(): void {
    this.isMuted = false;
  }

  /**
   * Toggle mute state
   * @returns New mute state (true = muted, false = unmuted)
   */
  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  /**
   * Check if sounds are muted
   */
  isSoundMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Set volume for message sounds (0.0 to 1.0)
   */
  setMessageVolume(volume: number): void {
    if (this.messageSound) {
      this.messageSound.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Set volume for call sounds (0.0 to 1.0)
   */
  setCallVolume(volume: number): void {
    if (this.callSound) {
      this.callSound.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Check if sound service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const soundService = new SoundService();
