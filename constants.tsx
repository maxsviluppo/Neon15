
import React from 'react';
import { Trophy, RefreshCw, Settings, Play, Pause, ChevronLeft, ChevronRight, Hash, Type, Undo2, Calculator, Volume2, VolumeX } from 'lucide-react';
import { GameLevel } from './types';

export const ITALIAN_ALPHABET = "ABCDEFGHILMNOPQRSTUVZ".split("");

// Fixed type error by reordering manually and removing .sort() which caused type widening on the array literal.
export const GAME_LEVELS: GameLevel[] = [
  { id: 1, gridSize: 3, mode: 'numbers', label: 'Iniziazione Digitale', complexity: 'easy' },
  { id: 2, gridSize: 3, mode: 'letters', label: 'Codice Alfabetico', complexity: 'easy' },
  { id: 3, gridSize: 3, mode: 'math', label: 'Sintesi Aritmetica', complexity: 'easy' },
  { id: 4, gridSize: 4, mode: 'numbers', label: 'Matrice Standard', complexity: 'medium' },
  { id: 5, gridSize: 4, mode: 'letters', label: 'Protocollo Testuale', complexity: 'medium' },
  { id: 6, gridSize: 4, mode: 'math', label: 'Algoritmo Avanzato', complexity: 'medium' },
  { id: 7, gridSize: 5, mode: 'numbers', label: 'Griglia Suprema', complexity: 'hard' },
  { id: 8, gridSize: 5, mode: 'letters', label: 'Overload di Dati', complexity: 'hard' },
  { id: 9, gridSize: 5, mode: 'math', label: 'Singolarità Matematica', complexity: 'hard' },
];

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
  Math: <Calculator className="w-5 h-5" />,
  Undo: <Undo2 className="w-5 h-5" />,
  VolumeOn: <Volume2 className="w-5 h-5" />,
  VolumeOff: <VolumeX className="w-5 h-5" />,
};
