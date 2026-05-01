import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';

const FLAVOR_AXES = [
  { key: 'sweet', label: 'Sweetness', low: 'Bone Dry', high: 'Very Sweet' },
  { key: 'smoke', label: 'Smoke', low: 'None', high: 'Intense' },
  { key: 'fruit', label: 'Fruit', low: 'Austere', high: 'Fruit-Forward' },
  { key: 'grain', label: 'Grain', low: 'Malty', high: 'Grainy' },
  { key: 'spice', label: 'Spice', low: 'Mild', high: 'Fiery' },
  { key: 'floral', label: 'Floral/Herbal', low: 'None', high: 'Prominent' },
  { key: 'body', label: 'Body', low: 'Light', high: 'Full' },
] as const;

type FlavorKey = typeof FLAVOR_AXES[number]['key'];

const DEFAULT_FLAVOR: Record<FlavorKey, number> = {
  sweet: 0.5, smoke: 0.2, fruit: 0.4, grain: 0.5, spice: 0.4, floral: 0.2, body: 0.5,
};

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [score, setScore] = useState(0);
  const [flavor, setFlavor] = useState<Record<FlavorKey, number>>({ ...DEFAULT_FLAVOR });
  const [notes, setNotes] = useState('');

  const submitMutation = useMutation({
    mutationFn: () =>
      api.ratings.submit({ spiritId: id, score, flavor, notes: notes.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spirit', id] });
      router.back();
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Write a Review</Text>

      {/* Star rating */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Rating</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setScore(s)} style={styles.star}>
              <Text style={[styles.starIcon, s <= score && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Flavor wheel */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Flavor Profile</Text>
        {FLAVOR_AXES.map(({ key, label, low, high }) => (
          <View key={key} style={styles.sliderBlock}>
            <Text style={styles.sliderLabel}>{label}</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderEndLabel}>{low}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={flavor[key]}
                onValueChange={(v) => setFlavor((prev) => ({ ...prev, [key]: v }))}
                minimumTrackTintColor={colors.amber}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.amber}
              />
              <Text style={styles.sliderEndLabel}>{high}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tasting Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Describe what you taste..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{notes.length}/500</Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, score === 0 && styles.submitButtonDisabled]}
        onPress={() => submitMutation.mutate()}
        disabled={score === 0 || submitMutation.isPending}
      >
        {submitMutation.isPending ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.submitText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing['2xl'] },
  pageTitle: { fontSize: typography['2xl'], fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionLabel: { fontSize: typography.base, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  stars: { flexDirection: 'row', gap: spacing.sm },
  star: { padding: 4 },
  starIcon: { fontSize: 36, color: colors.border },
  starActive: { color: colors.amber },
  sliderBlock: { marginBottom: spacing.md },
  sliderLabel: { fontSize: typography.sm, color: colors.textPrimary, marginBottom: 4 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sliderEndLabel: { fontSize: 10, color: colors.textTertiary, width: 48 },
  slider: { flex: 1 },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.base,
    color: colors.textPrimary,
    minHeight: 100,
  },
  charCount: { textAlign: 'right', fontSize: typography.xs, color: colors.textTertiary, marginTop: 4 },
  submitButton: {
    backgroundColor: colors.amber,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitText: { color: colors.background, fontWeight: '700', fontSize: typography.base },
});
