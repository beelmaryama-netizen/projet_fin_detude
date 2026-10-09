import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { fonts, radii, spacing } from '../../../theme/tokens';
import { categoryTitle } from '../../requests/data/requestCategories';
import { formatEmployerDate } from '../services/mockEmployerService';
import { employerTheme } from '../theme';
import type { EmployerRequest } from '../types/employer';
import { EmployerActionButton } from './EmployerActionButton';
import { RequestStatusBadge } from './RequestStatusBadge';

export function getEmployerRequestAction(status: EmployerRequest['status']): string | undefined {
  switch (status) {
    case 'new':
    case 'review':
      return 'Analyser';
    case 'waiting':
      return 'Préparer l’offre';
    case 'offer-sent':
      return 'Voir l’offre';
    case 'confirmed':
      return undefined;
  }
}

function RequestDetail({ icon, text }: { icon: ComponentProps<typeof Ionicons>['name']; text: string }) {
  return <View style={styles.detail}>
    <Ionicons name={icon} size={17} color={employerTheme.blue} accessible={false} />
    <AppText variant="label" style={styles.detailText}>{text}</AppText>
  </View>;
}

export function EmployerRequestCard({ request, onView, onAction }: {
  request: EmployerRequest;
  onView: () => void;
  onAction: () => void;
}) {
  const action = getEmployerRequestAction(request.status);
  return <LinearGradient colors={['#15345F', '#0D2448']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
    <View style={styles.heading}>
      <RequestStatusBadge status={request.status} />
      <AppText variant="heading" accessibilityRole="header" style={styles.service}>{request.serviceType}</AppText>
      <View style={styles.client}>
        <Ionicons name="person-outline" size={17} color={employerTheme.muted} accessible={false} />
        <AppText style={styles.clientName}>{request.clientName}</AppText>
      </View>
      <AppText variant="caption" style={styles.category}>{categoryTitle(request.category)}</AppText>
    </View>
    <View style={styles.details}>
      <RequestDetail icon="document-text-outline" text={`Reçue le ${formatEmployerDate(request.submittedAt)}`} />
      <RequestDetail icon="calendar-outline" text={`Date souhaitée : ${formatEmployerDate(request.preferredDate)}`} />
      <RequestDetail icon="location-outline" text={request.location} />
    </View>
    <View style={styles.actions}>
      <EmployerActionButton title="Voir la demande" variant="secondary" onPress={onView} style={styles.action}
        accessibilityHint={`Consulter les détails de la demande de ${request.clientName}`} />
      {action && <EmployerActionButton title={action} onPress={onAction} style={styles.action}
        accessibilityHint={`${action} pour la demande de ${request.clientName}`} />}
    </View>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.md, backgroundColor: employerTheme.surface, borderWidth: 1, borderColor: employerTheme.border, borderRadius: radii.card },
  heading: { gap: spacing.sm },
  service: { color: employerTheme.text, fontSize: 19, lineHeight: 27 },
  client: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clientName: { flex: 1, fontFamily: fonts.medium, color: employerTheme.text },
  category: { color: employerTheme.muted },
  details: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#294D8366' },
  detail: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  detailText: { flex: 1, color: employerTheme.muted, fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flexGrow: 1, flexBasis: 125, minWidth: 110 },
});
