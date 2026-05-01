import { View, Text, StyleSheet } from 'react-native';
import { colors, scoreColor } from '../lib/theme';

interface Props {
  score: number;
  size?: number;
}

export function MatchScoreBadge({ score, size = 56 }: Props) {
  const ring = scoreColor(score);
  const inner = size - 8;
  const fontSize = size === 56 ? 22 : Math.round(size * 0.39);
  const labelSize = Math.round(size * 0.13);

  return (
    <View
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: ring }]}
      accessibilityRole="text"
      accessibilityLabel={`Match score ${score} out of 100`}
    >
      <View
        style={[
          styles.inner,
          { width: inner, height: inner, borderRadius: inner / 2 },
        ]}
      >
        <Text style={[styles.score, { fontSize, lineHeight: fontSize + 2 }]}>{score}</Text>
        <Text style={[styles.label, { fontSize: labelSize }]}>MATCH</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    // Glassmorphism approximation — semi-transparent dark backdrop
    backgroundColor: 'rgba(15,15,15,0.55)',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontWeight: '800',
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  label: {
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
});
