import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';

const FLAVOR_LABELS: Record<string, string> = {
  sweet: 'Sweet', smoke: 'Smoke', fruit: 'Fruit',
  grain: 'Grain', spice: 'Spice', floral: 'Floral', body: 'Body',
};

function MatchBadge({ score }: { score: number }) {
  const color = score >= 80 ? colors.amber : score >= 60 ? '#a16207' : colors.textTertiary;
  return (
    <View style={[styles.matchBadge, { backgroundColor: color }]}>
      <Text style={styles.matchScore}>{score}</Text>
      <Text style={styles.matchLabel}>MATCH</Text>
    </View>
  );
}

function FlavorWheel({ flavor }: { flavor: Record<string, number> }) {
  return (
    <View style={styles.flavorSection}>
      {Object.entries(FLAVOR_LABELS).map(([key, label]) => (
        <View key={key} style={styles.flavorRow}>
          <Text style={styles.flavorLabel}>{label}</Text>
          <View style={styles.flavorBarBg}>
            <View style={[styles.flavorBarFill, { width: `${Math.round((flavor[key] ?? 0) * 100)}%` }]} />
          </View>
          <Text style={styles.flavorValue}>{Math.round((flavor[key] ?? 0) * 100)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function SpiritDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: spirit, isLoading } = useQuery({
    queryKey: ['spirit', id],
    queryFn: () => api.spirits.get(id),
  });

  const addToCollection = useMutation({
    mutationFn: () => api.collections.add({ spiritId: id, bottleStatus: 'sealed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collection'] }),
  });

  const addToWishlist = useMutation({
    mutationFn: () => api.wishlists.add({ spiritId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.amber} />
      </View>
    );
  }

  if (!spirit) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Spirit not found</Text>
      </View>
    );
  }

  const flavor = {
    sweet: spirit.flavor.sweet, smoke: spirit.flavor.smoke, fruit: spirit.flavor.fruit,
    grain: spirit.flavor.grain, spice: spirit.flavor.spice, floral: spirit.flavor.floral,
    body: spirit.flavor.body,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero image */}
      <View style={styles.hero}>
        <Image
          source={spirit.imageUrl ?? require('../../assets/bottle-placeholder.png')}
          style={styles.heroImage}
          contentFit="cover"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.spiritName}>{spirit.name}</Text>
          <Text style={styles.distilleryName}>{spirit.distillery?.name ?? ''}</Text>
        </View>
        {spirit.matchScore !== null && spirit.matchScore !== undefined && (
          <View style={styles.matchPosition}>
            <MatchBadge score={spirit.matchScore} />
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>★ {spirit.avgRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>{spirit.ratingCount} ratings</Text>
        </View>
        {spirit.abv && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{spirit.abv}%</Text>
            <Text style={styles.statLabel}>ABV</Text>
          </View>
        )}
        {spirit.ageStatement && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{spirit.ageStatement} yr</Text>
            <Text style={styles.statLabel}>Age</Text>
          </View>
        )}
        {spirit.category && (
          <View style={styles.stat}>
            <Text style={styles.statValue} numberOfLines={1}>{spirit.category.name}</Text>
            <Text style={styles.statLabel}>Category</Text>
          </View>
        )}
      </View>

      {/* Flavor profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flavor Profile</Text>
        <FlavorWheel flavor={flavor} />
      </View>

      {/* Description */}
      {spirit.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{spirit.description}</Text>
        </View>
      )}

      {/* Write review CTA */}
      <TouchableOpacity
        style={styles.reviewButton}
        onPress={() => router.push(`/review/${id}`)}
      >
        <Text style={styles.reviewButtonText}>Write a Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.textSecondary, fontSize: typography.base },
  hero: { position: 'relative', height: 300 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroContent: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: 70 },
  spiritName: { fontSize: typography['2xl'], fontWeight: '800', color: '#fff', lineHeight: 30 },
  distilleryName: { fontSize: typography.base, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  matchPosition: { position: 'absolute', top: spacing.md, right: spacing.md },
  matchBadge: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  matchScore: { fontSize: typography.xl, fontWeight: '900', color: colors.background, lineHeight: 24 },
  matchLabel: { fontSize: 7, fontWeight: '800', color: colors.background, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { fontSize: typography.base, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  flavorSection: {},
  flavorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  flavorLabel: { width: 52, fontSize: typography.sm, color: colors.textSecondary },
  flavorBarBg: { flex: 1, height: 6, backgroundColor: colors.surface, borderRadius: radius.full, overflow: 'hidden' },
  flavorBarFill: { height: '100%', backgroundColor: colors.amber, borderRadius: radius.full },
  flavorValue: { width: 28, textAlign: 'right', fontSize: typography.xs, color: colors.textSecondary },
  description: { fontSize: typography.base, color: colors.textSecondary, lineHeight: 22 },
  reviewButton: {
    margin: spacing.md,
    backgroundColor: colors.amber,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  reviewButtonText: { color: colors.background, fontWeight: '700', fontSize: typography.base },
});
