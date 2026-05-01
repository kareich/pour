import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  isAgeVerified: boolean;
  hasCompletedQuiz: boolean;
  setAgeVerified: (v: boolean) => void;
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
      hasCompletedQuiz: false,
      setAgeVerified: (isAgeVerified) => set({ isAgeVerified }),
      setQuizCompleted: (hasCompletedQuiz) => set({ hasCompletedQuiz }),
    }),
    {
      name: 'pour-auth',
      storage: createJSONStorage(() => secureStoreAdapter),
    }
  )
);
