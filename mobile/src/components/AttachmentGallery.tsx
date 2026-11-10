import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, View, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { AppText } from './AppText';
import { Button } from './Button';
import { MessageBanner } from './MessageBanner';
import { useAppTheme } from '../theme/ThemeProvider';
export function AttachmentGallery({ photos = [], documents = [] }: { photos?: { id: string; uri: string; name?: string }[]; documents?: { id: string; uri: string; name: string; size?: number }[] }) {
 const { colors } = useAppTheme(); const [uri, setUri] = useState<string>(); const [error, setError] = useState<string>();
 async function open(uri: string) { try { setError(undefined); if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Ouvrir le document', UTI: 'com.adobe.pdf' }); else await Linking.openURL(uri); } catch { setError('Impossible d’ouvrir ce fichier. Vérifiez qu’il est disponible sur cet appareil.'); } }
 return <View style={{ gap: 16 }}><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{photos.map((p, i) => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={'Agrandir la photo ' + (i + 1)} onPress={() => setUri(p.uri)}><Image source={{ uri: p.uri }} style={{ width: 112, height: 112, borderRadius: 12 }} /></Pressable>)}</View>
 {documents.map(d => <Button key={d.id} title={'Ouvrir ' + d.name} variant="secondary" onPress={() => void open(d.uri)} />)}
 <MessageBanner message={error} />
 <Modal visible={!!uri} onRequestClose={() => setUri(undefined)}><SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}><Button title="Fermer l’aperçu" onPress={() => setUri(undefined)} />{uri && <ScrollView contentContainerStyle={{ flexGrow: 1 }}><Image source={{ uri }} resizeMode="contain" accessibilityLabel="Photo agrandie" style={{ flex: 1, minHeight: 400 }} /></ScrollView>}</SafeAreaView></Modal>
 </View>;
}
