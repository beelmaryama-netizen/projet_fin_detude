import { View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { MessageBanner } from '../../../components/MessageBanner';
import { spacing } from '../../../theme/tokens';
import { useRequestDocuments } from '../hooks/useRequestDocuments';
import { MAX_DOCUMENTS } from '../types/business';
export function RequestDocumentPicker() {
  const picker = useRequestDocuments();
  return <View style={{ gap: spacing.sm }}>
    <AppText variant="heading">Documents (facultatif)</AppText>
    <AppText variant="caption">PDF · 10 Mo par fichier · {picker.documents.length}/{MAX_DOCUMENTS} documents. Conservés localement dans cette démonstration.</AppText>
    {picker.documents.map(document => <Card key={document.id}>
      <AppText>{document.name}</AppText><AppText variant="caption">PDF · {(document.size / 1024 / 1024).toFixed(2)} Mo</AppText>
      <Button title={`Supprimer ${document.name}`} variant="link" onPress={() => picker.remove(document.id)} />
    </Card>)}
    <MessageBanner message={picker.message} />
    <Button title="Ajouter des PDF" variant="secondary" icon="document-attach-outline" disabled={picker.documents.length >= MAX_DOCUMENTS} loading={picker.busy} onPress={() => void picker.pick()} />
  </View>;
}
