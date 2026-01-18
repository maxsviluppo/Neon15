
import { ITALIAN_ALPHABET } from '../constants';
import { Complexity } from '../types';

export const getTargetState = (gridSize: number, mode: 'numbers' | 'letters' | 'math'): (number | string | null)[] => {
  const size = Math.max(2, Math.floor(Number(gridSize) || 3));
  const total = size * size;
  const target: (number | string | null)[] = [];
  
  for (let i = 1; i < total; i++) {
    target.push(i);
  }
  target.push(null);
  return target;
};

export const getTileDisplay = (value: number | string | null, mode: 'numbers' | 'letters' | 'math'): string => {
  if (value === null) return "";
  
  const num = Number(value);
  if (isNaN(num)) return String(value || "");

  if (mode === 'numbers') return String(num);
  
  if (mode === 'letters') {
    return ITALIAN_ALPHABET[(num - 1) % ITALIAN_ALPHABET.length];
  }
  
  if (mode === 'math') {
    const type = Math.floor(Math.random() * 3);
    switch(type) {
      case 0:
        const add = Math.floor(Math.random() * (num - 1)) + 1;
        return `${add}+${num - add}`;
      case 1:
        const sub = Math.floor(Math.random() * 5) + 1;
        return `${num + sub}-${sub}`;
      case 2:
        for (let i = 2; i <= Math.sqrt(num); i++) {
          if (num % i === 0) return `${i}x${num / i}`;
        }
        return `${num}x1`;
      default:
        return `${num}+0`;
    }
  }
  
  return String(value);
};

export const isSolved = (tiles: (number | string | null)[], gridSize: number, mode: 'numbers' | 'letters' | 'math'): boolean => {
  if (!tiles || tiles.length === 0) return false;
  const target = getTargetState(gridSize, mode);
  if (tiles.length !== target.length) return false;
  return tiles.every((tile, index) => tile === target[index]);
};

// Fixed: Completed the truncated function
export const getValidMoves = (emptyIndex: number, gridSize: number): number[] => {
  const moves: number[] = [];
  const row = Math.floor(emptyIndex / gridSize);
  const col = emptyIndex % gridSize;

  if (row > 0) moves.push(emptyIndex - gridSize);
  if (row < gridSize - 1) moves.push(emptyIndex + gridSize);
  if (col > 0) moves.push(emptyIndex - 1);
  if (col < gridSize - 1) moves.push(emptyIndex + 1);

  return moves;
};

// Fixed: Implemented getMoveSequence to support sliding multiple tiles in a row/column
export const getMoveSequence = (targetIndex: number, emptyIndex: number, gridSize: number): number[] | null => {
  const targetRow = Math.floor(targetIndex / gridSize);
  const targetCol = targetIndex % gridSize;
  const emptyRow = Math.floor(emptyIndex / gridSize);
  const emptyCol = emptyIndex % gridSize;

  if (targetRow !== emptyRow && targetCol !== emptyCol) return null;

  const sequence: number[] = [];
  if (targetRow === emptyRow) {
    const step = targetCol > emptyCol ? 1 : -1;
    for (let c = emptyCol + step; step > 0 ? c <= targetCol : c >= targetCol; c += step) {
      sequence.push(emptyRow * gridSize + c);
    }
  } else {
    const step = targetRow > emptyRow ? 1 : -1;
    for (let r = emptyRow + step; step > 0 ? r <= targetRow : r >= targetRow; r += step) {
      sequence.push(r * gridSize + emptyCol);
    }
  }
  return sequence;
};

// Fixed: Implemented shuffleTiles using a sequence of valid moves to ensure solvability
export const shuffleTiles = (gridSize: number, mode: 'numbers' | 'letters' | 'math', complexity: Complexity): (number | string | null)[] => {
  let tiles = getTargetState(gridSize, mode);
  let emptyIndex = tiles.length - 1;

  let shuffleMoves = 0;
  switch (complexity) {
    case 'easy': shuffleMoves = 25; break;
    case 'medium': shuffleMoves = 75; break;
    case 'hard': shuffleMoves = 200; break;
    default: shuffleMoves = 50;
  }

  let lastIndex = -1;
  for (let i = 0; i < shuffleMoves; i++) {
    const possibleMoves = getValidMoves(emptyIndex, gridSize).filter(m => m !== lastIndex);
    const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    
    // Perform swap
    [tiles[emptyIndex], tiles[move]] = [tiles[move], tiles[emptyIndex]];
    lastIndex = emptyIndex;
    emptyIndex = move;
  }

  return tiles;
};
