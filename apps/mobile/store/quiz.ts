import { create } from 'zustand';
import type { FlavorProfile } from '../components/FlavorWheel';

export type QuizResults = {
  personaName: string;
  personaTagline: string;
  flavorProfile: FlavorProfile;
  matchCount: number;
};

interface QuizResultsState {
  results: QuizResults | null;
  setResults: (r: QuizResults) => void;
  clearResults: () => void;
}

export const useQuizResultsStore = create<QuizResultsState>((set) => ({
  results: null,
  setResults: (results) => set({ results }),
  clearResults: () => set({ results: null }),
}));
