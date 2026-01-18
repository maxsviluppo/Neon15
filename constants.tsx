
import React from 'react';
import { Trophy, RefreshCw, Settings, Play, Pause, ChevronLeft, ChevronRight, Hash, Type, Undo2 } from 'lucide-react';

export const ITALIAN_ALPHABET = "ABCDEFGHILMNOPQRSTUVZ".split("");

export const DIFFICULTY_LABELS: Record<number, string> = {
  3: 'Easy (3x3)',
  4: 'Normal (4x4)',
  5: 'Hard (5x5)',
};

export const ICONS = {
  Trophy: <Trophy className="w-5 h-5" />,
  Refresh: <RefreshCw className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  Play: <Play className="w-5 h-5" />,
  Pause: <Pause className="w-5 h-5" />,
  Left: <ChevronLeft className="w-5 h-5" />,
  Right: <ChevronRight className="w-5 h-5" />,
  Numbers: <Hash className="w-5 h-5" />,
  Letters: <Type className="w-5 h-5" />,
  Undo: <Undo2 className="w-5 h-5" />,
};
