// Procedural 8-bit sound effects using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private musicVolume: number = 0.55;
  private musicEnabled: boolean = true;
  private masterGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;
  private rainGainNode: GainNode | null = null;
  private rainSourceNode: AudioNode | null = null;

  // Background Music State
  private bgmTimer: number | null = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGainNode.connect(this.ctx.destination);

      this.musicGainNode = this.ctx.createGain();
      const currentMusicVol = this.musicEnabled ? this.musicVolume : 0;
      this.musicGainNode.gain.setValueAtTime(currentMusicVol, this.ctx.currentTime);
      this.musicGainNode.connect(this.masterGainNode);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public async unlockAudio(): Promise<boolean> {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
        return true;
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
        return false;
      }
    }
    return true;
  }

  public isAudioReady(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public setMasterVolume(volPercent: number) {
    this.masterVolume = Math.max(0, Math.min(1, volPercent / 100));
    if (this.masterGainNode && this.ctx && !this.isMuted) {
      this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public getMasterVolume(): number {
    return Math.round(this.masterVolume * 100);
  }

  public setMusicVolume(volPercent: number) {
    this.musicVolume = Math.max(0, Math.min(1, volPercent / 100));
    if (this.musicGainNode && this.ctx) {
      const vol = this.musicEnabled ? this.musicVolume : 0;
      this.musicGainNode.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1);
    }
  }

  public getMusicVolume(): number {
    return Math.round(this.musicVolume * 100);
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGainNode && this.ctx) {
      const vol = enabled ? this.musicVolume : 0;
      this.musicGainNode.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.2);
    }
    if (enabled && !this.isBgmPlaying) {
      this.startBGM();
    }
  }

  public isMusicOn(): boolean {
    return this.musicEnabled;
  }

  // ==========================================
  // PROCEDURAL C418-STYLE MINECRAFT BACKGROUND MUSIC
  // ==========================================
  public startBGM() {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.scheduleNextBgmPhrase(1000);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleNextBgmPhrase(delayMs: number = 3000) {
    if (!this.isBgmPlaying) return;
    this.bgmTimer = window.setTimeout(() => {
      if (!this.isBgmPlaying) return;
      this.playBgmPhrase();
      // Peaceful pause between melodic phrases (8 to 16 seconds)
      const nextDelay = 8000 + Math.random() * 8000;
      this.scheduleNextBgmPhrase(nextDelay);
    }, delayMs);
  }

  private playBgmPhrase() {
    if (!this.musicEnabled || this.isMuted || this.musicVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.musicGainNode) return;

    // Peaceful diatonic progressions: Cmaj7, Am9, Fmaj7, Em7, G
    const chords = [
      // C major 7: C3, G3, B3, E4
      [130.81, 196.00, 246.94, 329.63],
      // A minor 9: A2, E3, C4, B4
      [110.00, 164.81, 261.63, 493.88],
      // F major 7: F2, C3, A3, E4
      [87.31, 130.81, 220.00, 329.63],
      // G6 add9: G2, D3, B3, E4, A4
      [98.00, 146.83, 246.94, 329.63, 440.00],
      // E minor 7: E2, B2, G3, D4
      [82.41, 123.47, 196.00, 293.66]
    ];

    const chord = chords[Math.floor(Math.random() * chords.length)];
    const baseTime = this.ctx.currentTime + 0.05;

    // 1. Play warm pad/keyboard chord notes with gentle attack
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, baseTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + Math.random() * 300, baseTime);

      const noteDuration = 4.5 + Math.random() * 2.0;
      const attack = 0.8 + idx * 0.2;

      gain.gain.setValueAtTime(0.001, baseTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.08 / chord.length, baseTime + idx * 0.15 + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, baseTime + idx * 0.15 + noteDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(baseTime + idx * 0.15);
      osc.stop(baseTime + idx * 0.15 + noteDuration + 0.1);
    });

    // 2. Play gentle melody arpeggio in the background
    const melodyNotes = [329.63, 392.00, 440.00, 493.88, 523.25, 659.25, 783.99]; // E4, G4, A4, B4, C5, E5, G5
    const noteCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < noteCount; i++) {
      const noteFreq = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
      const noteTime = baseTime + 1.2 + i * 0.65;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.035, noteTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(noteTime);
      osc.stop(noteTime + 2.5);
    }
  }

  // ==========================================
  // VILLAGER & ENVIRONMENT SOUNDS
  // ==========================================
  public playVillagerHrmm() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const startFreq = 165 + (Math.random() * 20 - 10);
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(startFreq - 25, this.ctx.currentTime + 0.25);
    osc.frequency.linearRampToValueAtTime(startFreq - 10, this.ctx.currentTime + 0.42);

    // Nasal villager formant filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(540, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.38, this.ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  public playVillagerTrade() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Joyful double bell chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  public playVillagerNo() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playVillagerYes() {
    this.playVillagerTrade();
  }

  public playPortalAmbient() {
    this.playAetherChime();
  }

  public startBgm() {
    this.startBGM();
  }

  public stopBgm() {
    this.stopBGM();
  }

  public playFootstep(isWood: boolean = false) {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isWood ? 130 : 90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playAetherChime() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Heavenly ascending shimmer
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  public playButtonClick() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  public playBlockBreak() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Noise crunch + downward pitch
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noise.start();
  }

  public playBreak() {
    this.playBlockBreak();
  }

  public playDigHit(blockType: string = 'dirt') {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const isStone = blockType === 'stone' || blockType === 'cobblestone' || blockType === 'brick' || blockType.includes('ore');
    const isWood = blockType === 'wood' || blockType === 'planks' || blockType === 'bookshelf' || blockType === 'aether_wood';

    osc.type = isStone ? 'square' : isWood ? 'sawtooth' : 'triangle';
    const baseFreq = isStone ? 180 : isWood ? 140 : 100;
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 20, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  public playBlockPlace() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playHit() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playPlayerHurt() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playCraftSuccess() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const notes = [440, 554.37, 659.25]; // A major chord
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  public playThunder() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.35));
      const rumble = Math.sin(i * 0.01) * 0.3;
      data[i] = (Math.random() * 2 - 1 + rumble) * decay;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 2.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noise.start();
  }

  public updateRainSound(intensity: number) {
    if (this.isMuted || intensity <= 0.05 || this.masterVolume === 0) {
      if (this.rainGainNode && this.ctx) {
        this.rainGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }

    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    if (!this.rainGainNode) {
      // Create continuous pink/white noise loop
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.2;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 1.0;

      this.rainGainNode = this.ctx.createGain();
      this.rainGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.rainGainNode);
      this.rainGainNode.connect(this.masterGainNode);

      noise.start();
      this.rainSourceNode = noise;
    }

      if (this.rainGainNode) {
      const targetGain = Math.min(0.12, intensity * 0.1);
      this.rainGainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.5);
    }
  }

  // ==========================================
  // ICONIC MINECRAFT PROCEDURAL SOUND EFFECTS
  // ==========================================
  public playCreeperHiss() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Sizzling white noise with rising intensity
    const duration = 1.4;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(4500, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + duration * 0.8);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noise.start();
  }

  public playExplosion() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // 1. Sub-bass punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

    oscGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.masterGainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);

    // 2. Heavy blast noise
    const duration = 1.0;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGainNode);

    noise.start();
  }

  public playZombieGroan() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const base = 85 + Math.random() * 20;
    osc.frequency.setValueAtTime(base, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(base - 20, this.ctx.currentTime + 0.35);
    osc.frequency.linearRampToValueAtTime(base - 10, this.ctx.currentTime + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.28, this.ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }

  public playEating() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Crunch bite
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(260 + Math.random() * 120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playBowShoot() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playArmSwing() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Soft whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  public playAnimalSound() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(210, this.ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // ==========================================
  // SERAPHIM BOSS & HEAVEN PORTAL SOUNDS
  // ==========================================
  public playSeraphimSpawn() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime + idx * 0.1);
      filter.Q.setValueAtTime(4, this.ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + idx * 0.1 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(this.ctx.currentTime + idx * 0.1);
      osc.stop(this.ctx.currentTime + idx * 0.1 + 1.3);
    });
  }

  public playSeraphimAttack() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Holy beam laser sizzle
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playSeraphimHurt() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + 0.08);
    osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playSeraphimDefeat() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Victory fanfare cascade
    const fanfareNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C4 to C6
    fanfareNotes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const st = this.ctx.currentTime + idx * 0.12;
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.01, st);
      gain.gain.linearRampToValueAtTime(0.28, st + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 1.4);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(st);
      osc.stop(st + 1.5);
    });
  }

  public playPortalLocked() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    // Barrier buzz & lock
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.setValueAtTime(82.4, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  public playPortalUnlock() {
    if (this.isMuted || this.masterVolume === 0) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const freqs = [220, 277.18, 329.63, 440, 554.37, 659.25, 880];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const st = this.ctx.currentTime + idx * 0.06;
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.01, st);
      gain.gain.linearRampToValueAtTime(0.22, st + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(st);
      osc.stop(st + 0.85);
    });
  }

  // ==========================================
  // SHAROU (しゃろう - 350ml / 3:50) END CREDITS BGM
  // ==========================================
  private sharouTimer: number | null = null;
  private isSharouPlaying: boolean = false;
  private sharouStep: number = 0;
  private nextMeasureTime: number = 0;

  public isSharouBGMPlaying(): boolean {
    return this.isSharouPlaying;
  }

  public getSharouBeat(): number {
    return this.sharouStep;
  }

  public async playSharouCreditsBGM(forceRestart: boolean = false) {
    if (this.isSharouPlaying && !forceRestart) {
      // Just ensure audio context is active
      if (this.ctx && this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume();
        } catch (e) {
          console.warn('AudioContext resume failed:', e);
        }
      }
      return;
    }

    if (this.sharouTimer) {
      window.clearTimeout(this.sharouTimer);
      this.sharouTimer = null;
    }

    this.isSharouPlaying = true;
    this.sharouStep = 0;
    this.stopBGM(); // Stop standard C418 ambient music

    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }
    }

    // Ensure music and master gain are audible
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGainNode.gain.setValueAtTime(Math.max(0.7, this.musicVolume), this.ctx.currentTime);
    }
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGainNode.gain.setValueAtTime(Math.max(0.8, this.masterVolume), this.ctx.currentTime);
    }

    // Play signature soda can pop & fizz for "350ml"
    this.playSodaCanOpening();

    if (this.ctx) {
      this.nextMeasureTime = this.ctx.currentTime + 0.1;
    }
    this.scheduleSharouLoop();
  }

  public stopSharouCreditsBGM() {
    this.isSharouPlaying = false;
    if (this.sharouTimer) {
      window.clearTimeout(this.sharouTimer);
      this.sharouTimer = null;
    }
  }

  public async toggleSharouCreditsBGM() {
    if (this.isSharouPlaying) {
      this.stopSharouCreditsBGM();
    } else {
      await this.playSharouCreditsBGM(true);
    }
  }

  private playSodaCanOpening() {
    if (!this.ctx || !this.musicGainNode) return;
    const now = this.ctx.currentTime + 0.02;

    // Metal tab click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1800, now);
    clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    clickGain.gain.setValueAtTime(0.35, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    clickOsc.connect(clickGain);
    clickGain.connect(this.musicGainNode);
    clickOsc.start(now);
    clickOsc.stop(now + 0.06);

    // Refreshing soda fizz sound
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.25;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3200, now + 0.03);
      const fizzGain = this.ctx.createGain();
      fizzGain.gain.setValueAtTime(0.25, now + 0.03);
      fizzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(filter);
      filter.connect(fizzGain);
      fizzGain.connect(this.musicGainNode);
      noise.start(now + 0.03);
    } catch {
      // Fallback
    }
  }

  private scheduleSharouLoop() {
    if (!this.isSharouPlaying) return;
    this.initCtx();
    if (!this.ctx || !this.musicGainNode) return;

    if (this.ctx.state === 'suspended') {
      try {
        this.ctx.resume();
      } catch {
        // will retry
      }
      if (this.ctx.state === 'suspended') {
        // Wait 200ms and check again without scheduling future measures
        this.sharouTimer = window.setTimeout(() => {
          if (!this.isSharouPlaying) return;
          this.scheduleSharouLoop();
        }, 200);
        return;
      }
    }

    const beatSec = 0.48; // ~125 BPM bouncy tempo
    const measureDuration = beatSec * 4;

    const currentTime = this.ctx.currentTime;
    if (this.nextMeasureTime < currentTime) {
      this.nextMeasureTime = currentTime + 0.05;
    }

    this.playSharouMeasureAt(this.nextMeasureTime, beatSec);
    this.nextMeasureTime += measureDuration;

    // Schedule next iteration slightly before measure completes
    const delayMs = Math.max(80, Math.floor((this.nextMeasureTime - this.ctx.currentTime - 0.25) * 1000));
    this.sharouTimer = window.setTimeout(() => {
      if (!this.isSharouPlaying) return;
      this.scheduleSharouLoop();
    }, delayMs);
  }

  private playSharouMeasureAt(baseTime: number, beatSec: number) {
    if (!this.ctx || !this.musicGainNode) return;

    // Classic Sharou Royal Road Chord Progression: Fmaj7 -> G7 -> Em7 -> Am7
    const chords = [
      { name: 'Fmaj7', bass: 87.31, chord: [220.0, 261.63, 329.63, 392.0] }, // F3, A3, C4, E4, G4
      { name: 'G7',    bass: 98.00, chord: [246.94, 293.66, 349.23, 392.0] }, // G3, B3, D4, F4, G4
      { name: 'Em7',   bass: 82.41, chord: [196.00, 246.94, 293.66, 329.63] }, // E3, G3, B3, D4, E4
      { name: 'Am7',   bass: 110.0, chord: [261.63, 329.63, 392.0, 440.0] },  // A3, C4, E4, G4, A4
      { name: 'Fmaj7', bass: 87.31, chord: [220.0, 261.63, 329.63, 392.0] },
      { name: 'G7',    bass: 98.00, chord: [246.94, 293.66, 349.23, 392.0] },
      { name: 'Em7',   bass: 82.41, chord: [196.00, 246.94, 293.66, 329.63] },
      { name: 'Am7',   bass: 110.0, chord: [261.63, 329.63, 392.0, 523.25] }
    ];

    const currentChordData = chords[this.sharouStep % chords.length];
    const measureIdx = this.sharouStep;
    this.sharouStep++;

    // 1. Syncopated Rhodes Electric Piano Chords
    const chordBeats = [0.0, 0.75, 1.5, 2.5, 3.25];
    chordBeats.forEach((b) => {
      const chordTime = baseTime + b * beatSec;
      currentChordData.chord.forEach((freq) => {
        if (!this.ctx || !this.musicGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, chordTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, chordTime);

        gain.gain.setValueAtTime(0.001, chordTime);
        gain.gain.linearRampToValueAtTime(0.12, chordTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.32);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGainNode);

        osc.start(chordTime);
        osc.stop(chordTime + 0.36);
      });
    });

    // 2. Playful walking slap/synth bassline
    const bassRhythm = [
      { beat: 0.0,  freq: currentChordData.bass },
      { beat: 0.75, freq: currentChordData.bass * 1.5 },
      { beat: 1.5,  freq: currentChordData.bass },
      { beat: 2.25, freq: currentChordData.bass * 2.0 },
      { beat: 3.0,  freq: currentChordData.bass * 1.5 },
      { beat: 3.5,  freq: currentChordData.bass * 1.0 }
    ];
    bassRhythm.forEach((b) => {
      if (!this.ctx || !this.musicGainNode) return;
      const bTime = baseTime + b.beat * beatSec;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(b.freq, bTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, bTime);

      gain.gain.setValueAtTime(0.001, bTime);
      gain.gain.linearRampToValueAtTime(0.22, bTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, bTime + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(bTime);
      osc.stop(bTime + 0.4);
    });

    // 3. Catchy Sharou - 350ml / 3:50 signature lead melody
    const melodyMeasures = [
      // Measure 1: G4 -> C5 -> E5 -> G5 -> A5 -> G5
      [
        { beat: 0.0, note: 392.0 },
        { beat: 0.5, note: 523.25 },
        { beat: 1.0, note: 659.25 },
        { beat: 1.5, note: 783.99 },
        { beat: 2.25, note: 880.0 },
        { beat: 3.0, note: 783.99 }
      ],
      // Measure 2: A4 -> C5 -> D5 -> E5 -> G5 -> E5
      [
        { beat: 0.0, note: 440.0 },
        { beat: 0.5, note: 523.25 },
        { beat: 1.0, note: 587.33 },
        { beat: 1.5, note: 659.25 },
        { beat: 2.25, note: 783.99 },
        { beat: 3.0, note: 659.25 }
      ],
      // Measure 3: E5 -> G5 -> A5 -> C6 -> D6 -> C6
      [
        { beat: 0.0, note: 659.25 },
        { beat: 0.5, note: 783.99 },
        { beat: 1.0, note: 880.0 },
        { beat: 1.5, note: 1046.5 },
        { beat: 2.25, note: 1174.66 },
        { beat: 3.0, note: 1046.5 }
      ],
      // Measure 4: Turnaround D5 -> E5 -> G5 -> C6
      [
        { beat: 0.0, note: 587.33 },
        { beat: 0.5, note: 659.25 },
        { beat: 1.25, note: 783.99 },
        { beat: 2.0, note: 1046.5 },
        { beat: 2.75, note: 987.77 },
        { beat: 3.25, note: 1046.5 }
      ],
      // Measure 5: High variation C6 -> B5 -> A5 -> G5 -> E5 -> G5
      [
        { beat: 0.0, note: 1046.5 },
        { beat: 0.5, note: 987.77 },
        { beat: 1.0, note: 880.0 },
        { beat: 1.5, note: 783.99 },
        { beat: 2.25, note: 659.25 },
        { beat: 3.0, note: 783.99 }
      ],
      // Measure 6: A5 -> G5 -> E5 -> D5 -> C5 -> D5
      [
        { beat: 0.0, note: 880.0 },
        { beat: 0.5, note: 783.99 },
        { beat: 1.0, note: 659.25 },
        { beat: 1.5, note: 587.33 },
        { beat: 2.25, note: 523.25 },
        { beat: 3.0, note: 587.33 }
      ],
      // Measure 7: C5 -> E5 -> G5 -> C6 -> E6 -> D6
      [
        { beat: 0.0, note: 523.25 },
        { beat: 0.5, note: 659.25 },
        { beat: 1.0, note: 783.99 },
        { beat: 1.5, note: 1046.5 },
        { beat: 2.25, note: 1318.51 },
        { beat: 3.0, note: 1174.66 }
      ],
      // Measure 8: Grand resolution C6 with trill
      [
        { beat: 0.0, note: 1046.5 },
        { beat: 0.75, note: 987.77 },
        { beat: 1.5, note: 1046.5 },
        { beat: 2.25, note: 1174.66 },
        { beat: 3.0, note: 1046.5 }
      ]
    ];

    const currentMelody = melodyMeasures[measureIdx % melodyMeasures.length];
    currentMelody.forEach((m) => {
      if (!this.ctx || !this.musicGainNode) return;
      const mTime = baseTime + m.beat * beatSec;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(m.note, mTime);

      gain.gain.setValueAtTime(0.001, mTime);
      gain.gain.linearRampToValueAtTime(0.20, mTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, mTime + 0.38);

      osc.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(mTime);
      osc.stop(mTime + 0.42);
    });

    // 4. Punchy Chiptune Drums & 16th Hi-Hats
    // Kicks on beat 0 and 2
    [0, 2].forEach((beat) => {
      if (!this.ctx || !this.musicGainNode) return;
      const kTime = baseTime + beat * beatSec;
      const kOsc = this.ctx.createOscillator();
      const kGain = this.ctx.createGain();
      kOsc.frequency.setValueAtTime(160, kTime);
      kOsc.frequency.exponentialRampToValueAtTime(45, kTime + 0.08);

      kGain.gain.setValueAtTime(0.26, kTime);
      kGain.gain.exponentialRampToValueAtTime(0.001, kTime + 0.09);

      kOsc.connect(kGain);
      kGain.connect(this.musicGainNode);
      kOsc.start(kTime);
      kOsc.stop(kTime + 0.1);
    });

    // Snare on beat 1 and 3
    [1, 3].forEach((beat) => {
      if (!this.ctx || !this.musicGainNode) return;
      const sTime = baseTime + beat * beatSec;
      const sOsc = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sOsc.type = 'triangle';
      sOsc.frequency.setValueAtTime(290, sTime);
      sOsc.frequency.exponentialRampToValueAtTime(110, sTime + 0.06);

      sGain.gain.setValueAtTime(0.20, sTime);
      sGain.gain.exponentialRampToValueAtTime(0.001, sTime + 0.07);

      sOsc.connect(sGain);
      sGain.connect(this.musicGainNode);
      sOsc.start(sTime);
      sOsc.stop(sTime + 0.08);
    });

    // Crisp 8th-note Hi-Hats
    for (let h = 0; h < 8; h++) {
      if (!this.ctx || !this.musicGainNode) continue;
      const hTime = baseTime + h * (beatSec / 2);
      const hOsc = this.ctx.createOscillator();
      const hGain = this.ctx.createGain();
      hOsc.type = 'square';
      hOsc.frequency.setValueAtTime(6000 + (h % 2) * 1500, hTime);

      hGain.gain.setValueAtTime(0.04, hTime);
      hGain.gain.exponentialRampToValueAtTime(0.001, hTime + 0.03);

      hOsc.connect(hGain);
      hGain.connect(this.musicGainNode);
      hOsc.start(hTime);
      hOsc.stop(hTime + 0.035);
    }
  }
}

export const soundManager = new SoundManager();
