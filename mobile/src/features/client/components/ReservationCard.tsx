import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../../../components/Button';
import { AppText } from '../../../components/AppText';
import { spacing, type ThemeColors } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { formatReservation, reservationStatusLabels } from '../services/clientFormatters';
import { Card } from '../../../components/Card';
import { StatusChip } from '../../../components/StatusChip';
import type { ClientReservation } from '../types/reservation';

export function ReservationCard({ reservation, onPress }: { reservation: ClientReservation; onPress?: () => void }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const formatted = formatReservation(reservation);
  return <Card>
    <StatusChip label={reservationStatusLabels[reservation.status]} tone={reservation.status === 'CONFIRMED' || reservation.status === 'COMPLETED' ? 'success' : 'info'} />
    <AppText variant="heading">{reservation.serviceTitle}</AppText>
    <View style={styles.detail}><Ionicons name="calendar-outline" size={20} color={colors.primary} accessible={false} /><AppText variant="label" style={styles.text}>{formatted.date}</AppText></View>
    <View style={styles.detail}><Ionicons name="time-outline" size={20} color={colors.primary} accessible={false} /><AppText variant="label" style={styles.text}>{formatted.time}</AppText></View>
    <View style={styles.detail}><Ionicons name="location-outline" size={20} color={colors.primary} accessible={false} /><AppText variant="label" style={[styles.text, styles.muted]}>{reservation.address}</AppText></View>
    {onPress && <Button title="Voir la réservation" onPress={onPress} icon="arrow-forward" />}
  </Card>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, text: { flex: 1 }, muted: { color: colors.muted },
});
