/**
 * Component gallery — surfaces all design-system components for visual QA.
 * Route: /gallery (accessible via dev menu or direct navigation)
 */
import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, textStyles, radius } from '../lib/theme';
import { MatchScoreBadge } from '../components/MatchScoreBadge';
import { BottleCardGrid, BottleCardList } from '../components/BottleCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { BottomSheet } from '../components/BottomSheet';
import { FlavorWheel, FlavorProfile } from '../components/FlavorWheel';
import {
  BottleCardGridSkeletonRow,
  BottleCardListSkeleton,
  SpiritDetailSkeleton,
} from '../components/SkeletonLoader';

// ── Demo data ────────────────────────────────────────────────────────────────

const MOCK_SPIRIT = {
  id: '1',
  name: 'Glenfarclas 21 Year Old',
  distillery: 'Glenfarclas',
  category: 'Single Malt Scotch',
  abv: 43,
  avgRating: 4.5,
  matchScore: 91,
  imageUrl: null,
  bottleStatus: 'sealed' as const,
};

const MOCK_COMMUNITY: FlavorProfile = {
  sweet: 0.65, smoke: 0.35, fruit: 0.80,
  grain: 0.45, spice: 0.55, floral: 0.70, body: 0.60,
};

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

// ── Gallery screen ───────────────────────────────────────────────────────────

export default function GalleryScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [userFlavor, setUserFlavor] = useState<FlavorProfile>({
    sweet: 0.50, smoke: 0.20, fruit: 0.60,
    grain: 0.40, spice: 0.45, floral: 0.30, body: 0.55,
  });
  const [skeletonVariant, setSkeletonVariant] = useState<'grid' | 'list' | 'detail'>('grid');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Design System Gallery</Text>

        {/* ── Color tokens ─────────────────────────────────────── */}
        <SectionHeader title="Color tokens" subtitle="Exact UX spec values" />
        <View style={styles.colorGrid}>
          {[
            { name: 'bg-primary',   color: colors.bgPrimary,        onDark: true },
            { name: 'bg-surface-1', color: colors.bgSurface1,       onDark: true },
            { name: 'bg-surface-2', color: colors.bgSurface2,       onDark: true },
            { name: 'accent-amber', color: colors.accentAmber,      onDark: false },
            { name: 'amber-light',  color: colors.accentAmberLight, onDark: false },
            { name: 'score-high',   color: colors.scoreHigh,        onDark: false },
            { name: 'score-mid',    color: colors.scoreMid,         onDark: false },
            { name: 'score-low',    color: colors.scoreLow,         onDark: false },
          ].map(({ name, color, onDark }) => (
            <View key={name} style={[styles.colorChip, { backgroundColor: color, borderWidth: onDark ? 1 : 0, borderColor: colors.bgSurface2 }]}>
              <Text style={[styles.colorName, { color: onDark ? colors.textSecondary : '#000' }]}>{name}</Text>
              <Text style={[styles.colorHex, { color: onDark ? colors.textTertiary : 'rgba(0,0,0,0.5)' }]}>{color}</Text>
            </View>
          ))}
        </View>

        {/* ── Typography ───────────────────────────────────────── */}
        <SectionHeader title="Typography scale" subtitle="9 named styles" />
        {(
          [
            ['largeTitle', 'Large Title — 34pt'],
            ['title1',     'Title 1 — 28pt'],
            ['title2',     'Title 2 — 22pt'],
            ['title3',     'Title 3 — 20pt'],
            ['headline',   'Headline — 17pt semibold'],
            ['body',       'Body — 17pt regular'],
            ['callout',    'Callout — 16pt'],
            ['footnote',   'Footnote — 13pt'],
            ['caption2',   'Caption 2 — 11pt'],
          ] as Array<[keyof typeof textStyles, string]>
        ).map(([key, label]) => (
          <Text key={key} style={[textStyles[key], { color: colors.textPrimary, paddingHorizontal: spacing.md, marginBottom: 6 }]}>
            {label}
          </Text>
        ))}

        {/* ── MatchScoreBadge ──────────────────────────────────── */}
        <SectionHeader title="MatchScoreBadge" subtitle="Color-coded ring per score tier" />
        <View style={styles.row}>
          {[91, 73, 42].map(score => (
            <View key={score} style={styles.badgeWrapper}>
              <MatchScoreBadge score={score} size={56} />
              <Text style={styles.badgeLabel}>{score >= 80 ? 'High' : score >= 60 ? 'Mid' : 'Low'}</Text>
            </View>
          ))}
          <View style={styles.badgeWrapper}>
            <MatchScoreBadge score={87} size={44} />
            <Text style={styles.badgeLabel}>44pt</Text>
          </View>
        </View>

        {/* ── BottleCard Grid ──────────────────────────────────── */}
        <SectionHeader title="BottleCard · Grid" subtitle="2-column, 1:2.5 image, status dot, score badge" />
        <View style={styles.gridRow}>
          <BottleCardGrid spirit={MOCK_SPIRIT} onPress={() => {}} />
          <BottleCardGrid spirit={{ ...MOCK_SPIRIT, id: '2', name: 'Macallan 18 Sherry Oak', matchScore: 68, bottleStatus: 'open' }} onPress={() => {}} />
        </View>

        {/* ── BottleCard List ──────────────────────────────────── */}
        <SectionHeader title="BottleCard · List" subtitle="Horizontal row with swipe actions" />
        <BottleCardList
          spirit={MOCK_SPIRIT}
          onPress={() => {}}
          onWishlist={() => {}}
          onDelete={() => {}}
        />
        <BottleCardList
          spirit={{ ...MOCK_SPIRIT, id: '3', name: 'Ardbeg 10', matchScore: 55, bottleStatus: 'open', distillery: 'Ardbeg', category: 'Islay Scotch' }}
          onPress={() => {}}
          onWishlist={() => {}}
          onDelete={() => {}}
        />

        {/* ── PrimaryButton ────────────────────────────────────── */}
        <SectionHeader title="PrimaryButton" subtitle="52pt height, amber, 12pt radius, all states" />
        <View style={styles.buttonColumn}>
          <PrimaryButton title="Add to Collection" onPress={() => {}} />
          <PrimaryButton title="Outline variant" onPress={() => {}} variant="outline" />
          <PrimaryButton title="Ghost variant" onPress={() => {}} variant="ghost" />
          <PrimaryButton title="Disabled" onPress={() => {}} disabled />
          <PrimaryButton title="Loading…" onPress={() => {}} loading />
        </View>

        {/* ── BottomSheet ──────────────────────────────────────── */}
        <SectionHeader title="BottomSheet" subtitle="Drag handle, 16pt corners, safe area" />
        <View style={styles.buttonColumn}>
          <PrimaryButton title="Open BottomSheet" onPress={() => setSheetVisible(true)} variant="outline" />
        </View>

        {/* ── FlavorWheel ──────────────────────────────────────── */}
        <SectionHeader title="FlavorWheel" subtitle="7-axis radar chart — community + user layers" />
        <View style={styles.wheelWrapper}>
          <FlavorWheel
            communityFlavor={MOCK_COMMUNITY}
            userFlavor={userFlavor}
            onUserFlavorChange={setUserFlavor}
            interactive
            size={240}
          />
        </View>

        {/* ── SkeletonLoader ───────────────────────────────────── */}
        <SectionHeader title="SkeletonLoader" subtitle="Pulse shimmer matching real card layouts" />
        <View style={[styles.row, { paddingHorizontal: spacing.md, marginBottom: spacing.sm }]}>
          {(['grid', 'list', 'detail'] as const).map(v => (
            <PrimaryButton
              key={v}
              title={v}
              onPress={() => setSkeletonVariant(v)}
              variant={skeletonVariant === v ? 'filled' : 'outline'}
              style={{ flex: 1, height: 36 }}
            />
          ))}
        </View>
        {skeletonVariant === 'grid'   && <BottleCardGridSkeletonRow />}
        {skeletonVariant === 'list'   && (
          <>
            <BottleCardListSkeleton />
            <BottleCardListSkeleton />
            <BottleCardListSkeleton />
          </>
        )}
        {skeletonVariant === 'detail' && <SpiritDetailSkeleton />}

        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <View style={styles.sheetContent}>
          <Text style={[textStyles.title3, { color: colors.textPrimary }]}>BottomSheet demo</Text>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Drag the handle or tap the backdrop to dismiss.
          </Text>
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton title="Close" onPress={() => setSheetVisible(false)} />
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  container: { flex: 1 },
  content: { paddingTop: spacing.lg },

  screenTitle: {
    ...textStyles.largeTitle,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.headline,
    color: colors.textPrimary,
  },
  sectionSub: {
    ...textStyles.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Colors
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  colorChip: {
    width: '47%',
    padding: spacing.sm,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    minHeight: 64,
  },
  colorName: {
    fontSize: 11,
    fontWeight: '600',
  },
  colorHex: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Courier',
  },

  // Badge
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  badgeWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  badgeLabel: {
    ...textStyles.caption2,
    color: colors.textSecondary,
  },

  // Grid cards
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  // Buttons
  buttonColumn: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  // Wheel
  wheelWrapper: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  // BottomSheet content
  sheetContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
