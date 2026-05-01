import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';
import type { Spirit } from '@pour/shared';

const CATEGORIES = ['All', 'Bourbon', 'Scotch', 'Irish', 'Japanese', 'Rye', 'Tequila', 'Rum', 'Gin'];

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

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    clearTimeout((handleQueryChange as unknown as { timer?: ReturnType<typeof setTimeout> }).timer);
    (handleQueryChange as unknown as { timer?: ReturnType<typeof setTimeout> }).timer = setTimeout(() => {
      setDebouncedQuery(text);
    }, 200);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, category],
    queryFn: () => api.search.query(debouncedQuery || '*', category === 'All' ? undefined : category),
    enabled: debouncedQuery.length > 0 || category !== 'All',
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search spirits, distilleries..."
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlashList
        data={data?.data ?? []}
        estimatedItemSize={72}
        renderItem={({ item }) => (
          <SpiritRow spirit={item} onPress={() => router.push(`/spirit/${item.id}`)} />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.empty}>
              {debouncedQuery ? 'No results found' : 'Search for a spirit or browse by category'}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
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
  categories: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  chipText: { fontSize: typography.xs, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.background, fontWeight: '700' },
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
});
