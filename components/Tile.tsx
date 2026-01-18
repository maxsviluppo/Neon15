
import React from 'react';

interface TileProps {
  value: string | number | null;
  displayValue: string;
  index: number;
  isEmpty: boolean;
  isCorrect: boolean;
  onClick: () => void;
  canMove: boolean;
}

const Tile: React.FC<TileProps> = ({ value, displayValue, isEmpty, isCorrect, onClick, canMove }) => {
  if (isEmpty) {
    return (
      <div className="w-full h-full bg-slate-950/20 border-2 border-dashed border-slate-800/10 rounded-xl md:rounded-2xl" />
    );
  }

  // Se l'espressione è lunga (es. math), riduciamo leggermente il font
  const isLong = displayValue.length > 3;

  return (
    <button
      onClick={onClick}
      disabled={!canMove}
      className={`
        relative w-full h-full flex items-center justify-center
        ${isLong ? 'text-lg md:text-2xl' : 'text-xl md:text-3xl'}
        font-black rounded-xl md:rounded-2xl transition-all duration-300
        perspective-1000 transform-gpu animate-slideIn
        ${canMove ? 'cursor-pointer active:scale-90 active:shadow-none hover:border-sky-500/50' : 'cursor-default'}
        ${isCorrect ? 'text-sky-400' : 'text-slate-100'}
        tile-gradient border border-slate-700/40 shadow-[0_6px_0_0_rgba(15,23,42,1),0_12px_15px_rgba(0,0,0,0.5)]
      `}
      style={{
        boxShadow: isCorrect 
          ? '0 6px 0 0 rgba(15,23,42,1), 0 0 15px rgba(56, 189, 248, 0.2), inset 0 0 10px rgba(56, 189, 248, 0.1)' 
          : '0 6px 0 0 rgba(15,23,42,1), 0 10px 20px rgba(0,0,0,0.6)',
      }}
    >
      <div className="absolute inset-0 rounded-xl md:rounded-2xl opacity-5 bg-gradient-to-br from-white to-transparent pointer-events-none" />
      <span className={`${isCorrect ? 'glow-text' : ''} drop-shadow-lg tabular-nums`}>{displayValue}</span>
      {isCorrect && (
        <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8] flicker" />
      )}
    </button>
  );
};

export default Tile;
