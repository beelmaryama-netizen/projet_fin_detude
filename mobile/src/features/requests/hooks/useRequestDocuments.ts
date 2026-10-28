import { useState } from 'react';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import { MAX_DOCUMENTS, MAX_DOCUMENT_BYTES, type RequestDocument } from '../types/business';
export function useRequestDocuments() {
  const documents = useRequestDraftStore(state => state.documents);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const pick = async () => {
    if (busy || documents.length >= MAX_DOCUMENTS) return;
    const key = useRequestDraftStore.getState().submissionKey;
    setMessage(undefined); setBusy(Platform.OS !== 'web');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true, copyToCacheDirectory: true, base64: false });
      const draft = useRequestDraftStore.getState();
      if (result.canceled || draft.submissionKey !== key) return;
      const accepted = [...draft.documents]; let rejected = false;
      for (const asset of result.assets) {
        if (!asset.size || asset.size > MAX_DOCUMENT_BYTES || !asset.name.toLowerCase().endsWith('.pdf') || (asset.mimeType && asset.mimeType !== 'application/pdf') || accepted.length >= MAX_DOCUMENTS || accepted.some(item => item.name === asset.name && item.size === asset.size)) { rejected = true; continue; }
        const document: RequestDocument = { id: `pdf-${Date.now()}-${accepted.length}`, uri: asset.uri, name: asset.name, size: asset.size, mimeType: 'application/pdf' };
        accepted.push(document);
      }
      draft.setDocuments(accepted);
      if (rejected) setMessage('Certains fichiers n’ont pas été ajoutés : PDF uniquement, 10 Mo par fichier, 5 documents maximum, sans doublons.');
    } catch { setMessage('Impossible d’ouvrir les documents. Veuillez réessayer.'); }
    finally { setBusy(false); }
  };
  return { documents, busy, message, pick, remove: (id: string) => { const draft = useRequestDraftStore.getState(); draft.setDocuments(draft.documents.filter(item => item.id !== id)); } };
}
