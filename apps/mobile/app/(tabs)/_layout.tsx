import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, StyleSheet, View, Text, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../../lib/theme';

// ── Scan button (elevated amber circle) ─────────────────────────────────────

function ScanButton({ onPress }: { onPress: () => void }) {
  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <TouchableOpacity
      style={styles.scanButton}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Scan a bottle"
      accessibilityHint="Opens the barcode and label scanner"
    >
      {/* Scan icon — crosshair corners */}
      <View style={styles.scanIcon}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>
    </TouchableOpacity>
  );
}

// ── Active dot indicator ─────────────────────────────────────────────────────

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  return (
    <View style={styles.tabIconWrapper} accessibilityLabel={label}>
      <Text style={[styles.tabIconText, focused && styles.tabIconActive]}>{icon}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accentAmber,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: colors.bgPrimary },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⌂" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⌕" label="Search" />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarLabel: 'Scan',
          tabBarButton: (props) => (
            <ScanButton
              onPress={() => {
                router.push('/scan-modal');
                props.onPress?.({} as never);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarLabel: 'Collection',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⊞" label="Collection" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="◯" label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const CORNER = 3;
const CORNER_SIZE = 8;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgSurface1,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.select({ ios: 82, android: 64 }),
    paddingBottom: Platform.select({ ios: 20, android: 8 }),
    paddingTop: 8,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    position: 'relative',
  },
  tabIconText: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  tabIconActive: {
    color: colors.accentAmber,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentAmber,
  },

  // Scan button
  scanButton: {
    bottom: Platform.select({ ios: 14, android: 4 }),
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: colors.accentAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  scanIcon: {
    width: 22,
    height: 22,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.bgPrimary,
    borderWidth: CORNER,
  },
  cornerTL: {
    top: 0, left: 0,
    borderRightWidth: 0, borderBottomWidth: 0,
    borderTopLeftRadius: 2,
  },
  cornerTR: {
    top: 0, right: 0,
    borderLeftWidth: 0, borderBottomWidth: 0,
    borderTopRightRadius: 2,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderRightWidth: 0, borderTopWidth: 0,
    borderBottomLeftRadius: 2,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderLeftWidth: 0, borderTopWidth: 0,
    borderBottomRightRadius: 2,
  },
});
