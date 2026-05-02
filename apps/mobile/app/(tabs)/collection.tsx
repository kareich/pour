import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';
import type { CollectionEntry, WishlistEntry, SpiritStatus } from '@pour/shared';

type Tab = 'owned' | 'wishlist';
type ViewMode = 'grid' | 'list';

const VIEW_MODE_KEY = 'collection_view_mode';

const STATUS_COLORS: Record<string, string> = {
  sealed: colors.sealed,
  open: colors.open,
  empty: colors.empty,
};

const STATUS_CYCLE: Record<SpiritStatus, SpiritStatus> = {
  sealed: 'open',
  open: 'empty',
  empty: 'sealed',
};

function CollectionCard({ entry, onPress, onStatusPress }: {
  entry: CollectionEntry;
  onPress: () => void;
  onStatusPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.collectionCard} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={entry.spirit.imageUrl ?? require('../../assets/bottle-placeholder.png')}
        style={styles.collectionImage}
        contentFit="cover"
      />
      <TouchableOpacity
        style={[styles.statusDot, { backgroundColor: STATUS_COLORS[entry.bottleStatus] ?? colors.empty }]}
        onPress={onStatusPress}
        hitSlop={8}
      />
      <Text style={styles.collectionName} numberOfLines={2}>{entry.spirit.name}</Text>
    </TouchableOpacity>
  );
}

function CollectionRow({ entry, onPress, onStatusPress }: {
  entry: CollectionEntry;
  onPress: () => void;
  onStatusPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.listRow} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={entry.spirit.imageUrl ?? require('../../assets/bottle-placeholder.png')}
        style={styles.listImage}
        contentFit="cover"
      />
      <View style={styles.listContent}>
        <Text style={styles.listName} numberOfLines={1}>{entry.spirit.name}</Text>
        <Text style={styles.listMeta} numberOfLines={1}>{entry.spirit.distilleryName}</Text>
        {entry.pricePaid != null && (
          <Text style={styles.listPrice}>Paid ${entry.pricePaid.toFixed(0)}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onStatusPress} style={styles.statusChip} hitSlop={8}>
        <View style={[styles.statusDotSmall, { backgroundColor: STATUS_COLORS[entry.bottleStatus] ?? colors.empty }]} />
        <Text style={styles.statusLabel}>{entry.bottleStatus}</Text>
      </TouchableOpacity>
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

function TabHeader({
  activeTab,
  setActiveTab,
  collectionCount,
  wishlistCount,
  viewMode,
  onToggleViewMode,
}: {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  collectionCount: number;
  wishlistCount: number;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'owned' && styles.tabActive]}
          onPress={() => setActiveTab('owned')}
        >
          <Text style={[styles.tabText, activeTab === 'owned' && styles.tabTextActive]}>
            Owned ({collectionCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.tabActive]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.tabTextActive]}>
            Wishlist ({wishlistCount})
          </Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'owned' && (
        <TouchableOpacity onPress={onToggleViewMode} style={styles.viewToggle}>
          <Text style={styles.viewToggleText}>{viewMode === 'grid' ? '☰' : '⊞'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CollectionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('owned');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    SecureStore.getItemAsync(VIEW_MODE_KEY).then(val => {
      if (val === 'list' || val === 'grid') setViewMode(val);
    });
  }, []);

  const toggleViewMode = () => {
    const next: ViewMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(next);
    SecureStore.setItemAsync(VIEW_MODE_KEY, next);
  };

  const { data: collection } = useQuery({ queryKey: ['collection'], queryFn: api.collections.list });
  const { data: wishlist } = useQuery({ queryKey: ['wishlist'], queryFn: api.wishlists.list });

  const updateStatus = useMutation({
    mutationFn: ({ id, bottleStatus }: { id: string; bottleStatus: SpiritStatus }) =>
      api.collections.update(id, { bottleStatus }),
    onMutate: async ({ id, bottleStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['collection'] });
      const prev = queryClient.getQueryData<CollectionEntry[]>(['collection']);
      queryClient.setQueryData<CollectionEntry[]>(['collection'], old =>
        old?.map(e => e.id === id ? { ...e, bottleStatus } : e)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['collection'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['collection'] }),
  });

  const removeWishlist = useMutation({
    mutationFn: (id: string) => api.wishlists.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const header = (
    <TabHeader
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      collectionCount={collection?.length ?? 0}
      wishlistCount={wishlist?.length ?? 0}
      viewMode={viewMode}
      onToggleViewMode={toggleViewMode}
    />
  );

  if (activeTab === 'owned' && viewMode === 'grid') {
    return (
      <View style={styles.container}>
        <FlatList
          data={collection ?? []}
          numColumns={2}
          ListHeaderComponent={header}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CollectionCard
              entry={item}
              onPress={() => router.push(`/spirit/${item.spiritId}`)}
              onStatusPress={() =>
                updateStatus.mutate({ id: item.id, bottleStatus: STATUS_CYCLE[item.bottleStatus] })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No bottles yet. Scan one to add it!</Text>
          }
        />
      </View>
    );
  }

  if (activeTab === 'owned') {
    return (
      <View style={styles.container}>
        <FlatList
          data={collection ?? []}
          ListHeaderComponent={header}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CollectionRow
              entry={item}
              onPress={() => router.push(`/spirit/${item.spiritId}`)}
              onStatusPress={() =>
                updateStatus.mutate({ id: item.id, bottleStatus: STATUS_CYCLE[item.bottleStatus] })
              }
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
      <FlatList
        data={wishlist ?? []}
        ListHeaderComponent={header}
        keyExtractor={(item) => item.id}
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: { flex: 1, flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.amber },
  tabText: { fontSize: typography.base, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.amber, fontWeight: '700' },

  viewToggle: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  viewToggleText: { fontSize: typography.lg, color: colors.textSecondary },

  // Grid card
  collectionCard: {
    flex: 1,
    margin: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  collectionImage: { width: '100%', aspectRatio: 0.4 },
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

  // List row
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listImage: { width: 48, height: 48, borderRadius: radius.sm },
  listContent: { flex: 1, marginLeft: spacing.sm },
  listName: { fontSize: typography.base, fontWeight: '600', color: colors.textPrimary },
  listMeta: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  listPrice: { fontSize: typography.xs, color: colors.textTertiary, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: spacing.sm },
  statusDotSmall: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: typography.xs, color: colors.textSecondary, textTransform: 'capitalize' },

  // Wishlist row
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

  empty: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: typography.base,
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
});
