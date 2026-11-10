import { ToggleRow } from '../../../components/ToggleRow';
import { useEmployerTheme, type EmployerTheme } from '../theme';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import {
  AdminBadge, AdminCard, AdminChips, AdminDetail, AdminEmpty, AdminField,
  AdminNotice, AdminPage, useAdminStyles,
} from '../components/AdminUI';
import { EmployerActionButton } from '../components/EmployerActionButton';
import { EmployerDialog } from '../components/EmployerDialog';
import { dateLabel, formatMoney, isValidDate, localDate, parseDecimal, timeMinutes } from '../services/adminHelpers';
import { useAdminStore } from '../store/adminStore';
import { offerStatusLabels, type AdminOffer, type AdminScreenProps, type EstimateInput, type OfferStatus } from '../types/admin';

const demoMessage = 'Démonstration : modifications conservées pendant cette session. Aucun courriel réel n’est envoyé.';
const statusOptions = [
  { value: 'all', label: 'Toutes' }, { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'En attente' }, { value: 'accepted', label: 'Acceptées' },
  { value: 'refused', label: 'Refusées' }, { value: 'expired', label: 'Expirées' },
  { value: 'cancelled', label: 'Annulées' },
] as const;

function effectiveStatus(offer: AdminOffer): OfferStatus {
  return offer.status === 'sent' && offer.validUntil && new Date(offer.validUntil).getTime() <= Date.now()
    ? 'expired' : offer.status;
}

function OfferBadge({ offer }: { offer: AdminOffer }) {

  const status = effectiveStatus(offer);
  const tone = status === 'accepted' ? 'green' : status === 'sent' ? 'orange'
    : status === 'refused' ? 'red' : status === 'draft' ? 'blue' : 'muted';
  return <AdminBadge label={offerStatusLabels[status]} tone={tone} />;
}

function timestampLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-CA', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface EstimateForm {
  durationHours: string; employeeCount: string; subtotal: string; taxPercent: string;
  date: string; startTime: string; endTime: string; validityHours: string; notes: string;
}
type FormErrors = Partial<Record<keyof EstimateForm, string>>;

function EstimateScreen({ route, onNavigate, onBack }: AdminScreenProps) {
  const adminStyles = useAdminStyles();

  const requests = useAdminStore(state => state.requests);
  const offers = useAdminStore(state => state.offers);
  const settings = useAdminStore(state => state.settings);
  const saveEstimate = useAdminStore(state => state.saveEstimate);
  const requestId = route.screen === 'estimate' ? route.requestId : '';
  const requestedOfferId = route.screen === 'estimate' ? route.offerId : undefined;
  const request = requests.find(item => item.id === requestId);
  const draft = requestedOfferId ? offers.find(item => item.id === requestedOfferId)
    : offers.find(item => item.requestId === requestId && item.status === 'draft');
  const [form, setForm] = useState<EstimateForm>(() => ({
    durationHours: String(draft?.durationHours ?? 3), employeeCount: String(draft?.employeeCount ?? 1),
    subtotal: draft ? (draft.subtotalCents / 100).toFixed(2).replace('.', ',') : '180,00',
    taxPercent: String(draft?.taxPercent ?? settings.defaultTaxPercent).replace('.', ','),
    date: draft?.date ?? (request?.preferredDate.slice(0, 10) || localDate()),
    startTime: draft?.startTime ?? '09:00', endTime: draft?.endTime ?? '12:00',
    validityHours: String(draft?.validityHours ?? settings.defaultValidityHours), notes: draft?.notes ?? '',
  }));
  const [beforePhotos, setBeforePhotos] = useState(draft?.requiresBeforePhotos ?? false);
  const [afterPhotos, setAfterPhotos] = useState(draft?.requiresAfterPhotos ?? false);
  const [savedId, setSavedId] = useState(draft?.id);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<{ message: string; error?: boolean }>();
  const subtotal = parseDecimal(form.subtotal);
  const taxRate = parseDecimal(form.taxPercent);
  const subtotalCents = subtotal === null ? 0 : Math.round(subtotal * 100);
  const taxCents = taxRate === null ? 0 : Math.round(subtotalCents * taxRate / 100);

  const change = (key: keyof EstimateForm, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
    setNotice(undefined);
  };

  const save = (preview: boolean) => {
    const next: FormErrors = {};
    const durationHours = parseDecimal(form.durationHours);
    const employeeCount = Number(form.employeeCount);
    const validityHours = Number(form.validityHours);
    const start = timeMinutes(form.startTime), end = timeMinutes(form.endTime);
    if (durationHours === null || durationHours < 0.25 || durationHours > 24) next.durationHours = 'Indiquez une durée comprise entre 0,25 et 24 h.';
    if (!Number.isInteger(employeeCount) || employeeCount < 1 || employeeCount > 20) next.employeeCount = 'Indiquez un nombre entier entre 1 et 20.';
    if (subtotal === null || subtotal <= 0 || !/^\d+(?:[.,]\d{1,2})?$/.test(form.subtotal.trim())) next.subtotal = 'Indiquez un montant positif, avec au maximum deux décimales.';
    if (taxRate === null || taxRate > 30) next.taxPercent = 'Indiquez un taux entre 0 et 30 %.';
    if (!isValidDate(form.date)) next.date = 'Utilisez une date valide au format AAAA-MM-JJ.';
    else if (form.date < localDate()) next.date = 'La date de prestation ne peut pas être passée.';
    if (start === null) next.startTime = 'Utilisez le format HH:MM, par exemple 09:00.';
    if (end === null) next.endTime = 'Utilisez le format HH:MM, par exemple 12:00.';
    else if (start !== null && end <= start) next.endTime = 'L’heure de fin doit suivre l’heure de début, le même jour.';
    else if (start !== null && end !== null && durationHours !== null && (end - start) / 60 < durationHours) next.endTime = 'Le créneau doit couvrir la durée estimée.';
    if (!Number.isInteger(validityHours) || validityHours < 1 || validityHours > 720) next.validityHours = 'Indiquez une durée entière entre 1 et 720 heures.';
    setErrors(next);
    if (Object.keys(next).length) {
      setNotice({ message: 'Vérifiez les champs indiqués avant de continuer.', error: true });
      return;
    }
    const input: EstimateInput = {
      requiresBeforePhotos: beforePhotos, requiresAfterPhotos: afterPhotos,
      requestId, offerId: savedId ?? draft?.id, durationHours: durationHours!, employeeCount,
      subtotal: form.subtotal, taxPercent: form.taxPercent, date: form.date,
      startTime: form.startTime, endTime: form.endTime, validityHours, notes: form.notes.trim(),
    };
    const result = saveEstimate(input);
    if (!result.ok) { setNotice({ message: result.error, error: true }); return; }
    setSavedId(result.value.id);
    if (preview) onNavigate({ screen: 'offer-preview', offerId: result.value.id });
    else setNotice({ message: 'Brouillon enregistré pour cette session.' });
  };

  if (!request || (requestedOfferId && !draft)) return <AdminPage showFormLogo title="Créer l’estimation" onBack={onBack}>
    <AdminEmpty title="Dossier introuvable" message="Cette demande ou cette offre n’est plus disponible. Revenez à la liste pour choisir un autre dossier." />
  </AdminPage>;
  if (draft && draft.status !== 'draft') return <AdminPage title="Estimation déjà transmise" onBack={onBack}>
    <AdminEmpty title="Cette offre est déjà finalisée" message="Une offre transmise ne peut plus être modifiée. Consultez son suivi pour voir les actions disponibles."
      action={<EmployerActionButton title="Consulter l’offre" onPress={() => onNavigate({ screen: 'offer-detail', offerId: draft.id })} />} />
  </AdminPage>;

  return <AdminPage showFormLogo title="Créer l’estimation" subtitle="Préparez une offre claire à partir de la demande du client." onBack={onBack}>
    <AdminCard>
      <AdminBadge label="Estimation · Brouillon" />
      <AppText style={adminStyles.heading}>{request.clientName}</AppText>
      <AppText style={adminStyles.text}>{request.serviceType}</AppText>
      <AdminDetail label="Lieu" value={request.location} />
      <AdminDetail label="Besoin du client" value={request.description} />
    </AdminCard>
    <AdminCard>
      <AppText style={adminStyles.heading}>Prestation et équipe</AppText><ToggleRow label="Photos avant obligatoires" value={beforePhotos} onChange={setBeforePhotos} /><ToggleRow label="Photos après obligatoires" value={afterPhotos} onChange={setAfterPhotos} />
      <View style={adminStyles.split}>
        <View style={adminStyles.grow}><AdminField label="Durée estimée (heures)" value={form.durationHours}
          onChangeText={value => change('durationHours', value)} keyboardType="decimal-pad" error={errors.durationHours} /></View>
        <View style={adminStyles.grow}><AdminField label="Nombre d’employés" value={form.employeeCount}
          onChangeText={value => change('employeeCount', value)} keyboardType="number-pad" error={errors.employeeCount} /></View>
      </View>
      <AdminField label="Date de prestation" hint="AAAA-MM-JJ" value={form.date} autoCapitalize="none" maxLength={10}
        onChangeText={value => change('date', value)} keyboardType="numbers-and-punctuation" error={errors.date} />
      <View style={adminStyles.split}>
        <View style={adminStyles.grow}><AdminField label="Heure de début" hint="HH:MM · format 24 heures" value={form.startTime}
          maxLength={5} onChangeText={value => change('startTime', value)} keyboardType="numbers-and-punctuation" error={errors.startTime} /></View>
        <View style={adminStyles.grow}><AdminField label="Heure de fin" hint="HH:MM · le même jour" value={form.endTime}
          maxLength={5} onChangeText={value => change('endTime', value)} keyboardType="numbers-and-punctuation" error={errors.endTime} /></View>
      </View>
    </AdminCard>
    <AdminCard>
      <AppText style={adminStyles.heading}>Montant de l’offre</AppText>
      <AdminField label="Montant hors taxes (CAD)" hint="Montant global de la prestation, pour toute l’équipe." value={form.subtotal}
        onChangeText={value => change('subtotal', value)} keyboardType="decimal-pad" error={errors.subtotal} />
      <AdminField label="Taxes (%)" value={form.taxPercent} onChangeText={value => change('taxPercent', value)}
        keyboardType="decimal-pad" error={errors.taxPercent} hint="Taux initial repris des paramètres administratifs." />
      <View style={adminStyles.divider}>
        <MoneyRow label="Sous-total" amount={subtotalCents} />
        <MoneyRow label="Taxes" amount={taxCents} />
        <MoneyRow label="Total estimé" amount={subtotalCents + taxCents} total />
      </View>
      <AdminField label="Validité après l’envoi (heures)" value={form.validityHours}
        onChangeText={value => change('validityHours', value)} keyboardType="number-pad" error={errors.validityHours} />
      <AdminField label="Notes et conditions" value={form.notes} onChangeText={value => change('notes', value)}
        multiline maxLength={2000} placeholder="Précisions sur le matériel, l’accès ou les conditions de la prestation…" />
    </AdminCard>
    <AdminNotice message={notice?.message} error={notice?.error} />
    <EmployerActionButton title="Prévisualiser l’offre" icon="eye-outline" onPress={() => save(true)} />
    <EmployerActionButton title="Enregistrer le brouillon" variant="secondary" icon="save-outline" onPress={() => save(false)} />
    <AppText style={adminStyles.muted}>{demoMessage}</AppText>
  </AdminPage>;
}

function MoneyRow({ label, amount, total = false }: { label: string; amount: number; total?: boolean }) {
  const theme = useEmployerTheme();
  const styles = createStyles(theme);
  const adminStyles = useAdminStyles();

  return <View style={styles.moneyRow}>
    <AppText style={[total ? adminStyles.heading : adminStyles.muted, styles.moneyLabel]}>{label}</AppText>
    <AppText style={total ? adminStyles.heading : adminStyles.text}>{formatMoney(amount)}</AppText>
  </View>;
}

function OfferContent({ offer }: { offer: AdminOffer }) {
  const adminStyles = useAdminStyles();

  const request = useAdminStore(state => state.requests.find(item => item.id === offer.requestId));
  const settings = useAdminStore(state => state.settings);
  return <>
    <AdminCard>
      <View style={adminStyles.row}><OfferBadge offer={offer} /><AppText style={adminStyles.muted}>{offer.id}</AppText></View>
      <AppText style={adminStyles.heading}>{settings.companyName}</AppText>
      <AdminDetail label="Client" value={request?.clientName ?? 'Client non disponible'} />
      <AdminDetail label="Prestation" value={request?.serviceType ?? 'Prestation non disponible'} />
      {request && <AdminDetail label="Adresse de la prestation" value={request.location} />}
      <View style={adminStyles.divider}>
        <AdminDetail label="Date et horaire" value={`${dateLabel(offer.date)} · ${offer.startTime} à ${offer.endTime}`} />
        <AdminDetail label="Organisation" value={`${offer.durationHours} h estimées · ${offer.employeeCount} employé${offer.employeeCount > 1 ? 's' : ''}`} />
      </View>
    </AdminCard>
    <AdminCard>
      <AppText style={adminStyles.heading}>Détail du montant</AppText>
      <MoneyRow label="Sous-total" amount={offer.subtotalCents} />
      <MoneyRow label={`Taxes (${String(offer.taxPercent).replace('.', ',')} %)`} amount={offer.taxCents} />
      <View style={adminStyles.divider}><MoneyRow label="Total (CAD)" amount={offer.totalCents} total /></View>
      <AdminDetail label="Validité de l’offre" value={offer.validUntil ? `Jusqu’au ${timestampLabel(offer.validUntil)}` : `${offer.validityHours} heures à compter de l’envoi simulé`} />
      {offer.notes ? <AdminDetail label="Notes et conditions" value={offer.notes} /> : null}
      <AppText style={adminStyles.muted}>Contact : {settings.contactEmail}{settings.contactPhone ? ` · ${settings.contactPhone}` : ''}</AppText>
    </AdminCard>
  </>;
}

function OfferRecordScreen({ route, onNavigate, onBack }: AdminScreenProps) {
  const adminStyles = useAdminStyles();

  const offerId = route.screen === 'offer-preview' || route.screen === 'offer-detail' ? route.offerId : '';
  const offer = useAdminStore(state => state.offers.find(item => item.id === offerId));
  const mission = useAdminStore(state => state.missions.find(item => item.offerId === offerId));
  const sendOffer = useAdminStore(state => state.sendOffer);
  const resolveOffer = useAdminStore(state => state.resolveOffer);
  const cancelOffer = useAdminStore(state => state.cancelOffer);
  const [notice, setNotice] = useState<{ message: string; error?: boolean }>();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const preview = route.screen === 'offer-preview';
  if (!offer) return <AdminPage title={preview ? 'Prévisualiser l’offre' : 'Détail de l’offre'} onBack={onBack}>
    <AdminEmpty title="Offre introuvable" message="Ce dossier n’est plus disponible. Revenez à la liste des offres." />
  </AdminPage>;
  const status = effectiveStatus(offer);
  const send = () => {
    const result = sendOffer(offer.id);
    if (!result.ok) { setNotice({ message: result.error, error: true }); return; }
    onNavigate({ screen: 'offer-detail', offerId: result.value.id });
  };
  const resolve = (decision: 'accepted' | 'refused') => {
    const result = resolveOffer(offer.id, decision);
    setNotice(result.ok ? { message: decision === 'accepted'
      ? 'Acceptation simulée : la mission est maintenant disponible pour l’assignation.'
      : 'Refus simulé enregistré.' } : { message: result.error, error: true });
  };
  const cancel = () => {
    const result = cancelOffer(offer.id);
    setConfirmCancel(false);
    setNotice(result.ok ? { message: 'Offre annulée dans cette démonstration.' } : { message: result.error, error: true });
  };
  return <AdminPage title={preview ? 'Prévisualiser l’offre' : 'Suivi de l’offre'}
    subtitle={preview ? 'Vérifiez l’estimation avant de simuler sa transmission au client.' : 'Retrouvez l’estimation et son état de traitement.'} onBack={onBack}>
    <OfferContent offer={offer} />
    {!preview && <AdminCard>
      <AppText style={adminStyles.heading}>Suivi administratif</AppText>
      <AdminDetail label="Création" value={timestampLabel(offer.createdAt)} />
      {offer.sentAt && <AdminDetail label="Envoi simulé" value={timestampLabel(offer.sentAt)} />}
      {status === 'expired' && <AppText style={adminStyles.muted}>La période de validité est dépassée. Cette offre ne peut plus être acceptée.</AppText>}
      {status === 'accepted' && mission && <EmployerActionButton title="Voir la mission associée" icon="calendar-outline"
        onPress={() => onNavigate({ screen: 'mission-detail', missionId: mission.id })} />}
    </AdminCard>}
    <AdminNotice message={notice?.message} error={notice?.error} />
    {status === 'draft' && <>
      <EmployerActionButton title="Modifier l’estimation" variant="secondary" icon="create-outline"
        onPress={() => onNavigate({ screen: 'estimate', requestId: offer.requestId, offerId: offer.id })} />
      <EmployerActionButton title="Simuler l’envoi" icon="paper-plane-outline" onPress={send} />
    </>}
    {!preview && status === 'sent' && <AdminCard>
      <AdminBadge label="Simulation du parcours client" tone="orange" />
      <AppText style={adminStyles.muted}>Ces commandes servent à tester le suivi administratif. Elles représentent une réponse du client dans les données de démonstration.</AppText>
      <EmployerActionButton title="Simuler l’acceptation" icon="checkmark-circle-outline" onPress={() => resolve('accepted')} />
      <EmployerActionButton title="Simuler le refus" variant="secondary" icon="close-circle-outline" onPress={() => resolve('refused')} />
    </AdminCard>}
    {!preview && (status === 'draft' || status === 'sent') && <EmployerActionButton title="Annuler cette offre"
      variant="secondary" icon="ban-outline" onPress={() => setConfirmCancel(true)} />}
    {!preview && ['expired', 'refused', 'cancelled'].includes(status) && <EmployerActionButton title="Nouvelle estimation"
      icon="add-circle-outline" onPress={() => onNavigate({ screen: 'estimate', requestId: offer.requestId })} />}
    <EmployerActionButton title="Toutes les offres" variant="link" onPress={() => onNavigate({ screen: 'offers' })} />
    <AppText style={adminStyles.muted}>{demoMessage}</AppText>
    {confirmCancel && <EmployerDialog title="Annuler l’offre ?" onClose={() => setConfirmCancel(false)}>
      <AppText style={adminStyles.text}>L’offre {offer.id} sera marquée comme annulée. Elle ne pourra plus être acceptée dans la démonstration.</AppText>
      <EmployerActionButton title="Confirmer l’annulation" onPress={cancel} />
      <EmployerActionButton title="Conserver l’offre" variant="secondary" onPress={() => setConfirmCancel(false)} />
    </EmployerDialog>}
  </AdminPage>;
}

function OffersScreen({ route, onNavigate, onBack }: AdminScreenProps) {
  const adminStyles = useAdminStyles();

  const offers = useAdminStore(state => state.offers);
  const requests = useAdminStore(state => state.requests);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [chooseRequest, setChooseRequest] = useState(false);
  const [sentPeriod, setSentPeriod] = useState<{ from?: string; to?: string } | undefined>(() =>
    route.screen === 'offers' && (route.sentFrom || route.sentTo)
      ? { from: route.sentFrom, to: route.sentTo } : undefined);
  const visible = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('fr-CA');
    return offers.filter(offer => {
      const request = requests.find(item => item.id === offer.requestId);
      if (sentPeriod) {
        if (!offer.sentAt) return false;
        const sent = new Date(offer.sentAt);
        if (Number.isNaN(sent.getTime())) return false;
        const day = localDate(sent);
        if ((sentPeriod.from && day < sentPeriod.from) || (sentPeriod.to && day > sentPeriod.to)) return false;
      }
      return (status === 'all' || effectiveStatus(offer) === status)
        && `${offer.id} ${request?.clientName ?? ''}`.toLocaleLowerCase('fr-CA').includes(search);
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [offers, requests, query, status, sentPeriod]);
  const eligible = requests.filter(request => request.status !== 'confirmed'
    && !offers.some(offer => offer.requestId === request.id && ['sent', 'accepted'].includes(effectiveStatus(offer))));
  return <AdminPage title="Offres et estimations" subtitle="Préparez les offres et suivez les réponses des clients." onBack={onBack}>
    <EmployerActionButton title="Nouvelle estimation" icon="add-circle-outline" onPress={() => setChooseRequest(true)} />
    {sentPeriod && <AdminCard>
      <AdminBadge label="Période du tableau de bord" />
      <AppText style={adminStyles.muted}>{sentPeriod.from && sentPeriod.to
        ? `Envois du ${dateLabel(sentPeriod.from)} au ${dateLabel(sentPeriod.to)}`
        : sentPeriod.from ? `Envois à partir du ${dateLabel(sentPeriod.from)}`
          : `Envois jusqu’au ${dateLabel(sentPeriod.to!)}`}</AppText>
      <EmployerActionButton title="Effacer le filtre de période" variant="link" icon="close-circle-outline"
        onPress={() => setSentPeriod(undefined)} />
    </AdminCard>}
    <AdminField label="Rechercher une offre" placeholder="Nom du client ou référence" value={query} onChangeText={setQuery} autoCapitalize="none" returnKeyType="search" />
    <AdminChips options={statusOptions} value={status} onChange={setStatus} />
    <AppText style={adminStyles.muted}>{visible.length} offre{visible.length > 1 ? 's' : ''} affichée{visible.length > 1 ? 's' : ''} · Démonstration</AppText>
    {visible.length ? visible.map(offer => {
      const request = requests.find(item => item.id === offer.requestId);
      return <AdminCard key={offer.id}>
        <View style={adminStyles.row}><OfferBadge offer={offer} /><AppText style={adminStyles.muted}>{offer.id}</AppText></View>
        <AppText style={adminStyles.heading}>{request?.clientName ?? 'Client non disponible'}</AppText>
        <AppText style={adminStyles.text}>{request?.serviceType ?? 'Prestation'}</AppText>
        <AppText style={adminStyles.muted}>{dateLabel(offer.date)} · {offer.startTime} à {offer.endTime}</AppText>
        <AppText style={adminStyles.number}>{formatMoney(offer.totalCents)}</AppText>
        <EmployerActionButton title="Consulter l’offre" variant="secondary" icon="document-text-outline"
          onPress={() => onNavigate({ screen: 'offer-detail', offerId: offer.id })} />
        {offer.status === 'draft' && <EmployerActionButton title="Modifier le brouillon" icon="create-outline"
          onPress={() => onNavigate({ screen: 'estimate', requestId: offer.requestId, offerId: offer.id })} />}
      </AdminCard>;
    }) : <AdminEmpty title={offers.length ? 'Aucune offre correspondante' : 'Aucune offre pour le moment'}
      message={offers.length ? 'Modifiez la recherche ou choisissez un autre statut.' : 'Créez une première estimation à partir d’une demande client.'} />}
    <AppText style={adminStyles.muted}>{demoMessage}</AppText>
    {chooseRequest && <EmployerDialog title="Choisir une demande" onClose={() => setChooseRequest(false)}>
      <AppText style={adminStyles.muted}>Sélectionnez le dossier à estimer. Un brouillon existant sera repris.</AppText>
      {eligible.length ? eligible.map(request => <AdminCard key={request.id}>
        <AppText style={adminStyles.heading}>{request.clientName}</AppText>
        <AppText style={adminStyles.text}>{request.serviceType}</AppText>
        <AppText style={adminStyles.muted}>{request.location}</AppText>
        <EmployerActionButton title="Préparer l’estimation" onPress={() => {
          setChooseRequest(false); onNavigate({ screen: 'estimate', requestId: request.id });
        }} />
      </AdminCard>) : <AppText style={adminStyles.text}>Toutes les demandes ont déjà une offre en attente ou acceptée. Consultez les offres existantes pour leur suivi.</AppText>}
      <EmployerActionButton title="Fermer" variant="secondary" onPress={() => setChooseRequest(false)} />
    </EmployerDialog>}
  </AdminPage>;
}

export function AdminOfferScreens(props: AdminScreenProps) {

  const { route } = props;
  if (route.screen === 'estimate') return <EstimateScreen key={`${route.requestId}-${route.offerId ?? 'new'}`} {...props} />;
  if (route.screen === 'offer-preview' || route.screen === 'offer-detail') return <OfferRecordScreen key={`${route.screen}-${route.offerId}`} {...props} />;
  if (route.screen === 'offers') return <OffersScreen key={`offers-${route.sentFrom ?? ''}-${route.sentTo ?? ''}`} {...props} />;
  return null;
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  moneyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  moneyLabel: { flexShrink: 1 },
}));
