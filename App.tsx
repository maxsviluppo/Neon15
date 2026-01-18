
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameMode, Difficulty } from './types';
import { ICONS, GAME_LEVELS } from './constants';
import { shuffleTiles, isSolved, getValidMoves, getTargetState, getTileDisplay } from './utils/puzzleLogic';
import { playMoveSound, playWinSound, playSelectSound, playAmbientHum, playGlitchSound } from './utils/audioEffects';
import Tile from './components/Tile';

type View = 'home' | 'game';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [selectedMode, setSelectedMode] = useState<GameMode>('numbers');
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [tiles, setTiles] = useState<(number | string | null)[]>([]);
  const [tileDisplays, setTileDisplays] = useState<string[]>([]);
  const [history, setHistory] = useState<(number | string | null)[][]>([]);
  const [historyDisplays, setHistoryDisplays] = useState<string[][]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  
  const timerRef = useRef<number | null>(null);
  const ambientTimerRef = useRef<number | null>(null);
  const touchStart = useRef<{ x: number, y: number } | null>(null);

  // Load initial data
  useEffect(() => {
    const savedScores = localStorage.getItem('puzzle-15-best-scores');
    if (savedScores) setBestScores(JSON.parse(savedScores));
    
    const savedLevel = localStorage.getItem('puzzle-15-unlocked-level');
    if (savedLevel) {
      setUnlockedLevel(parseInt(savedLevel));
    } else {
      setUnlockedLevel(3);
    }
    
    const soundPref = localStorage.getItem('puzzle-15-sound');
    if (soundPref !== null) setSoundEnabled(soundPref === 'true');
  }, []);

  const currentLevel = useMemo(() => 
    GAME_LEVELS.find(l => l.id === currentLevelId) || GAME_LEVELS[0]
  , [currentLevelId]);

  const filteredLevels = useMemo(() => 
    GAME_LEVELS.filter(l => l.mode === selectedMode)
  , [selectedMode]);

  useEffect(() => {
    if (view === 'home') {
      const firstAvailable = filteredLevels.filter(l => l.id <= unlockedLevel).pop() || filteredLevels[0];
      setCurrentLevelId(firstAvailable.id);
    }
  }, [selectedMode, filteredLevels, unlockedLevel, view]);

  // Ambient sound management
  useEffect(() => {
    if (view === 'game' && soundEnabled && !isWon) {
      const triggerAmbient = () => {
        const rand = Math.random();
        if (rand > 0.7) playAmbientHum();
        else if (rand < 0.2) playGlitchSound();
        
        const nextDelay = Math.random() * 8000 + 4000; // 4-12 seconds
        ambientTimerRef.current = window.setTimeout(triggerAmbient, nextDelay);
      };

      ambientTimerRef.current = window.setTimeout(triggerAmbient, 2000);
    } else {
      if (ambientTimerRef.current) window.clearTimeout(ambientTimerRef.current);
    }
    return () => {
      if (ambientTimerRef.current) window.clearTimeout(ambientTimerRef.current);
    };
  }, [view, soundEnabled, isWon]);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('puzzle-15-sound', String(newVal));
    if (newVal) playSelectSound();
  };

  const initGame = useCallback(() => {
    const newTiles = shuffleTiles(currentLevel.gridSize, currentLevel.mode);
    setTiles(newTiles);
    const displays = newTiles.map(t => getTileDisplay(t, currentLevel.mode));
    setTileDisplays(displays);
    setHistory([]);
    setHistoryDisplays([]);
    setMoves(0);
    setTime(0);
    setIsActive(false);
    setIsWon(false);
    setIsNewRecord(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, [currentLevel]);

  useEffect(() => {
    if (view === 'game') {
      initGame();
    }
  }, [currentLevelId, view, initGame]);

  const startGame = () => {
    if (soundEnabled) playSelectSound();
    initGame();
    setView('game');
  };

  const goHome = () => {
    if (soundEnabled) playSelectSound();
    setView('home');
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const nextLevelInCategory = useMemo(() => {
    const modeLevels = GAME_LEVELS.filter(l => l.mode === currentLevel.mode);
    const currentIndex = modeLevels.findIndex(l => l.id === currentLevelId);
    return (currentIndex !== -1 && currentIndex < modeLevels.length - 1) ? modeLevels[currentIndex + 1] : null;
  }, [currentLevel, currentLevelId]);

  const nextLevel = () => {
    if (nextLevelInCategory) {
      if (soundEnabled) playSelectSound();
      const nextId = nextLevelInCategory.id;
      setCurrentLevelId(nextId);
      if (nextId > unlockedLevel) {
        setUnlockedLevel(nextId);
        localStorage.setItem('puzzle-15-unlocked-level', String(nextId));
      }
      setIsWon(false);
    } else {
      goHome();
    }
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
    if (isWon) return;
    const emptyIndex = tiles.indexOf(null);
    const validMoves = getValidMoves(emptyIndex, currentLevel.gridSize);
    if (validMoves.includes(index)) {
      if (soundEnabled) playMoveSound();
      if (!isActive) setIsActive(true);
      setHistory(prev => [...prev, [...tiles]]);
      setHistoryDisplays(prev => [...prev, [...tileDisplays]]);
      const newTiles = [...tiles];
      const newDisplays = [...tileDisplays];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      [newDisplays[emptyIndex], newDisplays[index]] = [newDisplays[index], newDisplays[emptyIndex]];
      setTiles(newTiles);
      setTileDisplays(newDisplays);
      const newMovesCount = moves + 1;
      setMoves(newMovesCount);
      if (isSolved(newTiles, currentLevel.gridSize, currentLevel.mode)) {
        setIsWon(true);
        setIsActive(false);
        if (soundEnabled) playWinSound();
        saveBestScore(newMovesCount);
      }
    }
  }, [tiles, tileDisplays, currentLevel, isWon, moves, isActive, soundEnabled]);

  const handleUndo = () => {
    if (history.length === 0 || isWon) return;
    if (soundEnabled) playMoveSound();
    const lastTiles = history[history.length - 1];
    const lastDisplays = historyDisplays[historyDisplays.length - 1];
    setTiles(lastTiles);
    setTileDisplays(lastDisplays);
    setHistory(prev => prev.slice(0, -1));
    setHistoryDisplays(prev => prev.slice(0, -1));
    setMoves(prev => Math.max(0, prev - 1));
    if (moves === 1) {
      setIsActive(false);
      setTime(0);
    }
  };

  const attemptSwipeMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const emptyIndex = tiles.indexOf(null);
    if (emptyIndex === -1) return;
    const col = emptyIndex % currentLevel.gridSize;
    const row = Math.floor(emptyIndex / currentLevel.gridSize);
    let targetIndex = -1;
    if (direction === 'left' && col < currentLevel.gridSize - 1) targetIndex = emptyIndex + 1;
    if (direction === 'right' && col > 0) targetIndex = emptyIndex - 1;
    if (direction === 'up' && row < currentLevel.gridSize - 1) targetIndex = emptyIndex + currentLevel.gridSize;
    if (direction === 'down' && row > 0) targetIndex = emptyIndex - currentLevel.gridSize;
    if (targetIndex !== -1) handleTileClick(targetIndex);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || isWon) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const threshold = 40; 
    if (Math.abs(dx) > Math.abs(dy)) { if (Math.abs(dx) > threshold) attemptSwipeMove(dx > 0 ? 'right' : 'left'); }
    else if (Math.abs(dy) > threshold) { if (Math.abs(dy) > threshold) attemptSwipeMove(dy > 0 ? 'down' : 'up'); }
    touchStart.current = null;
  };

  const saveBestScore = (finalMoves: number) => {
    const key = `level-${currentLevelId}`;
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

  const targetState = useMemo(() => getTargetState(currentLevel.gridSize, currentLevel.mode), [currentLevel]);
  const bestScoreKey = `level-${currentLevelId}`;

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
          const angle = (i / 80) * 360;
          const distance = 100 + Math.random() * 300;
          const x = Math.cos(angle * (Math.PI / 180)) * distance;
          const y = Math.sin(angle * (Math.PI / 180)) * distance;
          return (
            <div key={i} className="confetti" style={{ '--x': `${x}px`, '--y': `${y}px`, backgroundColor: colors[i % colors.length] } as any} />
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
        
        <button 
          onClick={toggleSound} 
          className="absolute top-6 right-6 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50 text-slate-400 active:scale-90 transition-all z-20"
        >
          {soundEnabled ? ICONS.VolumeOn : ICONS.VolumeOff}
        </button>

        <div className="z-10 w-full max-w-md flex flex-col items-center gap-8 text-center animate-slideIn">
          <header className="flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl mb-4 flex items-center justify-center border-2 border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.2)] mx-auto rotate-3">
               <span className="text-3xl font-black text-sky-400 glow-text flicker">15</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter glow-text uppercase mb-1">Neon Matrix</h1>
            <div className="flex flex-col items-center gap-1 mb-2">
              <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.1em] uppercase">
                LVL {currentLevel.id}: {currentLevel.label}
              </span>
            </div>
            <p className="text-slate-500 text-[9px] uppercase tracking-[0.4em] font-bold opacity-70">Neural Link Established</p>
          </header>

          <div className="w-full space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { mode: 'numbers' as GameMode, icon: ICONS.Numbers, label: 'NUMERI' },
                { mode: 'letters' as GameMode, icon: ICONS.Letters, label: 'LETTERE' },
                { mode: 'math' as GameMode, icon: ICONS.Math, label: 'MATH' }
              ].map(module => (
                <button 
                  key={module.mode} 
                  onClick={() => { setSelectedMode(module.mode); if(soundEnabled) playSelectSound(); }}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 active:scale-95 ${selectedMode === module.mode ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'border-slate-800 bg-slate-900/40 opacity-40 hover:opacity-60'}`}
                >
                  <div className={selectedMode === module.mode ? 'text-sky-400' : 'text-slate-600'}>
                    {module.icon}
                  </div>
                  <span className={`text-[8px] font-black tracking-widest ${selectedMode === module.mode ? 'text-sky-300' : 'text-slate-700'}`}>{module.label}</span>
                </button>
              ))}
            </div>

            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute inset-0 animate-shimmer opacity-10 pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Dati Protocollo</p>
                  <h3 className="text-xl font-black text-white">{currentLevel.label}</h3>
                </div>
                <div className="bg-sky-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black">
                  L{currentLevel.id}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {filteredLevels.map(level => (
                  <button
                    key={level.id}
                    disabled={level.id > unlockedLevel}
                    onClick={() => { setCurrentLevelId(level.id); if(soundEnabled) playSelectSound(); }}
                    className={`h-12 rounded-xl border flex flex-col items-center justify-center transition-all ${currentLevelId === level.id ? 'bg-sky-500 border-sky-400 text-slate-950 scale-105 shadow-lg' : level.id <= unlockedLevel ? 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500' : 'border-slate-900 bg-slate-950/50 text-slate-800 cursor-not-allowed'}`}
                  >
                    <span className="text-xs font-black">{level.gridSize}x{level.gridSize}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={startGame}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-lg rounded-2xl shadow-[0_10px_40px_-10px_rgba(56,189,248,0.5)] active:scale-95 transition-all pulse-neon"
          >
            INIZIA PROTOCOLLO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-[#030712] relative overflow-hidden safe-area-inset">
      <Particles />
      <header className="w-full max-w-md flex flex-col gap-3 z-10 pt-2">
        <div className="flex items-center justify-between w-full px-1">
           <button onClick={goHome} className="p-3 text-slate-400 hover:text-white bg-slate-900/60 rounded-2xl border border-slate-800/50 backdrop-blur-md active:scale-90 transition-transform">
             {ICONS.Left}
           </button>
           
           <div className="bg-slate-900/80 px-6 py-2 rounded-2xl border border-sky-500/20 backdrop-blur-md flex flex-col items-center shadow-[0_0_20px_rgba(56,189,248,0.1)]">
             <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_#38bdf8]" />
               <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">L{currentLevel.id} • {currentLevel.mode.toUpperCase()}</span>
             </div>
             <span className="text-xs font-black text-sky-400 tracking-tight">{currentLevel.label}</span>
           </div>

           <div className="flex gap-2">
             <button onClick={toggleSound} className="p-3 text-slate-400 hover:text-white bg-slate-900/60 rounded-2xl border border-slate-800/50 backdrop-blur-md active:scale-90 transition-all">
               {soundEnabled ? ICONS.VolumeOn : ICONS.VolumeOff}
             </button>
             <button onClick={handleUndo} disabled={history.length === 0} className={`p-3 rounded-2xl border border-slate-800/50 backdrop-blur-md transition-all active:scale-90 ${history.length > 0 ? 'text-sky-400 bg-slate-900/60' : 'text-slate-700 bg-slate-900/20 opacity-50'}`}>
               {ICONS.Undo}
             </button>
             <button onClick={() => { initGame(); if(soundEnabled) playSelectSound(); }} className="p-3 text-slate-400 hover:text-white bg-slate-900/60 rounded-2xl border border-slate-800/50 backdrop-blur-md active:rotate-180 transition-transform duration-500">
               {ICONS.Refresh}
             </button>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="bg-slate-900/50 border border-slate-800/40 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm">
            <span className="text-[9px] uppercase font-bold text-slate-500 mb-1">Mosse</span>
            <span className="text-xl font-black text-sky-400 tabular-nums">{moves}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/40 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm">
            <span className="text-[9px] uppercase font-bold text-slate-500 mb-1">Tempo</span>
            <span className="text-xl font-black text-slate-100 tabular-nums">{formatTime(time)}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/40 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm">
            <span className="text-[9px] uppercase font-bold text-slate-500 mb-1">Record</span>
            <span className="text-xl font-black text-purple-400 tabular-nums">
              {bestScores[bestScoreKey] === undefined ? '--' : bestScores[bestScoreKey]}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md flex items-center justify-center p-2 z-10">
        <div className="game-board-container relative w-full aspect-square max-h-[75vh] max-w-[400px]">
          <div 
            className="grid gap-2 p-3 bg-slate-900/40 border border-slate-800/50 rounded-3xl shadow-2xl backdrop-blur-md w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${currentLevel.gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${currentLevel.gridSize}, 1fr)`,
              touchAction: 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {tiles.map((tile, idx) => (
              <Tile
                key={`${idx}-${tile}`}
                value={tile}
                displayValue={tileDisplays[idx] || ""}
                index={idx}
                isEmpty={tile === null}
                isCorrect={tile === targetState[idx]}
                onClick={() => handleTileClick(idx)}
                canMove={!isWon && getValidMoves(tiles.indexOf(null), currentLevel.gridSize).includes(idx)}
              />
            ))}
          </div>

          {isWon && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl rounded-3xl animate-slideIn border border-sky-500/30 p-6 overflow-y-auto">
              <ConfettiBurst />
              <div className="scanline-effect opacity-20" />
              <div className="relative mb-6">
                <div className="bg-sky-500/20 p-5 rounded-full neon-glow animate-bounce">
                  {ICONS.Trophy}
                </div>
                {isNewRecord && (
                  <div className="absolute -top-2 -right-6 bg-purple-500 text-white text-[9px] font-black px-2 py-1 rounded-full animate-pulse rotate-12">
                    RECORD!
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-black text-white mb-6 tracking-[0.2em] animate-reveal text-center">SOLUZIONE TROVATA</h2>
              <div className="flex gap-6 mb-8 z-10 bg-slate-900/60 px-6 py-4 rounded-2xl border border-slate-800/60">
                <div className="text-center">
                  <p className="text-[8px] uppercase font-bold text-slate-500 mb-1">Mosse</p>
                  <p className="text-2xl font-black text-sky-400">{moves}</p>
                </div>
                <div className="w-px h-8 bg-slate-800 my-auto"></div>
                <div className="text-center">
                  <p className="text-[8px] uppercase font-bold text-slate-500 mb-1">Tempo</p>
                  <p className="text-2xl font-black text-slate-100">{formatTime(time)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[220px] z-10">
                {nextLevelInCategory ? (
                  <button onClick={nextLevel} className="w-full py-4 bg-sky-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg active:scale-95 border-b-4 border-sky-700">
                    PROSSIMA MISSIONE
                  </button>
                ) : (
                  <div className="text-center py-2 px-4 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-2">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">CATEGORIA COMPLETATA</p>
                  </div>
                )}
                <button onClick={initGame} className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl hover:text-white">
                  RIPROVA
                </button>
                <button onClick={goHome} className="w-full py-2 bg-transparent text-slate-500 font-bold text-[9px] uppercase tracking-[0.3em] hover:text-slate-300">
                  MENU PRINCIPALE
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-md py-4 z-10 px-2">
        <div className="flex justify-between items-center opacity-30 text-[8px] font-black tracking-[0.2em] text-slate-500">
           <span>NEURAL MATRIX v2.5</span>
           <span>SECURE LINK</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
