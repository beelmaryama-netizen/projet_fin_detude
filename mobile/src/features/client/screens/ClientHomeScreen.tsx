import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { AppPalette } from '../../../theme/palette';
import type { ClientTabScreenProps } from '../../../navigation/types';
import { requestCategories } from '../../requests/data/requestCategories';
import { ClientLayout } from '../components/ClientLayout';
import { ReservationCard } from '../components/ReservationCard';
import { useClientHome } from '../hooks/useClientHome';

const categoryDecor = {
  RESIDENTIAL: { icon: '#FF9B1A', bgLight: '#FFF3DF', bgDark: '#3A2810' },
  COMMERCIAL: { icon: '#1D9BF0', bgLight: '#E9F6FF', bgDark: '#0E2C42' },
  INDUSTRIAL: { icon: '#7657E8', bgLight: '#F1ECFF', bgDark: '#281F4C' },
  MEDICAL: { icon: '#0EAF83', bgLight: '#E8F8F2', bgDark: '#0B362C' },
} as const;

export function ClientHomeScreen({ navigation }: ClientTabScreenProps<'ClientHomeScreen'>) {
  const home = useClientHome(navigation);
  const { palette, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const firstName = home.firstName || 'Marie';

  return (
    <ClientLayout
      title={'Bonjour, ' + firstName + ' 👋'}
      subtitle="Que voulez-vous nettoyer aujourd’hui ?"
      onNotifications={() => navigation.navigate('Notifications')}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Commencer une demande de service"
        onPress={() => home.startRequest()}
        style={({ pressed }) => [styles.heroCard, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={isDark ? ['#102C4B', '#0B223A'] : ['#FFFFFF', '#EEF7FF']}
          style={styles.heroGradient}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="home" size={31} color={palette.primary} accessible={false} />
          </View>
          <View style={styles.heroText}>
            <AppText variant="heading" style={styles.heroTitle}>Demande de service</AppText>
            <AppText style={styles.heroSubtitle}>Résidentiel ou commercial</AppText>
          </View>
          <View style={styles.heroArrow}>
            <Ionicons name="chevron-forward" size={24} color={palette.primary} accessible={false} />
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.categoryGrid}>
        {requestCategories
          .filter(category => category.value !== 'OTHER')
          .map(category => {
            const decor = categoryDecor[category.value as keyof typeof categoryDecor];
            return (
              <Pressable
                key={category.value}
                onPress={() => home.startRequest(category.value)}
                accessibilityRole="button"
                accessibilityLabel={'Service ' + category.title}
                style={({ pressed }) => [
                  styles.categoryCard,
                  { backgroundColor: isDark ? decor.bgDark : decor.bgLight },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.categoryIcon, { backgroundColor: decor.icon + '18' }]}>
                  <Ionicons name={category.icon} size={31} color={decor.icon} accessible={false} />
                </View>
                <AppText variant="label" style={styles.categoryTitle}>{category.title}</AppText>
                <AppText variant="caption" numberOfLines={2} style={styles.categoryDescription}>{category.description}</AppText>
              </Pressable>
            );
          })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeading}>
            <AppText variant="heading" accessibilityRole="header" style={styles.sectionTitle}>Mes prochaines réservations</AppText>
            <AppText variant="caption" style={styles.sectionSubtitle}>Votre prochain service confirmé</AppText>
          </View>
          <Pressable
            onPress={() => navigation.navigate('ClientReservations')}
            accessibilityRole="button"
            accessibilityLabel="Voir toutes les réservations"
            style={styles.seeAll}
          >
            <AppText variant="label" style={styles.seeAllText}>Voir tout</AppText>
            <Ionicons name="chevron-forward" size={18} color={palette.primary} accessible={false} />
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
            <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={28} color={palette.primary} /></View>
            <AppText variant="heading">Aucune réservation</AppText>
            <AppText style={styles.emptyText}>Votre prochaine réservation apparaîtra ici.</AppText>
            <Button title="Demander un service" onPress={() => home.startRequest()} />
          </View>
        )}
      </View>
    </ClientLayout>
  );
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    heroCard: {
      borderRadius: 24,
      shadowColor: palette.shadow,
      shadowOpacity: 0.10,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    heroGradient: {
      minHeight: 116,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: palette.border,
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.md,
    },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.iconSoft,
    },
    heroText: { flex: 1, gap: 2 },
    heroTitle: { fontSize: 21, lineHeight: 28 },
    heroSubtitle: { color: palette.textSecondary },
    heroArrow: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.iconSoft,
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    categoryCard: {
      flexBasis: '47%',
      flexGrow: 1,
      minHeight: 152,
      borderRadius: 22,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: palette.border,
      gap: spacing.sm,
    },
    categoryIcon: {
      width: 54,
      height: 54,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryTitle: { fontSize: 15, lineHeight: 20 },
    categoryDescription: { color: palette.textSecondary },
    section: { gap: spacing.md, paddingBottom: spacing.lg },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    sectionHeading: { flex: 1, minWidth: 0 },
    sectionTitle: { fontSize: 21, lineHeight: 28 },
    sectionSubtitle: { color: palette.textSecondary, marginTop: 2 },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, paddingHorizontal: spacing.sm },
    seeAllText: { color: palette.primary },
    empty: {
      borderRadius: 24,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      padding: spacing.lg,
      gap: spacing.sm,
      alignItems: 'center',
    },
    emptyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.iconSoft },
    emptyText: { color: palette.textSecondary, textAlign: 'center' },
    pressed: { opacity: 0.84, transform: [{ scale: 0.992 }] },
  });
}
