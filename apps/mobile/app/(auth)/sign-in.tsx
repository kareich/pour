import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { colors, typography, spacing } from '../../lib/theme';

export default function SignInScreen() {
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { signIn } = useSignIn();
  const router = useRouter();
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  const handleApple = useCallback(async () => {
    try {
      setLoading('apple');
      const { createdSessionId, setActive } = await appleOAuth();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Apple sign in error:', err);
    } finally {
      setLoading(null);
    }
  }, [appleOAuth, router]);

  const handleGoogle = useCallback(async () => {
    try {
      setLoading('google');
      const { createdSessionId, setActive } = await googleOAuth();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setLoading(null);
    }
  }, [googleOAuth, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Pour</Text>
      <Text style={styles.tagline}>Scan any bottle. Know in 2 seconds.</Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.appleButton} onPress={handleApple} activeOpacity={0.85} disabled={!!loading}>
          {loading === 'apple' ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.appleText}> Continue with Apple</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogle} activeOpacity={0.85} disabled={!!loading}>
          {loading === 'google' ? (
            <ActivityIndicator color={colors.amber} />
          ) : (
            <Text style={styles.googleText}>G  Continue with Google</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.legal}>
        By continuing you agree to our Terms and Privacy Policy.{'\n'}You must be 21 or older to use Pour.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  logo: {
    fontSize: typography['4xl'],
    fontWeight: '800',
    color: colors.amber,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: typography.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  appleButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.textPrimary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleText: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.background,
  },
  googleButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legal: {
    marginTop: spacing.xl,
    fontSize: typography.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
});
