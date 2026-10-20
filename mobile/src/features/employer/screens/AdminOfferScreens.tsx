import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { AdminWorkspace } from './AdminWorkspace';
import {
  AdminBadge, AdminButton, AdminCard, AdminSectionTitle, AdminTextField, adminStyles,
  formatAdminDateTime, formatCad,
} from '../components/AdminUI';
import { employerTheme as theme } from '../theme';
import { useAdminStore } from '../store/adminStore';
import type { AdminOfferStatus, AdminStackParamList, EstimateDraft } from '../types/admin';

const offerLabels: Record<AdminOfferStatus, string> = {
  DRAFT: 'Brouillon', SENT: 'En attente', ACCEPTED: 'Acceptée', REFUSED: 'Refusée',
  EXPIRED: 'Expirée', CANCELLED: 'Annulée',
};

const offerTone = (status: AdminOfferStatus) =>
  status === 'ACCEPTED' ? 'green' : status === 'REFUSED' || status === 'CANCELLED' ? 'red' : status === 'SENT' ? 'gold' : 'blue';

function numberOrZero(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CreateEstimateScreen({ navigation, route }: NativeStackScreenProps<AdminStackParamList, 'CreateEstimate'>) {
  const clients = useAdminStore(state => state.clients);
  const drafts = useAdminStore(state => state.drafts);
  const saveDraft = useAdminStore(state => state.saveDraft);
  const requestId = route.params?.requestId ?? 'demo-request-001';
  const saved = drafts[requestId];
  const client = clients[0]!;

  const [serviceName, setServiceName] = useState(saved?.serviceName ?? 'Grand ménage résidentiel');
  const [address, setAddress] = useState(saved?.address ?? client.address);
  const [startAt, setStartAt] = useState(saved?.startAt ?? '2026-10-22T09:00:00');
  const [endAt, setEndAt] = useState(saved?.endAt ?? '2026-10-22T12:00:00');
  const [duration, setDuration] = useState(String(saved?.durationMinutes ?? 180));
  const [employees, setEmployees] = useState(String(saved?.employeeCount ?? 2));
  const [subtotal, setSubtotal] = useState(String((saved?.subtotalCents ?? 18000) / 100));
  const [taxRate, setTaxRate] = useState(String((saved?.taxRateBps ?? 1498) / 100));
  const [validDays, setValidDays] = useState(String(saved?.validDays ?? 7));
  const [notes, setNotes] = useState(saved?.notes ?? 'Cuisine et salle de bain prioritaires.');
  const [conditions, setConditions] = useState(saved?.conditions ?? 'Matériel et déplacement inclus.');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amounts = useMemo(() => {
    const subtotalCents = Math.round(numberOrZero(subtotal) * 100);
    const rateBps = Math.round(numberOrZero(taxRate) * 100);
    const taxCents = Math.round(subtotalCents * rateBps / 10000);
    return { subtotalCents, rateBps, taxCents, totalCents: subtotalCents + taxCents };
  }, [subtotal, taxRate]);

  function validate() {
    const next: Record<string, string> = {};
    if (!serviceName.trim()) next.service = 'La prestation est requise.';
    if (!address.trim()) next.address = 'L’adresse est requise.';
    if (!startAt.trim() || Number.isNaN(new Date(startAt).getTime())) next.startAt = 'Date de début invalide.';
    if (!endAt.trim() || Number.isNaN(new Date(endAt).getTime())) next.endAt = 'Date de fin invalide.';
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) next.endAt = 'La fin doit être après le début.';
    if (numberOrZero(duration) <= 0) next.duration = 'La durée doit être positive.';
    if (!Number.isInteger(numberOrZero(employees)) || numberOrZero(employees) <= 0) next.employees = 'Entrez un effectif valide.';
    if (amounts.subtotalCents <= 0) next.subtotal = 'Le montant doit être positif.';
    if (numberOrZero(validDays) <= 0) next.validDays = 'La validité doit être positive.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildDraft(): EstimateDraft {
    return {
      requestId, clientId: client.id, clientName: client.name, serviceName: serviceName.trim(), address: address.trim(),
      startAt: startAt.trim(), endAt: endAt.trim(), durationMinutes: Math.round(numberOrZero(duration)),
      employeeCount: Math.round(numberOrZero(employees)), subtotalCents: amounts.subtotalCents,
      taxRateBps: amounts.rateBps, validDays: Math.round(numberOrZero(validDays)), notes: notes.trim(), conditions: conditions.trim(),
    };
  }

  function save(preview: boolean) {
    if (!validate()) return;
    const offer = saveDraft(buildDraft());
    if (preview) navigation.navigate('OfferPreview', { offerId: offer.id });
  }

  return <AdminWorkspace title="Créer l’estimation" subtitle="Préparez une offre claire et calculée en dollars canadiens." onBack={() => navigation.goBack()}>
    <AdminCard>
      <AdminBadge label="ÉCRAN 48" />
      <AdminSectionTitle>Demande client</AdminSectionTitle>
      <AppText style={adminStyles.text}>{client.name}</AppText>
      <AppText style={adminStyles.muted}>{client.email} · {client.phone}</AppText>
    </AdminCard>

    <AdminCard>
      <AdminSectionTitle>Prestation et créneau</AdminSectionTitle>
      <AdminTextField label="Prestation" value={serviceName} onChangeText={setServiceName} error={errors.service} />
      <AdminTextField label="Adresse" value={address} onChangeText={setAddress} error={errors.address} />
      <AdminTextField label="Début (ISO)" value={startAt} onChangeText={setStartAt} error={errors.startAt} autoCapitalize="none" />
      <AdminTextField label="Fin (ISO)" value={endAt} onChangeText={setEndAt} error={errors.endAt} autoCapitalize="none" />
      <View style={styles.twoCols}>
        <View style={styles.field}><AdminTextField label="Durée (min)" value={duration} onChangeText={setDuration} keyboardType="numeric" error={errors.duration} /></View>
        <View style={styles.field}><AdminTextField label="Employés requis" value={employees} onChangeText={setEmployees} keyboardType="numeric" error={errors.employees} /></View>
      </View>
    </AdminCard>

    <AdminCard>
      <AdminSectionTitle>Montants</AdminSectionTitle>
      <View style={styles.twoCols}>
        <View style={styles.field}><AdminTextField label="Sous-total ($)" value={subtotal} onChangeText={setSubtotal} keyboardType="decimal-pad" error={errors.subtotal} /></View>
        <View style={styles.field}><AdminTextField label="Taxes (%)" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" /></View>
      </View>
      <View style={styles.summaryRow}><AppText style={adminStyles.muted}>Taxes</AppText><AppText style={styles.money}>{formatCad(amounts.taxCents)}</AppText></View>
      <View style={styles.summaryRow}><AppText style={styles.totalLabel}>Total</AppText><AppText style={styles.total}>{formatCad(amounts.totalCents)}</AppText></View>
      <AdminTextField label="Validité (jours)" value={validDays} onChangeText={setValidDays} keyboardType="numeric" error={errors.validDays} />
    </AdminCard>

    <AdminCard>
      <AdminSectionTitle>Notes et conditions</AdminSectionTitle>
      <AdminTextField label="Notes" value={notes} onChangeText={setNotes} multiline />
      <AdminTextField label="Conditions" value={conditions} onChangeText={setConditions} multiline />
    </AdminCard>

    <View style={styles.actions}>
      <View style={styles.action}><AdminButton title="Enregistrer le brouillon" icon="save-outline" variant="secondary" onPress={() => save(false)} /></View>
      <View style={styles.action}><AdminButton title="Prévisualiser l’offre" icon="eye-outline" onPress={() => save(true)} /></View>
    </View>
  </AdminWorkspace>;
}

export function OfferPreviewScreen({ navigation, route }: NativeStackScreenProps<AdminStackParamList, 'OfferPreview'>) {
  const offer = useAdminStore(state => state.offers.find(item => item.id === route.params.offerId));
  const sendOffer = useAdminStore(state => state.sendOffer);
  const simulate = useAdminStore(state => state.simulateOfferResponse);
  if (!offer) return <AdminWorkspace title="Offre introuvable" onBack={() => navigation.goBack()}><AdminCard><AppText style={adminStyles.text}>Cette offre n’existe plus.</AppText></AdminCard></AdminWorkspace>;

  return <AdminWorkspace title="Prévisualiser l’offre" subtitle="Les données ci-dessous reprennent exactement le brouillon enregistré." onBack={() => navigation.goBack()}>
    <AdminCard>
      <View style={styles.previewHead}><AdminBadge label={offer.reference} /><AdminBadge label={offerLabels[offer.status]} tone={offerTone(offer.status)} /></View>
      <AppText style={styles.clientName}>{offer.clientName}</AppText>
      <AppText style={adminStyles.muted}>{offer.serviceName}</AppText>
      <View style={adminStyles.divider} />
      <Detail icon="location-outline" label={offer.address} />
      <Detail icon="calendar-outline" label={formatAdminDateTime(offer.startAt)} />
      <Detail icon="time-outline" label={offer.durationMinutes + ' min · ' + offer.employeeCount + ' employé(s)'} />
    </AdminCard>

    <AdminCard>
      <AdminSectionTitle>Détail des prix</AdminSectionTitle>
      <Price label="Sous-total" value={formatCad(offer.subtotalCents)} />
      <Price label="Taxes" value={formatCad(offer.taxCents)} />
      <View style={adminStyles.divider} />
      <Price label="Total" value={formatCad(offer.totalCents)} strong />
      <AppText style={adminStyles.muted}>Validité : {offer.validDays} jours</AppText>
    </AdminCard>

    <AdminCard>
      <AdminSectionTitle>Conditions</AdminSectionTitle>
      <AppText style={adminStyles.text}>{offer.notes || 'Aucune note.'}</AppText>
      <AppText style={adminStyles.muted}>{offer.conditions || 'Aucune condition particulière.'}</AppText>
    </AdminCard>

    <View style={styles.actions}>
      <View style={styles.action}><AdminButton title="Modifier l’estimation" variant="secondary" icon="create-outline" onPress={() => navigation.navigate('CreateEstimate', { requestId: offer.requestId })} /></View>
      <View style={styles.action}><AdminButton title={offer.status === 'DRAFT' ? 'Simuler l’envoi' : 'Offre déjà envoyée'} icon="paper-plane-outline" disabled={offer.status !== 'DRAFT'} onPress={() => sendOffer(offer.id)} /></View>
    </View>
    {offer.status === 'SENT' && <View style={styles.actions}>
      <View style={styles.action}><AdminButton title="Simuler l’acceptation" variant="secondary" icon="checkmark-circle-outline" onPress={() => simulate(offer.id, true)} /></View>
      <View style={styles.action}><AdminButton title="Simuler le refus" variant="danger" icon="close-circle-outline" onPress={() => simulate(offer.id, false)} /></View>
    </View>}
  </AdminWorkspace>;
}

export function OffersScreen({ navigation }: NativeStackScreenProps<AdminStackParamList, 'Offers'>) {
  const offers = useAdminStore(state => state.offers);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AdminOfferStatus | 'ALL'>('ALL');
  const visible = offers.filter(offer =>
    (status === 'ALL' || offer.status === status) &&
    (offer.clientName.toLowerCase().includes(query.toLowerCase()) || offer.reference.toLowerCase().includes(query.toLowerCase()))
  );

  const filters: Array<AdminOfferStatus | 'ALL'> = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REFUSED', 'EXPIRED', 'CANCELLED'];
  return <AdminWorkspace title="Offres envoyées" subtitle="Recherche, suivi et reprise des offres." onBack={() => navigation.goBack()}>
    <AdminTextField label="Rechercher" placeholder="Client ou référence" value={query} onChangeText={setQuery} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {filters.map(item => <Pressable key={item} onPress={() => setStatus(item)} style={[styles.filter, status === item && styles.filterActive]}>
        <AppText style={[styles.filterText, status === item && styles.filterTextActive]}>{item === 'ALL' ? 'Toutes' : offerLabels[item]}</AppText>
      </Pressable>)}
    </ScrollView>
    <AppText style={adminStyles.muted}>{visible.length} offre(s) affichée(s)</AppText>
    {visible.map(offer => <Pressable key={offer.id} onPress={() => navigation.navigate('OfferPreview', { offerId: offer.id })}>
      <AdminCard>
        <View style={styles.previewHead}><AdminBadge label={offer.reference} /><AdminBadge label={offerLabels[offer.status]} tone={offerTone(offer.status)} /></View>
        <AppText style={styles.clientName}>{offer.clientName}</AppText>
        <AppText style={adminStyles.muted}>{offer.serviceName} · {formatCad(offer.totalCents)}</AppText>
        <AppText style={adminStyles.muted}>{formatAdminDateTime(offer.startAt)} · validité {offer.validDays} jours</AppText>
      </AdminCard>
    </Pressable>)}
    {!visible.length && <AdminCard><AppText style={adminStyles.text}>Aucune offre ne correspond à ces critères.</AppText></AdminCard>}
  </AdminWorkspace>;
}

function Detail({ icon, label }: { icon: ComponentProps<typeof Ionicons>['name']; label: string }) {
  return <View style={styles.detail}><Ionicons name={icon} size={19} color={theme.blue} /><AppText style={styles.detailText}>{label}</AppText></View>;
}

function Price({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.summaryRow}><AppText style={strong ? styles.totalLabel : adminStyles.muted}>{label}</AppText><AppText style={strong ? styles.total : styles.money}>{value}</AppText></View>;
}

const styles = StyleSheet.create({
  twoCols: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  field: { flexGrow: 1, flexBasis: '44%', minWidth: 130 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  money: { color: theme.text, fontFamily: fonts.bold },
  totalLabel: { color: theme.text, fontFamily: fonts.titleBold, fontSize: 18 },
  total: { color: theme.blue, fontFamily: fonts.titleBold, fontSize: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { flexGrow: 1, flexBasis: '44%', minWidth: 150 },
  previewHead: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  clientName: { color: theme.text, fontFamily: fonts.titleBold, fontSize: 20, lineHeight: 28 },
  detail: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  detailText: { flex: 1, color: theme.text },
  filters: { gap: 8, paddingVertical: 2 },
  filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  filterActive: { backgroundColor: '#275A9D', borderColor: theme.blue },
  filterText: { color: theme.muted, fontSize: 12 },
  filterTextActive: { color: theme.text },
});
