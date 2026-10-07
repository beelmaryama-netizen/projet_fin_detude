import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts, spacing } from '../../../theme/tokens';
import { employerTheme } from '../theme';
import { employerStatusLabels, type EmployerRequest } from '../types/employer';

const statusStyles: Record<EmployerRequest['status'], {
  foreground: string;
  background: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}> = {
  new: { foreground: '#8DCBFF', background: '#17467A', icon: 'document-text-outline' },
  review: { foreground: '#C5BEFF', background: '#353664', icon: 'search-outline' },
  waiting: { foreground: '#FFDA89', background: '#4C4025', icon: 'time-outline' },
  'offer-sent': { foreground: employerTheme.teal, background: '#144757', icon: 'paper-plane-outline' },
  confirmed: { foreground: employerTheme.success, background: '#17463F', icon: 'checkmark-circle-outline' },
};

export function RequestStatusBadge({ status }: { status: EmployerRequest['status'] }) {
  const palette = statusStyles[status];
  const label = employerStatusLabels[status];
  return <View style={[styles.badge, { backgroundColor: palette.background }]} accessible accessibilityLabel={`Statut : ${label}`}>
    <Ionicons name={palette.icon} size={16} color={palette.foreground} accessible={false} />
    <AppText variant="caption" style={[styles.label, { color: palette.foreground }]}>{label}</AppText>
  </View>;
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignSelf: 'flex-start', maxWidth: '100%', alignItems: 'center', gap: spacing.xs, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  label: { flexShrink: 1, fontFamily: fonts.medium },
});
