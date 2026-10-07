import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { colors, radii, spacing } from '../../../theme/tokens';
import type { ClientTabScreenProps } from '../../../navigation/types';
import { requestCategories } from '../../requests/data/requestCategories';
import { ClientLayout } from '../components/ClientLayout';
import { ReservationCard } from '../components/ReservationCard';
import { useClientHome } from '../hooks/useClientHome';

const categoryTheme = {
  RESIDENTIAL: { backgroundColor: '#FFF4DE', iconColor: '#FF9F0A' },
  COMMERCIAL: { backgroundColor: '#EAF5FF', iconColor: '#1389E8' },
  INDUSTRIAL: { backgroundColor: '#F2EAFE', iconColor: '#7142D9' },
  MEDICAL: { backgroundColor: '#E8F8F1', iconColor: '#0A9B70' },
} as const;

export function ClientHomeScreen({ navigation }: ClientTabScreenProps<'ClientHomeScreen'>) {
  const home = useClientHome(navigation);
  const firstName = home.firstName || 'Marie';

  return (
    <ClientLayout
      title={`Bonjour, ${firstName} 👋`}
      subtitle="Que voulez-vous nettoyer aujourd’hui ?"
      onNotifications={() => navigation.navigate('Notifications')}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Créer une demande de service"
        onPress={() => home.startRequest()}
        style={({ pressed }) => [styles.primaryCard, pressed && styles.pressed]}
      >
        <View style={styles.serviceIcon}>
          <Ionicons name="home-outline" size={34} color={colors.primary} accessible={false} />
        </View>
        <View style={styles.cardText}>
          <AppText variant="heading">Demande de service</AppText>
          <AppText variant="label" style={styles.muted}>Résidentiel ou commercial</AppText>
        </View>
        <View style={styles.arrowCircle}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} accessible={false} />
        </View>
      </Pressable>

      <View style={styles.categories}>
        {requestCategories
          .filter(category => category.value !== 'OTHER')
          .map(category => {
            const theme = categoryTheme[category.value as keyof typeof categoryTheme];
            return (
              <Pressable
                key={category.value}
                onPress={() => home.startRequest(category.value)}
                accessibilityRole="button"
                accessibilityLabel={`Demander un service : ${category.title}`}
                style={({ pressed }) => [
                  styles.category,
                  { backgroundColor: theme.backgroundColor },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name={category.icon} size={34} color={theme.iconColor} accessible={false} />
                <AppText variant="label" style={styles.categoryTitle}>{category.title}</AppText>
              </Pressable>
            );
          })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="heading" accessibilityRole="header">Mes prochaines réservations</AppText>
          <Pressable onPress={() => navigation.navigate('ClientReservations')} accessibilityRole="button">
            <AppText variant="label" style={styles.link}>Voir tout ›</AppText>
          </Pressable>
        </View>

        {home.reservations.length ? (
          home.reservations.map(reservation => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onPress={() => navigation.navigate('ReservationDetails', { id: reservation.id })}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <AppText>Aucune réservation à venir.</AppText>
            <Button title="Demander un service" variant="secondary" onPress={() => home.startRequest()} />
          </View>
        )}
      </View>
    </ClientLayout>
  );
}

const styles = StyleSheet.create({
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: '#D8E8FB',
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.md,
    shadowColor: '#0B3D78',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  serviceIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paleBlue,
    borderRadius: 20,
  },
  cardText: { flex: 1, gap: spacing.xs },
  muted: { color: colors.muted },
  arrowCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paleBlue,
  },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  category: {
    flexGrow: 1,
    flexBasis: '42%',
    minHeight: 116,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  categoryTitle: { textAlign: 'center', color: colors.ink },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  link: { color: colors.primary },
  empty: { gap: spacing.md },
});
