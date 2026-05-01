import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';

export default function AgeGateScreen() {
  const router = useRouter();
  const { setAgeVerified } = useAuthStore();

  const handleYes = () => {
    setAgeVerified(true);
    router.replace('/(auth)/sign-in');
  };

  const handleNo = () => {
    // No path forward — app store compliance
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>Are you 21 or older?</Text>
      <TouchableOpacity style={styles.yesButton} onPress={handleYes} activeOpacity={0.85}>
        <Text style={styles.yesText}>YES</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.noButton} onPress={handleNo} activeOpacity={0.85}>
        <Text style={styles.noText}>NO</Text>
      </TouchableOpacity>
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
  question: {
    fontSize: typography['3xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    fontWeight: '600',
  },
  yesButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.amber,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  yesText: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.background,
    letterSpacing: 1,
  },
  noButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noText: {
    fontSize: typography.lg,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
