
import { ITALIAN_ALPHABET } from '../constants';

export const getTargetState = (gridSize: number, mode: 'numbers' | 'letters'): (number | string | null)[] => {
  const total = gridSize * gridSize;
  const target: (number | string | null)[] = [];
  
  for (let i = 1; i < total; i++) {
    if (mode === 'numbers') {
      target.push(i);
    } else {
      // For letters, we cycle the alphabet if needed
      target.push(ITALIAN_ALPHABET[(i - 1) % ITALIAN_ALPHABET.length]);
    }
  }
  target.push(null);
  return target;
};

export const isSolved = (tiles: (number | string | null)[], gridSize: number, mode: 'numbers' | 'letters'): boolean => {
  const target = getTargetState(gridSize, mode);
  return tiles.every((tile, index) => tile === target[index]);
};

export const shuffleTiles = (gridSize: number, mode: 'numbers' | 'letters'): (number | string | null)[] => {
  const solved = getTargetState(gridSize, mode);
  let current = [...solved];
  let emptyIndex = current.length - 1;

  // Perform random valid moves to ensure solvability
  const iterations = gridSize * gridSize * 100;
  for (let i = 0; i < iterations; i++) {
    const neighbors = getValidMoves(emptyIndex, gridSize);
    const randomMove = neighbors[Math.floor(Math.random() * neighbors.length)];
    
    // Swap
    [current[emptyIndex], current[randomMove]] = [current[randomMove], current[emptyIndex]];
    emptyIndex = randomMove;
  }

  // Ensure it's not solved initially
  if (isSolved(current, gridSize, mode)) {
    return shuffleTiles(gridSize, mode);
  }

  return current;
};

export const getValidMoves = (emptyIndex: number, gridSize: number): number[] => {
  const moves: number[] = [];
  const row = Math.floor(emptyIndex / gridSize);
  const col = emptyIndex % gridSize;

  if (row > 0) moves.push(emptyIndex - gridSize); // Top
  if (row < gridSize - 1) moves.push(emptyIndex + gridSize); // Bottom
  if (col > 0) moves.push(emptyIndex - 1); // Left
  if (col < gridSize - 1) moves.push(emptyIndex + 1); // Right

  return moves;
};
