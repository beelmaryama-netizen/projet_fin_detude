import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { AdminBadge, AdminCard, AdminSectionTitle, adminStyles } from '../components/AdminUI';
import { employerTheme as theme } from '../theme';

/**
 * Petits blocs réutilisables pour les écrans administratifs complémentaires.
 * Les rapports, services et paramètres existants restent dans le module employeur;
 * ce fichier centralise les limites explicites de la démonstration.
 */
export function AdminDemoLimitCard() {
  return <AdminCard>
    <View style={styles.row}>
      <View style={styles.icon}><Ionicons name="information-circle-outline" size={22} color={theme.teal} /></View>
      <View style={styles.copy}>
        <AdminSectionTitle>Mode démonstration</AdminSectionTitle>
        <AdminBadge label="LOCAL" tone="blue" />
      </View>
    </View>
    <AppText style={adminStyles.muted}>Les modifications sont conservées dans le store local pendant la session. Le raccordement backend, l’envoi réel de courriels et les notifications push restent à connecter.</AppText>
  </AdminCard>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#153B6D', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 6 },
});
