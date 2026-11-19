import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AppText } from './AppText';
import { Button } from './Button';
import { MessageBanner } from './MessageBanner';
import { useAppTheme } from '../theme/ThemeProvider';
export function AttachmentGallery({
  photos = [],
  documents = [],
}: {
  photos?: { id: string; uri: string; name?: string }[];
  documents?: { id: string; uri: string; name: string; size?: number }[];
}) {
  const { colors } = useAppTheme();
  const [uri, setUri] = useState<string>();
  const [error, setError] = useState<string>();
  async function open(uri: string) {
    let downloaded: string | undefined;
    try {
      setError(undefined);
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        let local = uri;
        if (/^https?:\/\//.test(uri)) {
          if (!FileSystem.cacheDirectory) throw new Error('Cache indisponible');
          downloaded =
            FileSystem.cacheDirectory +
            'magicpro-document-' +
            Date.now() +
            '.pdf';
          const response = await FileSystem.downloadAsync(uri, downloaded);
          if (response.status !== 200) throw new Error('Document indisponible');
          local = downloaded;
        }
        await Sharing.shareAsync(local, {
          mimeType: 'application/pdf',
          dialogTitle: 'Ouvrir le document',
          UTI: 'com.adobe.pdf',
        });
      } else await Linking.openURL(uri);
    } catch {
      setError(
        'Impossible d’ouvrir ce document. Actualisez le dossier pour renouveler son lien.',
      );
    } finally {
      if (downloaded)
        await FileSystem.deleteAsync(downloaded, { idempotent: true }).catch(
          () => {},
        );
    }
  }
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((p, i) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={'Agrandir la photo ' + (i + 1)}
            onPress={() => setUri(p.uri)}
          >
            <Image
              source={{ uri: p.uri }}
              style={{ width: 112, height: 112, borderRadius: 12 }}
            />
          </Pressable>
        ))}
      </View>
      {documents.map((d) => (
        <Button
          key={d.id}
          title={'Ouvrir ' + d.name}
          variant="secondary"
          onPress={() => void open(d.uri)}
        />
      ))}
      <MessageBanner message={error} />
      <Modal visible={!!uri} onRequestClose={() => setUri(undefined)}>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}
        >
          <Button title="Fermer l’aperçu" onPress={() => setUri(undefined)} />
          {uri && (
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <Image
                source={{ uri }}
                resizeMode="contain"
                accessibilityLabel="Photo agrandie"
                style={{ flex: 1, minHeight: 400 }}
              />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
