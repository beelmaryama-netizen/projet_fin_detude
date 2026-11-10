import { keepLocalFile } from '../../../services/durableFiles';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import { MAX_REQUEST_PHOTOS } from '../types/request';

export function useRequestPhotos() {
  const photos = useRequestDraftStore(state => state.photos);
  const removePhoto = useRequestDraftStore(state => state.removePhoto);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const acceptResult = useCallback(async (result: ImagePicker.ImagePickerResult, ownerId: string | null) => {
    if (result.canceled || ownerId !== useRequestDraftStore.getState().ownerId) return;
    const candidates = await Promise.all(result.assets.map(async (asset, index) => ({ id: `${Date.now()}-${index}-${asset.assetId ?? asset.uri}`, uri: await keepLocalFile(asset.uri, asset.fileName ?? 'photo.jpg'), name: asset.fileName ?? `Photo ${index + 1}` })));
    if (ownerId !== useRequestDraftStore.getState().ownerId) return;
    const added = useRequestDraftStore.getState().addPhotos(candidates);
    setMessage(added < candidates.length ? 'Certaines photos n’ont pas été ajoutées : maximum 5 photos, sans doublons.' : undefined);
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    const ownerId = useRequestDraftStore.getState().ownerId;
    void ImagePicker.getPendingResultAsync().then(result => {
      if (!active || !result) return;
      if ('code' in result) setMessage('La sélection a été interrompue. Veuillez réessayer.');
      else acceptResult(result, ownerId);
    }).catch(() => { if (active) setMessage('Impossible de récupérer les photos. Veuillez réessayer.'); });
    return () => { active = false; };
  }, [acceptResult]);
  const pickPhotos = async (camera = false) => {
    const draft = useRequestDraftStore.getState();
    if (draft.photos.length >= MAX_REQUEST_PHOTOS || busy) return;
    setMessage(undefined);
    // On web, a dismissed picker does not always resolve. Do not leave the UI locked.
    setBusy(Platform.OS !== 'web');
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) { setMessage('Autorisez la caméra dans les réglages de l’appareil.'); return; }
      const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, exif: false }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true,
        selectionLimit: MAX_REQUEST_PHOTOS - draft.photos.length, quality: 0.8, exif: false, base64: false });
      await acceptResult(result, draft.ownerId);
    } catch {
      setMessage('Impossible d’ouvrir la galerie. Vérifiez les autorisations de photos et réessayez.');
    } finally { setBusy(false); }
  };
  return { photos, removePhoto, pickPhotos, busy, message };
}
