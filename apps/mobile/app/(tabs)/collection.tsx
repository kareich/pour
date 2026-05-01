import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';
import type { CollectionEntry, WishlistEntry } from '@pour/shared';

type Tab = 'owned' | 'wishlist';

const STATUS_COLORS: Record<string, string> = {
  sealed: colors.sealed,
  open: colors.open,
  empty: colors.empty,
};

function CollectionCard({ entry, onPress }: { entry: CollectionEntry; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.collectionCard} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={entry.spirit.imageUrl ?? require('../../assets/bottle-placeholder.png')}
        style={styles.collectionImage}
        contentFit="cover"
      />
      <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[entry.bottleStatus] ?? colors.empty }]} />
      <Text style={styles.collectionName} numberOfLines={2}>{entry.spirit.name}</Text>
    </TouchableOpacity>
  );
}

function WishlistRow({ entry, onRemove }: { entry: WishlistEntry; onRemove: () => void }) {
  return (
    <View style={styles.wishlistRow}>
      <Image
        source={entry.spirit.imageUrl ?? require('../../assets/bottle-placeholder.png')}
        style={styles.wishlistImage}
        contentFit="cover"
      />
      <View style={styles.wishlistContent}>
        <Text style={styles.wishlistName} numberOfLines={1}>{entry.spirit.name}</Text>
        {entry.targetPrice && (
          <Text style={styles.wishlistPrice}>Target: ${entry.targetPrice}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CollectionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('owned');

  const { data: collection } = useQuery({ queryKey: ['collection'], queryFn: api.collections.list });
  const { data: wishlist } = useQuery({ queryKey: ['wishlist'], queryFn: api.wishlists.list });

  const removeWishlist = useMutation({
    mutationFn: (id: string) => api.wishlists.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const header = (
    <View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'owned' && styles.tabActive]}
          onPress={() => setActiveTab('owned')}
        >
          <Text style={[styles.tabText, activeTab === 'owned' && styles.tabTextActive]}>
            Owned ({collection?.length ?? 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.tabActive]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.tabTextActive]}>
            Wishlist ({wishlist?.length ?? 0})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (activeTab === 'owned') {
    return (
      <View style={styles.container}>
        {header}
        <FlashList
          data={collection ?? []}
          numColumns={2}
          estimatedItemSize={200}
          renderItem={({ item }) => (
            <CollectionCard
              entry={item}
              onPress={() => router.push(`/spirit/${item.spiritId}`)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No bottles yet. Scan one to add it!</Text>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <FlashList
        data={wishlist ?? []}
        estimatedItemSize={72}
        renderItem={({ item }) => (
          <WishlistRow
            entry={item}
            onRemove={() => removeWishlist.mutate(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Your wishlist is empty. Add bottles from spirit pages.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.amber },
  tabText: { fontSize: typography.base, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.amber, fontWeight: '700' },
  collectionCard: {
    flex: 1,
    margin: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  collectionImage: { width: '100%', aspectRatio: 1 },
  statusDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  collectionName: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textPrimary,
    padding: spacing.sm,
  },
  wishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wishlistImage: { width: 48, height: 48, borderRadius: radius.sm },
  wishlistContent: { flex: 1, marginLeft: spacing.sm },
  wishlistName: { fontSize: typography.base, fontWeight: '600', color: colors.textPrimary },
  wishlistPrice: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  removeButton: { padding: spacing.sm },
  removeText: { color: colors.textTertiary, fontSize: typography.lg },
  empty: { textAlign: 'center', color: colors.textTertiary, fontSize: typography.base, marginTop: spacing['2xl'], paddingHorizontal: spacing.xl },
});
