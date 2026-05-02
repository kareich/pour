import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, ActivityIndicator, FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';
import type { Spirit } from '@pour/shared';

const CATEGORIES = ['All', 'Bourbon', 'Scotch', 'Irish', 'Japanese', 'Rye', 'Tequila', 'Rum', 'Gin', 'Vodka', 'Brandy'];
const REGIONS = ['All', 'Kentucky', 'Tennessee', 'Scotland', 'Ireland', 'Japan', 'Mexico', 'Caribbean', 'France'];
const RATING_OPTIONS = [{ label: 'Any', value: undefined }, { label: '4.0+', value: 4 }, { label: '4.5+', value: 4.5 }];
const AGE_OPTIONS = [{ label: 'Any', value: undefined }, { label: '8+', value: 8 }, { label: '12+', value: 12 }, { label: '18+', value: 18 }];

interface Filters {
  category: string;
  region: string;
  abvMin: number;
  abvMax: number;
  ratingMin?: number;
  ageMin?: number;
}

const DEFAULT_FILTERS: Filters = { category: 'All', region: 'All', abvMin: 40, abvMax: 70 };

function SpiritRow({ spirit, onPress }: { spirit: Spirit; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={spirit.imageUrl ?? require('../../assets/bottle-placeholder.png')}
        style={styles.rowImage}
        contentFit="cover"
      />
      <View style={styles.rowContent}>
        <Text style={styles.rowName} numberOfLines={1}>{spirit.name}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>{spirit.distilleryName ?? ''}</Text>
        <View style={styles.rowStats}>
          <Text style={styles.rowRating}>★ {spirit.avgRating.toFixed(1)}</Text>
          <Text style={styles.rowCount}>{spirit.ratingCount} ratings</Text>
        </View>
      </View>
      {spirit.matchScore !== undefined && (
        <View style={styles.matchChip}>
          <Text style={styles.matchText}>{spirit.matchScore}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function FilterSheet({
  visible, filters, onApply, onDismiss,
}: {
  visible: boolean;
  filters: Filters;
  onApply: (f: Filters) => void;
  onDismiss: () => void;
}) {
  const [local, setLocal] = useState<Filters>(filters);

  useEffect(() => { if (visible) setLocal(filters); }, [visible, filters]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Filter Spirits</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
          {/* Category */}
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.pill, local.category === c && styles.pillActive]}
                onPress={() => update('category', c)}
              >
                <Text style={[styles.pillText, local.category === c && styles.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Region */}
          <Text style={styles.filterLabel}>Region</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {REGIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, local.region === r && styles.pillActive]}
                onPress={() => update('region', r)}
              >
                <Text style={[styles.pillText, local.region === r && styles.pillTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ABV Range — preset chips */}
          <Text style={styles.filterLabel}>ABV Range</Text>
          <View style={styles.optionRow}>
            {([
              { label: 'Any', min: 0, max: 100 },
              { label: 'Under 45%', min: 0, max: 45 },
              { label: '45–55%', min: 45, max: 55 },
              { label: '55%+', min: 55, max: 100 },
            ] as const).map(({ label, min, max }) => {
              const active = local.abvMin === min && local.abvMax === max;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => { update('abvMin', min); update('abvMax', max); }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Community Rating */}
          <Text style={styles.filterLabel}>Community Rating</Text>
          <View style={styles.optionRow}>
            {RATING_OPTIONS.map(({ label, value }) => (
              <TouchableOpacity
                key={label}
                style={[styles.optionChip, local.ratingMin === value && styles.optionChipActive]}
                onPress={() => update('ratingMin', value)}
              >
                <Text style={[styles.optionText, local.ratingMin === value && styles.optionTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Age Statement */}
          <Text style={styles.filterLabel}>Age Statement</Text>
          <View style={styles.optionRow}>
            {AGE_OPTIONS.map(({ label, value }) => (
              <TouchableOpacity
                key={label}
                style={[styles.optionChip, local.ageMin === value && styles.optionChipActive]}
                onPress={() => update('ageMin', value)}
              >
                <Text style={[styles.optionText, local.ageMin === value && styles.optionTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.resetButton} onPress={() => setLocal(DEFAULT_FILTERS)}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={() => { onApply(local); onDismiss(); }}>
            <Text style={styles.applyText}>Show Spirits</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    setShowAutocomplete(text.length >= 2);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(text), 200);
  }, []);

  const { data: autocompleteData, isFetching: acFetching } = useQuery({
    queryKey: ['autocomplete', debouncedQuery],
    queryFn: () => api.search.autocomplete(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && showAutocomplete,
    staleTime: 5_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, filters],
    queryFn: () =>
      debouncedQuery
        ? api.search.query(debouncedQuery, filters.category === 'All' ? undefined : filters.category)
        : api.search.browse({
            category: filters.category === 'All' ? undefined : filters.category,
            region: filters.region === 'All' ? undefined : filters.region,
            abv_min: filters.abvMin !== 35 ? filters.abvMin : undefined,
            abv_max: filters.abvMax !== 80 ? filters.abvMax : undefined,
            rating_min: filters.ratingMin,
            age_min: filters.ageMin,
          }),
    enabled: !showAutocomplete,
  });

  const hasActiveFilters =
    filters.category !== 'All' || filters.region !== 'All' ||
    filters.abvMin !== DEFAULT_FILTERS.abvMin || filters.abvMax !== DEFAULT_FILTERS.abvMax ||
    filters.ratingMin !== undefined || filters.ageMin !== undefined;

  return (
    <View style={styles.container}>
      {/* Search bar row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
            placeholder="Search spirits, distilleries..."
            placeholderTextColor={colors.textTertiary}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setFilterOpen(true)}
        >
          <Text style={[styles.filterIcon, hasActiveFilters && styles.filterIconActive]}>⊞</Text>
        </TouchableOpacity>
      </View>

      {/* Autocomplete dropdown */}
      {showAutocomplete && (
        <View style={styles.autocompleteContainer}>
          {acFetching && <ActivityIndicator size="small" color={colors.amber} style={{ padding: spacing.sm }} />}
          {!acFetching && autocompleteData && (
            <>
              {autocompleteData.spirits.length > 0 && (
                <>
                  <Text style={styles.acHeader}>SPIRITS</Text>
                  {autocompleteData.spirits.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.acRow}
                      onPress={() => { setShowAutocomplete(false); router.push(`/spirit/${s.id}`); }}
                    >
                      <View style={styles.acRowContent}>
                        <Text style={styles.acName} numberOfLines={1}>{s.name}</Text>
                        {s.distilleryName && <Text style={styles.acMeta}>{s.distilleryName}</Text>}
                      </View>
                      <Text style={styles.acRating}>★ {s.avgRating.toFixed(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {autocompleteData.distilleries.length > 0 && (
                <>
                  <Text style={styles.acHeader}>DISTILLERIES</Text>
                  {autocompleteData.distilleries.map((d) => (
                    <TouchableOpacity
                      key={d.name}
                      style={styles.acRow}
                      onPress={() => {
                        setFilters((prev) => ({ ...prev, category: 'All' }));
                        handleQueryChange(d.name);
                      }}
                    >
                      <Text style={styles.acDistillery}>{d.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* Category quick-filter chips */}
      {!showAutocomplete && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, filters.category === cat && styles.chipActive]}
              onPress={() => setFilters((prev) => ({ ...prev, category: cat }))}
            >
              <Text style={[styles.chipText, filters.category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      {!showAutocomplete && (
        <FlatList
          data={data?.data ?? []}
          renderItem={({ item }) => (
            <SpiritRow spirit={item} onPress={() => router.push(`/spirit/${item.id}`)} />
          )}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator color={colors.amber} style={{ marginTop: spacing['2xl'] }} />
            ) : (
              <Text style={styles.empty}>
                {debouncedQuery ? 'No results found' : 'Search for a spirit or browse by category'}
              </Text>
            )
          }
          keyExtractor={(item) => item.id}
        />
      )}

      <FilterSheet
        visible={filterOpen}
        filters={filters}
        onApply={setFilters}
        onDismiss={() => setFilterOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  searchBar: { flex: 1 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButton: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  filterIcon: { fontSize: 20, color: colors.textSecondary },
  filterIconActive: { color: colors.background },

  // Autocomplete
  autocompleteContainer: {
    position: 'absolute', top: 64, left: spacing.md, right: spacing.md + 44 + spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    zIndex: 100, maxHeight: 320,
  },
  acHeader: { fontSize: typography.xs, fontWeight: '700', color: colors.textTertiary, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 2, letterSpacing: 0.8 },
  acRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  acRowContent: { flex: 1 },
  acName: { fontSize: typography.sm, color: colors.textPrimary, fontWeight: '500' },
  acMeta: { fontSize: typography.xs, color: colors.textTertiary, marginTop: 1 },
  acRating: { fontSize: typography.xs, color: colors.amber, marginLeft: spacing.sm },
  acDistillery: { fontSize: typography.sm, color: colors.textSecondary },

  // Category chips
  categories: { maxHeight: 40, marginBottom: spacing.xs },
  categoriesContent: { paddingHorizontal: spacing.md, gap: spacing.sm, flexDirection: 'row' },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  chipText: { fontSize: typography.xs, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.background, fontWeight: '700' },

  // Results
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowImage: { width: 48, height: 48, borderRadius: radius.sm },
  rowContent: { flex: 1, marginLeft: spacing.sm },
  rowName: { fontSize: typography.base, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  rowStats: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  rowRating: { fontSize: typography.xs, color: colors.amber },
  rowCount: { fontSize: typography.xs, color: colors.textTertiary },
  matchChip: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  matchText: { fontSize: typography.sm, fontWeight: '800', color: colors.background },
  empty: { textAlign: 'center', color: colors.textTertiary, fontSize: typography.base, marginTop: spacing['2xl'], paddingHorizontal: spacing.xl },

  // Filter sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.sm },
  sheetTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  sheetScroll: { paddingHorizontal: spacing.lg },
  filterLabel: { fontSize: typography.sm, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  filterValue: { color: colors.amber },
  pillRow: { marginBottom: spacing.xs },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs },
  pillActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  pillText: { fontSize: typography.xs, color: colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: colors.background, fontWeight: '700' },
  slider: { height: 36 },
  sliderSubLabel: { fontSize: typography.xs, color: colors.textTertiary },
  optionRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  optionChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  optionChipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  optionText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '500' },
  optionTextActive: { color: colors.background, fontWeight: '700' },
  sheetActions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  resetButton: { flex: 1, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  resetText: { fontSize: typography.base, color: colors.textSecondary, fontWeight: '600' },
  applyButton: { flex: 2, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.amber, alignItems: 'center' },
  applyText: { fontSize: typography.base, color: colors.background, fontWeight: '700' },
});
