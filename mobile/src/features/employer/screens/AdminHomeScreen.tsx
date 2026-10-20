import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { useSession } from '../../auth/hooks/useSession';
import { AdminWorkspace } from './AdminWorkspace';
import { AdminButton, AdminCard, AdminMetric, AdminSectionTitle, adminStyles } from '../components/AdminUI';
import { employerTheme as theme } from '../theme';
import { useAdminStore } from '../store/adminStore';
import type { AdminStackParamList } from '../types/admin';

export function AdminHomeScreen({ navigation }: NativeStackScreenProps<AdminStackParamList, 'AdminHome'>) {
  const { session, signOut, busy } = useSession();
  const offers = useAdminStore(state => state.offers);
  const missions = useAdminStore(state => state.missions);
  const employees = useAdminStore(state => state.employees);
  const clients = useAdminStore(state => state.clients);

  return <AdminWorkspace
    title="Administration MagiquePro"
    subtitle={'Bonjour ' + (session?.user.firstName ?? 'Meryem') + ' · gestion complète de la démonstration'}
    right={<Ionicons name="shield-checkmark-outline" size={24} color={theme.success} />}
  >
    <View style={styles.metrics}>
      <AdminMetric icon="document-text-outline" value={offers.filter(item => item.status === 'SENT').length} label="Offres en attente" />
      <AdminMetric icon="calendar-outline" value={missions.filter(item => item.status === 'TO_ASSIGN').length} label="Missions à assigner" />
      <AdminMetric icon="people-outline" value={employees.filter(item => item.status === 'ACTIVE').length} label="Employés actifs" />
      <AdminMetric icon="person-outline" value={clients.length} label="Clients" />
    </View>

    <AdminCard>
      <AdminSectionTitle>Parcours administratif</AdminSectionTitle>
      <AppText style={adminStyles.muted}>Demande → Estimation → Offre → Acceptation → Mission → Affectation → Suivi</AppText>
      <View style={styles.grid}>
        <Tile icon="calculator-outline" title="Créer une estimation" onPress={() => navigation.navigate('CreateEstimate')} />
        <Tile icon="paper-plane-outline" title="Offres envoyées" onPress={() => navigation.navigate('Offers')} />
        <Tile icon="people-outline" title="Missions à assigner" onPress={() => navigation.navigate('MissionsToAssign')} />
        <Tile icon="calendar-outline" title="Calendrier / Dispatch" onPress={() => navigation.navigate('DispatchCalendar')} />
        <Tile icon="person-add-outline" title="Employés" onPress={() => navigation.navigate('Employees')} />
        <Tile icon="people-circle-outline" title="Clients" onPress={() => navigation.navigate('Clients')} />
      </View>
    </AdminCard>

    <AdminCard>
      <AdminSectionTitle>Tableau de bord existant</AdminSectionTitle>
      <AppText style={adminStyles.muted}>Le tableau de bord employeur original reste accessible et inchangé dans le parcours.</AppText>
      <AdminButton title="Ouvrir le tableau de bord" variant="secondary" icon="grid-outline" onPress={() => navigation.navigate('LegacyEmployerDashboard')} />
    </AdminCard>

    <AdminCard>
      <AdminSectionTitle>État de la démonstration</AdminSectionTitle>
      <AppText style={adminStyles.text}>Les données administratives sont cohérentes entre les listes, les détails, le calendrier et les historiques.</AppText>
      <AppText style={adminStyles.muted}>Le backend réel reste à raccorder : aucun courriel, push, paiement ou synchronisation distante n’est prétendu.</AppText>
    </AdminCard>

    <AdminButton title="Se déconnecter" variant="danger" icon="log-out-outline" disabled={busy} onPress={signOut} />
  </AdminWorkspace>;
}

function Tile({ icon, title, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; onPress: () => void }) {
  return <View style={styles.tile}>
    <View style={styles.icon}><Ionicons name={icon} size={24} color={theme.blue} /></View>
    <AppText style={styles.tileTitle}>{title}</AppText>
    <AdminButton title="Ouvrir" variant="ghost" onPress={onPress} />
  </View>;
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexGrow: 1, flexBasis: '45%', minWidth: 150, minHeight: 170,
    backgroundColor: theme.backgroundDeep, borderWidth: 1, borderColor: theme.border,
    borderRadius: 17, padding: 13, gap: 10,
  },
  icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#173E72', alignItems: 'center', justifyContent: 'center' },
  tileTitle: { flex: 1, color: theme.text, fontFamily: fonts.bold, fontSize: 14, lineHeight: 21 },
});
