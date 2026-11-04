import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { DashboardStatCard } from '../components/DashboardStatCard';
import { EmployerActionButton } from '../components/EmployerActionButton';
import { EmployerDialog } from '../components/EmployerDialog';
import { EmployerLayout, type EmployerTab } from '../components/EmployerLayout';
import { EmployerQuickAction } from '../components/EmployerQuickAction';
import { EmployerRequestCard } from '../components/EmployerRequestCard';
import { EmployerRequestDetails } from '../components/EmployerRequestDetails';
import { AdminField } from '../components/AdminUI';
import { useEmployerDashboard } from '../hooks/useEmployerDashboard';
import { employerPeriodLabels, getEmployerMetricRequests, type EmployerMetricKey, type EmployerPeriod } from '../services/employerAnalytics';
import { adminPeriodBounds, getAdminMetrics } from '../services/adminAnalytics';
import { localDate } from '../services/adminHelpers';
import { useAdminStore } from '../store/adminStore';
import { employerTheme as theme } from '../theme';
import type { EmployerRequest, EmployerRequestFilter } from '../types/employer';
import type { AdminRoute } from '../types/admin';
import { AdminWorkspace } from './AdminWorkspace';

const filters: ReadonlyArray<{ value: EmployerRequestFilter; label: string }> = [
  { value: 'all', label: 'Toutes' }, { value: 'new', label: 'Nouvelles' }, { value: 'actionable', label: 'À traiter' },
  { value: 'waiting', label: 'En attente' }, { value: 'confirmed', label: 'Confirmées' },
];
const metricIcons: Record<EmployerMetricKey, ComponentProps<typeof Ionicons>['name']> = { new: 'document-text-outline', review: 'time', offers: 'paper-plane', planned: 'calendar' };
const menuItems: { title: string; icon: ComponentProps<typeof Ionicons>['name']; route: AdminRoute }[] = [
  { title: 'Offres et estimations', icon: 'paper-plane-outline', route: { screen: 'offers' } },
  { title: 'Missions à assigner', icon: 'person-add-outline', route: { screen: 'missions', filter: 'unassigned' } },
  { title: 'Toutes les missions', icon: 'clipboard-outline', route: { screen: 'missions' } },
  { title: 'Calendrier / dispatch', icon: 'calendar-outline', route: { screen: 'calendar' } },
  { title: 'Employés', icon: 'people-outline', route: { screen: 'employees' } },
  { title: 'Clients', icon: 'business-outline', route: { screen: 'clients' } },
  { title: 'Catalogue des services', icon: 'list-outline', route: { screen: 'services' } },
  { title: 'Rapports et statistiques', icon: 'bar-chart-outline', route: { screen: 'reports' } },
  { title: 'Paramètres administratifs', icon: 'settings-outline', route: { screen: 'settings' } },
];
type Panel = 'menu' | 'notifications' | 'period';
const panelTitles: Record<Panel, string> = { menu: 'Espace administration', notifications: 'Notifications', period: 'Choisir une période' };

export function AdminHomeScreen() {
  const dashboard = useEmployerDashboard();
  const store = useAdminStore();
  const [tab, setTab] = useState<EmployerTab>('dashboard');
  const [history, setHistory] = useState<AdminRoute[]>([]);
  const route = history[history.length - 1] ?? null;
  const [period, setPeriod] = useState<EmployerPeriod>('week');
  const [today] = useState(() => new Date());
  const [metricFilter, setMetricFilter] = useState<EmployerMetricKey | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [search, setSearch] = useState('');
  const { width, fontScale } = useWindowDimensions();
  const metrics = useMemo(() => getAdminMetrics(store, period, today), [store.requests, store.offers, store.missions, period, today]);
  const metricRequests = useMemo(() => metricFilter ? getEmployerMetricRequests(dashboard.requests, metricFilter, period, today) : null, [dashboard.requests, metricFilter, period, today]);
  const newRequests = dashboard.requests.filter(request => request.status === 'new');
  const visibleRequests = (metricRequests ?? dashboard.visibleRequests).filter(r => `${r.id} ${r.clientName} ${r.serviceType} ${r.location}`.toLocaleLowerCase('fr-CA').includes(search.trim().toLocaleLowerCase('fr-CA')));
  const selected = dashboard.requests.find(request => request.id === selectedId);
  const selectedClient = selected ? store.clients.find(client => client.requestIds.includes(selected.id)) : undefined;
  const selectedOffer = selected ? store.offers.find(offer => offer.requestId === selected.id && (offer.status === 'sent' || offer.status === 'accepted' || offer.status === 'draft')) : undefined;
  const selectedMission = selected ? store.missions.find(mission => mission.requestId === selected.id && mission.status !== 'cancelled' && mission.status !== 'completed') : undefined;
  const user = dashboard.session?.user;
  const modalVisible = !!selected || panel !== null;
  const date = today.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const expandedText = fontScale > 1.2;
  const activeTab = route && ['employees', 'employee-create', 'employee-detail'].includes(route.screen) ? 'employees'
    : route && ['missions', 'mission-detail', 'assignment', 'calendar'].includes(route.screen) ? 'reservations' : tab;
  function navigate(next: AdminRoute) {
    setHistory(current => JSON.stringify(current[current.length - 1]) === JSON.stringify(next) ? current : [...current, next].slice(-40));
    setSelectedId(null); setPanel(null); setMetricFilter(null);
  }
  function back() { if (history.length <= 1 && (tab === 'employees' || tab === 'reservations')) setTab('dashboard'); setHistory(current => current.slice(0, -1)); }
  function openTab(next: EmployerTab) {
    setMetricFilter(null); setTab(next); setPanel(null); setSelectedId(null); setSearch('');
    setHistory(next === 'employees' ? [{ screen: 'employees' }] : next === 'reservations' ? [{ screen: 'missions' }] : []);
  }
  function openRequests(filter: EmployerRequestFilter = 'all') { dashboard.setFilter(filter); openTab('requests'); }
  function openMetric(key: EmployerMetricKey) {
    const bounds = adminPeriodBounds(period, today);
    if (key === 'offers') { navigate({ screen: 'offers', sentFrom: bounds.from, sentTo: localDate(today) }); return; }
    if (key === 'planned') { navigate({ screen: 'missions', filter: 'planned', dateFrom: bounds.from, dateTo: bounds.to }); return; }
    setMetricFilter(key); setTab('requests'); setHistory([]); setSearch(''); setPanel(null);
  }
  function requestAction(request: EmployerRequest) {
    if (request.status === 'waiting') navigate({ screen: 'estimate', requestId: request.id });
    else if (request.status === 'offer-sent') {
      const offer = store.offers.find(o => o.requestId === request.id && o.status === 'sent');
      if (offer) navigate({ screen: 'offer-detail', offerId: offer.id }); else setSelectedId(request.id);
    } else { store.markRequestReview(request.id); setSelectedId(request.id); }
  }
  function requestCard(request: EmployerRequest) { return <EmployerRequestCard key={request.id} request={request} onView={() => setSelectedId(request.id)} onAction={() => requestAction(request)} />; }
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedId) { setSelectedId(null); return true; }
      if (panel) { setPanel(null); return true; }
      if (history.length) { back(); return true; }
      if (tab !== 'dashboard') { openTab('dashboard'); return true; }
      return false;
    });
    return () => handler.remove();
  }, [history.length, selectedId, panel, tab]);
  if (!user) return null;
  return <>
    <View style={styles.root} aria-hidden={modalVisible} accessibilityElementsHidden={modalVisible} importantForAccessibility={modalVisible ? 'no-hide-descendants' : 'auto'}>
      <EmployerLayout activeTab={activeTab} navigationKey={route ? JSON.stringify(route) : tab} onTabChange={openTab} onMenu={() => setPanel('menu')}
        onNotifications={() => setPanel('notifications')} notificationCount={store.settings.notifyNewRequests ? newRequests.length : 0}>
        {route ? <>
          <AppText style={styles.demoText}>Démonstration · Modifications conservées pendant cette session</AppText>
          <AdminWorkspace key={JSON.stringify(route)} route={route} onNavigate={navigate} onBack={back} />
        </> : <>
          <View style={styles.pageHeading}>
            <AppText accessibilityRole="header" style={styles.pageTitle}>{tab === 'requests' ? 'Demandes des clients' : 'Tableau de bord'}</AppText>
            {tab === 'dashboard' ? <View style={styles.dateRow}>
              <AppText style={styles.date}>{date.charAt(0).toUpperCase() + date.slice(1)}</AppText>
              <Pressable accessibilityRole="button" accessibilityLabel={`Période : ${employerPeriodLabels[period]}`} onPress={() => setPanel('period')} style={styles.period}>
                <Ionicons name="calendar-outline" size={17} color={theme.muted} /><AppText style={styles.periodText}>{employerPeriodLabels[period]}</AppText><Ionicons name="chevron-down" size={15} color={theme.text} />
              </Pressable>
            </View> : <AppText style={styles.subtitle}>Retrouvez et suivez les besoins de vos clients.</AppText>}
          </View>
          {tab === 'dashboard' && <>
            <View style={styles.stats}>{metrics.map(metric => <DashboardStatCard key={metric.key} label={metric.label} value={metric.value} trend={metric.trend} bars={metric.bars} icon={metricIcons[metric.key]} compact={width < 350 && !expandedText}
              tone={metric.key === 'offers' ? 'teal' : metric.key === 'review' ? 'muted' : 'blue'} style={expandedText ? styles.fullCard : undefined} onPress={() => openMetric(metric.key)} />)}</View>
            <View style={styles.section}>
              <View style={styles.sectionHeading}><AppText accessibilityRole="header" style={styles.sectionTitle}>Actions rapides</AppText><Pressable accessibilityRole="button" accessibilityLabel="Ouvrir toutes les sections de l’administration" onPress={() => setPanel('menu')} style={styles.textLink}><AppText style={styles.linkText}>Voir tout</AppText><Ionicons name="chevron-forward" size={19} color={theme.blue} accessible={false} /></Pressable></View>
              <View style={styles.quickActions}>
                <EmployerQuickAction title={'Créer\nune offre'} icon="document-text-outline" onPress={() => navigate({ screen: 'offers' })} style={width < 350 || expandedText ? styles.halfCard : undefined} />
                <EmployerQuickAction title={'Gérer\nles employés'} icon="people" onPress={() => openTab('employees')} style={width < 350 || expandedText ? styles.halfCard : undefined} />
                <EmployerQuickAction title={'Planifier\nune mission'} icon="calendar-outline" onPress={() => navigate({ screen: 'missions', filter: 'unassigned' })} style={width < 350 || expandedText ? styles.halfCard : undefined} />
                <EmployerQuickAction title={'Voir les\nstatistiques'} icon="bar-chart" onPress={() => navigate({ screen: 'reports' })} style={width < 350 || expandedText ? styles.halfCard : undefined} />
              </View>
            </View>
            <AppText style={styles.demoText}>Données de démonstration · Bonjour {user.firstName}</AppText>
            <View style={styles.section}><AppText accessibilityRole="header" style={styles.sectionTitle}>Dernières demandes</AppText>{dashboard.requests.slice(0, 2).map(requestCard)}<EmployerActionButton title="Voir toutes les demandes" variant="secondary" onPress={() => openRequests()} icon="arrow-forward" /></View>
          </>}
          {tab === 'requests' && <View style={styles.section}>
            <AdminField label="Rechercher une demande" value={search} onChangeText={setSearch} placeholder="Client, service, ville ou référence" autoCorrect={false} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map(item => <Pressable key={item.value} onPress={() => { setMetricFilter(null); dashboard.setFilter(item.value); }} accessibilityRole="button" accessibilityLabel={`Filtrer les demandes : ${item.label}`} accessibilityState={{ selected: metricFilter === null && dashboard.filter === item.value }} style={[styles.filter, metricFilter === null && dashboard.filter === item.value && styles.selectedFilter]}><AppText style={metricFilter === null && dashboard.filter === item.value ? styles.selectedLabel : styles.filterLabel}>{item.label}</AppText></Pressable>)}</ScrollView>
            {metricFilter && <EmployerActionButton title={`${metrics.find(m => m.key === metricFilter)?.label} · ${employerPeriodLabels[period]} · Effacer`} variant="secondary" onPress={() => setMetricFilter(null)} />}
            <AppText style={styles.muted}>{visibleRequests.length} demande{visibleRequests.length === 1 ? '' : 's'} affichée{visibleRequests.length === 1 ? '' : 's'} · Démonstration</AppText>
            {visibleRequests.length ? visibleRequests.map(requestCard) : <View style={styles.empty}><AppText style={styles.subtitle}>Aucune demande pour cette recherche.</AppText><EmployerActionButton title="Afficher toutes les demandes" variant="secondary" onPress={() => openRequests()} /></View>}
          </View>}
        </>}
      </EmployerLayout>
    </View>
    {selected && <EmployerRequestDetails request={selected} onClose={() => setSelectedId(null)} client={selectedClient} onAnalyze={() => store.markRequestReview(selected.id)}
      onEstimate={() => navigate({ screen: 'estimate', requestId: selected.id, offerId: selectedOffer?.status === 'draft' ? selectedOffer.id : undefined })}
      onOffer={selectedOffer ? () => navigate({ screen: 'offer-detail', offerId: selectedOffer.id }) : undefined}
      onClient={selectedClient ? () => navigate({ screen: 'client-detail', clientId: selectedClient.id }) : undefined}
      onMission={selectedMission ? () => navigate({ screen: 'mission-detail', missionId: selectedMission.id }) : undefined} />}
    {panel && <EmployerDialog title={panelTitles[panel]} onClose={() => setPanel(null)}>
      {panel === 'menu' && <>
        <View style={styles.account}><View style={styles.avatar}><AppText style={styles.initials}>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AppText></View><View style={{ flex: 1 }}><AppText style={styles.accountName}>{user.firstName} {user.lastName}</AppText><AppText style={styles.muted}>{user.email}</AppText><AppText style={styles.linkText}>Administration</AppText></View></View>
        <EmployerActionButton title="Tableau de bord" icon="home-outline" variant="secondary" onPress={() => openTab('dashboard')} /><EmployerActionButton title="Demandes des clients" icon="document-text-outline" variant="secondary" onPress={() => openRequests()} />
        {menuItems.map(item => <EmployerActionButton key={item.title} title={item.title} icon={item.icon} variant="secondary" onPress={() => navigate(item.route)} />)}
        {dashboard.error && <AppText accessibilityRole="alert" style={styles.error}>{dashboard.error}</AppText>}
        <EmployerActionButton title="Se déconnecter" variant="link" icon="log-out-outline" onPress={dashboard.signOut} loading={dashboard.busy} />
      </>}
      {panel === 'period' && <View accessibilityRole="radiogroup" style={styles.section}>{(['week', 'month'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={employerPeriodLabels[value]} accessibilityState={{ checked: period === value }} onPress={() => { setPeriod(value); setPanel(null); }} style={styles.option}><Ionicons name={period === value ? 'radio-button-on' : 'radio-button-off'} size={22} color={theme.blue} /><AppText style={styles.subtitle}>{employerPeriodLabels[value]}</AppText></Pressable>)}</View>}
      {panel === 'notifications' && <>
        <AppText style={styles.subtitle}>Nouvelles demandes à consulter.</AppText>
        {newRequests.length ? newRequests.map(request => <Pressable key={request.id} accessibilityRole="button" accessibilityLabel={`Consulter la demande de ${request.clientName}`} onPress={() => { setPanel(null); setSelectedId(request.id); }} style={styles.notification}><Ionicons name="document-text-outline" size={22} color={theme.blue} /><View style={{ flex: 1 }}><AppText style={styles.subtitle}>{request.clientName}</AppText><AppText style={styles.muted}>{request.serviceType}</AppText></View><Ionicons name="chevron-forward" size={19} color={theme.muted} /></Pressable>) : <AppText style={styles.subtitle}>Vous n’avez aucune nouvelle demande.</AppText>}
        <EmployerActionButton title="Voir les nouvelles demandes" onPress={() => openRequests('new')} />
      </>}
    </EmployerDialog>}
  </>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background }, pageHeading: { gap: 3, marginBottom: 2 }, pageTitle: { fontFamily: fonts.titleBold, fontSize: 28, lineHeight: 36, color: theme.text },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, date: { flexGrow: 1, color: theme.muted, fontSize: 14, lineHeight: 22 },
  period: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 15, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#16346299' }, periodText: { fontSize: 11, lineHeight: 16, color: theme.text },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, fullCard: { flexBasis: '100%' }, halfCard: { flexBasis: '46%' }, section: { gap: 12 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 }, sectionTitle: { fontFamily: fonts.titleBold, fontSize: 20, lineHeight: 28, color: theme.text },
  textLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3 }, linkText: { fontSize: 13, lineHeight: 20, color: theme.blue }, quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, muted: { color: theme.muted, fontSize: 12, lineHeight: 19 }, subtitle: { color: theme.text, fontSize: 14, lineHeight: 22 }, demoText: { color: theme.muted, fontSize: 10, lineHeight: 16 },
  filters: { gap: 8, paddingVertical: 2 }, filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface }, selectedFilter: { backgroundColor: '#265DB0', borderColor: theme.blue }, selectedLabel: { color: theme.text, fontSize: 13, lineHeight: 20 }, filterLabel: { color: theme.muted, fontSize: 13, lineHeight: 20 },
  empty: { padding: 20, gap: 16, backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.border }, account: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 52, height: 52, backgroundColor: '#2857A0', borderRadius: 26, alignItems: 'center', justifyContent: 'center' }, initials: { fontFamily: fonts.titleBold, fontSize: 19, color: theme.text }, accountName: { color: theme.text, fontFamily: fonts.bold, fontSize: 18, lineHeight: 26 }, error: { color: '#FFA8B0' },
  option: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14 }, notification: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 72, padding: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14 },
});
