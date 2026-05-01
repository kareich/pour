import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';

const FLAVOR_LABELS: Record<string, string> = {
  sweet: 'Sweet', smoke: 'Smoke', fruit: 'Fruit',
  grain: 'Grain', spice: 'Spice', floral: 'Floral', body: 'Body',
};

function FlavorBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.flavorRow}>
      <Text style={styles.flavorLabel}>{label}</Text>
      <View style={styles.flavorBarBg}>
        <View style={[styles.flavorBarFill, { width: `${Math.round(value * 100)}%` }]} />
      </View>
      <Text style={styles.flavorValue}>{Math.round(value * 100)}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: api.users.me });

  const profile = user?.tasteProfile;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {user?.avatarUrl ? (
          <Image source={user.avatarUrl} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{user?.displayName?.[0] ?? '?'}</Text>
          </View>
        )}
        <Text style={styles.displayName}>{user?.displayName ?? '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Taste Profile</Text>
        {profile ? (
          Object.entries(FLAVOR_LABELS).map(([key, label]) => (
            <FlavorBar key={key} label={label} value={(profile as Record<string, number>)[key] ?? 0.5} />
          ))
        ) : (
          <TouchableOpacity style={styles.quizButton} onPress={() => router.push('/quiz')}>
            <Text style={styles.quizButtonText}>Take the Taste Quiz →</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['2xl'] },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: typography['2xl'], fontWeight: '700', color: colors.amber },
  displayName: { fontSize: typography.xl, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.sm },
  section: { marginHorizontal: spacing.md, marginTop: spacing.lg },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  flavorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  flavorLabel: { width: 52, fontSize: typography.sm, color: colors.textSecondary },
  flavorBarBg: { flex: 1, height: 6, backgroundColor: colors.surface, borderRadius: radius.full, overflow: 'hidden' },
  flavorBarFill: { height: '100%', backgroundColor: colors.amber, borderRadius: radius.full },
  flavorValue: { width: 28, textAlign: 'right', fontSize: typography.xs, color: colors.textSecondary },
  quizButton: {
    backgroundColor: colors.amber,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  quizButtonText: { color: colors.background, fontWeight: '700', fontSize: typography.base },
  signOutButton: { margin: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  signOutText: { color: colors.textSecondary, fontSize: typography.base },
});
