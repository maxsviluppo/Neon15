
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

/**
 * Suono di movimento: un "click" magnetico-digitale.
 */
export const playMoveSound = () => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  
  const clickOsc = audioCtx.createOscillator();
  const clickGain = audioCtx.createGain();
  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(1200, now);
  clickGain.gain.setValueAtTime(0.05, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
  clickOsc.connect(clickGain);
  clickGain.connect(audioCtx.destination);
  clickOsc.start(now);
  clickOsc.stop(now + 0.02);

  const bodyOsc = audioCtx.createOscillator();
  const bodyGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  bodyOsc.type = 'sine';
  bodyOsc.frequency.setValueAtTime(220, now);
  bodyOsc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  bodyGain.gain.setValueAtTime(0.1, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  bodyOsc.connect(filter);
  filter.connect(bodyGain);
  bodyGain.connect(audioCtx.destination);
  bodyOsc.start(now);
  bodyOsc.stop(now + 0.12);
};

/**
 * Suono di vittoria: un arpeggio di Major 9.
 */
export const playWinSound = () => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
  
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.08);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, now + i * 0.08);
    filter.frequency.exponentialRampToValueAtTime(200, now + i * 0.08 + 0.5);
    gain.gain.setValueAtTime(0, now + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.8);
  });
};

/**
 * Suono di interazione menu.
 */
export const playSelectSound = () => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
};

/**
 * Ronzio ambientale sottile (Cyber Hum).
 */
export const playAmbientHum = () => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(55, now); // Low A
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(150, now);
  filter.Q.setValueAtTime(10, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.03, now + 1);
  gain.gain.linearRampToValueAtTime(0, now + 4);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(now);
  osc.stop(now + 4);
};

/**
 * Effetto glitch digitale intermittente.
 */
export const playGlitchSound = () => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(Math.random() * 2000 + 1000, now);
  osc.frequency.exponentialRampToValueAtTime(Math.random() * 500 + 100, now + 0.05);
  
  gain.gain.setValueAtTime(0.02, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
};
