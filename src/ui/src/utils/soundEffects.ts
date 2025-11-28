/**
 * Sound Effects System for D&D Game Interface
 * 
 * Provides audio feedback for game actions like dice rolls,
 * spell casting, combat, and UI interactions.
 */

type SoundType = 
  | 'dice-roll'
  | 'dice-roll-success'
  | 'dice-roll-critical'
  | 'spell-cast'
  | 'spell-success'
  | 'combat-hit'
  | 'combat-miss'
  | 'combat-critical'
  | 'level-up'
  | 'quest-complete'
  | 'item-pickup'
  | 'button-hover'
  | 'button-click'
  | 'notification'
  | 'error';

interface SoundConfig {
  volume: number;
  enabled: boolean;
}

class SoundManager {
  private config: SoundConfig = {
    volume: 0.5,
    enabled: true,
  };

  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();

  constructor() {
    // Initialize Web Audio API
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }

    // Load saved preferences
    const saved = localStorage.getItem('soundConfig');
    if (saved) {
      try {
        this.config = { ...this.config, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Failed to load sound config:', e);
      }
    }
  }

  /**
   * Generate a dice roll sound using Web Audio API
   */
  private generateDiceRollSound(): AudioBufferSourceNode | null {
    if (!this.audioContext) return null;

    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a rolling/tumbling sound with noise and frequency modulation
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      // White noise component
      const noise = (Math.random() * 2 - 1) * 0.3;
      // Low frequency rumble
      const rumble = Math.sin(t * 50) * 0.2;
      // High frequency tumbling
      const tumble = Math.sin(t * 800 + Math.sin(t * 200) * 5) * 0.3;
      // Envelope (fade out)
      const envelope = Math.max(0, 1 - t / duration);
      
      data[i] = (noise + rumble + tumble) * envelope;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    return source;
  }

  /**
   * Generate a spell cast sound
   */
  private generateSpellSound(): AudioBufferSourceNode | null {
    if (!this.audioContext) return null;

    const duration = 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a magical chime sound
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      // Multiple harmonic frequencies for a chime effect
      const fundamental = Math.sin(t * 440 * 2 * Math.PI) * 0.2;
      const harmonic2 = Math.sin(t * 880 * 2 * Math.PI) * 0.15;
      const harmonic3 = Math.sin(t * 1320 * 2 * Math.PI) * 0.1;
      // Envelope (quick attack, slow decay)
      const envelope = Math.min(1, t * 10) * Math.max(0, 1 - t / duration);
      
      data[i] = (fundamental + harmonic2 + harmonic3) * envelope;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    return source;
  }

  /**
   * Generate a success/critical sound
   */
  private generateSuccessSound(): AudioBufferSourceNode | null {
    if (!this.audioContext) return null;

    const duration = 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // Create an ascending chime
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const freq = 440 + (t * 200); // Ascending frequency
      const wave = Math.sin(t * freq * 2 * Math.PI);
      const envelope = Math.min(1, t * 5) * Math.max(0, 1 - t / duration);
      
      data[i] = wave * envelope * 0.3;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    return source;
  }

  /**
   * Play a sound effect
   */
  play(type: SoundType, options?: { volume?: number }): void {
    if (!this.config.enabled || !this.audioContext) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const volume = options?.volume ?? this.config.volume;
    let source: AudioBufferSourceNode | null = null;

    try {
      switch (type) {
        case 'dice-roll':
        case 'dice-roll-success':
          source = this.generateDiceRollSound();
          break;
        case 'dice-roll-critical':
          source = this.generateSuccessSound();
          break;
        case 'spell-cast':
        case 'spell-success':
          source = this.generateSpellSound();
          break;
        case 'combat-hit':
        case 'combat-critical':
          source = this.generateSuccessSound();
          break;
        case 'level-up':
        case 'quest-complete':
          source = this.generateSuccessSound();
          break;
        case 'button-hover':
        case 'button-click':
          // Short click sound
          source = this.generateDiceRollSound();
          if (source) {
            source.playbackRate.value = 2; // Faster for click
          }
          break;
        default:
          // Fallback: simple beep
          source = this.generateDiceRollSound();
      }

      if (source) {
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  /**
   * Set sound configuration
   */
  setConfig(config: Partial<SoundConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('soundConfig', JSON.stringify(this.config));
  }

  /**
   * Get current sound configuration
   */
  getConfig(): SoundConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.setConfig({ enabled });
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.setConfig({ volume: Math.max(0, Math.min(1, volume)) });
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Export convenience functions
export const playSound = (type: SoundType, options?: { volume?: number }) => {
  soundManager.play(type, options);
};

export const setSoundEnabled = (enabled: boolean) => {
  soundManager.setEnabled(enabled);
};

export const setSoundVolume = (volume: number) => {
  soundManager.setVolume(volume);
};

export const getSoundConfig = () => {
  return soundManager.getConfig();
};

