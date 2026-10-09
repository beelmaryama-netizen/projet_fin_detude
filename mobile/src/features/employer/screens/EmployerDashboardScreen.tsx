import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { DashboardStatCard } from '../components/DashboardStatCard';
import { EmployerActionButton } from '../components/EmployerActionButton';
import { EmployerDialog } from '../components/EmployerDialog';
import { EmployerLayout, type EmployerTab } from '../components/EmployerLayout';
import { EmployerQuickAction } from '../components/EmployerQuickAction';
import { EmployerRequestCard } from '../components/EmployerRequestCard';
import { EmployerRequestDetails } from '../components/EmployerRequestDetails';
import { useEmployerDashboard } from '../hooks/useEmployerDashboard';
import {
  employerPeriodLabels, getEmployerMetrics, getEmployerMetricRequests,
  type EmployerMetricKey, type EmployerPeriod,
} from '../services/employerAnalytics';
import { employerTheme as theme } from '../theme';
import type { EmployerRequest, EmployerRequestFilter } from '../types/employer';

const filters: ReadonlyArray<{ value: EmployerRequestFilter; label: string }> = [
  { value: 'all', label: 'Toutes' }, { value: 'new', label: 'Nouvelles' },
  { value: 'actionable', label: 'À traiter' }, { value: 'waiting', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
];
const tabLabels: Record<EmployerTab, string> = {
  dashboard: 'Tableau de bord', requests: 'Demandes des clients',
  reservations: 'Réservations', employees: 'Employés',
};
const metricIcons: Record<EmployerMetricKey, ComponentProps<typeof Ionicons>['name']> = {
  new: 'document-text-outline', review: 'time', offers: 'paper-plane', planned: 'calendar',
};
type Panel = 'menu' | 'notifications' | 'period' | 'statistics' | 'offer' | 'planning';
const panelTitles: Record<Panel, string> = {
  menu: 'Espace employeur', notifications: 'Notifications', period: 'Choisir une période',
  statistics: 'Vos statistiques', offer: 'Créer une offre', planning: 'Planifier une mission',
};

export function EmployerDashboardScreen() {
  const dashboard = useEmployerDashboard();
  const [tab, setTab] = useState<EmployerTab>('dashboard');
  const [period, setPeriod] = useState<EmployerPeriod>('week');
  const [today] = useState(() => new Date());
  const [metricFilter, setMetricFilter] = useState<EmployerMetricKey | null>(null);
  const [selected, setSelected] = useState<{ request: EmployerRequest; showAction: boolean } | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const { width, fontScale } = useWindowDimensions();
  const metrics = useMemo(() => getEmployerMetrics(dashboard.requests, period, today), [dashboard.requests, period, today]);
  const metricRequests = useMemo(() => metricFilter
    ? getEmployerMetricRequests(dashboard.requests, metricFilter, period, today) : null,
  [dashboard.requests, metricFilter, period, today]);
  const newRequests = dashboard.requests.filter(request => request.status === 'new');
  const reservations = metricRequests ?? dashboard.requests.filter(request => request.status === 'confirmed');
  const visibleRequests = metricRequests ?? dashboard.visibleRequests;
  const user = dashboard.session?.user;
  const modalVisible = selected !== null || panel !== null;
  const date = today.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const expandedText = fontScale > 1.2;
  if (!user) return null;

  function openTab(next: EmployerTab) {
    setMetricFilter(null);
    setTab(next);
    setPanel(null);
  }
  function openRequests(filter: EmployerRequestFilter = 'all') {
    dashboard.setFilter(filter);
    openTab('requests');
  }
  function openMetric(key: EmployerMetricKey) {
    setMetricFilter(key);
    setTab(key === 'planned' ? 'reservations' : 'requests');
    setPanel(null);
  }
  function requestCard(request: EmployerRequest) {
    return <EmployerRequestCard key={request.id} request={request}
      onView={() => setSelected({ request, showAction: false })}
      onAction={() => setSelected({ request, showAction: true })} />;
  }
  const metricLabel = metrics.find(metric => metric.key === metricFilter)?.label;

  return <>
    <View style={styles.root} aria-hidden={modalVisible} accessibilityElementsHidden={modalVisible}
      importantForAccessibility={modalVisible ? 'no-hide-descendants' : 'auto'}>
      <EmployerLayout activeTab={tab} onTabChange={openTab} onMenu={() => setPanel('menu')}
        onNotifications={() => setPanel('notifications')} notificationCount={newRequests.length}>
        <View style={styles.pageHeading}>
          <AppText accessibilityRole="header" style={styles.pageTitle}>{tabLabels[tab]}</AppText>
          {tab === 'dashboard' ? <View style={styles.dateRow}>
            <AppText style={styles.date}>{date.charAt(0).toUpperCase() + date.slice(1)}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel={`Période : ${employerPeriodLabels[period]}`}
              onPress={() => setPanel('period')} style={({ pressed }) => [styles.period, pressed && styles.pressed]}>
              <Ionicons name="calendar-outline" size={17} color={theme.muted} accessible={false} />
              <AppText style={styles.periodText}>{employerPeriodLabels[period]}</AppText>
              <Ionicons name="chevron-down" size={15} color={theme.text} accessible={false} />
            </Pressable>
          </View> : <AppText style={styles.subtitle}>
            {tab === 'requests' ? 'Retrouvez et suivez les besoins de vos clients.'
              : tab === 'reservations' ? 'Vos prochaines prestations confirmées.' : 'Votre équipe, au même endroit.'}
          </AppText>}
        </View>

        {tab === 'dashboard' && <>
          <View style={styles.stats}>
            {metrics.map(metric => <DashboardStatCard key={metric.key} label={metric.label} value={metric.value}
              trend={metric.trend} bars={metric.bars} icon={metricIcons[metric.key]}
              compact={width < 350 && !expandedText}
              tone={metric.key === 'offers' ? 'teal' : metric.key === 'review' ? 'muted' : 'blue'}
              style={expandedText ? styles.fullCard : undefined} onPress={() => openMetric(metric.key)} />)}
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <AppText accessibilityRole="header" style={styles.sectionTitle}>Actions rapides</AppText>
              <Pressable accessibilityRole="button" onPress={() => openRequests()} accessibilityLabel="Voir toutes les demandes"
                style={({ pressed }) => [styles.textLink, pressed && styles.pressed]}>
                <AppText style={styles.linkText}>Voir tout</AppText>
                <Ionicons name="chevron-forward" size={19} color={theme.blue} accessible={false} />
              </Pressable>
            </View>
            <View style={styles.quickActions}>
              <EmployerQuickAction title={'Créer\nune offre'} icon="document-text-outline" onPress={() => setPanel('offer')}
                style={width < 350 || expandedText ? styles.halfCard : undefined} />
              <EmployerQuickAction title={'Gérer\nles employés'} icon="people" onPress={() => openTab('employees')}
                style={width < 350 || expandedText ? styles.halfCard : undefined} />
              <EmployerQuickAction title={'Planifier\nune mission'} icon="calendar-outline" onPress={() => setPanel('planning')}
                style={width < 350 || expandedText ? styles.halfCard : undefined} />
              <EmployerQuickAction title={'Voir les\nstatistiques'} icon="bar-chart" onPress={() => setPanel('statistics')}
                style={width < 350 || expandedText ? styles.halfCard : undefined} />
            </View>
          </View>
          <View style={styles.demo}>
            <Ionicons name="information-circle-outline" size={15} color={theme.muted} accessible={false} />
            <AppText style={styles.demoText}>Données de démonstration · Bonjour {user.firstName}</AppText>
          </View>
          <View style={styles.section}>
            <AppText accessibilityRole="header" style={styles.sectionTitle}>Dernières demandes</AppText>
            {dashboard.requests.slice(0, 2).map(requestCard)}
            <EmployerActionButton title="Voir toutes les demandes" variant="secondary" onPress={() => openRequests()} icon="arrow-forward" />
          </View>
        </>}

        {tab === 'requests' && <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {filters.map(item => <Pressable key={item.value} onPress={() => { setMetricFilter(null); dashboard.setFilter(item.value); }}
              accessibilityRole="button" accessibilityLabel={`Filtrer les demandes : ${item.label}`}
              accessibilityState={{ selected: metricFilter === null && dashboard.filter === item.value }}
              aria-pressed={metricFilter === null && dashboard.filter === item.value}
              style={({ pressed }) => [styles.filter, metricFilter === null && dashboard.filter === item.value && styles.selectedFilter, pressed && styles.pressed]}>
              <AppText style={metricFilter === null && dashboard.filter === item.value ? styles.selectedLabel : styles.filterLabel}>{item.label}</AppText>
            </Pressable>)}
          </ScrollView>
          {metricFilter && <View style={styles.activeMetric}>
            <AppText style={styles.metricFilterText}>{metricLabel} · {employerPeriodLabels[period]}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Effacer le filtre de l’indicateur" onPress={() => openRequests()}
              style={styles.closeFilter}><Ionicons name="close" size={19} color={theme.text} accessible={false} /></Pressable>
          </View>}
          <AppText style={styles.muted} accessibilityLiveRegion="polite">
            {visibleRequests.length} demande{visibleRequests.length === 1 ? '' : 's'} affichée{visibleRequests.length === 1 ? '' : 's'} · Démonstration
          </AppText>
          {visibleRequests.length ? visibleRequests.map(requestCard) : <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={32} color={theme.blue} accessible={false} />
            <AppText style={styles.text}>Aucune demande pour ce filtre.</AppText>
            <EmployerActionButton title="Afficher toutes les demandes" variant="secondary" onPress={() => openRequests()} />
          </View>}
        </View>}

        {tab === 'reservations' && <View style={styles.section}>
          {metricFilter === 'planned' && <View style={styles.activeMetric}>
            <AppText style={styles.metricFilterText}>{employerPeriodLabels[period]} · Dates de prestation</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Afficher toutes les réservations" onPress={() => setMetricFilter(null)}
              style={styles.closeFilter}><Ionicons name="close" size={19} color={theme.text} accessible={false} /></Pressable>
          </View>}
          <AppText style={styles.muted}>{reservations.length} mission{reservations.length === 1 ? '' : 's'} confirmée{reservations.length === 1 ? '' : 's'} · Démonstration</AppText>
          {reservations.length ? reservations.map(requestCard) : <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={34} color={theme.blue} accessible={false} />
            <AppText style={styles.text}>Aucune mission planifiée pour cette période.</AppText>
          </View>}
          <EmployerActionButton title="Planifier une mission" icon="calendar-outline" onPress={() => setPanel('planning')} />
        </View>}

        {tab === 'employees' && <LinearGradient colors={['#193B6D', '#0E254A']} style={styles.featureCard}>
          <View style={styles.featureIcon}><Ionicons name="people" size={34} color={theme.blue} accessible={false} /></View>
          <AppText accessibilityRole="header" style={styles.sectionTitle}>Gérer votre équipe</AppText>
          <AppText style={styles.text}>La gestion des employés sera disponible prochainement.</AppText>
          <AppText style={styles.subtitle}>Cet aperçu ne contient pas encore de liste d’employés. Vous pouvez déjà consulter les demandes et les missions de démonstration.</AppText>
          <EmployerActionButton title="Consulter les missions" icon="calendar-outline" onPress={() => openTab('reservations')} />
          <EmployerActionButton title="Retour au tableau de bord" variant="secondary" onPress={() => openTab('dashboard')} />
        </LinearGradient>}
      </EmployerLayout>
    </View>

    {selected && <EmployerRequestDetails key={`${selected.request.id}-${selected.showAction}`} request={selected.request}
      showAction={selected.showAction} onClose={() => setSelected(null)} />}
    {panel && <EmployerDialog title={panelTitles[panel]} onClose={() => setPanel(null)}>
      {panel === 'menu' && <>
        <View style={styles.account}>
          <View style={styles.avatar}><AppText style={styles.initials}>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AppText></View>
          <View style={styles.accountCopy}>
            <AppText style={styles.accountName}>{user.firstName} {user.lastName}</AppText>
            <AppText style={styles.muted}>{user.email}</AppText>
            <AppText style={styles.accountRole}>Profil employeur · ADMIN</AppText>
          </View>
        </View>
        <View style={styles.section}>
          <EmployerActionButton title="Tableau de bord" variant="secondary" icon="home-outline" onPress={() => openTab('dashboard')} />
          <EmployerActionButton title="Demandes des clients" variant="secondary" icon="document-text-outline" onPress={() => openRequests()} />
          <EmployerActionButton title="Réservations" variant="secondary" icon="calendar-outline" onPress={() => openTab('reservations')} />
          <EmployerActionButton title="Employés" variant="secondary" icon="people-outline" onPress={() => openTab('employees')} />
        </View>
        {dashboard.error && <AppText accessibilityRole="alert" style={styles.error}>{dashboard.error}</AppText>}
        <EmployerActionButton title="Se déconnecter" variant="link" icon="log-out-outline" onPress={dashboard.signOut} loading={dashboard.busy} />
      </>}
      {panel === 'period' && <View accessibilityRole="radiogroup" style={styles.section}>
        {(['week', 'month'] as const).map(value => <Pressable key={value} accessibilityRole="radio"
          accessibilityLabel={employerPeriodLabels[value]} accessibilityState={{ checked: period === value }} aria-checked={period === value}
          onPress={() => { setPeriod(value); setPanel(null); }} style={styles.option}>
          <Ionicons name={period === value ? 'radio-button-on' : 'radio-button-off'} size={22} color={theme.blue} accessible={false} />
          <AppText style={styles.text}>{employerPeriodLabels[value]}</AppText>
        </Pressable>)}
      </View>}
      {panel === 'notifications' && <>
        <AppText style={styles.subtitle}>Nouvelles demandes de démonstration à consulter.</AppText>
        {newRequests.length ? newRequests.map(request => <Pressable key={request.id} accessibilityRole="button"
          accessibilityLabel={`Consulter la demande de ${request.clientName}`} onPress={() => { setPanel(null); setSelected({ request, showAction: false }); }}
          style={({ pressed }) => [styles.notification, pressed && styles.pressed]}>
          <View style={styles.notificationIcon}><Ionicons name="document-text-outline" size={20} color={theme.blue} accessible={false} /></View>
          <View style={styles.notificationCopy}>
            <AppText style={styles.text}>{request.clientName}</AppText>
            <AppText style={styles.muted}>{request.serviceType}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} accessible={false} />
        </Pressable>) : <AppText style={styles.text}>Vous n’avez aucune nouvelle demande.</AppText>}
        <EmployerActionButton title="Voir les nouvelles demandes" onPress={() => openRequests('new')} />
      </>}
      {panel === 'statistics' && <>
        <AppText style={styles.subtitle}>{employerPeriodLabels[period]} · Données de démonstration</AppText>
        {metrics.map(metric => <Pressable key={metric.key} accessibilityRole="button" accessibilityLabel={`${metric.label} : ${metric.value}, voir les demandes`}
          onPress={() => openMetric(metric.key)} style={styles.statisticsRow}>
          <Ionicons name={metricIcons[metric.key]} size={22} color={metric.key === 'offers' ? theme.teal : theme.blue} accessible={false} />
          <AppText style={styles.statisticsLabel}>{metric.label}</AppText>
          <AppText style={styles.statisticsValue}>{metric.value}</AppText>
          <Ionicons name="chevron-forward" size={17} color={theme.muted} accessible={false} />
        </Pressable>)}
        <AppText style={styles.muted}>Les demandes sont regroupées par date de réception; les missions, par date de prestation. Les offres représentent les demandes dont le statut est « Offre envoyée ».</AppText>
        <AppText style={styles.muted}>Les tendances comparent la période sélectionnée à la période précédente complète. Un tiret indique qu’aucune comparaison n’est disponible.</AppText>
      </>}
      {panel === 'offer' && <>
        <View style={styles.featureIcon}><Ionicons name="document-text-outline" size={30} color={theme.blue} accessible={false} /></View>
        <AppText style={styles.text}>Commencez par consulter la demande du client.</AppText>
        <AppText style={styles.subtitle}>La création et l’envoi d’offres seront disponibles prochainement. Cet aperçu permet de consulter les besoins, sans envoyer d’offre.</AppText>
        <EmployerActionButton title="Voir les demandes à traiter" icon="arrow-forward" onPress={() => openRequests('actionable')} />
        <EmployerActionButton title="Voir les demandes en attente" variant="secondary" onPress={() => openRequests('waiting')} />
      </>}
      {panel === 'planning' && <>
        <View style={styles.featureIcon}><Ionicons name="calendar-outline" size={30} color={theme.blue} accessible={false} /></View>
        <AppText style={styles.text}>Retrouvez vos missions confirmées et leurs dates souhaitées.</AppText>
        <AppText style={styles.subtitle}>La planification et l’affectation d’employés seront disponibles prochainement. Aucune réservation n’est modifiée dans cette démonstration.</AppText>
        <EmployerActionButton title="Consulter les réservations" icon="arrow-forward" onPress={() => openTab('reservations')} />
      </>}
    </EmployerDialog>}
  </>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  pageHeading: { gap: 3, marginBottom: 2 },
  pageTitle: { fontFamily: fonts.titleBold, fontSize: 28, lineHeight: 36, color: theme.text },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  date: { flexGrow: 1, color: theme.muted, fontSize: 14, lineHeight: 22 },
  period: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 15, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#16346299' },
  periodText: { fontSize: 11, lineHeight: 16, color: theme.text },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fullCard: { flexBasis: '100%' }, halfCard: { flexBasis: '46%' },
  section: { gap: 12 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 },
  sectionTitle: { fontFamily: fonts.titleBold, fontSize: 20, lineHeight: 28, color: theme.text },
  textLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3 },
  linkText: { fontSize: 13, lineHeight: 20, color: theme.blue },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  text: { color: theme.text }, muted: { color: theme.muted, fontSize: 12, lineHeight: 19 },
  subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  demoText: { flex: 1, color: theme.muted, fontSize: 10, lineHeight: 16 },
  pressed: { opacity: 0.75 }, filters: { gap: 8, paddingVertical: 2 },
  filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  selectedFilter: { backgroundColor: '#265DB0', borderColor: theme.blue },
  selectedLabel: { color: theme.text, fontSize: 13, lineHeight: 20 }, filterLabel: { color: theme.muted, fontSize: 13, lineHeight: 20 },
  activeMetric: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: theme.surface, paddingLeft: 12 },
  metricFilterText: { flex: 1, color: theme.text, fontSize: 12, lineHeight: 20 },
  closeFilter: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: 20, gap: 16, backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.border },
  featureCard: { padding: 22, gap: 18, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  featureIcon: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3A65AD', backgroundColor: '#23477B', borderRadius: 33 },
  account: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  accountCopy: { flexGrow: 1, flexBasis: 180, gap: 4 },
  avatar: { width: 52, height: 52, backgroundColor: '#2857A0', borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.titleBold, fontSize: 19, color: theme.text },
  accountName: { color: theme.text, fontFamily: fonts.bold, fontSize: 18, lineHeight: 26 },
  accountRole: { color: theme.blue, fontSize: 12, lineHeight: 20 }, error: { color: '#FFA8B0' },
  option: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14 },
  notification: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 72, padding: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14 },
  notificationIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#244D87', alignItems: 'center', justifyContent: 'center' },
  notificationCopy: { flex: 1, gap: 3 },
  statisticsRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 10 },
  statisticsLabel: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 21 },
  statisticsValue: { fontFamily: fonts.titleBold, fontSize: 24, lineHeight: 32, color: theme.text },
});
