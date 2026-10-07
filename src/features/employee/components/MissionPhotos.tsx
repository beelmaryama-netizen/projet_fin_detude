import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { colors, radii } from '../../../theme/tokens';
import { MAX_REQUEST_PHOTOS } from '../../requests/types/request';
import { useEmployeeStore } from '../hooks/useEmployeeStore';
import { Action, Notice, ui } from './EmployeeUI';

// Android recovery must only consume a selection launched by this employee session.
let pendingSelection: { ownerId: string; missionId: string; profile: unknown } | undefined;

export function MissionPhotos({ missionId, readOnly = false }: { missionId: string; readOnly?: boolean }) {
  const mission = useEmployeeStore(state => state.missions.find(item => item.id === missionId));
  const ownerId = useEmployeeStore(state => state.ownerId);
  const profile = useEmployeeStore(state => state.profile);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const locked = readOnly || mission?.status !== 'REPORT_PENDING';
  const accept = useCallback((result: ImagePicker.ImagePickerResult) => {
    const store = useEmployeeStore.getState();
    if (!active.current || result.canceled || !ownerId || store.ownerId !== ownerId || store.profile !== profile) return;
    const current = store.missions.find(item => item.id === missionId);
    if (!current || current.status !== 'REPORT_PENDING') return;
    const photos = [...current.report.photos];
    let skipped = 0;
    result.assets.forEach((asset, index) => {
      if (photos.length >= MAX_REQUEST_PHOTOS || photos.some(photo => photo.uri === asset.uri)) { skipped++; return; }
      photos.push({ id: `${Date.now()}-${index}-${asset.assetId ?? asset.uri}`, uri: asset.uri, name: asset.fileName ?? `Photo ${photos.length + 1}` });
    });
    store.updateReport(missionId, { photos });
    setMessage(skipped ? 'Certaines photos sont déjà présentes ou dépassent la limite de 5 photos.' : undefined);
  }, [ownerId, missionId, profile]);

  useEffect(() => {
    if (Platform.OS !== 'android' || locked || pendingSelection?.ownerId !== ownerId || pendingSelection.missionId !== missionId || pendingSelection.profile !== profile) return;
    let active = true;
    void ImagePicker.getPendingResultAsync().then(result => {
      if (!active || !result) return;
      if ('code' in result) setMessage('La sélection a été interrompue. Veuillez réessayer.');
      else accept(result);
    }).catch(() => { if (active) setMessage('Impossible de récupérer les photos. Veuillez réessayer.'); });
    return () => { active = false; };
  }, [accept, locked, ownerId, missionId, profile]);

  const pick = async () => {
    if (busy || locked || !ownerId || !mission || mission.report.photos.length >= MAX_REQUEST_PHOTOS) return;
    setMessage(undefined);
    setBusy(Platform.OS !== 'web');
    pendingSelection = { ownerId, missionId, profile };
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_REQUEST_PHOTOS - mission.report.photos.length, quality: 0.8, exif: false, base64: false });
      accept(result);
    } catch { setMessage('Impossible d’ouvrir la galerie. Vérifiez les autorisations de photos et réessayez.'); }
    finally { if (pendingSelection?.profile === profile) pendingSelection = undefined; setBusy(false); }
  };

  if (!mission) return null;
  return <View style={ui.smallGap}>
    <AppText variant="label">Photos de l’intervention (facultatif)</AppText>
    <AppText variant="caption" style={ui.muted}>{mission.report.photos.length} sur 5 photos · conservées dans cette démonstration</AppText>
    <View style={styles.grid}>{mission.report.photos.map((photo, index) => <View key={photo.id} style={styles.photo}>
      <Image source={{ uri: photo.uri }} style={styles.image} accessibilityLabel={`Photo de l’intervention ${index + 1}`} />
      {!locked && <Pressable style={styles.remove} accessibilityRole="button" accessibilityLabel={`Supprimer la photo ${index + 1}`} onPress={() => {
        const current = useEmployeeStore.getState();
        if (current.ownerId !== ownerId) return;
        const latest = current.missions.find(item => item.id === missionId);
        if (latest) current.updateReport(missionId, { photos: latest.report.photos.filter(item => item.id !== photo.id) });
      }}><Ionicons name="close" size={22} color={colors.white} /></Pressable>}
    </View>)}</View>
    {message && <Notice>{message}</Notice>}
    {!locked && <Action title={mission.report.photos.length >= MAX_REQUEST_PHOTOS ? '5 photos maximum' : 'Ajouter des photos'} icon="images-outline" variant="secondary" disabled={mission.report.photos.length >= MAX_REQUEST_PHOTOS} loading={busy} onPress={() => void pick()} />}
  </View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, photo: { width: 100, height: 100, borderRadius: radii.control, overflow: 'hidden', backgroundColor: colors.disabled }, image: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: 0, right: 0, minWidth: 44, minHeight: 44, backgroundColor: '#1A1A2E99', alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: radii.control },
});
