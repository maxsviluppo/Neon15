
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playMoveSound = () => {
  initAudio();
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.15);
};

export const playWinSound = () => {
  initAudio();
  if (!audioCtx) return;

  const playNote = (freq: number, start: number, duration: number, type: OscillatorType = 'triangle') => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime + start);
    gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + start + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime + start);
    osc.stop(audioCtx.currentTime + start + duration);
  };

  // Uplifting chord progression
  playNote(523.25, 0, 1.2); // C5
  playNote(659.25, 0.1, 1.2); // E5
  playNote(783.99, 0.2, 1.2); // G5
  playNote(1046.50, 0.3, 2.0, 'sine'); // C6
};
