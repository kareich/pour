import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, textStyles, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { useQuizResultsStore } from '../../store/quiz';
import { computeFlavorProfile, determinePersona } from '../../lib/quiz-logic';
import type { QuizAnswers } from '../../lib/quiz-logic';

const { width } = Dimensions.get('window');

// ── Question definitions ─────────────────────────────────────────────────────

type Option = { value: string; label: string; icon?: string; sub?: string };
type Question = {
  key: keyof QuizAnswers;
  question: string;
  sub?: string;
  multi: boolean;
  layout: 'grid3' | 'grid2' | 'list' | 'grid3-large';
  autoAdvance: boolean;
  options: Option[];
  cta?: string;
};

const QUESTIONS: Question[] = [
  {
    key: 'categories',
    question: 'What do you drink?',
    sub: 'Pick all that apply',
    multi: true,
    layout: 'grid3',
    autoAdvance: false,
    options: [
      { value: 'Bourbon',  label: 'Bourbon',  icon: '🥃' },
      { value: 'Scotch',   label: 'Scotch',   icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
      { value: 'Irish',    label: 'Irish',    icon: '☘️' },
      { value: 'Japanese', label: 'Japanese', icon: '🗾' },
      { value: 'Rye',      label: 'Rye',      icon: '🌾' },
      { value: 'Tequila',  label: 'Tequila',  icon: '🌵' },
      { value: 'Rum',      label: 'Rum',      icon: '🏝️' },
      { value: 'Gin',      label: 'Gin',      icon: '🌿' },
      { value: 'Vodka',    label: 'Vodka',    icon: '❄️' },
      { value: 'Starting', label: 'Just starting', icon: '👋' },
    ],
  },
  {
    key: 'flavorDirection',
    question: 'What do you notice first?',
    sub: 'In something you love',
    multi: false,
    layout: 'grid2',
    autoAdvance: true,
    options: [
      { value: 'sweet',  label: 'Sweet warmth',    icon: '🍯', sub: 'vanilla · honey · caramel' },
      { value: 'bold',   label: 'Bold & spicy',    icon: '🌶', sub: 'pepper · cinnamon · oak' },
      { value: 'fruity', label: 'Fruity & bright', icon: '🍊', sub: 'citrus · orchard · tropical' },
      { value: 'clean',  label: 'Clean & smooth',  icon: '🌾', sub: 'grain · malt · light body' },
    ],
  },
  {
    key: 'smokePreference',
    question: 'Smoke: love it\nor avoid it?',
    multi: false,
    layout: 'list',
    autoAdvance: true,
    options: [
      { value: 'love',    label: '🔥  I love it',          sub: 'The peatier the better' },
      { value: 'little',  label: '💨  A little is nice',   sub: 'Subtle hints welcome' },
      { value: 'none',    label: '✋  Prefer none',         sub: 'Keep it clean' },
      { value: 'unknown', label: '🤷  What is peat?',      sub: 'New to this' },
    ],
  },
  {
    key: 'priceRange',
    question: 'Comfortable\nprice range?',
    multi: false,
    layout: 'list',
    autoAdvance: true,
    options: [
      { value: 'under40', label: 'Under $40',  sub: 'Everyday sipping' },
      { value: '40to80',  label: '$40 – $80',  sub: 'Weekend staple' },
      { value: '80to150', label: '$80 – $150', sub: 'Occasion bottle' },
      { value: 'nolimit', label: 'No limit',   sub: 'Worth every dollar' },
    ],
  },
  {
    key: 'drinkingStyle',
    question: 'How do you\ndrink?',
    multi: false,
    layout: 'grid2',
    autoAdvance: true,
    options: [
      { value: 'neat',       label: 'Neat or rocks',   icon: '🧊', sub: 'Pure expression' },
      { value: 'cocktails',  label: 'Cocktails',       icon: '🍸', sub: 'Mixed & crafted' },
      { value: 'collecting', label: 'Collecting',      icon: '📦', sub: 'Shelf envy' },
      { value: 'social',     label: 'Social sipping',  icon: '🥂', sub: 'Sharing moments' },
    ],
  },
  {
    key: 'fruitNotes',
    question: 'Fruit notes\nyou reach for?',
    multi: false,
    layout: 'grid3-large',
    autoAdvance: true,
    options: [
      { value: 'citrus',   label: 'Citrus',   icon: '🍋', sub: 'lemon · orange' },
      { value: 'tropical', label: 'Tropical', icon: '🍍', sub: 'mango · pineapple' },
      { value: 'stone',    label: 'Stone',    icon: '🍑', sub: 'peach · cherry' },
    ],
  },
  {
    key: 'discoveryStyle',
    question: 'How do you\nexplore spirits?',
    multi: false,
    layout: 'grid3-large',
    autoAdvance: true,
    options: [
      { value: 'classic',  label: 'Classics first', icon: '📚', sub: 'Proven greats' },
      { value: 'regional', label: 'By region',      icon: '🗺️', sub: 'Origin matters' },
      { value: 'global',   label: 'Anything goes',  icon: '🌍', sub: 'Wide open' },
    ],
  },
  {
    key: 'primaryGoal',
    question: 'What\'s your\nprimary goal?',
    sub: 'Pick all that apply',
    multi: true,
    layout: 'list',
    autoAdvance: false,
    cta: 'Build My Taste Profile →',
    options: [
      { value: 'explore',    label: '🔍  Discover new spirits', sub: 'Find hidden gems' },
      { value: 'collecting', label: '📦  Build my collection',  sub: 'Curate a shelf' },
      { value: 'entertain',  label: '🥂  Impress guests',       sub: 'Host better' },
      { value: 'gift',       label: '🎁  Give great gifts',     sub: 'Never miss' },
    ],
  },
];

const TOTAL = QUESTIONS.length;

const emptyAnswers = (): Partial<QuizAnswers> => ({ categories: [], primaryGoal: [] });

// ── Option card components ───────────────────────────────────────────────────

function OptionCard({
  option,
  selected,
  onPress,
  large = false,
  flex = false,
}: {
  option: Option;
  selected: boolean;
  onPress: () => void;
  large?: boolean;
  flex?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.option,
        selected && styles.optionSelected,
        large && styles.optionLarge,
        flex && styles.optionFlex,
      ]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {option.icon && <Text style={styles.optionIcon}>{option.icon}</Text>}
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]} numberOfLines={2}>
        {option.label}
      </Text>
      {option.sub && (
        <Text style={[styles.optionSub, selected && styles.optionSubSelected]} numberOfLines={2}>
          {option.sub}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function ListOptionCard({
  option,
  selected,
  onPress,
}: {
  option: Option;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.listOption, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={styles.listOptionMain}>
        <Text style={[styles.listOptionLabel, selected && styles.optionLabelSelected]}>
          {option.label}
        </Text>
        {option.sub && (
          <Text style={[styles.listOptionSub, selected && styles.optionSubSelected]}>
            {option.sub}
          </Text>
        )}
      </View>
      {selected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function QuizScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setQuizCompleted } = useAuthStore();
  const setResults = useQuizResultsStore((s) => s.setResults);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>(emptyAnswers());

  const question = QUESTIONS[step];

  const submitMutation = useMutation({
    mutationFn: (data: Partial<QuizAnswers>) =>
      api.users.saveTasteProfile(data as Record<string, unknown>),
    onSuccess: (data, variables) => {
      const fullAnswers = variables as QuizAnswers;
      const flavorProfile = computeFlavorProfile(fullAnswers);
      const persona = determinePersona(fullAnswers);
      const matchCount = (data as { matchCount?: number }).matchCount ?? 0;

      setResults({ personaName: persona.name, personaTagline: persona.tagline, flavorProfile, matchCount });
      setQuizCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      router.replace('/quiz/reveal');
    },
  });

  const isSelected = (value: string): boolean => {
    const current = answers[question.key as keyof QuizAnswers];
    if (Array.isArray(current)) return current.includes(value);
    return current === value;
  };

  const toggle = (value: string) => {
    const { key, multi, autoAdvance } = question;

    if (multi) {
      const current = (answers[key as keyof QuizAnswers] as string[]) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers((prev) => ({ ...prev, [key]: next }));
    } else {
      const updated = { ...answers, [key]: value };
      setAnswers(updated);
      if (autoAdvance) {
        setTimeout(() => advanceOrSubmit(updated), 180);
      }
    }
  };

  const advanceOrSubmit = (currentAnswers = answers) => {
    if (step < TOTAL - 1) {
      setStep((s) => s + 1);
    } else {
      submitMutation.mutate(currentAnswers);
    }
  };

  const canAdvance = question.multi
    ? ((answers[question.key as keyof QuizAnswers] as string[]) ?? []).length > 0
    : false;

  if (submitMutation.isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accentAmber} />
        <Text style={styles.loadingTitle}>Building your taste profile…</Text>
        <Text style={styles.loadingBody}>This takes just a moment</Text>
      </View>
    );
  }

  const renderOptions = () => {
    switch (question.layout) {
      case 'grid3':
        return (
          <View style={styles.grid3}>
            {question.options.map((opt) => (
              <OptionCard
                key={opt.value}
                option={opt}
                selected={isSelected(opt.value)}
                onPress={() => toggle(opt.value)}
              />
            ))}
          </View>
        );
      case 'grid2':
        return (
          <View style={styles.grid2}>
            {question.options.map((opt) => (
              <OptionCard
                key={opt.value}
                option={opt}
                selected={isSelected(opt.value)}
                onPress={() => toggle(opt.value)}
                large
              />
            ))}
          </View>
        );
      case 'grid3-large':
        return (
          <View style={styles.grid3Large}>
            {question.options.map((opt) => (
              <OptionCard
                key={opt.value}
                option={opt}
                selected={isSelected(opt.value)}
                onPress={() => toggle(opt.value)}
                flex
              />
            ))}
          </View>
        );
      case 'list':
      default:
        return (
          <View style={styles.listOptions}>
            {question.options.map((opt) => (
              <ListOptionCard
                key={opt.value}
                option={opt}
                selected={isSelected(opt.value)}
                onPress={() => toggle(opt.value)}
              />
            ))}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < step && styles.progressDotDone,
              i === step && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.question}>{question.question}</Text>
        {question.sub && <Text style={styles.questionSub}>{question.sub}</Text>}
        {renderOptions()}
      </ScrollView>

      {/* CTA for multi-select questions */}
      {question.multi && (
        <TouchableOpacity
          style={[styles.nextBtn, !canAdvance && styles.nextBtnDisabled]}
          disabled={!canAdvance || submitMutation.isPending}
          onPress={() => advanceOrSubmit()}
        >
          <Text style={styles.nextBtnText}>
            {question.cta ?? (step === TOTAL - 1 ? 'Finish →' : 'Next →')}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const GAP = spacing.sm;
const GRID3_W = (width - spacing.xl * 2 - GAP * 2) / 3;
const GRID2_W = (width - spacing.xl * 2 - GAP) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 56,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  loadingTitle: {
    ...textStyles.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loadingBody: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bgSurface2,
  },
  progressDotDone: {
    backgroundColor: colors.accentAmberLight,
    opacity: 0.5,
  },
  progressDotActive: {
    backgroundColor: colors.accentAmber,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  question: {
    ...textStyles.title1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  questionSub: {
    ...textStyles.callout,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    marginTop: spacing.md,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    marginTop: spacing.md,
  },
  grid3Large: {
    flexDirection: 'row',
    gap: GAP,
    marginTop: spacing.md,
  },
  listOptions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  option: {
    width: GRID3_W,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface1,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 4,
  },
  optionLarge: {
    width: GRID2_W,
    paddingVertical: spacing.lg,
  },
  optionFlex: {
    flex: 1,
    flexBasis: 0,
    paddingVertical: spacing.lg,
  },
  optionSelected: {
    backgroundColor: colors.accentAmber + '22',
    borderColor: colors.accentAmber,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  optionLabel: {
    ...textStyles.footnote,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: colors.accentAmber,
  },
  optionSub: {
    ...textStyles.caption2,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  optionSubSelected: {
    color: colors.accentAmberLight,
    opacity: 0.85,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface1,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 64,
  },
  listOptionMain: {
    flex: 1,
    gap: 2,
  },
  listOptionLabel: {
    ...textStyles.headline,
    color: colors.textPrimary,
  },
  listOptionSub: {
    ...textStyles.footnote,
    color: colors.textTertiary,
  },
  checkmark: {
    fontSize: 18,
    color: colors.accentAmber,
    marginLeft: spacing.sm,
  },
  nextBtn: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    height: 52,
    backgroundColor: colors.accentAmber,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.38,
  },
  nextBtnText: {
    ...textStyles.headline,
    color: colors.bgPrimary,
    fontWeight: '700',
  },
  skipBtn: {
    alignSelf: 'center',
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  skipText: {
    ...textStyles.footnote,
    color: colors.textTertiary,
  },
});
