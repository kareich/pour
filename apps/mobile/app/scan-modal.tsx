import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraView as CameraViewType } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { colors, typography, spacing } from '../lib/theme';
import { api } from '../lib/api';

type ScanState = 'scanning' | 'loading' | 'ocr_prompt' | 'ocr_loading' | 'error';

export default function ScanModal() {
  const router = useRouter();
  const cameraRef = useRef<CameraViewType>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [errorMsg, setErrorMsg] = useState('');
  const lastScanned = useRef<string | null>(null);
  const scanning = useRef(true);

  const handleBarcode = useCallback(async ({ data: barcode }: { data: string }) => {
    if (!scanning.current || barcode === lastScanned.current) return;
    scanning.current = false;
    lastScanned.current = barcode;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanState('loading');

    try {
      const result = await api.scan.barcode(barcode);
      router.replace(`/spirit/${result.spirit.id}`);
    } catch {
      // Barcode not in DB — offer OCR fallback
      setScanState('ocr_prompt');
    }
  }, [router]);

  const handleOcrScan = useCallback(async () => {
    if (!cameraRef.current) return;
    setScanState('ocr_loading');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (!photo?.base64) throw new Error('No image data');

      const result = await api.scan.ocr(photo.base64);
      router.replace(`/spirit/${result.spirit.id}`);
    } catch {
      setScanState('error');
      setErrorMsg('Label scan failed. Try better lighting or search by name.');
      setTimeout(() => {
        setScanState('scanning');
        scanning.current = true;
        lastScanned.current = null;
      }, 2500);
    }
  }, [router]);

  const resetToScanning = useCallback(() => {
    setScanState('scanning');
    scanning.current = true;
    lastScanned.current = null;
  }, []);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Pour needs camera access to scan bottles.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanState === 'scanning' ? handleBarcode : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'upc_a', 'upc_e'] }}
      />

      {/* Crosshair guide */}
      <View style={styles.overlay}>
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.hint}>
          {scanState === 'ocr_prompt'
            ? 'No barcode match — try scanning the label'
            : 'Point at the barcode on the bottle'}
        </Text>
      </View>

      {(scanState === 'loading' || scanState === 'ocr_loading') && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.amber} />
          <Text style={styles.loadingText}>
            {scanState === 'ocr_loading' ? 'Reading label...' : 'Identifying bottle...'}
          </Text>
        </View>
      )}

      {scanState === 'ocr_prompt' && (
        <View style={styles.ocrPrompt}>
          <Text style={styles.ocrPromptTitle}>Barcode not found</Text>
          <Text style={styles.ocrPromptSub}>Point at the front label and tap to scan</Text>
          <TouchableOpacity style={styles.ocrButton} onPress={handleOcrScan}>
            <Text style={styles.ocrButtonText}>Scan Label</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ocrRetry} onPress={resetToScanning}>
            <Text style={styles.ocrRetryText}>Try barcode again</Text>
          </TouchableOpacity>
        </View>
      )}

      {scanState === 'error' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  permissionText: { fontSize: typography.lg, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xl },
  permissionButton: { backgroundColor: colors.amber, paddingHorizontal: spacing.xl, paddingVertical: 14, borderRadius: 10 },
  permissionButtonText: { color: colors.background, fontWeight: '700', fontSize: typography.base },
  closeButton: { marginTop: spacing.md },
  closeText: { color: colors.textSecondary, fontSize: typography.base },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewfinder: {
    width: 240,
    height: 160,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.amber,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: typography.sm, marginTop: spacing.xl, textAlign: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: { color: colors.textPrimary, fontSize: typography.base },
  ocrPrompt: {
    position: 'absolute',
    bottom: 100,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  ocrPromptTitle: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700' },
  ocrPromptSub: { color: 'rgba(255,255,255,0.6)', fontSize: typography.sm, textAlign: 'center' },
  ocrButton: {
    backgroundColor: colors.amber,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  ocrButtonText: { color: colors.background, fontWeight: '700', fontSize: typography.base },
  ocrRetry: { marginTop: spacing.xs },
  ocrRetryText: { color: 'rgba(255,255,255,0.5)', fontSize: typography.sm },
  errorBanner: {
    position: 'absolute',
    bottom: 120,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 10,
    padding: spacing.md,
  },
  errorText: { color: '#fff', textAlign: 'center', fontSize: typography.sm },
  cancelButton: { position: 'absolute', bottom: spacing.xl, alignSelf: 'center' },
  cancelText: { color: 'rgba(255,255,255,0.8)', fontSize: typography.lg },
});
