
export type GameMode = 'numbers' | 'letters';

export type Difficulty = 3 | 4 | 5;

export interface GameState {
  tiles: (number | string | null)[];
  gridSize: Difficulty;
  moves: number;
  time: number;
  isActive: boolean;
  isWon: boolean;
  bestScores: Record<string, number>;
}

export interface Stats {
  moves: number;
  time: number;
}
