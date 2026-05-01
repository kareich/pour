import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, textStyles, spacing, radius } from '../../lib/theme';
import { useQuizResultsStore } from '../../store/quiz';
import { FlavorWheel } from '../../components/FlavorWheel';
import type { FlavorProfile } from '../../components/FlavorWheel';

const EMPTY_PROFILE: FlavorProfile = {
  sweet: 0.5, smoke: 0.3, fruit: 0.4, grain: 0.5, spice: 0.4, floral: 0.35, body: 0.55,
};

export default function RevealScreen() {
  const router = useRouter();
  const results = useQuizResultsStore((s) => s.results);

  const persona = results?.personaName ?? 'The Spirit Explorer';
  const tagline = results?.personaTagline ?? 'Your taste, your journey';
  const profile = results?.flavorProfile ?? EMPTY_PROFILE;
  const matchCount = results?.matchCount ?? 0;

  const handleScanFirst = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/quiz/scan-prompt');
  };

  const handleBrowse = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>YOUR TASTE PROFILE</Text>
      </View>

      {/* Persona */}
      <Text style={styles.persona}>{persona}</Text>
      <Text style={styles.tagline}>{tagline}</Text>

      {/* Radar chart */}
      <View style={styles.chartContainer}>
        <FlavorWheel communityFlavor={profile} size={260} />
      </View>

      {/* Match count */}
      {matchCount > 0 && (
        <View style={styles.matchBox}>
          <Text style={styles.matchCount}>{matchCount}</Text>
          <Text style={styles.matchLabel}>
            spirits that match{'\n'}your taste profile
          </Text>
        </View>
      )}

      {/* Profile axes summary */}
      <View style={styles.axisGrid}>
        {Object.entries(profile).map(([key, val]) => (
          <View key={key} style={styles.axisItem}>
            <View style={styles.axisBar}>
              <View style={[styles.axisBarFill, { width: `${Math.round(val * 100)}%` }]} />
            </View>
            <Text style={styles.axisLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
          </View>
        ))}
      </View>

      {/* CTAs */}
      <TouchableOpacity style={styles.primaryCta} onPress={handleScanFirst}>
        <Text style={styles.primaryCtaText}>Scan Your First Bottle</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryCta} onPress={handleBrowse}>
        <Text style={styles.secondaryCtaText}>Browse Recommendations →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    paddingTop: 64,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.accentAmber + '22',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accentAmber + '44',
  },
  badgeText: {
    ...textStyles.caption2,
    color: colors.accentAmber,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  persona: {
    ...textStyles.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tagline: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  matchBox: {
    backgroundColor: colors.bgSurface1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.accentAmber + '33',
  },
  matchCount: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accentAmber,
    lineHeight: 56,
  },
  matchLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  axisGrid: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  axisItem: {
    gap: 4,
  },
  axisBar: {
    height: 4,
    backgroundColor: colors.bgSurface2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  axisBarFill: {
    height: '100%',
    backgroundColor: colors.accentAmber,
    borderRadius: 2,
  },
  axisLabel: {
    ...textStyles.caption2,
    color: colors.textTertiary,
  },
  primaryCta: {
    width: '100%',
    height: 54,
    backgroundColor: colors.accentAmber,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  primaryCtaText: {
    ...textStyles.headline,
    color: colors.bgPrimary,
    fontWeight: '700',
  },
  secondaryCta: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accentAmber + '66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    ...textStyles.headline,
    color: colors.accentAmber,
    fontWeight: '600',
  },
});
