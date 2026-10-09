import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../../../components/Button';
import { AppText } from '../../../components/AppText';
import { colors, radii, spacing } from '../../../theme/tokens';
import { formatReservation } from '../services/mockClientService';
import type { ClientReservation } from '../types/reservation';

export function ReservationCard({ reservation, onPress }: { reservation: ClientReservation; onPress?: () => void }) {
  const formatted = formatReservation(reservation);
  return <View style={styles.card}>
    <View style={styles.badge}><Ionicons name="checkmark-circle" size={16} color={colors.success} accessible={false} /><AppText variant="caption" style={styles.status}>Confirmée</AppText></View>
    <AppText variant="heading">{reservation.serviceTitle}</AppText>
    <View style={styles.detail}><Ionicons name="calendar-outline" size={20} color={colors.primary} accessible={false} /><AppText variant="label" style={styles.text}>{formatted.date}</AppText></View>
    <View style={styles.detail}><Ionicons name="time-outline" size={20} color={colors.primary} accessible={false} /><AppText variant="label" style={styles.text}>{formatted.time}</AppText></View>
    <View style={styles.detail}><Ionicons name="location-outline" size={20} color={colors.primary} accessible={false} /><AppText variant="label" style={[styles.text, styles.muted]}>{reservation.address}</AppText></View>
    {onPress && <Button title="Voir la réservation" onPress={onPress} icon="arrow-forward" />}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border },
  badge: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: spacing.xs, borderRadius: radii.control, backgroundColor: colors.successSurface, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  status: { color: colors.success }, detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, text: { flex: 1 }, muted: { color: colors.muted },
});
