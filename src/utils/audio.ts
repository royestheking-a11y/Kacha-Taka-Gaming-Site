// Sound Manager using Web Audio API for reliable sound generation without external assets
// This ensures sounds work even without internet or if assets 404.

class SoundManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: Map<string, OscillatorNode> = new Map();

  constructor() {
    // Initialize on user interaction usually, but we'll init lazily
    try {
      // @ts-ignore - AudioContext might be prefixed
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 0.3; // Master volume
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  private ensureContext() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
    if (!this.context) {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContextClass();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = 0.3; 
        } catch (e) {}
    }
  }

  playClick() {
    this.ensureContext();
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  playWin() {
    this.ensureContext();
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio

    notes.forEach((freq, i) => {
      const osc = this.context!.createOscillator();
      const gain = this.context!.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.type = 'square'; // 8-bit style
      osc.frequency.value = freq;
      
      const startTime = now + (i * 0.1);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  playExplosion() {
    this.ensureContext();
    if (!this.context || !this.masterGain) return;

    // Create a more dramatic crash sound with layered noise and tones
    const now = this.context.currentTime;
    
    // Layer 1: Deep boom
    const boom = this.context.createOscillator();
    const boomGain = this.context.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, now);
    boom.frequency.exponentialRampToValueAtTime(20, now + 0.3);
    boomGain.gain.setValueAtTime(0.6, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    boom.connect(boomGain);
    boomGain.connect(this.masterGain);
    boom.start(now);
    boom.stop(now + 0.3);

    // Layer 2: Mid-range crash noise
    const bufferSize = this.context.sampleRate * 0.5;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 2;
    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
    
    // Layer 3: High pitch descending screech
    const screech = this.context.createOscillator();
    const screechGain = this.context.createGain();
    screech.type = 'sawtooth';
    screech.frequency.setValueAtTime(1200, now);
    screech.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    screechGain.gain.setValueAtTime(0.3, now);
    screechGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    screech.connect(screechGain);
    screechGain.connect(this.masterGain);
    screech.start(now);
    screech.stop(now + 0.2);
  }

  // Flying sound loop handling
  private flyOsc: OscillatorNode | null = null;
  private flyOsc2: OscillatorNode | null = null;
  private flyGain: GainNode | null = null;

  startFlySound() {
    this.ensureContext();
    if (!this.context || !this.masterGain || this.flyOsc) return;

    // Create dual oscillator for richer engine sound
    this.flyOsc = this.context.createOscillator();
    this.flyOsc2 = this.context.createOscillator();
    this.flyGain = this.context.createGain();

    this.flyOsc.connect(this.flyGain);
    this.flyOsc2.connect(this.flyGain);
    this.flyGain.connect(this.masterGain);

    // Main engine rumble
    this.flyOsc.type = 'sawtooth';
    this.flyOsc.frequency.value = 80;
    
    // Higher harmonic for richness
    this.flyOsc2.type = 'square';
    this.flyOsc2.frequency.value = 160;
    
    this.flyGain.gain.value = 0.12;

    this.flyOsc.start();
    this.flyOsc2.start();
  }

  updateFlyPitch(multiplier: number) {
    if (!this.context || !this.flyOsc || !this.flyOsc2) return;
    // Map multiplier 1.0-100.0 to frequency range for more realistic engine acceleration
    const basePitch = 80 + Math.min(multiplier * 40, 800);
    const harmonicPitch = basePitch * 2;
    this.flyOsc.frequency.setTargetAtTime(basePitch, this.context.currentTime, 0.08);
    this.flyOsc2.frequency.setTargetAtTime(harmonicPitch, this.context.currentTime, 0.08);
  }

  stopFlySound() {
    if (this.flyOsc) {
      try {
          this.flyOsc.stop();
          this.flyOsc.disconnect();
      } catch(e) {}
      this.flyOsc = null;
    }
    if (this.flyOsc2) {
      try {
          this.flyOsc2.stop();
          this.flyOsc2.disconnect();
      } catch(e) {}
      this.flyOsc2 = null;
    }
    if (this.flyGain) {
      this.flyGain.disconnect();
      this.flyGain = null;
    }
  }
  
  playSpin() {
      this.ensureContext();
      if (!this.context || !this.masterGain) return;
      // Rapid ticks sequence
      let count = 0;
      const tick = () => {
          if (count > 10) return;
          this.playClick();
          count++;
          setTimeout(tick, 100);
      };
      tick();
  }
}

export const soundManager = new SoundManager();