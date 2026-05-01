import { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, radius, textStyles } from '../lib/theme';
import { MatchScoreBadge } from './MatchScoreBadge';

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 140;

export type BottleStatus = 'sealed' | 'open' | 'empty';

export interface BottleCardSpirit {
  id: string;
  name: string;
  distillery?: string;
  category?: string;
  abv?: number;
  avgRating: number;
  matchScore?: number;
  imageUrl: string | null;
  bottleStatus?: BottleStatus;
}

// ── Shared status dot ────────────────────────────────────────────────────────

function StatusDot({ status }: { status: BottleStatus }) {
  const dotColor =
    status === 'sealed' ? colors.sealed :
    status === 'open'   ? colors.open   : colors.empty;
  return (
    <View
      style={[styles.statusDot, { backgroundColor: dotColor }]}
      accessibilityLabel={`Bottle status: ${status}`}
    />
  );
}

// ── Grid card (2-column layout) ──────────────────────────────────────────────

interface GridCardProps {
  spirit: BottleCardSpirit;
  onPress: () => void;
  columnWidth?: number;
}

export function BottleCardGrid({ spirit, onPress, columnWidth }: GridCardProps) {
  const cardWidth = columnWidth ?? (Dimensions.get('window').width - spacing.md * 2 - spacing.sm) / 2;
  const imageHeight = cardWidth * 2.5; // 1:2.5 aspect ratio

  return (
    <TouchableOpacity
      style={[styles.gridCard, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${spirit.name}, ${spirit.avgRating.toFixed(1)} stars`}
    >
      <View style={{ height: imageHeight }}>
        <Image
          source={spirit.imageUrl ? { uri: spirit.imageUrl } : require('../assets/bottle-placeholder.png')}
          style={[StyleSheet.absoluteFill, styles.gridImage]}
          contentFit="cover"
          accessibilityLabel={spirit.name}
        />
        {/* Top-right match badge */}
        {spirit.matchScore !== undefined && (
          <View style={styles.gridBadgePos}>
            <MatchScoreBadge score={spirit.matchScore} size={48} />
          </View>
        )}
        {/* Status dot */}
        {spirit.bottleStatus && (
          <View style={styles.gridStatusPos}>
            <StatusDot status={spirit.bottleStatus} />
          </View>
        )}
      </View>

      <View style={styles.gridMeta}>
        <Text style={styles.gridName} numberOfLines={2}>{spirit.name}</Text>
        {spirit.distillery ? (
          <Text style={styles.gridDistillery} numberOfLines={1}>{spirit.distillery}</Text>
        ) : null}
        <Text style={styles.gridRating}>★ {spirit.avgRating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── List card (horizontal row + swipe actions) ───────────────────────────────

interface ListCardProps {
  spirit: BottleCardSpirit;
  onPress: () => void;
  onWishlist?: () => void;
  onDelete?: () => void;
}

export function BottleCardList({ spirit, onPress, onWishlist, onDelete }: ListCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const hasActions = !!(onWishlist || onDelete);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        hasActions && Math.abs(gs.dx) > 8 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderMove: (_e, gs) => {
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, -ACTION_WIDTH));
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  function closeSwipe() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  }

  return (
    <View style={styles.listContainer}>
      {/* Swipe action buttons (revealed on swipe-left) */}
      {hasActions && (
        <View style={styles.listActions}>
          {onWishlist && (
            <TouchableOpacity
              style={[styles.listAction, styles.listActionWishlist]}
              onPress={() => { closeSwipe(); onWishlist(); }}
              accessibilityLabel="Add to wishlist"
            >
              <Text style={styles.listActionIcon}>♡</Text>
              <Text style={styles.listActionLabel}>Wishlist</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.listAction, styles.listActionDelete]}
              onPress={() => { closeSwipe(); onDelete(); }}
              accessibilityLabel="Remove"
            >
              <Text style={styles.listActionIcon}>✕</Text>
              <Text style={styles.listActionLabel}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Row content */}
      <Animated.View
        style={[styles.listRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.listRowInner}
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${spirit.name}, ${spirit.avgRating.toFixed(1)} stars`}
        >
          <Image
            source={spirit.imageUrl ? { uri: spirit.imageUrl } : require('../assets/bottle-placeholder.png')}
            style={styles.listImage}
            contentFit="cover"
            accessibilityLabel={spirit.name}
          />
          <View style={styles.listMeta}>
            <Text style={styles.listName} numberOfLines={1}>{spirit.name}</Text>
            <Text style={styles.listSub} numberOfLines={1}>
              {[spirit.distillery, spirit.category].filter(Boolean).join(' · ')}
            </Text>
            <View style={styles.listRow2}>
              {spirit.abv ? <Text style={styles.listAbv}>{spirit.abv}% ABV</Text> : null}
              <Text style={styles.listRating}>★ {spirit.avgRating.toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.listRight}>
            {spirit.bottleStatus && <StatusDot status={spirit.bottleStatus} />}
            {spirit.matchScore !== undefined && (
              <MatchScoreBadge score={spirit.matchScore} size={44} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Grid
  gridCard: {
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface1,
    overflow: 'hidden',
  },
  gridImage: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  gridBadgePos: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  gridStatusPos: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  gridMeta: {
    padding: spacing.sm,
    gap: 3,
  },
  gridName: {
    ...textStyles.headline,
    color: colors.textPrimary,
  },
  gridDistillery: {
    ...textStyles.footnote,
    color: colors.textSecondary,
  },
  gridRating: {
    ...textStyles.caption2,
    color: colors.accentAmber,
    marginTop: 2,
  },

  // Status dot
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },

  // List
  listContainer: {
    position: 'relative',
    marginBottom: 1,
    overflow: 'hidden',
  },
  listActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    width: ACTION_WIDTH,
  },
  listAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  listActionWishlist: {
    backgroundColor: colors.accentAmber,
  },
  listActionDelete: {
    backgroundColor: colors.scoreLow,
  },
  listActionIcon: {
    fontSize: 20,
    color: '#fff',
  },
  listActionLabel: {
    ...textStyles.caption2,
    color: '#fff',
    fontWeight: '600',
  },
  listRow: {
    backgroundColor: colors.bgSurface1,
  },
  listRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 72,
  },
  listImage: {
    width: 52,
    height: 72,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  listMeta: {
    flex: 1,
    gap: 3,
  },
  listName: {
    ...textStyles.headline,
    color: colors.textPrimary,
  },
  listSub: {
    ...textStyles.footnote,
    color: colors.textSecondary,
  },
  listRow2: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  listAbv: {
    ...textStyles.caption2,
    color: colors.textTertiary,
  },
  listRating: {
    ...textStyles.caption2,
    color: colors.accentAmber,
  },
  listRight: {
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
});
