import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';

function MatchBadge({ score }: { score: number }) {
  return (
    <View style={styles.matchBadge}>
      <Text style={styles.matchScore}>{score}</Text>
      <Text style={styles.matchLabel}>MATCH</Text>
    </View>
  );
}

function SpiritCard({ spirit, onPress }: { spirit: { id: string; name: string; avgRating: number; imageUrl: string | null; matchScore: number }; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={spirit.imageUrl ?? require('../../assets/bottle-placeholder.png')}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={2}>{spirit.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardRating}>★ {spirit.avgRating.toFixed(1)}</Text>
        </View>
      </View>
      <MatchBadge score={spirit.matchScore} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: api.users.recommendations,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Your Match</Text>
      <Text style={styles.sectionSubtitle}>Based on your taste profile</Text>

      {isLoading ? (
        <View style={styles.loadingRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.card, styles.cardSkeleton]} />
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {recommendations?.map((spirit) => (
            <SpiritCard
              key={spirit.id}
              spirit={spirit}
              onPress={() => router.push(`/spirit/${spirit.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: spacing.lg, paddingBottom: spacing['2xl'] },
  sectionTitle: { fontSize: typography['2xl'], fontWeight: '700', color: colors.textPrimary, paddingHorizontal: spacing.md },
  sectionSubtitle: { fontSize: typography.sm, color: colors.textSecondary, paddingHorizontal: spacing.md, marginTop: 2, marginBottom: spacing.md },
  loadingRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm },
  horizontalScroll: { paddingLeft: spacing.md },
  card: {
    width: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  cardSkeleton: { height: 220, opacity: 0.4 },
  cardImage: { width: 160, height: 140 },
  cardContent: { padding: spacing.sm },
  cardName: { fontSize: typography.sm, fontWeight: '600', color: colors.textPrimary, lineHeight: 18 },
  cardMeta: { marginTop: 4 },
  cardRating: { fontSize: typography.xs, color: colors.amber },
  matchBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchScore: { fontSize: typography.sm, fontWeight: '800', color: colors.background, lineHeight: 16 },
  matchLabel: { fontSize: 7, fontWeight: '700', color: colors.background, letterSpacing: 0.5 },
});
