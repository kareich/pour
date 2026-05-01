import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, textStyles } from '../lib/theme';

type Variant = 'filled' | 'outline' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  accessibilityHint?: string;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'filled',
  style,
  accessibilityHint,
}: Props) {
  const isDisabled = disabled || loading;

  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'filled'  && styles.filled,
        variant === 'outline' && styles.outline,
        variant === 'ghost'   && styles.ghost,
        isDisabled            && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? colors.bgPrimary : colors.accentAmber}
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'filled'  && styles.labelFilled,
            variant === 'outline' && styles.labelOutline,
            variant === 'ghost'   && styles.labelGhost,
            isDisabled            && styles.labelDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  filled: {
    backgroundColor: colors.accentAmber,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accentAmber,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.38,
  },
  label: {
    ...textStyles.headline,
    letterSpacing: 0.2,
  },
  labelFilled: {
    color: colors.bgPrimary,
    fontWeight: '700',
  },
  labelOutline: {
    color: colors.accentAmber,
    fontWeight: '600',
  },
  labelGhost: {
    color: colors.accentAmber,
    fontWeight: '600',
  },
  labelDisabled: {
    opacity: 0.6,
  },
});
