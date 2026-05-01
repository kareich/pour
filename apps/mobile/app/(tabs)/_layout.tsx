import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { colors } from '../../lib/theme';

function ScanButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.scanButton} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.scanButtonInner} />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textTertiary,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
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
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    bottom: 8,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonInner: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2.5,
    borderColor: colors.background,
  },
});
