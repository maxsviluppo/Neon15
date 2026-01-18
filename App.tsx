
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode, Difficulty } from './types';
import { ICONS } from './constants';
import { shuffleTiles, isSolved, getValidMoves, getTargetState } from './utils/puzzleLogic';
import { playMoveSound, playWinSound } from './utils/audioEffects';
import Tile from './components/Tile';

type View = 'home' | 'game';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [gridSize, setGridSize] = useState<Difficulty>(4);
  const [mode, setMode] = useState<GameMode>('numbers');
  const [tiles, setTiles] = useState<(number | string | null)[]>([]);
  const [history, setHistory] = useState<(number | string | null)[][]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const touchStart = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('puzzle-15-best-scores');
    if (saved) setBestScores(JSON.parse(saved));
    const soundPref = localStorage.getItem('puzzle-15-sound');
    if (soundPref !== null) setSoundEnabled(soundPref === 'true');
  }, []);

  const initGame = useCallback(() => {
    const newTiles = shuffleTiles(gridSize, mode);
    setTiles(newTiles);
    setHistory([]);
    setMoves(0);
    setTime(0);
    setIsActive(false);
    setIsWon(false);
    setIsNewRecord(false);
    setIsSettingsOpen(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, [gridSize, mode]);

  useEffect(() => {
    if (view === 'game') {
      initGame();
    }
  }, [gridSize, mode, view]);

  const startGame = () => {
    initGame();
    setView('game');
  };

  const goHome = () => {
    setView('home');
    setIsSettingsOpen(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('puzzle-15-sound', String(newVal));
  };

  useEffect(() => {
    if (isActive && !isWon && view === 'game') {
      timerRef.current = window.setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isActive, isWon, view]);

  const handleTileClick = useCallback((index: number) => {
    if (isWon || isSettingsOpen) return;

    const emptyIndex = tiles.indexOf(null);
    const validMoves = getValidMoves(emptyIndex, gridSize);

    if (validMoves.includes(index)) {
      if (soundEnabled) playMoveSound();
      if (!isActive) setIsActive(true);

      setHistory(prev => [...prev, [...tiles]]);

      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      const newMovesCount = moves + 1;
      setMoves(newMovesCount);

      if (isSolved(newTiles, gridSize, mode)) {
        setIsWon(true);
        setIsActive(false);
        if (soundEnabled) playWinSound();
        saveBestScore(newMovesCount);
      }
    }
  }, [tiles, gridSize, isWon, isSettingsOpen, moves, isActive, mode, soundEnabled]);

  const handleUndo = () => {
    if (history.length === 0 || isWon || isSettingsOpen) return;
    
    if (soundEnabled) playMoveSound();
    const lastState = history[history.length - 1];
    setTiles(lastState);
    setHistory(prev => prev.slice(0, -1));
    setMoves(prev => Math.max(0, prev - 1));
    
    if (moves === 1) {
      setIsActive(false);
      setTime(0);
    }
  };

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'game' || isWon || isSettingsOpen) return;
      const emptyIndex = tiles.indexOf(null);
      const row = Math.floor(emptyIndex / gridSize);
      const col = emptyIndex % gridSize;

      let targetIndex = -1;
      if (e.key === 'ArrowUp' && row < gridSize - 1) targetIndex = emptyIndex + gridSize;
      if (e.key === 'ArrowDown' && row > 0) targetIndex = emptyIndex - gridSize;
      if (e.key === 'ArrowLeft' && col < gridSize - 1) targetIndex = emptyIndex + 1;
      if (e.key === 'ArrowRight' && col > 0) targetIndex = emptyIndex - 1;

      if (targetIndex !== -1) {
        e.preventDefault();
        handleTileClick(targetIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isWon, isSettingsOpen, tiles, gridSize, handleTileClick]);

  // Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSettingsOpen) return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || isWon || view !== 'game' || isSettingsOpen) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStart.current.x;
    const dy = endY - touchStart.current.y;
    const threshold = 40; 

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        const direction = dx > 0 ? 'right' : 'left';
        attemptSwipeMove(direction);
      }
    } else {
      if (Math.abs(dy) > threshold) {
        const direction = dy > 0 ? 'down' : 'up';
        attemptSwipeMove(direction);
      }
    }
    touchStart.current = null;
  };

  const attemptSwipeMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const emptyIndex = tiles.indexOf(null);
    const col = emptyIndex % gridSize;
    const row = Math.floor(emptyIndex / gridSize);

    let targetIndex = -1;
    if (direction === 'left' && col < gridSize - 1) targetIndex = emptyIndex + 1;
    if (direction === 'right' && col > 0) targetIndex = emptyIndex - 1;
    if (direction === 'up' && row < gridSize - 1) targetIndex = emptyIndex + gridSize;
    if (direction === 'down' && row > 0) targetIndex = emptyIndex - gridSize;

    if (targetIndex !== -1) handleTileClick(targetIndex);
  };

  const saveBestScore = (finalMoves: number) => {
    const key = `${gridSize}-${mode}`;
    const currentBest = bestScores[key] || Infinity;
    if (finalMoves < currentBest) {
      setIsNewRecord(true);
      const updated = { ...bestScores, [key]: finalMoves };
      setBestScores(updated);
      localStorage.setItem('puzzle-15-best-scores', JSON.stringify(updated));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const targetState = getTargetState(gridSize, mode);
  const bestScoreKey = `${gridSize}-${mode}`;

  const Particles = () => (
    <>
      <div className="particle w-2 h-2 top-[20%] left-[10%]" />
      <div className="particle w-1 h-1 top-[60%] left-[80%] [animation-delay:2s]" />
      <div className="particle w-3 h-3 top-[80%] left-[20%] [animation-delay:5s]" />
      <div className="particle w-1.5 h-1.5 top-[10%] left-[70%] [animation-delay:1s]" />
    </>
  );

  const ConfettiBurst = () => {
    const colors = ['#38bdf8', '#a855f7', '#ec4899', '#22d3ee', '#fbbf24'];
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {Array.from({ length: 80 }).map((_, i) => {
          const angle = (i / 80) * 360 + (Math.random() * 40 - 20);
          const distance = 100 + Math.random() * 300;
          const x = Math.cos(angle * (Math.PI / 180)) * distance;
          const y = Math.sin(angle * (Math.PI / 180)) * distance;
          const color = colors[i % colors.length];
          const size = Math.random() * 8 + 4; // Variety in size
          const duration = 2 + Math.random() * 1.5; // Variety in speed
          
          return (
            <div
              key={i}
              className="confetti"
              style={{
                '--x': `${x}px`,
                '--y': `${y}px`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}80, 0 0 20px ${color}30`,
                animationDuration: `${duration}s`,
                animationDelay: `${Math.random() * 0.4}s`
              } as any}
            />
          );
        })}
      </div>
    );
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#030712] relative overflow-hidden">
        <Particles />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="z-10 w-full max-w-sm flex flex-col items-center gap-10 text-center animate-slideIn">
          <div>
            <div className="w-24 h-24 bg-slate-900 rounded-3xl mb-6 flex items-center justify-center border-2 border-sky-500/50 shadow-[0_0_30px_rgba(56,189,248,0.3)] mx-auto rotate-3 hover:rotate-0 transition-all duration-500 group cursor-default">
               <span className="text-4xl font-black text-sky-400 glow-text flicker group-hover:scale-110 transition-transform">15</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter glow-text mb-2 flicker">NEON<span className="text-sky-400">15</span></h1>
            <p className="text-slate-500 text-xs uppercase tracking-[0.4em] font-bold opacity-80">Reinvented Puzzle</p>
          </div>

          <div className="w-full space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left ml-2">Game Type</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setMode('numbers')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300 ${mode === 'numbers' ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
                >
                  <div className={`transition-colors duration-300 ${mode === 'numbers' ? 'text-sky-400' : 'text-slate-600'}`}>{ICONS.Numbers}</div>
                  <span className={`text-xs font-black uppercase tracking-widest ${mode === 'numbers' ? 'text-sky-100' : 'text-slate-500'}`}>Numbers</span>
                </button>
                <button 
                  onClick={() => setMode('letters')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300 ${mode === 'letters' ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
                >
                  <div className={`transition-colors duration-300 ${mode === 'letters' ? 'text-sky-400' : 'text-slate-600'}`}>{ICONS.Letters}</div>
                  <span className={`text-xs font-black uppercase tracking-widest ${mode === 'letters' ? 'text-sky-100' : 'text-slate-500'}`}>Letters</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left ml-2">Grid Dimension</p>
              <div className="grid grid-cols-3 gap-3">
                {[3, 4, 5].map((size) => (
                  <button 
                    key={size}
                    onClick={() => setGridSize(size as Difficulty)}
                    className={`py-4 rounded-2xl border-2 font-black transition-all duration-300 ${gridSize === size ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:border-slate-700'}`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={startGame}
            className="w-full py-5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-lg rounded-3xl shadow-[0_10px_40px_-10px_rgba(56,189,248,0.5)] active:scale-95 transition-all pulse-neon mt-4"
          >
            START MISSION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-[#030712] relative overflow-hidden safe-area-inset">
      <Particles />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/5 rounded-full blur-[120px] pointer-events-none" />

      <header className="w-full max-w-md flex flex-col gap-4 z-10 shrink-0 pt-2">
        <div className="flex items-center justify-between w-full px-1">
           <button 
             onClick={goHome}
             className="p-3 text-slate-400 hover:text-white bg-slate-900/60 rounded-2xl border border-slate-800/50 backdrop-blur-md active:scale-90 transition-transform"
             aria-label="Go Home"
           >
             {ICONS.Left}
           </button>
           
           <div className="relative">
             <button 
               onClick={() => setIsSettingsOpen(!isSettingsOpen)}
               className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-300 backdrop-blur-md ${isSettingsOpen ? 'bg-sky-500 border-sky-400 text-slate-950' : 'bg-slate-900/60 border-slate-800/50 text-slate-200 hover:border-slate-600'}`}
             >
               <span className="text-sm font-black tracking-tight">{gridSize}x{gridSize}</span>
               <div className={`${isSettingsOpen ? 'rotate-180' : 'rotate-0'} transition-transform duration-300`}>
                 {ICONS.Settings}
               </div>
             </button>

             {isSettingsOpen && (
               <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-slate-900/95 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl animate-slideIn z-30">
                 <div className="p-2 flex flex-col gap-1">
                   {[3, 4, 5].map((size) => (
                     <button
                       key={size}
                       onClick={() => setGridSize(size as Difficulty)}
                       className={`w-full py-3 px-4 flex justify-between items-center rounded-2xl text-xs font-black transition-all ${gridSize === size ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                     >
                       <span>{size}x{size}</span>
                       {gridSize === size && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                     </button>
                   ))}
                   <div className="h-px bg-slate-800 my-1 mx-2" />
                   <button
                     onClick={() => setMode(mode === 'numbers' ? 'letters' : 'numbers')}
                     className="w-full py-3 px-4 flex items-center gap-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl text-[10px] uppercase font-black tracking-widest"
                   >
                     {mode === 'numbers' ? ICONS.Letters : ICONS.Numbers}
                     <span>{mode === 'numbers' ? 'Letters' : 'Numbers'}</span>
                   </button>
                   <button
                     onClick={toggleSound}
                     className="w-full py-3 px-4 flex items-center gap-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl text-[10px] uppercase font-black tracking-widest"
                   >
                     <div className={soundEnabled ? 'text-sky-400' : 'text-slate-600 opacity-50'}>
                       {soundEnabled ? ICONS.Play : ICONS.Pause}
                     </div>
                     <span>{soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
                   </button>
                 </div>
               </div>
             )}
           </div>

           <div className="flex gap-2">
             <button 
               onClick={handleUndo}
               disabled={history.length === 0}
               className={`p-3 rounded-2xl border border-slate-800/50 backdrop-blur-md transition-all active:scale-90 ${history.length > 0 ? 'text-sky-400 bg-slate-900/60 hover:text-white' : 'text-slate-700 bg-slate-900/20 opacity-50'}`}
               aria-label="Undo last move"
             >
               {ICONS.Undo}
             </button>
             <button 
               onClick={initGame}
               className="p-3 text-slate-400 hover:text-white bg-slate-900/60 rounded-2xl border border-slate-800/50 backdrop-blur-md active:rotate-180 transition-transform duration-500"
               aria-label="Restart game"
             >
               {ICONS.Refresh}
             </button>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="bg-slate-900/50 border border-slate-800/40 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm shadow-lg">
            <span className="text-[9px] uppercase font-bold text-slate-500 mb-1">Moves</span>
            <span className="text-xl font-black text-sky-400 tabular-nums">{moves}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/40 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm shadow-lg">
            <span className="text-[9px] uppercase font-bold text-slate-500 mb-1">Time</span>
            <span className="text-xl font-black text-slate-100 tabular-nums">{formatTime(time)}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/40 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm shadow-lg">
            <span className="text-[9px] uppercase font-bold text-slate-500 mb-1">Best</span>
            <span className="text-xl font-black text-purple-400 tabular-nums">
              {bestScores[bestScoreKey] === undefined ? '--' : bestScores[bestScoreKey]}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md flex items-center justify-center p-2 z-10">
        <div className="game-board-container relative w-full aspect-square max-h-[75vh] max-w-[400px]">
          {isSettingsOpen && (
            <div 
              className="absolute inset-0 z-20 bg-slate-950/20 backdrop-blur-[2px] rounded-3xl"
              onClick={() => setIsSettingsOpen(false)}
            />
          )}

          <div 
            className="grid gap-2 p-3 bg-slate-900/40 border border-slate-800/50 rounded-3xl shadow-2xl backdrop-blur-md w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
              touchAction: 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {tiles.map((tile, idx) => (
              <Tile
                key={`${idx}-${tile}`}
                value={tile}
                index={idx}
                isEmpty={tile === null}
                isCorrect={tile === targetState[idx]}
                onClick={() => handleTileClick(idx)}
                canMove={!isWon && !isSettingsOpen && getValidMoves(tiles.indexOf(null), gridSize).includes(idx)}
              />
            ))}
          </div>

          {isWon && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl rounded-3xl animate-slideIn border border-sky-500/30 shadow-[0_0_80px_rgba(56,189,248,0.3)] overflow-y-auto overflow-x-hidden p-4">
              <ConfettiBurst />
              <div className="scanline-effect opacity-30" />
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                <div className="w-32 h-32 rounded-full border-2 border-sky-500/20 animate-radiate" />
                <div className="w-32 h-32 rounded-full border-2 border-purple-500/20 animate-radiate [animation-delay:0.5s]" />
              </div>

              <div className="relative mb-4 shrink-0 scale-90 md:scale-100">
                <div className="bg-sky-500/20 p-5 rounded-full neon-glow animate-bounce shadow-[0_0_40px_rgba(56,189,248,0.5)]">
                  {ICONS.Trophy}
                </div>
                {isNewRecord && (
                  <div className="absolute -top-2 -right-8 bg-purple-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full animate-pulse border border-white/20 shadow-lg rotate-12 whitespace-nowrap">
                    NEW RECORD
                  </div>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 italic tracking-[0.2em] flicker animate-reveal text-center px-2 shrink-0">
                MISSION CLEAR
              </h2>
              
              <div className="flex gap-4 md:gap-8 mb-6 z-10 bg-slate-900/60 px-5 py-3 rounded-2xl border border-slate-800/60 backdrop-blur-sm shrink-0">
                <div className="text-center">
                  <p className="text-[8px] uppercase font-bold text-slate-500 mb-0.5 tracking-tighter">Efficiency</p>
                  <p className="text-xl md:text-2xl font-black text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">{moves} <span className="text-[10px] opacity-50">M</span></p>
                </div>
                <div className="w-px h-8 bg-slate-800/80 my-auto"></div>
                <div className="text-center">
                  <p className="text-[8px] uppercase font-bold text-slate-500 mb-0.5 tracking-tighter">Timeframe</p>
                  <p className="text-xl md:text-2xl font-black text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{formatTime(time)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-[240px] z-10 shrink-0">
                <button
                  onClick={initGame}
                  className="w-full py-3.5 bg-sky-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg active:scale-95 border-b-4 border-sky-700 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-40" />
                  <span className="relative group-hover:tracking-widest transition-all">REBOOT GAME</span>
                </button>
                <button
                  onClick={goHome}
                  className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl transition-all active:scale-95 hover:text-white hover:bg-slate-800"
                >
                  COMMAND CENTER
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-md shrink-0 py-4 z-10 px-2">
        <div className="flex justify-between items-center opacity-30 text-[9px] uppercase font-black tracking-[0.2em] text-slate-400">
           <span>SYSTEM ONLINE</span>
           <div className="flex gap-2">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
             <span>SECURE CONNECTION</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
