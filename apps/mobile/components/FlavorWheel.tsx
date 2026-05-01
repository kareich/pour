import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { colors, spacing, textStyles } from '../lib/theme';

export type FlavorProfile = {
  sweet: number;
  smoke: number;
  fruit: number;
  grain: number;
  spice: number;
  floral: number;
  body: number;
};

const AXES: Array<{ key: keyof FlavorProfile; label: string }> = [
  { key: 'sweet',  label: 'Sweet'  },
  { key: 'smoke',  label: 'Smoke'  },
  { key: 'fruit',  label: 'Fruit'  },
  { key: 'grain',  label: 'Grain'  },
  { key: 'spice',  label: 'Spice'  },
  { key: 'floral', label: 'Floral' },
  { key: 'body',   label: 'Body'   },
];

const N = AXES.length;

function axisAngle(i: number): number {
  // Start from top (-π/2) and go clockwise
  return -Math.PI / 2 + (2 * Math.PI * i) / N;
}

function polarPoint(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function polygonPoints(values: number[], cx: number, cy: number, maxR: number): string {
  return AXES.map((_, i) => {
    const v = Math.max(0, Math.min(1, values[i] ?? 0));
    const { x, y } = polarPoint(cx, cy, v * maxR, axisAngle(i));
    return `${x},${y}`;
  }).join(' ');
}

// ── Slider ──────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

const SLIDER_W = 200;

function FlavorSlider({ label, value, onChange }: SliderProps) {
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const x = e.nativeEvent.locationX;
      onChange(Math.max(0, Math.min(1, x / SLIDER_W)));
    },
    onPanResponderMove: (e) => {
      const x = e.nativeEvent.locationX;
      onChange(Math.max(0, Math.min(1, x / SLIDER_W)));
    },
  });

  return (
    <View style={sliderStyles.row}>
      <Text style={sliderStyles.label}>{label}</Text>
      <View style={sliderStyles.track} {...panResponder.panHandlers}>
        <View style={[sliderStyles.fill, { width: value * SLIDER_W }]} />
        <View style={[sliderStyles.thumb, { left: value * SLIDER_W - 8 }]} />
      </View>
      <Text style={sliderStyles.value}>{Math.round(value * 100)}</Text>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 44,
  },
  label: {
    ...textStyles.footnote,
    color: colors.textSecondary,
    width: 44,
  },
  track: {
    width: SLIDER_W,
    height: 6,
    backgroundColor: colors.bgSurface2,
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    height: 6,
    backgroundColor: colors.accentAmber,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentAmber,
    top: -5,
  },
  value: {
    ...textStyles.caption2,
    color: colors.textTertiary,
    width: 28,
    textAlign: 'right',
    marginLeft: spacing.xs,
  },
});

// ── FlavorWheel ─────────────────────────────────────────────────────────────

interface Props {
  communityFlavor: FlavorProfile;
  userFlavor?: FlavorProfile;
  onUserFlavorChange?: (flavor: FlavorProfile) => void;
  interactive?: boolean;
  size?: number;
}

const EMPTY_FLAVOR: FlavorProfile = {
  sweet: 0, smoke: 0, fruit: 0, grain: 0, spice: 0, floral: 0, body: 0,
};

export function FlavorWheel({
  communityFlavor,
  userFlavor,
  onUserFlavorChange,
  interactive = false,
  size = 220,
}: Props) {
  const [localUser, setLocalUser] = useState<FlavorProfile>(userFlavor ?? EMPTY_FLAVOR);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 24; // leave room for axis labels

  const effectiveUser = onUserFlavorChange ? (userFlavor ?? localUser) : localUser;

  const handleChange = useCallback(
    (key: keyof FlavorProfile, v: number) => {
      const next = { ...effectiveUser, [key]: v };
      if (onUserFlavorChange) {
        onUserFlavorChange(next);
      } else {
        setLocalUser(next);
      }
    },
    [effectiveUser, onUserFlavorChange],
  );

  const communityVals = AXES.map(a => communityFlavor[a.key]);
  const userVals      = AXES.map(a => effectiveUser[a.key]);

  // Concentric grid rings
  const gridRings = [0.25, 0.5, 0.75, 1];

  return (
    <View accessibilityLabel="Flavor wheel radar chart">
      <Svg width={size} height={size}>
        {/* Grid rings */}
        {gridRings.map(t => (
          <Circle
            key={t}
            cx={cx}
            cy={cy}
            r={maxR * t}
            stroke={colors.bgSurface2}
            strokeWidth={1}
            fill="none"
          />
        ))}

        {/* Axis spokes */}
        {AXES.map((_, i) => {
          const { x, y } = polarPoint(cx, cy, maxR, axisAngle(i));
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={colors.bgSurface2}
              strokeWidth={1}
            />
          );
        })}

        {/* Community polygon */}
        <Polygon
          points={polygonPoints(communityVals, cx, cy, maxR)}
          fill="rgba(200,150,42,0.2)"
          stroke={colors.accentAmber}
          strokeWidth={1.5}
        />

        {/* User polygon */}
        {interactive && (
          <Polygon
            points={polygonPoints(userVals, cx, cy, maxR)}
            fill="rgba(52,199,89,0.2)"
            stroke={colors.scoreHigh}
            strokeWidth={1.5}
          />
        )}

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const angle = axisAngle(i);
          const labelR = maxR + 16;
          const { x, y } = polarPoint(cx, cy, labelR, angle);
          const textAnchor =
            Math.abs(Math.cos(angle)) < 0.1 ? 'middle' :
            Math.cos(angle) > 0             ? 'start'  : 'end';
          return (
            <G key={axis.key}>
              <SvgText
                x={x}
                y={y + 4}
                fill={colors.textSecondary}
                fontSize={10}
                textAnchor={textAnchor}
                fontWeight="500"
              >
                {axis.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Interactive sliders */}
      {interactive && (
        <View style={styles.sliders}>
          {AXES.map(axis => (
            <FlavorSlider
              key={axis.key}
              label={axis.label}
              value={effectiveUser[axis.key]}
              onChange={v => handleChange(axis.key, v)}
            />
          ))}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accentAmber }]} />
          <Text style={styles.legendLabel}>Community</Text>
        </View>
        {interactive && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.scoreHigh }]} />
            <Text style={styles.legendLabel}>Your palate</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliders: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...textStyles.caption2,
    color: colors.textSecondary,
  },
});
