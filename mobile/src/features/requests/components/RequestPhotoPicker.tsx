import { Image, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { colors, radii, spacing } from '../../../theme/tokens';
import { MAX_REQUEST_PHOTOS } from '../types/request';
import { useRequestPhotos } from '../hooks/useRequestPhotos';

export function RequestPhotoPicker() {
  const picker = useRequestPhotos();
  return <View style={styles.group}>
    <AppText variant="label">Photos avant (facultatif)</AppText>
    <AppText variant="caption" accessibilityLiveRegion="polite" style={styles.muted}>{picker.photos.length} sur {MAX_REQUEST_PHOTOS} photos ajoutées</AppText>
    <View style={styles.photos}>
      {picker.photos.map((photo, index) => <View key={photo.id} style={styles.photo}>
        <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" accessibilityLabel={`Photo avant ${index + 1}`} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Supprimer la photo ${index + 1}`} onPress={() => picker.removePhoto(photo.id)} style={styles.remove}>
          <Ionicons name="close-circle" size={28} color={colors.white} accessible={false} />
        </Pressable>
      </View>)}
    </View>
    <MessageBanner tone="info" message={picker.message} />
    <Button title={picker.photos.length >= MAX_REQUEST_PHOTOS ? '5 photos maximum' : 'Ajouter des photos'} icon="images-outline" variant="secondary"
      loading={picker.busy} disabled={picker.photos.length >= MAX_REQUEST_PHOTOS} onPress={() => void picker.pickPhotos()} />
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.sm }, muted: { color: colors.muted }, photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 112, height: 112, borderRadius: radii.control, overflow: 'hidden', backgroundColor: colors.disabled },
  image: { width: '100%', height: '100%' }, remove: { position: 'absolute', top: 0, right: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A2E99', borderBottomLeftRadius: radii.control },
});
