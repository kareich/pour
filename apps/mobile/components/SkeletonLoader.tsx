import { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

// ── Shimmer atom ─────────────────────────────────────────────────────────────

function useShimmer() {
  const opacity = new Animated.Value(0.35);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return opacity;
}

interface BoxProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  opacity: Animated.Value;
  style?: object;
}

function ShimmerBox({ width, height, borderRadius = radius.sm, opacity, style }: BoxProps) {
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.bgSurface2,
        },
        { opacity },
        style,
      ]}
    />
  );
}

// ── BottleCard grid skeleton ─────────────────────────────────────────────────

export function BottleCardGridSkeleton() {
  const opacity = useShimmer();
  const cardWidth = '48%';
  const imageHeight = 200; // approx 1:2.5 ratio

  return (
    <View style={styles.gridCard} accessibilityLabel="Loading bottle card">
      <ShimmerBox width="100%" height={imageHeight} borderRadius={0} opacity={opacity} />
      <View style={styles.gridMeta}>
        <ShimmerBox width="85%" height={14} opacity={opacity} />
        <ShimmerBox width="55%" height={11} opacity={opacity} style={{ marginTop: 6 }} />
        <ShimmerBox width="30%" height={10} opacity={opacity} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function BottleCardGridSkeletonRow() {
  return (
    <View style={styles.gridRow}>
      <BottleCardGridSkeleton />
      <BottleCardGridSkeleton />
    </View>
  );
}

// ── BottleCard list skeleton ─────────────────────────────────────────────────

export function BottleCardListSkeleton() {
  const opacity = useShimmer();

  return (
    <View style={styles.listRow} accessibilityLabel="Loading bottle card">
      <ShimmerBox width={52} height={72} borderRadius={radius.sm} opacity={opacity} />
      <View style={styles.listMeta}>
        <ShimmerBox width="70%" height={14} opacity={opacity} />
        <ShimmerBox width="50%" height={11} opacity={opacity} style={{ marginTop: 6 }} />
        <ShimmerBox width="35%" height={10} opacity={opacity} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// ── SpiritDetail skeleton ────────────────────────────────────────────────────

export function SpiritDetailSkeleton() {
  const opacity = useShimmer();

  return (
    <View style={styles.detailContainer} accessibilityLabel="Loading spirit details">
      {/* Hero image */}
      <ShimmerBox width="100%" height={300} borderRadius={0} opacity={opacity} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.statBlock}>
            <ShimmerBox width={44} height={18} opacity={opacity} />
            <ShimmerBox width={32} height={11} opacity={opacity} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Section: flavor */}
      <View style={styles.section}>
        <ShimmerBox width={100} height={16} opacity={opacity} />
        <View style={{ marginTop: spacing.md, gap: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <View key={i} style={styles.flavorRow}>
              <ShimmerBox width={44} height={11} opacity={opacity} />
              <ShimmerBox width="55%" height={6} borderRadius={3} opacity={opacity} style={{ marginLeft: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* CTA button */}
      <View style={styles.cta}>
        <ShimmerBox width="100%" height={52} borderRadius={radius.md} opacity={opacity} />
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Grid
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  gridCard: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface1,
    overflow: 'hidden',
  },
  gridMeta: {
    padding: spacing.sm,
    gap: 4,
  },

  // List
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.bgSurface1,
    marginBottom: 1,
  },
  listMeta: {
    flex: 1,
    gap: 4,
  },

  // Detail
  detailContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  flavorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cta: {
    margin: spacing.md,
    marginTop: spacing.xl,
  },
});
