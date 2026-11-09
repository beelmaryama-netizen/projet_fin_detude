import { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenLayout } from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { AsyncState } from '../../../components/AsyncState';
import { MessageBanner } from '../../../components/MessageBanner';
import { useEmployeeMission, useEmployeeMutation, useEmployeeUser, employeeError } from '../hooks/useEmployeeData';
import { employeeService } from '../services/employeeService';
import { useEmployeeDraftStore } from '../store/employeeDraftStore';
import { useAuthStore } from '../../../store/authStore';
import type { EmployeeScreenProps } from '../navigation/types';
import type { MissionPhoto } from '../types/employee';
export function MissionPhotoScreen({ route, navigation }: EmployeeScreenProps<'BeforePhotos'> | EmployeeScreenProps<'AfterPhotos'>) {
 const { id } = route.params; const phase = route.name === 'BeforePhotos' ? 'BEFORE' : 'AFTER';
 const user = useEmployeeUser(); const query = useEmployeeMission(id); const mission = query.data;
 const draft = useEmployeeDraftStore(s => s.drafts[id]); const update = useEmployeeDraftStore(s => s.update);
 const planned = mission?.status === 'PLANNED' && phase === 'BEFORE';
 const editable = planned || mission?.status === 'IN_PROGRESS';
 const photos = planned ? draft?.photos ?? [] : mission?.photos.filter(p => p.phase === phase) ?? [];
 const [error, setError] = useState<string>(); const [picking, setPicking] = useState(false); const lock = useRef(false); const mounted = useRef(true);
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 const add = useEmployeeMutation(employeeService.addPhoto);
 const remove = useEmployeeMutation(employeeService.removePhoto);
 const start = useEmployeeMutation(employeeService.start, () => { update(id, { photos: [] }); navigation.replace('MissionActive', { id }); });
 const busy = picking || add.isPending || remove.isPending || start.isPending;
 async function pick(camera: boolean) {
  if (lock.current || busy || !editable || photos.length >= 5) return;
  lock.current = true; setPicking(true); setError(undefined);
  try {
   const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
   if (!permission.granted) throw new Error('Autorisez l’accès dans les réglages de votre appareil.');
   const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
   if (!mounted.current || result.canceled || !result.assets[0] || useAuthStore.getState().session?.user.id !== user.id || useEmployeeDraftStore.getState().ownerId !== user.id) return;
   const photo: MissionPhoto = { id: 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2), uri: result.assets[0].uri, phase, createdAt: new Date().toISOString() };
   if (planned) update(id, { photos: [...(useEmployeeDraftStore.getState().drafts[id]?.photos ?? []), photo].slice(0, 5) });
   else await add.mutateAsync({ id, photo });
  } catch (e) { if (mounted.current) setError(employeeError(e)); } finally { lock.current = false; if (mounted.current) setPicking(false); }
 }
 return <ScreenLayout title={phase === 'BEFORE' ? 'Photos avant' : 'Photos après'} subtitle="Ajoutez jusqu’à 5 photos. Évitez les personnes et les documents confidentiels." onBack={() => navigation.goBack()}>
  <AsyncState query={query}>{mission && <>
   <AppText>{photos.length} / 5 photos</AppText>
   {photos.map((photo, index) => <View key={photo.id} style={{ gap: 8 }}><Image source={{ uri: photo.uri }} accessibilityLabel={'Photo ' + (index + 1)} style={{ height: 200, width: '100%', borderRadius: 12 }} resizeMode="contain" />
    {editable && <Button title={'Supprimer la photo ' + (index + 1)} variant="secondary" disabled={busy} onPress={() => planned ? update(id, { photos: photos.filter(p => p.id !== photo.id) }) : remove.mutate({ id, photoId: photo.id })} />}
   </View>)}
   {editable && <><Button title="Choisir dans la galerie" disabled={busy || photos.length >= 5} onPress={() => void pick(false)} /><Button title="Prendre une photo" variant="secondary" disabled={busy || photos.length >= 5} onPress={() => void pick(true)} /></>}
   <MessageBanner message={error || (remove.error ? employeeError(remove.error) : start.error ? employeeError(start.error) : undefined)} />
   {planned && <Button title="Confirmer et démarrer" loading={start.isPending} disabled={busy} onPress={() => start.mutate({ id, photos })} />}
   {mission.status === 'IN_PROGRESS' && <Button title={phase === 'AFTER' ? 'Continuer vers le rapport' : 'Revenir à la mission'} disabled={busy} onPress={() => phase === 'AFTER' ? navigation.navigate('MissionReport', { id }) : navigation.navigate('MissionActive', { id })} />}
  </>}</AsyncState>
 </ScreenLayout>;
}
