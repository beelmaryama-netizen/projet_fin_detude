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

export function ClientHomeScreen({ navigation }: ClientTabScreenProps<'ClientHomeScreen'>) {
  const home = useClientHome(navigation);
  return <ClientLayout title={`Bonjour, ${home.firstName} 👋`} subtitle="Que voulez-vous nettoyer aujourd’hui ?" onNotifications={() => navigation.navigate('Notifications')}>
    <Pressable accessibilityRole="button" accessibilityLabel="Demande de service. Résidentiel ou commercial" onPress={() => home.startRequest()}
      style={({ pressed }) => [styles.primaryCard, pressed && styles.pressed]}>
      <View style={styles.serviceIcon}><Ionicons name="home-outline" size={32} color={colors.primary} accessible={false} /></View>
      <View style={styles.cardText}><AppText variant="heading">Demande de service</AppText><AppText variant="label" style={styles.muted}>Résidentiel ou commercial</AppText></View>
      <Ionicons name="chevron-forward" size={24} color={colors.primary} accessible={false} />
    </Pressable>
    <View style={styles.categories}>
      {requestCategories.filter(category => category.value !== 'OTHER').map(category => <Pressable key={category.value} onPress={() => home.startRequest(category.value)}
        accessibilityRole="button" accessibilityLabel={`Demander un service : ${category.title}`}
        style={({ pressed }) => [styles.category, pressed && styles.pressed]}>
        <Ionicons name={category.icon} size={28} color={category.value === 'MEDICAL' ? colors.teal : colors.primary} accessible={false} />
        <AppText variant="label" style={styles.categoryTitle}>{category.title}</AppText>
      </Pressable>)}
    </View>
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header">Mes prochaines réservations</AppText>
      {home.reservations.length ? home.reservations.map(reservation => <ReservationCard key={reservation.id} reservation={reservation} onPress={() => navigation.navigate('ReservationDetails', { id: reservation.id })} />)
        : <View style={styles.empty}><AppText>Aucune réservation à venir.</AppText><Button title="Demander un service" variant="secondary" onPress={() => home.startRequest()} /></View>}
    </View>
  </ClientLayout>;
}
const styles = StyleSheet.create({
  primaryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.card, padding: spacing.md },
  serviceIcon: { padding: spacing.sm, backgroundColor: colors.paleBlue, borderRadius: radii.control },
  cardText: { flex: 1, gap: spacing.xs }, muted: { color: colors.muted }, pressed: { opacity: 0.75 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  category: { flexGrow: 1, flexBasis: '42%', minHeight: 108, justifyContent: 'center', alignItems: 'center', padding: spacing.md, gap: spacing.sm, borderRadius: radii.card, backgroundColor: colors.paleBlue },
  categoryTitle: { textAlign: 'center' }, section: { gap: spacing.md }, empty: { gap: spacing.md },
});
