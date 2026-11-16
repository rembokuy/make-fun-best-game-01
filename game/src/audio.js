// Synthesised WebAudio: every sound effect and the music loop are built
// from oscillators and noise — no audio files, nothing fetched. The
// context is created lazily on the first user gesture so browsers allow
// it, and every call is a no-op until then (or in shot mode).

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicTimer = null;
    this.musicOn = true;
    this.step = 0;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  tone({ freq = 440, freqEnd = null, dur = 0.12, type = 'sine', vol = 0.2, delay = 0 }) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.2, vol = 0.25, low = 400, high = 4000, delay = 0 }) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (low + high) / 2;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  shoot() {
    this.tone({ freq: 880, freqEnd: 320, dur: 0.09, type: 'triangle', vol: 0.12 });
  }

  hit() {
    this.noise({ dur: 0.06, vol: 0.12, low: 900, high: 2600 });
  }

  explode() {
    this.noise({ dur: 0.35, vol: 0.3, low: 120, high: 900 });
    this.tone({ freq: 160, freqEnd: 40, dur: 0.3, type: 'sawtooth', vol: 0.18 });
  }

  hurt() {
    this.tone({ freq: 220, freqEnd: 90, dur: 0.25, type: 'sawtooth', vol: 0.22 });
  }

  pickup() {
    this.tone({ freq: 1180, dur: 0.07, type: 'sine', vol: 0.14 });
    this.tone({ freq: 1760, dur: 0.1, type: 'sine', vol: 0.12, delay: 0.06 });
  }

  dash() {
    this.noise({ dur: 0.14, vol: 0.14, low: 1500, high: 5000 });
  }

  flare() {
    this.tone({ freq: 240, freqEnd: 1400, dur: 0.35, type: 'sine', vol: 0.2 });
    this.noise({ dur: 0.4, vol: 0.18, low: 600, high: 3500 });
  }

  waveClear() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone({ freq: f, dur: 0.16, type: 'triangle', vol: 0.16, delay: i * 0.09 }));
  }

  upgrade() {
    [392, 523, 659].forEach((f, i) => this.tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.16, delay: i * 0.07 }));
  }

  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.18, delay: i * 0.12 }));
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone({ freq: f, dur: 0.3, type: 'sine', vol: 0.18, delay: i * 0.16 }));
  }

  // A slow, quiet arpeggio in A minor over a low drone. One bar is
  // scheduled per timer tick so it costs nothing when tabbed away.
  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const bass = [110, 87.31, 98, 82.41];
    const arp = [440, 523.25, 659.25, 523.25, 440, 329.63, 392, 493.88];
    this.musicTimer = window.setInterval(() => {
      if (!this.ready || !this.musicOn) return;
      const bar = this.step;
      this.tone({ freq: bass[bar % bass.length], dur: 1.9, type: 'sine', vol: 0.05 });
      for (let i = 0; i < 4; i += 1) {
        this.tone({ freq: arp[(bar * 4 + i) % arp.length], dur: 0.22, type: 'triangle', vol: 0.045, delay: i * 0.48 });
      }
      this.step += 1;
    }, 2000);
  }

  toggleMusic() {
    this.musicOn = !this.musicOn;
    return this.musicOn;
  }
}
