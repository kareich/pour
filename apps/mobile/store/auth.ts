import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  isAgeVerified: boolean;
  hasSeenWelcome: boolean;
  hasCompletedQuiz: boolean;
  setAgeVerified: (v: boolean) => void;
  setSeenWelcome: (v: boolean) => void;
  setQuizCompleted: (v: boolean) => void;
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAgeVerified: false,
      hasSeenWelcome: false,
      hasCompletedQuiz: false,
      setAgeVerified: (isAgeVerified) => set({ isAgeVerified }),
      setSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
      setQuizCompleted: (hasCompletedQuiz) => set({ hasCompletedQuiz }),
    }),
    {
      name: 'pour-auth',
      storage: createJSONStorage(() => secureStoreAdapter),
      // hasSeenWelcome intentionally excluded so welcome slides always show on app launch
      partialize: (state) => ({ isAgeVerified: state.isAgeVerified, hasCompletedQuiz: state.hasCompletedQuiz }),
    }
  )
);
