import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { colors, typography, spacing } from '../../lib/theme';

export default function SignInScreen() {
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [loading, setLoading] = useState<'apple' | 'google' | 'email' | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleApple = useCallback(async () => {
    try {
      setLoading('apple');
      const { createdSessionId, setActive: setActiveSession } = await appleOAuth();
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
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
      const { createdSessionId, setActive: setActiveSession } = await googleOAuth();
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setLoading(null);
    }
  }, [googleOAuth, router]);

  const handleEmail = useCallback(async () => {
    if (!isLoaded || !signIn || !setActive) return;
    setEmailError(null);
    try {
      setLoading('email');
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'errors' in err
          ? (err as { errors: Array<{ message: string }> }).errors[0]?.message
          : 'Sign in failed. Check your email and password.';
      setEmailError(msg ?? 'Sign in failed.');
    } finally {
      setLoading(null);
    }
  }, [isLoaded, signIn, setActive, email, password, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>Pour</Text>
      <Text style={styles.tagline}>Scan any bottle. Know in 2 seconds.</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.appleButton}
          onPress={handleApple}
          activeOpacity={0.85}
          disabled={!!loading}
        >
          {loading === 'apple' ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.appleText}> Continue with Apple</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogle}
          activeOpacity={0.85}
          disabled={!!loading}
        >
          {loading === 'google' ? (
            <ActivityIndicator color={colors.amber} />
          ) : (
            <Text style={styles.googleText}>G  Continue with Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowEmail((v) => !v)} disabled={!!loading}>
          <Text style={styles.emailLink}>Or use email</Text>
        </TouchableOpacity>

        {showEmail && (
          <View style={styles.emailForm}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            {emailError && <Text style={styles.error}>{emailError}</Text>}
            <TouchableOpacity
              style={[styles.emailButton, (!email || !password) && styles.emailButtonDisabled]}
              onPress={handleEmail}
              activeOpacity={0.85}
              disabled={!!loading || !email || !password}
            >
              {loading === 'email' ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.emailButtonText}>Sign in with email</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.legal}>
        By continuing you agree to our Terms and Privacy Policy.{'\n'}You must be 21 or older to use
        Pour.
      </Text>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
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
  emailLink: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  emailForm: {
    width: '100%',
    gap: spacing.sm,
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.base,
    color: colors.textPrimary,
    backgroundColor: 'transparent',
  },
  emailButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.amber,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonDisabled: {
    opacity: 0.5,
  },
  emailButtonText: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.background,
  },
  error: {
    fontSize: typography.xs,
    color: '#ff4d4f',
    textAlign: 'center',
  },
  legal: {
    marginTop: spacing.xl,
    fontSize: typography.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
});
