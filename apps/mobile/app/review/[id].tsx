import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { colors, textStyles, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';
import { FlavorWheel } from '../../components/FlavorWheel';
import type { FlavorProfile } from '@pour/shared';

type Step = 1 | 2 | 3;
type DrinkingContext = 'neat' | 'rocks' | 'cocktail';

const STAR_LABELS = ['', "Didn't enjoy", "It was okay", "Liked it", "Really liked it", "Outstanding"];

const CONTEXT_CHIPS: { key: DrinkingContext; label: string }[] = [
  { key: 'neat', label: 'Neat' },
  { key: 'rocks', label: 'Rocks' },
  { key: 'cocktail', label: 'Cocktail' },
];

const DEFAULT_FLAVOR: FlavorProfile = {
  sweet: 0.5, smoke: 0.2, fruit: 0.4, grain: 0.5, spice: 0.4, floral: 0.2, body: 0.5,
};

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [score, setScore] = useState(0);
  const [flavor, setFlavor] = useState<FlavorProfile>({ ...DEFAULT_FLAVOR });
  const [notes, setNotes] = useState('');
  const [drinkingContext, setDrinkingContext] = useState<DrinkingContext | null>(null);

  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: spirit } = useQuery({
    queryKey: ['spirit', id],
    queryFn: () => api.spirits.get(id),
  });

  // Pre-fill flavor wheel with community average once spirit loads
  useEffect(() => {
    if (spirit?.flavor) {
      setFlavor({ ...spirit.flavor });
    }
  }, [spirit?.flavor]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const submitMutation = useMutation({
    mutationFn: () =>
      api.ratings.submit({
        spiritId: id,
        score,
        flavor,
        notes: notes.trim() || null,
        drinkingContext: drinkingContext ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spirit', id] });
      Animated.sequence([
        Animated.timing(checkmarkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1700),
        Animated.timing(checkmarkOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => router.back());
    },
  });

  const handleStarPress = (s: number) => {
    setScore(s);
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => setStep(2), 1000);
  };

  // Success overlay
  if (submitMutation.isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View style={[styles.successContent, { opacity: checkmarkOpacity }]}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.successTitle}>Review posted.</Text>
          <Text style={styles.successSub}>Your taste profile just got sharper.</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header — spirit name + step dots */}
      <View style={styles.header}>
        <Text style={styles.spiritName} numberOfLines={1}>{spirit?.name ?? '—'}</Text>
        {spirit?.distilleryName ? (
          <Text style={styles.distillery} numberOfLines={1}>{spirit.distilleryName}</Text>
        ) : null}
        <View style={styles.stepDots}>
          {([1, 2, 3] as Step[]).map((n) => (
            <View key={n} style={[styles.stepDot, n <= step && styles.stepDotActive]} />
          ))}
        </View>
      </View>

      {/* Step 1: Star rating */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>How was it?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => handleStarPress(s)}
                style={styles.starButton}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={[styles.starIcon, s <= score && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {score > 0 && (
            <Text style={styles.starLabel}>{STAR_LABELS[score]}</Text>
          )}
          {score > 0 && (
            <Text style={styles.autoAdvanceHint}>Advancing…</Text>
          )}
          {score === 0 && (
            <Text style={styles.tapHint}>Tap a star to rate</Text>
          )}
        </View>
      )}

      {/* Step 2: Flavor wheel */}
      {step === 2 && (
        <ScrollView
          style={styles.scrollStep}
          contentContainerStyle={styles.scrollStepContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepTitle}>How did it taste?</Text>
          <Text style={styles.stepSub}>Adjust any that stand out.</Text>
          <View style={styles.wheelWrapper}>
            <FlavorWheel
              communityFlavor={spirit?.flavor ?? DEFAULT_FLAVOR}
              userFlavor={flavor}
              onUserFlavorChange={setFlavor}
              interactive
              size={240}
            />
          </View>
          <View style={styles.stepButtons}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setStep(3)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
              <Text style={styles.nextText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Step 3: Note + context chips */}
      {step === 3 && (
        <ScrollView
          style={styles.scrollStep}
          contentContainerStyle={styles.scrollStepContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepTitle}>Add a note?</Text>
          <Text style={styles.stepSub}>Totally optional.</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={(t) => setNotes(t.slice(0, 100))}
            placeholder="Describe what you taste..."
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            autoFocus={false}
          />
          <Text style={styles.charCount}>{notes.length}/100</Text>
          <View style={styles.chips}>
            {CONTEXT_CHIPS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.chip, drinkingContext === key && styles.chipActive]}
                onPress={() => setDrinkingContext(drinkingContext === key ? null : key)}
              >
                <Text style={[styles.chipText, drinkingContext === key && styles.chipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.submitButton, submitMutation.isPending && styles.submitButtonDisabled]}
            onPress={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitText}>Post Review</Text>
            )}
          </TouchableOpacity>
          {submitMutation.isError && (
            <Text style={styles.errorText}>Something went wrong. Try again.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  spiritName: {
    ...textStyles.title3,
    color: colors.textPrimary,
  },
  distillery: {
    ...textStyles.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.md,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.amber,
  },

  // Step containers
  stepContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  scrollStep: {
    flex: 1,
  },
  scrollStepContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  stepTitle: {
    ...textStyles.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stepSub: {
    ...textStyles.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Step 1: Stars
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing['2xl'],
  },
  starButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 48,
    color: colors.border,
    lineHeight: 56,
  },
  starActive: {
    color: colors.amber,
  },
  starLabel: {
    ...textStyles.headline,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  autoAdvanceHint: {
    ...textStyles.caption2,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  tapHint: {
    ...textStyles.footnote,
    color: colors.textTertiary,
    marginTop: spacing.xl,
  },

  // Step 2: Flavor wheel
  wheelWrapper: {
    marginTop: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  stepButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  skipText: {
    ...textStyles.callout,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    backgroundColor: colors.amber,
  },
  nextText: {
    ...textStyles.callout,
    color: colors.background,
    fontWeight: '700',
  },

  // Step 3: Notes
  notesInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...textStyles.body,
    color: colors.textPrimary,
    minHeight: 100,
    marginTop: spacing.lg,
  },
  charCount: {
    alignSelf: 'flex-end',
    ...textStyles.caption2,
    color: colors.textTertiary,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.amber,
    backgroundColor: 'rgba(200,150,42,0.12)',
  },
  chipText: {
    ...textStyles.footnote,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.amber,
    fontWeight: '600',
  },
  submitButton: {
    width: '100%',
    backgroundColor: colors.amber,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...textStyles.headline,
    color: colors.background,
    fontWeight: '700',
  },
  errorText: {
    ...textStyles.footnote,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Success screen
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successContent: {
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 80,
    color: colors.amber,
    textAlign: 'center',
    lineHeight: 96,
  },
  successTitle: {
    ...textStyles.title1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  successSub: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
