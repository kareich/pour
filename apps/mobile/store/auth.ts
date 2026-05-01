import { create } from 'zustand';

interface AuthState {
  isAgeVerified: boolean;
  hasCompletedQuiz: boolean;
  setAgeVerified: (v: boolean) => void;
  setQuizCompleted: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAgeVerified: false,
  hasCompletedQuiz: false,
  setAgeVerified: (isAgeVerified) => set({ isAgeVerified }),
  setQuizCompleted: (hasCompletedQuiz) => set({ hasCompletedQuiz }),
}));
