import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { AppPalette } from '../../../theme/palette';
import { formatReservation } from '../services/mockClientService';
import type { ClientReservation } from '../types/reservation';

export function ReservationCard({ reservation, onPress }: { reservation: ClientReservation; onPress?: () => void }) {
  const formatted = formatReservation(reservation);
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const content = (
    <>
      <View style={styles.topRow}>
        <View style={styles.serviceIcon}>
          <Ionicons name="sparkles-outline" size={24} color={palette.primary} accessible={false} />
        </View>
        <View style={styles.main}>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color={palette.success} accessible={false} />
            <AppText variant="caption" style={styles.status}>Confirmée</AppText>
          </View>
          <AppText variant="heading" style={styles.title}>{reservation.serviceTitle}</AppText>
        </View>
        {onPress && <Ionicons name="chevron-forward" size={24} color={palette.primary} accessible={false} />}
      </View>

      <View style={styles.divider} />

      <View style={styles.detail}>
        <Ionicons name="calendar-outline" size={20} color={palette.primary} accessible={false} />
        <AppText variant="label" style={styles.text}>{formatted.date}</AppText>
      </View>
      <View style={styles.detail}>
        <Ionicons name="time-outline" size={20} color={palette.primary} accessible={false} />
        <AppText variant="label" style={styles.text}>{formatted.time}</AppText>
      </View>
      <View style={styles.detail}>
        <Ionicons name="location-outline" size={20} color={palette.primary} accessible={false} />
        <AppText variant="label" style={styles.address}>{reservation.address}</AppText>
      </View>

      {onPress && (
        <View style={styles.cta}>
          <AppText variant="label" style={styles.ctaText}>Voir la réservation</AppText>
          <Ionicons name="arrow-forward" size={20} color={palette.white} accessible={false} />
        </View>
      )}
    </>
  );

  if (!onPress) return <View style={styles.card}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Voir la réservation ' + reservation.serviceTitle}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: palette.surface,
      padding: spacing.md,
      gap: spacing.sm,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: palette.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    serviceIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.iconSoft,
    },
    main: { flex: 1, gap: spacing.xs },
    badge: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: 999,
      backgroundColor: palette.successSurface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    status: { color: palette.success },
    title: { fontSize: 19, lineHeight: 25 },
    divider: { height: 1, backgroundColor: palette.border, marginVertical: spacing.xs },
    detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    text: { flex: 1 },
    address: { flex: 1, color: palette.textSecondary },
    cta: {
      marginTop: spacing.sm,
      minHeight: 50,
      borderRadius: 16,
      paddingHorizontal: spacing.md,
      backgroundColor: palette.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    ctaText: { color: palette.white },
    pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
  });
}
