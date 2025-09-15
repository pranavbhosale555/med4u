import { useRef, useCallback } from 'react';

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  async initialize() {
    if (this.isInitialized || !this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  private createBeepTone(frequency: number, duration: number, volume: number = 0.3): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      oscillator.onended = () => resolve();
    });
  }

  async playAlarmSound() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Play a series of beeps to create an alarm pattern
      await this.createBeepTone(800, 0.3, 0.4); // First beep
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.createBeepTone(800, 0.3, 0.4); // Second beep
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.createBeepTone(1000, 0.5, 0.5); // Higher pitch beep
    } catch (error) {
      console.warn('Failed to play alarm sound:', error);
    }
  }

  async playSuccessSound() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Play a pleasant success sound
      await this.createBeepTone(523, 0.2, 0.3); // C note
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.createBeepTone(659, 0.2, 0.3); // E note
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.createBeepTone(784, 0.3, 0.3); // G note
    } catch (error) {
      console.warn('Failed to play success sound:', error);
    }
  }

  async playReminderSound() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Play a gentle reminder sound
      await this.createBeepTone(600, 0.4, 0.3);
      await new Promise(resolve => setTimeout(resolve, 200));
      await this.createBeepTone(800, 0.4, 0.3);
    } catch (error) {
      console.warn('Failed to play reminder sound:', error);
    }
  }
}

// Hook for using sound manager
export function useSoundManager() {
  const soundManagerRef = useRef<SoundManager | null>(null);

  const initializeSoundManager = useCallback(() => {
    if (!soundManagerRef.current) {
      soundManagerRef.current = new SoundManager();
    }
    return soundManagerRef.current;
  }, []);

  const playAlarmSound = useCallback(async () => {
    const soundManager = initializeSoundManager();
    await soundManager.playAlarmSound();
  }, [initializeSoundManager]);

  const playSuccessSound = useCallback(async () => {
    const soundManager = initializeSoundManager();
    await soundManager.playSuccessSound();
  }, [initializeSoundManager]);

  const playReminderSound = useCallback(async () => {
    const soundManager = initializeSoundManager();
    await soundManager.playReminderSound();
  }, [initializeSoundManager]);

  return {
    playAlarmSound,
    playSuccessSound,
    playReminderSound
  };
}