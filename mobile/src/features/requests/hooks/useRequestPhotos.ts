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
  const acceptResult = useCallback((result: ImagePicker.ImagePickerResult, ownerId: string | null) => {
    if (result.canceled || ownerId !== useRequestDraftStore.getState().ownerId) return;
    const candidates = result.assets.map((asset, index) => ({ id: `${Date.now()}-${index}-${asset.assetId ?? asset.uri}`, uri: asset.uri, name: asset.fileName ?? `Photo ${index + 1}` }));
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
  const pickPhotos = async () => {
    const draft = useRequestDraftStore.getState();
    if (draft.photos.length >= MAX_REQUEST_PHOTOS || busy) return;
    setMessage(undefined);
    // On web, a dismissed picker does not always resolve. Do not leave the UI locked.
    setBusy(Platform.OS !== 'web');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true,
        selectionLimit: MAX_REQUEST_PHOTOS - draft.photos.length, quality: 0.8, exif: false, base64: false });
      acceptResult(result, draft.ownerId);
    } catch {
      setMessage('Impossible d’ouvrir la galerie. Vérifiez les autorisations de photos et réessayez.');
    } finally { setBusy(false); }
  };
  return { photos, removePhoto, pickPhotos, busy, message };
}
