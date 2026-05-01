import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { colors, textStyles, spacing, radius } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: '🥃',
    headline: 'Your personal\nspirits guide',
    sub: 'Scan any bottle. Know in 2 seconds if it\'s worth buying.',
  },
  {
    id: '2',
    icon: '✨',
    headline: 'Tailored to\nyour taste',
    sub: 'Answer 8 questions. Get a taste profile matched perfectly to you.',
  },
];

const AUTO_ADVANCE_MS = 3000;

export default function WelcomeScreen() {
  const router = useRouter();
  const { setSeenWelcome } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFinish = () => {
    setSeenWelcome(true);
    router.replace('/(auth)/sign-in');
  };

  const advance = (to: number) => {
    if (to >= SLIDES.length) {
      handleFinish();
      return;
    }
    listRef.current?.scrollToIndex({ index: to, animated: true });
    setActiveIndex(to);
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => advance(activeIndex + 1), AUTO_ADVANCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={handleFinish} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.headline}>{item.headline}</Text>
            <Text style={styles.sub}>{item.sub}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.cta} onPress={() => advance(activeIndex + 1)}>
        <Text style={styles.ctaText}>
          {activeIndex === SLIDES.length - 1 ? 'Get Started →' : 'Next →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 60,
    paddingBottom: 48,
  },
  skip: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  skipText: {
    ...textStyles.callout,
    color: colors.textSecondary,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: {
    fontSize: 96,
    marginBottom: spacing.xl,
  },
  headline: {
    ...textStyles.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sub: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface2,
  },
  dotActive: {
    backgroundColor: colors.accentAmber,
    width: 24,
  },
  cta: {
    marginHorizontal: spacing.xl,
    height: 52,
    backgroundColor: colors.accentAmber,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...textStyles.headline,
    color: colors.bgPrimary,
    fontWeight: '700',
  },
});
