import { RequestSummary } from '../../requests/components/RequestSummary';
import { AttachmentGallery } from '../../../components/AttachmentGallery';
import { useEmployerTheme, type EmployerTheme } from '../theme';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { radii, spacing } from '../../../theme/tokens';
import { categoryTitle } from '../../requests/data/requestCategories';
import { formatEmployerDate } from '../services/mockEmployerService';
import type { EmployerRequest } from '../types/employer';
import type { AdminClient } from '../types/admin';
import { EmployerActionButton } from './EmployerActionButton';
import { RequestStatusBadge } from './RequestStatusBadge';

export function EmployerRequestDetails({ request, onClose, client, onAnalyze, onEstimate, onOffer, onClient, onMission }: {
  request: EmployerRequest; onClose: () => void; client?: AdminClient;
  onAnalyze: () => void; onEstimate: () => void; onOffer?: () => void; onClient?: () => void; onMission?: () => void;
}) {
  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  return <Modal visible animationType="slide" transparent onRequestClose={onClose}>
    <SafeAreaView style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[theme.surface, theme.surface]} style={styles.dialog} accessibilityViewIsModal onAccessibilityEscape={onClose}>
          <View style={styles.heading}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>Détail de la demande</AppText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Ionicons name="close" size={23} color={theme.text} accessible={false} />
            </Pressable>
          </View>
          <AppText variant="caption" style={styles.muted}>{request.id} · Données de démonstration</AppText>
          <RequestStatusBadge status={request.status} />
          <View style={styles.group}>
            <AppText variant="heading" style={styles.text}>{request.clientName}</AppText>
            <AppText style={styles.text}>{request.serviceType}</AppText>
            <AppText variant="label" style={styles.muted}>{categoryTitle(request.category)}</AppText>
            {client && <><AppText style={styles.text}>{client.email}</AppText><AppText style={styles.text}>{client.phone}</AppText></>}
          </View>
          <View style={styles.group}>
            <AppText variant="label" style={styles.text}>Reçue le {formatEmployerDate(request.submittedAt)}</AppText>
            <AppText variant="label" style={styles.text}>Date souhaitée : {formatEmployerDate(request.preferredDate)}</AppText>
            <AppText variant="label" style={styles.text}>Lieu : {request.location}</AppText>
          </View>
          <View style={styles.group}>
            <AppText variant="label" style={styles.sectionLabel}>Besoin du client</AppText>
            <AppText style={styles.text}>{request.description}</AppText>
          </View>
          <View style={styles.group}><AppText variant="label" style={styles.sectionLabel}>Photos et documents</AppText>
            {request.dossier ? <><RequestSummary details={request.dossier} photos={request.dossier.photos} schedule={request.dossier.schedule} address={request.dossier.address} /><AttachmentGallery photos={request.dossier.photos} documents={request.dossier.category === 'RESIDENTIAL' ? [] : request.dossier.documents} /></> : <AppText style={styles.muted}>Aucune pièce jointe.</AppText>}
          </View>
          {request.status === 'new' && <EmployerActionButton title="Commencer l’analyse" onPress={onAnalyze} icon="search-outline" />}
          {['new', 'review', 'waiting'].includes(request.status) && <EmployerActionButton title="Créer une estimation" onPress={onEstimate} icon="document-text-outline" />}
          {onOffer && <EmployerActionButton title="Consulter l’offre" variant="secondary" onPress={onOffer} icon="paper-plane-outline" />}
          {onMission && <EmployerActionButton title="Consulter la mission" variant="secondary" onPress={onMission} icon="calendar-outline" />}
          {onClient && <EmployerActionButton title="Voir la fiche client" variant="secondary" onPress={onClient} icon="person-outline" />}
          <EmployerActionButton title="Fermer la demande" variant="secondary" onPress={onClose} />
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#020A1CDE' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.md },
  dialog: { width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: theme.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: theme.border },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, color: theme.text, fontSize: 20, lineHeight: 28 },
  close: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.paleBlue, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  group: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.border },
  text: { color: theme.text },
  muted: { color: theme.muted },
  sectionLabel: { color: theme.blue },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: 12, borderWidth: 1, borderColor: theme.border, borderRadius: radii.control, backgroundColor: theme.paleBlue },
  noticeText: { flex: 1, color: theme.text, lineHeight: 21 },
}));
