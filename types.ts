
export type GameMode = 'numbers' | 'letters' | 'math';

export type Difficulty = 3 | 4 | 5;

export interface GameLevel {
  id: number;
  gridSize: Difficulty;
  mode: GameMode;
  label: string;
}

export interface GameState {
  tiles: (number | string | null)[];
  gridSize: Difficulty;
  moves: number;
  time: number;
  isActive: boolean;
  isWon: boolean;
  bestScores: Record<string, number>;
}
