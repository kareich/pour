import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, textStyles, spacing, radius } from '../../lib/theme';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.72;
const CORNER = 24;

export default function ScanPromptScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.03, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const frameStyle = { opacity, transform: [{ scale }] };

  const handleScan = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/scan-modal');
  };

  const handleSkip = () => router.replace('/(tabs)');

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Scan Your{'\n'}First Bottle</Text>
        <Text style={styles.sub}>Point the camera at any spirit label</Text>
      </View>

      {/* Animated scan frame */}
      <View style={styles.frameArea}>
        <View style={styles.dimOverlay} />
        <Animated.View style={[styles.frame, frameStyle]}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scan line placeholder */}
          <View style={styles.scanLine} />
        </Animated.View>

        <Text style={styles.hint}>Any whiskey · tequila · rum · gin · vodka</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
          <Text style={styles.scanBtnText}>Open Scanner</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Browse first →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 72,
  },
  top: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    ...textStyles.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sub: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  frameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgSurface1,
    opacity: 0.3,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE * 1.35,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.accentAmber,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radius.sm },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radius.sm },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radius.sm },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radius.sm },
  scanLine: {
    width: '85%',
    height: 2,
    backgroundColor: colors.accentAmber,
    opacity: 0.6,
    borderRadius: 1,
  },
  hint: {
    ...textStyles.caption2,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    gap: spacing.md,
  },
  scanBtn: {
    height: 54,
    backgroundColor: colors.accentAmber,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: {
    ...textStyles.headline,
    color: colors.bgPrimary,
    fontWeight: '700',
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...textStyles.callout,
    color: colors.textSecondary,
  },
});
