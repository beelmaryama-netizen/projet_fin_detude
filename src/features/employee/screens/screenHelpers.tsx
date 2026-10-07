import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../../theme/tokens';
import { Action, Card, EmployeeLayout, StatusBadge } from '../components/EmployeeUI';
import type { EmployeeMission } from '../types/employee';

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value));
}
export function formatTime(value?: string) {
  return value ? new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'Non enregistrée';
}
export function plannedDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h${rest ? ` ${rest.toString().padStart(2, '0')}` : ''}` : `${rest} min`;
}
export function MissionUnavailable({ onBack }: { onBack: () => void }) {
  return (
    <EmployeeLayout title="Mission introuvable" onBack={onBack}>
      <Card>
        <Text style={screenStyles.heading}>Cette mission n’est pas disponible.</Text>
        <Text style={screenStyles.body}>Revenez à vos missions pour consulter les interventions qui vous sont attribuées.</Text>
        <Action title="Retour à mes missions" onPress={onBack} />
      </Card>
    </EmployeeLayout>
  );
}
export function MissionIdentity({ mission }: { mission: EmployeeMission }) {
  return (
    <View style={screenStyles.stack}>
      <View style={screenStyles.spread}>
        <Text style={screenStyles.reference}>{mission.reference}</Text>
        <StatusBadge status={mission.status} />
      </View>
      <Text style={screenStyles.heading}>{mission.service}</Text>
      <Text style={screenStyles.body}>{mission.client}</Text>
    </View>
  );
}
export function Bullet({ children, checked = false }: { children: React.ReactNode; checked?: boolean }) {
  return <View style={screenStyles.bullet}><Ionicons name={checked ? 'checkmark-circle' : 'ellipse'} size={checked ? 18 : 6} color={checked ? colors.teal : colors.primary} style={{ marginTop: checked ? 2 : 8 }} /><Text style={[screenStyles.body, { flex: 1 }]}>{children}</Text></View>;
}
export const screenStyles = StyleSheet.create({
  stack: { gap: 12 },
  gap: { gap: 20 },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  heading: { fontFamily: fonts.title, color: colors.ink, fontSize: 20, lineHeight: 29 },
  body: { fontFamily: fonts.body, color: colors.muted, fontSize: 15, lineHeight: 23 },
  label: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15, lineHeight: 22 },
  reference: { fontFamily: fonts.bold, color: colors.primary, fontSize: 13, letterSpacing: 0.5 },
  caption: { fontFamily: fonts.body, color: colors.muted, fontSize: 13, lineHeight: 20 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  error: { fontFamily: fonts.body, color: colors.danger, fontSize: 13, lineHeight: 20 },
});
