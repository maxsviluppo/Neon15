
import { ITALIAN_ALPHABET } from '../constants';

export const getTargetState = (gridSize: number, mode: 'numbers' | 'letters' | 'math'): (number | string | null)[] => {
  const total = gridSize * gridSize;
  const target: (number | string | null)[] = [];
  
  for (let i = 1; i < total; i++) {
    target.push(i); // Usiamo sempre i numeri internamente per la logica di risoluzione
  }
  target.push(null);
  return target;
};

// Funzione per generare una stringa visualizzata in base al numero e alla modalità
export const getTileDisplay = (value: number | string | null, mode: 'numbers' | 'letters' | 'math'): string => {
  if (value === null) return "";
  
  if (mode === 'numbers') return String(value);
  
  if (mode === 'letters') {
    const num = Number(value);
    return ITALIAN_ALPHABET[(num - 1) % ITALIAN_ALPHABET.length];
  }
  
  if (mode === 'math') {
    const num = Number(value);
    // Generiamo un'operazione semplice che risulti in 'num'
    const type = Math.floor(Math.random() * 3);
    switch(type) {
      case 0: // Addizione: x + y = num
        const add = Math.floor(Math.random() * (num - 1)) + 1;
        return `${add}+${num - add}`;
      case 1: // Sottrazione: x - y = num
        const sub = Math.floor(Math.random() * 5) + 1;
        return `${num + sub}-${sub}`;
      case 2: // Moltiplicazione (se possibile)
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
  const target = getTargetState(gridSize, mode);
  return tiles.every((tile, index) => tile === target[index]);
};

export const shuffleTiles = (gridSize: number, mode: 'numbers' | 'letters' | 'math'): (number | string | null)[] => {
  const solved = getTargetState(gridSize, mode);
  let current = [...solved];
  let emptyIndex = current.length - 1;

  const iterations = gridSize * gridSize * 100;
  for (let i = 0; i < iterations; i++) {
    const neighbors = getValidMoves(emptyIndex, gridSize);
    const randomMove = neighbors[Math.floor(Math.random() * neighbors.length)];
    [current[emptyIndex], current[randomMove]] = [current[randomMove], current[emptyIndex]];
    emptyIndex = randomMove;
  }

  if (isSolved(current, gridSize, mode)) {
    return shuffleTiles(gridSize, mode);
  }

  return current;
};

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
