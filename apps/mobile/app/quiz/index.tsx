import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';

type QuizState = {
  categories: string[];
  flavorDirection: string;
  smokePreference: string;
  agePreference: string;
  sweetnessPreference: string;
  proofPreference: string;
  priceRange: string;
  drinkingContext: string[];
};

const QUESTIONS = [
  {
    key: 'categories',
    question: "What do you drink?",
    multi: true,
    options: [
      { value: 'Bourbon', label: 'Bourbon' },
      { value: 'Scotch', label: 'Scotch' },
      { value: 'Irish', label: 'Irish Whiskey' },
      { value: 'Japanese', label: 'Japanese Whisky' },
      { value: 'Rye', label: 'Rye' },
      { value: 'Tequila', label: 'Tequila' },
      { value: 'Rum', label: 'Rum' },
      { value: 'Gin', label: 'Gin' },
      { value: 'Vodka', label: 'Vodka' },
      { value: 'Starting', label: "Just starting" },
    ],
  },
  {
    key: 'flavorDirection',
    question: "What do you notice first in something you love?",
    multi: false,
    options: [
      { value: 'sweet', label: '🍯 Sweet warmth', sub: 'vanilla, honey, caramel' },
      { value: 'bold', label: '🌶 Bold and spicy', sub: 'pepper, cinnamon, oak' },
      { value: 'fruity', label: '🍊 Fruity and bright', sub: 'citrus, orchard, tropical' },
      { value: 'clean', label: '🌾 Clean and smooth', sub: 'grain, malt, light body' },
    ],
  },
  {
    key: 'smokePreference',
    question: "Smoke: love it or avoid it?",
    multi: false,
    options: [
      { value: 'love', label: "I love it" },
      { value: 'little', label: "A little is nice" },
      { value: 'none', label: "Prefer none" },
      { value: 'unknown', label: "What is peat?" },
    ],
  },
  {
    key: 'agePreference',
    question: "When it comes to age...",
    multi: false,
    options: [
      { value: 'young', label: "Young and vibrant" },
      { value: 'aged', label: "Love well-aged" },
      { value: 'either', label: "Either is great" },
    ],
  },
  {
    key: 'sweetnessPreference',
    question: "Sweetness level?",
    multi: false,
    options: [
      { value: 'sweeter', label: "The sweeter the better" },
      { value: 'balanced', label: "Balance is key" },
      { value: 'dry', label: "Bone dry please" },
    ],
  },
  {
    key: 'proofPreference',
    question: "What proof do you prefer?",
    multi: false,
    options: [
      { value: 'easy', label: "Easy sipping (under 90°)" },
      { value: 'standard', label: "Standard proof" },
      { value: 'cask', label: "Cask strength all day" },
    ],
  },
  {
    key: 'priceRange',
    question: "Comfortable price range?",
    multi: false,
    options: [
      { value: 'under40', label: "Under $40" },
      { value: '40to80', label: "$40 – $80" },
      { value: '80to150', label: "$80 – $150" },
      { value: 'nolimit', label: "No limit" },
    ],
  },
  {
    key: 'drinkingContext',
    question: "How do you drink?",
    multi: true,
    options: [
      { value: 'neat', label: "Neat or on the rocks" },
      { value: 'cocktails', label: "Cocktails" },
      { value: 'collecting', label: "Collecting" },
      { value: 'all', label: "All of the above" },
    ],
  },
];

const TOTAL = QUESTIONS.length;

export default function QuizScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizState>>({
    categories: [],
    drinkingContext: [],
  });

  const question = QUESTIONS[step];

  const submitMutation = useMutation({
    mutationFn: () => api.users.saveTasteProfile(answers as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      router.replace('/(tabs)');
    },
  });

  const toggle = (key: string, value: string, multi: boolean) => {
    if (multi) {
      const current = (answers[key as keyof QuizState] as string[]) ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      setAnswers((prev) => ({ ...prev, [key]: next }));
    } else {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      setTimeout(() => {
        if (step < TOTAL - 1) setStep((s) => s + 1);
        else submitMutation.mutate();
      }, 150);
    }
  };

  const canAdvance = question.multi
    ? ((answers[question.key as keyof QuizState] as string[]) ?? []).length > 0
    : false;

  const isSelected = (value: string) => {
    const current = answers[question.key as keyof QuizState];
    if (Array.isArray(current)) return current.includes(value);
    return current === value;
  };

  if (submitMutation.isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.amber} />
        <Text style={styles.loadingText}>Building your taste profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{question.question}</Text>

        <View style={styles.options}>
          {question.options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, isSelected(opt.value) && styles.optionSelected]}
              onPress={() => toggle(question.key, opt.value, question.multi)}
              activeOpacity={0.75}
            >
              <Text style={[styles.optionLabel, isSelected(opt.value) && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              {'sub' in opt && opt.sub && (
                <Text style={[styles.optionSub, isSelected(opt.value) && styles.optionSubSelected]}>
                  {opt.sub}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {question.multi && (
        <TouchableOpacity
          style={[styles.nextButton, !canAdvance && styles.nextButtonDisabled]}
          disabled={!canAdvance}
          onPress={() => {
            if (step < TOTAL - 1) setStep((s) => s + 1);
            else submitMutation.mutate();
          }}
        >
          <Text style={styles.nextText}>{step === TOTAL - 1 ? 'Finish →' : 'Next →'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontSize: typography.base },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface },
  dotActive: { backgroundColor: colors.amber },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'] },
  question: { fontSize: typography['2xl'], fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xl, lineHeight: 34 },
  options: { gap: spacing.sm },
  option: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.amber + '20', borderColor: colors.amber },
  optionLabel: { fontSize: typography.base, fontWeight: '600', color: colors.textPrimary },
  optionLabelSelected: { color: colors.amber },
  optionSub: { fontSize: typography.sm, color: colors.textTertiary, marginTop: 2 },
  optionSubSelected: { color: colors.amberDark },
  nextButton: {
    margin: spacing.md,
    backgroundColor: colors.amber,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  nextButtonDisabled: { opacity: 0.4 },
  nextText: { color: colors.background, fontWeight: '700', fontSize: typography.base },
  skipButton: { alignSelf: 'center', paddingBottom: spacing.xl },
  skipText: { color: colors.textTertiary, fontSize: typography.sm },
});
