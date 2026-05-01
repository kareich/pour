import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { registerTokenGetter } from '../lib/token-store';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function AuthGate() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { isAgeVerified, hasSeenWelcome, hasCompletedQuiz } = useAuthStore();
  const [storeHydrated, setStoreHydrated] = useState(useAuthStore.persist.hasHydrated());

  // Register Clerk's getToken so non-React api.ts can call it
  useEffect(() => {
    registerTokenGetter(getToken);
  }, [getToken]);

  // Wait for Zustand store to rehydrate from SecureStore before routing
  useEffect(() => {
    if (storeHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setStoreHydrated(true));
    return unsub;
  }, [storeHydrated]);

  useEffect(() => {
    if (!isLoaded || !storeHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inQuizGroup = segments[0] === 'quiz';

    // Step 1: Age gate
    if (!isAgeVerified) {
      router.replace('/(auth)/age-gate');
      return;
    }

    // Step 2: Value proposition screens (before sign-in)
    if (!hasSeenWelcome && !inAuthGroup) {
      router.replace('/(auth)/welcome');
      return;
    }

    // Step 3: Authentication
    if (!isSignedIn) {
      if (!inAuthGroup) router.replace('/(auth)/sign-in');
      return;
    }

    // Step 4: Taste quiz (after sign-in, before main app)
    if (!hasCompletedQuiz) {
      if (!inQuizGroup) router.replace('/quiz');
      return;
    }

    // Step 5: Main app
    if (inAuthGroup || inQuizGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, isAgeVerified, hasSeenWelcome, hasCompletedQuiz, segments, storeHydrated]);

  // Don't render until the auth store hydrated — avoids a flash redirect to age-gate
  if (!storeHydrated) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
