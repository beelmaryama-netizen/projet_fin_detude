import { useMemo, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { AdminBadge, AdminCard, AdminChips, AdminDetail, AdminEmpty, AdminField, AdminNotice, AdminPage, adminStyles as s } from '../components/AdminUI';
import { EmployerActionButton } from '../components/EmployerActionButton';
import { EmployerDialog } from '../components/EmployerDialog';
import { formatMoney, localDate, parseDecimal } from '../services/adminHelpers';
import { adminPeriodBounds } from '../services/adminAnalytics';
import { useAdminStore } from '../store/adminStore';
import { employerTheme as theme } from '../theme';
import type { AdminScreenProps, AdminService, AdminSettings } from '../types/admin';

function ServiceCatalogue({ onBack }: AdminScreenProps) {
  const store = useAdminStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const services = store.services.filter(service => `${service.name} ${service.description}`.toLocaleLowerCase('fr-CA').includes(query.trim().toLocaleLowerCase('fr-CA'))
    && (filter === 'all' || service.active === (filter === 'active')));
  function save() {
    if (!editing) return;
    const result = store.updateService(editing.id, editing);
    if (!result.ok) { setError(result.error); return; }
    setEditing(null); setError(''); setNotice('Le service a été mis à jour pour cette session.');
  }
  return <AdminPage title="Catalogue des services" subtitle="Gérez les prestations proposées et leur présentation." onBack={onBack}>
    <AdminField label="Rechercher un service" placeholder="Nom ou description" value={query} onChangeText={setQuery} />
    <AdminChips options={[{ value: 'all', label: 'Tous' }, { value: 'active', label: 'Actifs' }, { value: 'inactive', label: 'Désactivés' }]} value={filter} onChange={setFilter} />
    <AdminNotice message={notice} />
    {services.length ? services.map(service => <AdminCard key={service.id}>
      <AdminBadge label={service.active ? 'Actif' : 'Désactivé'} tone={service.active ? 'green' : 'muted'} />
      <AppText style={s.heading}>{service.name}</AppText><AppText style={s.muted}>{service.description}</AppText>
      <EmployerActionButton title={`Modifier ${service.name}`} variant="secondary" icon="create-outline" onPress={() => { setEditing({ ...service }); setError(''); }} />
    </AdminCard>) : <AdminEmpty title="Aucun service trouvé" message="Modifiez votre recherche ou votre filtre." />}
    {editing && <EmployerDialog title="Modifier le service" onClose={() => setEditing(null)}>
      <AdminField label="Nom du service" value={editing.name} maxLength={100} onChangeText={name => setEditing({ ...editing, name })} />
      <AdminField label="Description" value={editing.description} multiline maxLength={1000} onChangeText={description => setEditing({ ...editing, description })} />
      <View style={[s.row, { justifyContent: 'space-between' }]}><AppText style={s.text}>Service actif</AppText>
        <Switch accessibilityLabel="Service actif" value={editing.active} onValueChange={active => setEditing({ ...editing, active })} trackColor={{ false: theme.border, true: '#2371BF' }} thumbColor={theme.text} />
      </View>
      <AdminNotice error message={error} /><EmployerActionButton title="Enregistrer le service" onPress={save} />
      <EmployerActionButton title="Annuler" variant="secondary" onPress={() => setEditing(null)} />
    </EmployerDialog>}
  </AdminPage>;
}

function Reports({ onBack, onNavigate }: AdminScreenProps) {
  const store = useAdminStore();
  const [period, setPeriod] = useState('month');
  const range = useMemo(() => {
    return adminPeriodBounds(period === 'week' ? 'week' : 'month');
  }, [period]);
  const inRange = (date?: string) => {
    const day = date && date.length > 10 ? localDate(new Date(date)) : date;
    return !!day && (period === 'all' || (day >= range.from && day <= range.to));
  };
  const requests = store.requests.filter(r => inRange(r.submittedAt));
  const sentOffers = store.offers.filter(o => o.sentAt && inRange(o.sentAt));
  const accepted = sentOffers.filter(o => o.status === 'accepted');
  const missions = store.missions.filter(m => inRange(m.date));
  const completed = missions.filter(m => m.status === 'completed');
  const amount = accepted.reduce((sum, o) => sum + o.totalCents, 0);
  const series = requests.reduce<Record<string, number>>((counts, request) => ({ ...counts, [request.category]: (counts[request.category] ?? 0) + 1 }), {});
  const categoryLabels: Record<string, string> = { RESIDENTIAL: 'Résidentiel', COMMERCIAL: 'Commercial', MEDICAL: 'Médical', INDUSTRIAL: 'Industriel', OTHER: 'Autres' };
  const metrics = [
    { label: 'Demandes reçues', value: requests.length, action: undefined },
    { label: 'Offres envoyées', value: sentOffers.length, action: () => onNavigate({ screen: 'offers' }) },
    { label: 'Missions de la période', value: missions.filter(m => m.status !== 'cancelled').length, action: () => onNavigate({ screen: 'missions' }) },
    { label: 'Missions terminées', value: completed.length, action: () => onNavigate({ screen: 'missions', filter: 'completed' }) },
  ];
  return <AdminPage title="Rapports et statistiques" subtitle="Les indicateurs de votre activité, réunis au même endroit." onBack={onBack}>
    <AdminChips options={[{ value: 'week', label: 'Cette semaine' }, { value: 'month', label: 'Ce mois-ci' }, { value: 'all', label: 'Tout l’historique' }]} value={period} onChange={setPeriod} />
    <View style={s.split}>{metrics.map(metric => <View key={metric.label} style={s.grow}>
      <AdminCard>{metric.action ? <Pressable accessibilityRole="button" accessibilityLabel={`${metric.label} : ${metric.value}, consulter`} onPress={metric.action} style={{ minHeight: 70, gap: 5 }}>
        <AppText style={s.number}>{metric.value}</AppText><AppText style={s.text}>{metric.label} ›</AppText>
      </Pressable> : <><AppText style={s.number}>{metric.value}</AppText><AppText style={s.text}>{metric.label}</AppText></>}</AdminCard>
    </View>)}</View>
    <AdminCard><AppText style={s.heading}>Offres acceptées</AppText><AppText style={s.number}>{formatMoney(amount)}</AppText>
      <AppText style={s.muted}>{accepted.length} offre(s) acceptée(s), taxes incluses. Ce montant ne représente pas des paiements encaissés.</AppText>
      <AdminDetail label="Taux d’acceptation des offres envoyées" value={sentOffers.length ? `${Math.round(accepted.length / sentOffers.length * 100)} %` : 'Aucune offre envoyée sur cette période'} />
    </AdminCard>
    <AdminCard><AppText style={s.heading}>Demandes par catégorie</AppText>
      {Object.entries(series).length ? Object.entries(series).map(([category, count]) => <View key={category} style={{ gap: 5 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}><AppText style={s.text}>{categoryLabels[category] ?? category}</AppText><AppText style={s.muted}>{count}</AppText></View>
        <View style={{ height: 8, backgroundColor: theme.background, borderRadius: 4 }}><View style={{ height: 8, borderRadius: 4, width: `${count / requests.length * 100}%`, backgroundColor: theme.teal }} /></View>
      </View>) : <AppText style={s.muted}>Aucune demande reçue sur cette période.</AppText>}
    </AdminCard>
    <AppText style={s.muted}>Demandes par date de réception; offres par date d’envoi; missions par date de prestation. Les listes ouvertes affichent leur historique complet et proposent leurs propres filtres.</AppText>
  </AdminPage>;
}

function Settings({ onBack }: AdminScreenProps) {
  const store = useAdminStore();
  const [values, setValues] = useState<AdminSettings>({ ...store.settings });
  const [tax, setTax] = useState(String(store.settings.defaultTaxPercent).replace('.', ','));
  const [validity, setValidity] = useState(String(store.settings.defaultValidityHours));
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [confirm, setConfirm] = useState(false);
  function prepare() {
    const rate = parseDecimal(tax), hours = Number(validity);
    if (rate === null || rate > 30 || !Number.isInteger(hours) || hours < 1 || hours > 720) { setError('Renseignez un taux entre 0 et 30 % et une validité de 1 à 720 heures.'); return; }
    if (!values.companyName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) { setError('Renseignez le nom de l’entreprise et un courriel valide.'); return; }
    setValues({ ...values, defaultTaxPercent: rate, defaultValidityHours: hours }); setError(''); setSuccess(''); setConfirm(true);
  }
  function save() {
    const result = store.updateSettings(values); setConfirm(false);
    if (!result.ok) setError(result.error); else { setError(''); setSuccess('Paramètres enregistrés pour cette session. Les offres existantes conservent leurs montants.'); }
  }
  return <AdminPage title="Paramètres administratifs" subtitle="Coordonnées et valeurs utilisées pour les nouvelles estimations." onBack={onBack}>
    <AdminCard><AppText style={s.heading}>Entreprise</AppText>
      <AdminField label="Nom de l’entreprise" value={values.companyName} maxLength={120} onChangeText={companyName => setValues({ ...values, companyName })} />
      <AdminField label="Courriel de contact" value={values.contactEmail} keyboardType="email-address" autoCapitalize="none" maxLength={120} onChangeText={contactEmail => setValues({ ...values, contactEmail })} />
      <AdminField label="Téléphone de contact" value={values.contactPhone} keyboardType="phone-pad" maxLength={24} onChangeText={contactPhone => setValues({ ...values, contactPhone })} />
    </AdminCard>
    <AdminCard><AppText style={s.heading}>Nouvelles offres</AppText>
      <AdminField label="Taux de taxes par défaut (%)" value={tax} onChangeText={setTax} keyboardType="decimal-pad" maxLength={7} />
      <AdminField label="Validité par défaut (heures)" value={validity} onChangeText={setValidity} keyboardType="number-pad" maxLength={3} />
      <View style={[s.row, { justifyContent: 'space-between' }]}><AppText style={[s.text, { flex: 1 }]}>Alertes de nouvelles demandes</AppText>
        <Switch accessibilityLabel="Alertes de nouvelles demandes" value={values.notifyNewRequests} onValueChange={notifyNewRequests => setValues({ ...values, notifyNewRequests })} trackColor={{ false: theme.border, true: '#2371BF' }} thumbColor={theme.text} />
      </View>
    </AdminCard>
    <AdminNotice error message={error} /><AdminNotice message={success} />
    <EmployerActionButton title="Enregistrer les paramètres" icon="save-outline" onPress={prepare} />
    <AdminCard><AppText style={s.heading}>Dernières modifications</AppText>
      {store.audit.slice(0, 5).map(event => <View key={event.id} style={s.divider}><AppText style={s.text}>{event.text}</AppText><AppText style={s.muted}>{new Date(event.at).toLocaleString('fr-CA')}</AppText></View>)}
    </AdminCard>
    {confirm && <EmployerDialog title="Confirmer les paramètres" onClose={() => setConfirm(false)}>
      <AppText style={s.text}>Ces valeurs seront utilisées pour les prochaines estimations. Les offres déjà créées restent inchangées.</AppText>
      <AdminDetail label="Taxes" value={`${String(values.defaultTaxPercent).replace('.', ',')} %`} /><AdminDetail label="Validité" value={`${values.defaultValidityHours} heures`} />
      <EmployerActionButton title="Confirmer l’enregistrement" onPress={save} /><EmployerActionButton title="Annuler" variant="secondary" onPress={() => setConfirm(false)} />
    </EmployerDialog>}
  </AdminPage>;
}

export function AdminExtraScreens(props: AdminScreenProps) {
  return props.route.screen === 'services' ? <ServiceCatalogue {...props} /> : props.route.screen === 'reports' ? <Reports {...props} /> : <Settings {...props} />;
}
