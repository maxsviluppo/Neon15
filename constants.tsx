
import React from 'react';
import { Trophy, RefreshCw, Settings, Play, Pause, ChevronLeft, ChevronRight, Hash, Type, Undo2, Calculator, Volume2, VolumeX } from 'lucide-react';
import { GameLevel } from './types';

export const ITALIAN_ALPHABET = "ABCDEFGHILMNOPQRSTUVZ".split("");

export const GAME_LEVELS: GameLevel[] = [
  { id: 1, gridSize: 3, mode: 'numbers', label: 'Iniziazione Digitale' },
  { id: 2, gridSize: 3, mode: 'letters', label: 'Codice Alfabetico' },
  { id: 3, gridSize: 3, mode: 'math', label: 'Sintesi Aritmetica' },
  { id: 4, gridSize: 4, mode: 'numbers', label: 'Matrice Standard' },
  { id: 5, gridSize: 4, mode: 'letters', label: 'Protocollo Testuale' },
  { id: 6, gridSize: 4, mode: 'math', label: 'Algoritmo Avanzato' },
  { id: 7, gridSize: 5, mode: 'numbers', label: 'Griglia Suprema' },
  { id: 8, gridSize: 5, mode: 'letters', label: 'Overload di Dati' },
  { id: 9, gridSize: 5, mode: 'math', label: 'Singolarità Matematica' },
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
