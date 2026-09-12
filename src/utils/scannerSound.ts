// Audio feedback utility for barcode scanning and POS actions using Web Audio API

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
  try {
    localStorage.setItem('ei_mon_pos_sound_muted', muted ? '1' : '0');
  } catch {
    // ignore
  }
}

export function getSoundMuted(): boolean {
  try {
    const val = localStorage.getItem('ei_mon_pos_sound_muted');
    if (val !== null) {
      isMuted = val === '1';
    }
  } catch {
    // ignore
  }
  return isMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (isMuted) return null;

  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

let lastBeepTime = 0;

export function playBarcodeBeep(type: 'success' | 'error' | 'warning' = 'success'): void {
  if (isMuted) return;
  const now = Date.now();
  if (now - lastBeepTime < 120) return;
  lastBeepTime = now;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'success') {
      // Crisp high-pitch POS scanner beep (1750Hz, 75ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.085);
    } else if (type === 'error') {
      // Distinctive double error buzz (low pitch buzz buzz)
      const t = ctx.currentTime;
      // First buzz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(240, t);
      gain1.gain.setValueAtTime(0.25, t);
      gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.13);

      // Second buzz
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(200, t + 0.15);
      gain2.gain.setValueAtTime(0.25, t + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t + 0.15);
      osc2.stop(t + 0.33);
    } else {
      // Warning double chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    }
  } catch (err) {
    console.debug('Audio feedback unavailable', err);
  }
}

// Lush cash register completion chime (Major chord arpeggio)
export function playPaymentSuccessChime(): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.16, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  } catch (err) {
    console.debug('Chime unavailable', err);
  }
}

// Subtle micro-tap sound for adding products to cart
export function playCartAddSound(): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.055);
  } catch {
    // ignore
  }
}
