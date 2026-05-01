import { useEffect, useRef, ReactNode } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAG_DISMISS_THRESHOLD = 120;

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Sheet height — defaults to 60% of screen */
  sheetHeight?: number;
}

export function BottomSheet({ visible, onClose, children, sheetHeight }: Props) {
  const insets = useSafeAreaInsets();
  const height = sheetHeight ?? SCREEN_HEIGHT * 0.6;
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        gs.dy > 5 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_e, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
          backdropOpacity.setValue(Math.max(0, 1 - gs.dy / height));
        }
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dy > DRAG_DISMISS_THRESHOLD || gs.vy > 0.5) {
          close();
        } else {
          Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            Animated.timing(backdropOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, bounciness: 4, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function close() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height,
            paddingBottom: insets.bottom + 8,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag handle */}
        <View
          style={styles.handleRow}
          accessibilityRole="adjustable"
          accessibilityLabel="Drag handle"
          accessibilityHint="Drag down to close"
        >
          <View style={styles.handle} />
        </View>

        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgSurface1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // Shadow (iOS)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(235,235,245,0.3)',
  },
});
