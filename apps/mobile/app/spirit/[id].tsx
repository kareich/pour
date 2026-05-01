import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { colors, typography, spacing, radius, textStyles } from '../../lib/theme';
import { api } from '../../lib/api';
import { MatchScoreBadge } from '../../components/MatchScoreBadge';
import { FlavorWheel } from '../../components/FlavorWheel';
import type { FlavorProfile } from '../../components/FlavorWheel';

function StarRow({ score }: { score: number }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Text key={i} style={{ fontSize: 14, color: i < full ? colors.accentAmber : half && i === full ? colors.accentAmber : colors.textTertiary }}>
          {i < full ? '★' : half && i === full ? '⯨' : '☆'}
        </Text>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: { score: number; notes: string | null; createdAt: string; user: { displayName: string } } }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{review.user.displayName}</Text>
        <StarRow score={review.score} />
        <Text style={styles.reviewScore}>{review.score.toFixed(1)}</Text>
      </View>
      {review.notes ? <Text style={styles.reviewNotes} numberOfLines={3}>{review.notes}</Text> : null}
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

  const { data: ratingsData } = useQuery({
    queryKey: ['spirit-ratings', id],
    queryFn: () => api.spirits.ratings(id, 1),
    enabled: !!id,
  });

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.users.me(),
  });

  const { data: collectionData } = useQuery({
    queryKey: ['collection'],
    queryFn: () => api.collections.list(),
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.wishlists.list(),
  });

  const isInCollection = collectionData?.some(e => e.spiritId === id) ?? false;
  const isInWishlist = wishlistData?.some(e => e.spiritId === id) ?? false;

  const collectionEntry = collectionData?.find(e => e.spiritId === id);

  const addToCollection = useMutation({
    mutationFn: () => api.collections.add({ spiritId: id, bottleStatus: 'sealed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collection'] }),
  });

  const removeFromCollection = useMutation({
    mutationFn: () => api.collections.remove(collectionEntry!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collection'] }),
  });

  const addToWishlist = useMutation({
    mutationFn: () => api.wishlists.add({ spiritId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const wishlistEntry = wishlistData?.find(e => e.spiritId === id);
  const removeFromWishlist = useMutation({
    mutationFn: () => api.wishlists.remove(wishlistEntry!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accentAmber} />
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

  const userFlavor: FlavorProfile | undefined = me?.tasteProfile
    ? {
        sweet: me.tasteProfile.sweet,
        smoke: me.tasteProfile.smoke,
        fruit: me.tasteProfile.fruit,
        grain: me.tasteProfile.grain,
        spice: me.tasteProfile.spice,
        floral: me.tasteProfile.floral,
        body: me.tasteProfile.body,
      }
    : undefined;

  const recentReviews = ratingsData?.data.slice(0, 5) ?? [];

  return (
    <View style={styles.root}>
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
            <Text style={styles.distilleryName}>{spirit.distilleryName}</Text>
          </View>
          {spirit.matchScore != null ? (
            <View style={styles.matchPosition}>
              <MatchScoreBadge score={spirit.matchScore} size={64} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.quizPrompt}
              onPress={() => router.push('/quiz')}
            >
              <Text style={styles.quizPromptText}>Take the quiz</Text>
              <Text style={styles.quizPromptSub}>to see your match</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Community rating + stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <StarRow score={spirit.avgRating} />
            <Text style={styles.statLabel}>{spirit.ratingCount} ratings</Text>
          </View>
          {spirit.abv != null && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{spirit.abv}%</Text>
              <Text style={styles.statLabel}>ABV</Text>
            </View>
          )}
          {spirit.ageStatement != null && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{spirit.ageStatement} yr</Text>
              <Text style={styles.statLabel}>Age</Text>
            </View>
          )}
          {spirit.category ? (
            <View style={styles.stat}>
              <Text style={styles.statValue} numberOfLines={1}>{spirit.category}</Text>
              <Text style={styles.statLabel}>Category</Text>
            </View>
          ) : null}
        </View>

        {/* Flavor wheel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flavor Profile</Text>
          <View style={styles.wheelWrap}>
            <FlavorWheel
              communityFlavor={spirit.flavor}
              userFlavor={userFlavor}
              size={240}
            />
          </View>
        </View>

        {/* Description */}
        {spirit.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{spirit.description}</Text>
          </View>
        ) : null}

        {/* Reviews */}
        {recentReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {recentReviews.map(r => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </View>
        )}

        {/* Write a Review */}
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => router.push(`/review/${id}`)}
        >
          <Text style={styles.reviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky action buttons */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.actionBtn, isInCollection && styles.actionBtnActive]}
          onPress={() => isInCollection ? removeFromCollection.mutate() : addToCollection.mutate()}
          disabled={addToCollection.isPending || removeFromCollection.isPending}
        >
          <Text style={[styles.actionBtnText, isInCollection && styles.actionBtnTextActive]}>
            {isInCollection ? '✓ In Collection' : '+ Collection'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, isInWishlist && styles.actionBtnActive]}
          onPress={() => isInWishlist ? removeFromWishlist.mutate() : addToWishlist.mutate()}
          disabled={addToWishlist.isPending || removeFromWishlist.isPending}
        >
          <Text style={[styles.actionBtnText, isInWishlist && styles.actionBtnTextActive]}>
            {isInWishlist ? '♥ Wishlisted' : '♡ Wishlist'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  container: { flex: 1 },
  content: { paddingBottom: 120 },
  loading: { flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.textSecondary, fontSize: typography.base },

  hero: { position: 'relative', height: 320 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: 80 },
  spiritName: { ...textStyles.title1, color: colors.textPrimary, lineHeight: 32 },
  distilleryName: { ...textStyles.footnote, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  matchPosition: { position: 'absolute', top: spacing.md, right: spacing.md },
  quizPrompt: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(200,150,42,0.85)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  quizPromptText: { color: colors.bgPrimary, fontWeight: '700', fontSize: typography.xs },
  quizPromptSub: { color: colors.bgPrimary, fontSize: 10, opacity: 0.8 },

  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSurface1,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: 4 },
  statValue: { ...textStyles.headline, color: colors.textPrimary },
  statLabel: { ...textStyles.caption2, color: colors.textSecondary, marginTop: 2 },

  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionTitle: { ...textStyles.title3, color: colors.textPrimary, marginBottom: spacing.sm },
  wheelWrap: { alignItems: 'center' },
  description: { ...textStyles.body, color: colors.textSecondary, lineHeight: 22 },

  reviewCard: {
    backgroundColor: colors.bgSurface1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  reviewUser: { ...textStyles.footnote, color: colors.textPrimary, fontWeight: '600', flex: 1 },
  reviewScore: { ...textStyles.footnote, color: colors.textSecondary },
  reviewNotes: { ...textStyles.footnote, color: colors.textSecondary, lineHeight: 18 },

  reviewButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accentAmber,
    alignItems: 'center',
  },
  reviewButtonText: { color: colors.accentAmber, fontWeight: '700', fontSize: typography.base },

  stickyBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bgSurface1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface2,
    alignItems: 'center',
  },
  actionBtnActive: {
    backgroundColor: colors.accentAmber,
  },
  actionBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: typography.sm,
  },
  actionBtnTextActive: {
    color: colors.bgPrimary,
  },
});
