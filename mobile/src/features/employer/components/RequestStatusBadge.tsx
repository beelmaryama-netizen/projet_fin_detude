import { useEmployerTheme, type EmployerTheme } from '../theme';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts, spacing } from '../../../theme/tokens';
import { employerStatusLabels, type EmployerRequest } from '../types/employer';

const createStatusStyles = (theme: EmployerTheme): Record<EmployerRequest['status'], {
  foreground: string;
  background: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}> => ({
  new: { foreground: theme.blue, background: theme.paleBlue, icon: 'document-text-outline' },
  review: { foreground: theme.blue, background: theme.paleBlue, icon: 'search-outline' },
  waiting: { foreground: theme.ink, background: theme.paleBlue, icon: 'time-outline' },
  'offer-sent': { foreground: theme.teal, background: theme.paleBlue, icon: 'paper-plane-outline' },
  confirmed: { foreground: theme.success, background: theme.successSurface, icon: 'checkmark-circle-outline' },
});

export function RequestStatusBadge({ status }: { status: EmployerRequest['status'] }) {
  const theme = useEmployerTheme();
  const statusStyles = createStatusStyles(theme);
  const styles = createStyles(theme);

  const palette = statusStyles[status];
  const label = employerStatusLabels[status];
  return <View style={[styles.badge, { backgroundColor: palette.background }]} accessible accessibilityLabel={`Statut : ${label}`}>
    <Ionicons name={palette.icon} size={16} color={palette.foreground} accessible={false} />
    <AppText variant="caption" style={[styles.label, { color: palette.foreground }]}>{label}</AppText>
  </View>;
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  badge: { flexDirection: 'row', alignSelf: 'flex-start', maxWidth: '100%', alignItems: 'center', gap: spacing.xs, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  label: { flexShrink: 1, fontFamily: fonts.medium },
}));
