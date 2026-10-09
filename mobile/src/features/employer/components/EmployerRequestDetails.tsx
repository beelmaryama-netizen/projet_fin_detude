import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { radii, spacing } from '../../../theme/tokens';
import { categoryTitle } from '../../requests/data/requestCategories';
import { formatEmployerDate } from '../services/mockEmployerService';
import { employerTheme } from '../theme';
import type { EmployerRequest } from '../types/employer';
import { getEmployerRequestAction } from './EmployerRequestCard';
import { EmployerActionButton } from './EmployerActionButton';
import { RequestStatusBadge } from './RequestStatusBadge';

const actionNotices = {
  new: 'Consultez les informations ci-dessous pour analyser la demande. En mode démo, le statut reste inchangé.',
  review: 'Consultez les informations ci-dessous pour poursuivre l’analyse. En mode démo, le statut reste inchangé.',
  waiting: 'La préparation des offres sera disponible prochainement. Cette démonstration ne transmet aucune offre au client.',
  'offer-sent': 'Le détail de l’offre sera disponible prochainement. Aucune offre réelle n’est associée à cette demande de démonstration.',
  confirmed: 'Cette demande est confirmée dans les données de démonstration.',
} as const;

export function EmployerRequestDetails({ request, showAction, onClose }: {
  request: EmployerRequest; showAction: boolean; onClose: () => void;
}) {
  const [actionVisible, setActionVisible] = useState(showAction);
  const action = getEmployerRequestAction(request.status);
  return <Modal visible animationType="slide" transparent onRequestClose={onClose}>
    <SafeAreaView style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient colors={['#17345F', '#0D2448']} style={styles.dialog} accessibilityViewIsModal onAccessibilityEscape={onClose}>
          <View style={styles.heading}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>Détail de la demande</AppText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Ionicons name="close" size={23} color={employerTheme.text} accessible={false} />
            </Pressable>
          </View>
          <AppText variant="caption" style={styles.muted}>{request.id} · Données de démonstration</AppText>
          <RequestStatusBadge status={request.status} />
          <View style={styles.group}>
            <AppText variant="heading" style={styles.text}>{request.clientName}</AppText>
            <AppText style={styles.text}>{request.serviceType}</AppText>
            <AppText variant="label" style={styles.muted}>{categoryTitle(request.category)}</AppText>
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
          {actionVisible && <View style={styles.notice} accessibilityRole="alert">
            <Ionicons name="information-circle-outline" size={21} color={employerTheme.blue} accessible={false} />
            <AppText variant="label" style={styles.noticeText}>{actionNotices[request.status]}</AppText>
          </View>}
          {action && !actionVisible && <EmployerActionButton title={action} onPress={() => setActionVisible(true)} icon="arrow-forward" />}
          <EmployerActionButton title="Fermer la demande" variant="secondary" onPress={onClose} />
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#020A1CDE' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.md },
  dialog: { width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: employerTheme.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: employerTheme.border },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, color: employerTheme.text, fontSize: 20, lineHeight: 28 },
  close: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#294D8355', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  group: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#294D8380' },
  text: { color: employerTheme.text },
  muted: { color: employerTheme.muted },
  sectionLabel: { color: employerTheme.blue },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: 12, borderWidth: 1, borderColor: '#366094', borderRadius: radii.control, backgroundColor: '#103662' },
  noticeText: { flex: 1, color: '#D4E8FF', lineHeight: 21 },
});
