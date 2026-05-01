// This tab is a placeholder — the scan action opens a modal camera directly
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../lib/theme';

export default function ScanTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tap the scan button to scan a bottle.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.base },
});
