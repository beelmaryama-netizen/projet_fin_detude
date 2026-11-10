import { createApiEmployee } from '../services/apiAdminService';
import * as Crypto from 'expo-crypto';
import { apiMode } from '../../../services/api/config';
import { adminActions } from '../services/apiAdminService';
import { authService } from '../../auth/services/authService';
import { useAuthStore } from '../../../store/authStore';
import { ToggleRow } from '../../../components/ToggleRow';
import { useEmployerTheme, type EmployerTheme } from '../theme';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import {
  AdminBadge, AdminCard, AdminChips, AdminDetail, AdminEmpty, AdminField,
  AdminNotice, AdminPage, useAdminStyles,
} from '../components/AdminUI';
import { EmployerActionButton } from '../components/EmployerActionButton';
import { EmployerDialog } from '../components/EmployerDialog';
import { dateLabel } from '../services/adminHelpers';
import { useAdminStore } from '../store/adminStore';
import {
  missionStatusLabels, type AdminClient, type AdminEmployee, type AdminMission,
  type AdminScreenProps, type AdminStore, type EmployeeInput,
} from '../types/admin';
import { employerStatusLabels, type EmployerRequest } from '../types/employer';

type DirectoryProps = Pick<AdminScreenProps, 'onBack' | 'onNavigate'> & { store: AdminStore };
type FieldKey = keyof Omit<EmployeeInput, 'specialties' | 'workingHours'>;
type FormValues = Omit<EmployeeInput, 'specialties' | 'workingHours'> & { specialtyText: string };
const employeeFilters = [
  { value: 'all', label: 'Tous' }, { value: 'active', label: 'Actifs' }, { value: 'suspended', label: 'Suspendus' },
] as const;
const clientFilters = [
  { value: 'all', label: 'Tous' }, { value: 'Résidentiel', label: 'Résidentiels' }, { value: 'Entreprise', label: 'Entreprises' },
] as const;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-CA').trim();
const employeeName = (employee: AdminEmployee) => `${employee.firstName} ${employee.lastName}`.trim();

export function AdminDirectoryScreens({ route, onBack, onNavigate }: AdminScreenProps) {

  const store = useAdminStore();
  const props: DirectoryProps = { store, onBack, onNavigate };
  switch (route.screen) {
    case 'employees': return <Employees {...props} />;
    case 'employee-create': return <CreateEmployee {...props} />;
    case 'employee-detail': return <EmployeeDetails key={route.employeeId} {...props} employeeId={route.employeeId} />;
    case 'clients': return <Clients {...props} />;
    case 'client-detail': return <ClientDetails key={route.clientId} {...props} clientId={route.clientId} />;
    default: return <AdminPage title="Répertoire" onBack={onBack}><AdminEmpty title="Page indisponible" message="Revenez au menu pour choisir un répertoire." /></AdminPage>;
  }
}

function Employees({ store, onBack, onNavigate }: DirectoryProps) {
  const s = useAdminStyles();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const query = normalize(search);
  const employees = useMemo(() => store.employees.filter(employee => {
    const matchesStatus = filter === 'all' || (filter === 'active' ? employee.active : !employee.active);
    return matchesStatus && normalize(`${employeeName(employee)} ${employee.email} ${employee.city}`).includes(query);
  }).sort((a, b) => employeeName(a).localeCompare(employeeName(b), 'fr-CA')), [store.employees, query, filter]);
  return <AdminPage title="Employés" subtitle="Coordonnées, spécialités et affectations de votre équipe." onBack={onBack}>
    <AdminCard>
      <View style={s.split}>
        <View style={s.grow}><AppText style={s.number}>{store.employees.filter(employee => employee.active).length}</AppText><AppText style={s.muted}>employés actifs</AppText></View>
        <View style={s.grow}><AppText style={s.number}>{store.employees.filter(employee => !employee.active).length}</AppText><AppText style={s.muted}>employés suspendus</AppText></View>
      </View>
      <EmployerActionButton title="Créer un compte employé" icon="person-add-outline" onPress={() => onNavigate({ screen: 'employee-create' })} />
    </AdminCard>
    <AdminField label="Rechercher un employé" placeholder="Nom, courriel ou ville" value={search} onChangeText={setSearch} autoCorrect={false} />
    <AdminChips options={employeeFilters} value={filter} onChange={setFilter} />
    <AppText style={s.muted}>{employees.length} employé{employees.length > 1 ? 's' : ''} affiché{employees.length > 1 ? 's' : ''} · Données locales de démonstration</AppText>
    {employees.length === 0 && <AdminEmpty title="Aucun employé trouvé" message="Essayez un autre nom, une autre ville ou un autre filtre." action={<EmployerActionButton title="Réinitialiser la recherche" variant="secondary" onPress={() => { setSearch(''); setFilter('all'); }} />} />}
    {employees.map(employee => <AdminCard key={employee.id}>
      <View style={s.row}><AdminBadge label={employee.active ? 'Actif' : 'Suspendu'} tone={employee.active ? 'green' : 'red'} />{employee.activationPending && <AdminBadge label="Activation à prévoir" tone="orange" />}</View>
      <AppText style={s.heading}>{employeeName(employee)}</AppText>
      <AppText style={s.muted}>{employee.email}</AppText>
      <AppText style={s.text}>{employee.city || 'Ville non renseignée'}</AppText>
      <AppText style={s.muted}>{employee.specialties.length ? employee.specialties.join(' · ') : 'Aucune spécialité renseignée'}</AppText>
      <AppText style={s.muted}>{store.missions.filter(mission => (mission.employeeIds ?? (mission.employeeId ? [mission.employeeId] : [])).includes(employee.id) && ['planned', 'in-progress'].includes(mission.status)).length} mission(s) affectée(s) à venir ou en cours</AppText>
      <EmployerActionButton title="Voir la fiche employé" variant="secondary" icon="person-outline" onPress={() => onNavigate({ screen: 'employee-detail', employeeId: employee.id })} />
    </AdminCard>)}
  </AdminPage>;
}

function CreateEmployee({ store, onBack, onNavigate }: DirectoryProps) {
  const s = useAdminStyles();

  const [error, setError] = useState<string>(); const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; id: string }>();
  async function create(input: EmployeeInput) {
   if (busy) return; setBusy(true); setError(undefined);
   if (apiMode) { try { setCreated(await createApiEmployee(input)); } catch (e) { setError(e instanceof Error ? e.message : 'Création impossible'); } finally { setBusy(false); } return; }
   const admin = useAuthStore.getState().session?.user;
   if (!admin || admin.role !== 'ADMIN') { setError('Session administrateur requise.'); setBusy(false); return; }
   const result = store.createEmployee(input);
   if (!result.ok) { setError(result.error); setBusy(false); return; }
   const password = 'Mp!2026-' + Crypto.randomUUID().slice(0, 18);
   try {
    await authService.provisionEmployee(admin, { id: result.value.id, email: result.value.email, firstName: input.firstName, lastName: input.lastName, phone: input.phone, role: 'EMPLOYEE' }, password);
    useAdminStore.setState(s => ({ employees: s.employees.map(e => e.id === result.value.id ? { ...e, activationPending: false } : e) }));
    setCreated({ email: result.value.email, password, id: result.value.id });
   } catch (e) { useAdminStore.setState(s => ({ employees: s.employees.filter(e => e.id !== result.value.id), audit: s.audit.filter(a => a.entityId !== result.value.id) })); setError(e instanceof Error ? e.message : 'Création impossible.'); }
   finally { setBusy(false); }
  }
  if (created) return <AdminPage title="Accès employé créé" onBack={onBack}><AdminCard><AppText>Compte employé : {created.email}</AppText><AppText selectable>Mot de passe temporaire : {created.password}</AppText><AppText>Notez cet accès avant de quitter. {!apiMode && 'Code de démonstration : 123456.'} Le mot de passe doit être changé à la première connexion. Aucun courriel n’a été envoyé.</AppText><EmployerActionButton title="Voir la fiche employé" onPress={() => onNavigate({ screen: 'employee-detail', employeeId: created.id })} /></AdminCard></AdminPage>;
  return <AdminPage showFormLogo title="Créer un compte employé" subtitle="Ajoutez un membre à votre équipe." onBack={onBack}>
    <AdminCard>
      <AdminBadge label={apiMode ? "Compte serveur" : "Création locale"} tone="orange" />
      <AppText style={s.muted}>{apiMode ? 'Un compte sera créé sur le serveur. Notez son mot de passe temporaire affiché une seule fois.' : 'Un accès local sera créé avec un mot de passe temporaire affiché une seule fois.'}</AppText>
    </AdminCard>
    <EmployeeForm busy={busy} submitLabel="Créer le compte employé" error={error} onCancel={onBack} onSubmit={input => void create(input)} />
  </AdminPage>;
}

function EmployeeForm({ employee, submitLabel, error, onSubmit, onCancel, busy = false }: {
  busy?: boolean; employee?: AdminEmployee; submitLabel: string; error?: string;
  onSubmit: (input: EmployeeInput) => void; onCancel: () => void;
}) {
  const s = useAdminStyles();

  const [values, setValues] = useState<FormValues>(() => ({
    firstName: employee?.firstName ?? '', lastName: employee?.lastName ?? '', email: employee?.email ?? '',
    phone: employee?.phone ?? '', city: employee?.city ?? '', availability: employee?.availability ?? '',
    specialtyText: employee?.specialties.join(', ') ?? '',
  }));
  const [hours, setHours] = useState(employee?.workingHours ?? { days: [1,2,3,4,5], start: '08:00', end: '18:00' });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  function update(field: keyof FormValues, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    if (field !== 'specialtyText') setErrors(previous => ({ ...previous, [field]: undefined }));
  }
  function save() {
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    if (!values.firstName.trim()) nextErrors.firstName = 'Le prénom est requis.';
    if (!values.lastName.trim()) nextErrors.lastName = 'Le nom est requis.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) nextErrors.email = 'Saisissez un courriel valide.';
    if (!values.city.trim()) nextErrors.city = 'La ville est requise.';
    const phoneDigits = values.phone.replace(/\D/g, '').length;
    if (values.phone.trim() && (phoneDigits < 7 || phoneDigits > 15)) nextErrors.phone = 'Saisissez un numéro de 7 à 15 chiffres.';
    if (!hours.days.length || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.end) || hours.end <= hours.start) nextErrors.availability = 'Choisissez les jours et une plage horaire valide.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit({
      firstName: values.firstName.trim(), lastName: values.lastName.trim(), email: values.email.trim(),
      phone: values.phone.trim(), city: values.city.trim(), availability: values.availability.trim(),
      workingHours: hours,
      specialties: [...new Set(values.specialtyText.split(',').map(value => value.trim()).filter(Boolean))],
    });
  }
  return <AdminCard>
    <AppText style={s.muted}>Les champs marqués d’un astérisque sont obligatoires.</AppText>
    <View style={s.split}>
      <View style={s.grow}><AdminField label="Prénom *" value={values.firstName} onChangeText={value => update('firstName', value)} error={errors.firstName} autoCapitalize="words" maxLength={80} /></View>
      <View style={s.grow}><AdminField label="Nom *" value={values.lastName} onChangeText={value => update('lastName', value)} error={errors.lastName} autoCapitalize="words" maxLength={80} /></View>
    </View>
    <AdminField label="Courriel *" value={values.email} onChangeText={value => update('email', value)} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={160} />
    <AdminField label="Téléphone" value={values.phone} onChangeText={value => update('phone', value)} error={errors.phone} keyboardType="phone-pad" maxLength={30} />
    <AdminField label="Ville *" value={values.city} onChangeText={value => update('city', value)} error={errors.city} autoCapitalize="words" maxLength={120} />
    <AdminField label="Spécialités" value={values.specialtyText} onChangeText={value => update('specialtyText', value)} placeholder="Résidentiel, bureaux, vitres…" hint="Séparez les spécialités par des virgules." maxLength={300} />
    <AppText>Jours disponibles</AppText>{['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'].map((day, index) => <ToggleRow key={day} label={day} value={hours.days.includes(index)} onChange={selected => setHours({ ...hours, days: selected ? [...hours.days, index] : hours.days.filter(d => d !== index) })} />)}<AdminField label="Disponible à partir de" value={hours.start} onChangeText={start => setHours({ ...hours, start })} placeholder="08:00" maxLength={5} /><AdminField label="Disponible jusqu’à" value={hours.end} onChangeText={end => setHours({ ...hours, end })} placeholder="18:00" maxLength={5} error={errors.availability} />
    <AdminField label="Disponibilités" value={values.availability} onChangeText={value => update('availability', value)} placeholder="Ex. : du lundi au vendredi, de 8 h à 17 h" multiline maxLength={500} />
    <AdminNotice message={error} error />
    <EmployerActionButton loading={busy} title={submitLabel} icon="checkmark-outline" onPress={save} />
    <EmployerActionButton title="Annuler" variant="secondary" onPress={onCancel} />
  </AdminCard>;
}

function EmployeeDetails({ store, employeeId, onBack, onNavigate }: DirectoryProps & { employeeId: string }) {
  const s = useAdminStyles();

  const employee = store.employees.find(value => value.id === employeeId);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [dialogError, setDialogError] = useState<string>();
  if (!employee) return <AdminPage title="Fiche employé" onBack={onBack}><AdminEmpty title="Employé introuvable" message="Cette fiche n’est plus disponible dans les données locales." /></AdminPage>;
  const missions = store.missions.filter(mission => (mission.employeeIds ?? (mission.employeeId ? [mission.employeeId] : [])).includes(employee.id));
  const upcoming = missions.filter(mission => ['planned', 'in-progress'].includes(mission.status));
  const history = missions.filter(mission => ['completed', 'cancelled'].includes(mission.status));
  return <AdminPage title={employeeName(employee)} subtitle="Fiche employé et suivi des affectations" onBack={onBack}>
    <AdminCard>
      <View style={s.row}><AdminBadge label={employee.active ? 'Actif' : 'Suspendu'} tone={employee.active ? 'green' : 'red'} />{employee.activationPending && <AdminBadge label="Activation à prévoir" tone="orange" />}</View>
      {employee.activationPending && <AppText style={s.muted}>Fiche créée en démonstration. Aucune invitation transmise ; l’activation réelle du compte reste à connecter.</AppText>}
      {!employee.active && <AppText style={s.muted}>Les nouvelles affectations sont bloquées dans cette démonstration. Les missions déjà affectées et leur historique sont conservés.</AppText>}
      <AdminDetail label="Courriel" value={employee.email} />
      <AdminDetail label="Téléphone" value={employee.phone || 'Non renseigné'} />
      <AdminDetail label="Ville" value={employee.city || 'Non renseignée'} />
      <AdminDetail label="Spécialités" value={employee.specialties.join(' · ') || 'Non renseignées'} />
      <AdminDetail label="Disponibilités déclarées" value={employee.availability || 'Non renseignées'} />
      <AdminDetail label="Fiche créée le" value={dateLabel(employee.createdAt.slice(0, 10))} />
      {!editing && <EmployerActionButton title="Modifier la fiche" variant="secondary" icon="create-outline" onPress={() => { setError(undefined); setNotice(undefined); setEditing(true); }} />}
      <EmployerActionButton title={employee.active ? 'Suspendre les affectations' : 'Réactiver les affectations'} variant="secondary" icon={employee.active ? 'pause-circle-outline' : 'play-circle-outline'} onPress={() => { setDialogError(undefined); setConfirm(true); }} />
      <AdminNotice message={notice} />
    </AdminCard>
    {editing && <EmployeeForm key={employee.id} employee={employee} submitLabel="Enregistrer les modifications" error={error} onCancel={() => { setEditing(false); setError(undefined); }} onSubmit={async input => {
      if (apiMode) { const result = await adminActions.updateEmployee(employee.id, input); if (!result.ok) setError(result.error); else { setEditing(false); setNotice('Fiche enregistrée sur le serveur.'); } return; }
      const admin = useAuthStore.getState().session?.user;
      if (!admin || admin.role !== 'ADMIN') { setError('Reconnectez-vous comme administrateur.'); return; }
      const previous = useAdminStore.getState();
      const result = store.updateEmployee(employee.id, input);
      if (!result.ok) { setError(result.error); return; }
      try { authService.updateEmployeeAccount(admin, employee.email, input); }
      catch (cause) { useAdminStore.setState({ employees: previous.employees, audit: previous.audit }); setError(cause instanceof Error ? cause.message : 'Impossible de modifier ce compte.'); return; }
      setEditing(false); setError(undefined); setNotice('La fiche a été mise à jour localement.');
    }} />}
    <AppText accessibilityRole="header" style={s.heading}>Missions affectées ({upcoming.length})</AppText>
    <MissionRows missions={upcoming} store={store} onNavigate={onNavigate} emptyMessage="Aucune mission à venir ou en cours pour cet employé." />
    <AppText accessibilityRole="header" style={s.heading}>Historique des missions ({history.length})</AppText>
    <MissionRows missions={history} store={store} onNavigate={onNavigate} emptyMessage="Aucune mission terminée ou annulée pour cet employé." />
    {confirm && <EmployerDialog title={employee.active ? 'Suspendre cet employé ?' : 'Réactiver cet employé ?'} onClose={() => setConfirm(false)}>
      <AppText style={s.text}>{employee.active
        ? 'Cet employé ne pourra plus recevoir de nouvelles affectations locales. Ses missions existantes et leur historique resteront disponibles.'
        : 'Cet employé pourra de nouveau recevoir des affectations dans la démonstration.'}</AppText>
      <AppText style={s.muted}>Cette action bloque ou rétablit aussi la connexion au compte employé local sur cet appareil.</AppText>
      <AdminNotice message={dialogError} error />
      <EmployerActionButton title={employee.active ? 'Confirmer la suspension' : 'Confirmer la réactivation'} onPress={async () => {
        const nextActive = !employee.active;
        const result = await adminActions.setEmployeeActive(employee.id, nextActive);
        if (!result.ok) { setDialogError(result.error); return; }
        setConfirm(false); setNotice(nextActive ? 'Les affectations sont réactivées localement.' : 'Les nouvelles affectations sont suspendues localement.');
      }} />
      <EmployerActionButton title="Annuler" variant="secondary" onPress={() => setConfirm(false)} />
    </EmployerDialog>}
  </AdminPage>;
}

function Clients({ store, onBack, onNavigate }: DirectoryProps) {
  const s = useAdminStyles();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const query = normalize(search);
  const clients = store.clients.filter(client => (filter === 'all' || client.kind === filter)
    && normalize(`${client.name} ${client.email} ${client.address} ${client.phone}`).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr-CA'));
  return <AdminPage title="Clients" subtitle="Retrouvez les coordonnées et le suivi des demandes de vos clients." onBack={onBack}>
    <AdminField label="Rechercher un client" placeholder="Nom, courriel, téléphone ou adresse" value={search} onChangeText={setSearch} autoCorrect={false} />
    <AdminChips options={clientFilters} value={filter} onChange={setFilter} />
    <AppText style={s.muted}>{clients.length} client{clients.length > 1 ? 's' : ''} affiché{clients.length > 1 ? 's' : ''} · Données de démonstration</AppText>
    {clients.length === 0 && <AdminEmpty title="Aucun client trouvé" message="Essayez un autre terme ou retirez le filtre." action={<EmployerActionButton title="Réinitialiser la recherche" variant="secondary" onPress={() => { setSearch(''); setFilter('all'); }} />} />}
    {clients.map(client => <AdminCard key={client.id}>
      <AdminBadge label={client.kind} tone={client.kind === 'Entreprise' ? 'blue' : 'green'} />
      <AppText style={s.heading}>{client.name}</AppText>
      <AppText style={s.muted}>{client.email}</AppText>
      <AppText style={s.text}>{client.address || 'Adresse non renseignée'}</AppText>
      <AppText style={s.muted}>{client.requestIds.length} demande(s) dans le dossier</AppText>
      <EmployerActionButton title="Voir la fiche client" variant="secondary" icon="person-outline" onPress={() => onNavigate({ screen: 'client-detail', clientId: client.id })} />
    </AdminCard>)}
  </AdminPage>;
}

function ClientDetails({ store, clientId, onBack, onNavigate }: DirectoryProps & { clientId: string }) {
  const s = useAdminStyles();

  const client = store.clients.find(value => value.id === clientId);
  const [contactError, setContactError] = useState<string>();
  if (!client) return <AdminPage title="Fiche client" onBack={onBack}><AdminEmpty title="Client introuvable" message="Cette fiche n’est plus disponible dans les données locales." /></AdminPage>;
  const requests = store.requests.filter(request => client.requestIds.includes(request.id))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const missions = store.missions.filter(mission => client.requestIds.includes(mission.requestId));
  async function contact(kind: 'email' | 'phone', value: string) {
    setContactError(undefined);
    try {
      await Linking.openURL(kind === 'email' ? `mailto:${encodeURIComponent(value)}` : `tel:${value.replace(/[^+\d]/g, '')}`);
    } catch {
      setContactError('Impossible d’ouvrir cette application sur cet appareil. Utilisez les coordonnées affichées.');
    }
  }
  return <AdminPage title={client.name} subtitle="Fiche client et historique des prestations" onBack={onBack}>
    <AdminCard>
      <AdminBadge label={client.kind} tone={client.kind === 'Entreprise' ? 'blue' : 'green'} />
      <AdminDetail label="Courriel" value={client.email || 'Non renseigné'} />
      <AdminDetail label="Téléphone" value={client.phone || 'Non renseigné'} />
      <AdminDetail label="Adresse" value={client.address || 'Non renseignée'} />
      <ContactButtons client={client} onContact={contact} />
      <AdminNotice message={contactError} error />
      <AppText style={s.muted}>Les boutons de contact ouvrent votre application de messagerie ou de téléphone. Aucun message n’est envoyé automatiquement.</AppText>
    </AdminCard>
    <AppText accessibilityRole="header" style={s.heading}>Demandes du client ({requests.length})</AppText>
    {!requests.length && <AdminEmpty title="Aucune demande" message="Les demandes de ce client apparaîtront ici." />}
    {requests.map(request => <ClientRequest key={request.id} request={request} store={store} onNavigate={onNavigate} />)}
    <AppText accessibilityRole="header" style={s.heading}>Missions du client ({missions.length})</AppText>
    <MissionRows missions={missions} store={store} onNavigate={onNavigate} emptyMessage="Aucune mission associée à ce client pour le moment." />
  </AdminPage>;
}

function ContactButtons({ client, onContact }: { client: AdminClient; onContact: (kind: 'email' | 'phone', value: string) => void }) {
  const s = useAdminStyles();

  return <View style={s.split}>
    {!!client.email && <EmployerActionButton style={s.grow} title="Écrire un courriel" variant="secondary" icon="mail-outline" onPress={() => onContact('email', client.email)} />}
    {!!client.phone && <EmployerActionButton style={s.grow} title="Appeler" variant="secondary" icon="call-outline" onPress={() => onContact('phone', client.phone)} />}
  </View>;
}

function ClientRequest({ request, store, onNavigate }: { request: EmployerRequest } & Pick<DirectoryProps, 'store' | 'onNavigate'>) {
  const s = useAdminStyles();

  const offer = [...store.offers].reverse().find(value => value.requestId === request.id && value.status !== 'cancelled');
  return <AdminCard>
    <AdminBadge label={employerStatusLabels[request.status]} tone={request.status === 'confirmed' ? 'green' : 'blue'} />
    <AppText style={s.heading}>{request.serviceType}</AppText>
    <AdminDetail label="Demande reçue le" value={dateLabel(request.submittedAt.slice(0, 10))} />
    <AdminDetail label="Date souhaitée" value={dateLabel(request.preferredDate.slice(0, 10))} />
    <AdminDetail label="Lieu" value={request.location} />
    <AppText style={s.muted}>{request.description}</AppText>
    {offer ? <EmployerActionButton title={offer.status === 'draft' ? 'Reprendre l’estimation' : 'Voir l’offre associée'} variant="secondary" onPress={() => onNavigate(offer.status === 'draft'
      ? { screen: 'estimate', requestId: request.id, offerId: offer.id }
      : { screen: 'offer-detail', offerId: offer.id })} />
      : ['new', 'review', 'waiting'].includes(request.status) && <EmployerActionButton title="Créer une estimation" variant="secondary" onPress={() => onNavigate({ screen: 'estimate', requestId: request.id })} />}
  </AdminCard>;
}

function MissionRows({ missions, store, onNavigate, emptyMessage }: {
  missions: AdminMission[]; emptyMessage: string;
} & Pick<DirectoryProps, 'store' | 'onNavigate'>) {
  const theme = useEmployerTheme();
  const styles = createStyles(theme);
  const s = useAdminStyles();

  if (!missions.length) return <AdminEmpty title="Aucune mission" message={emptyMessage} />;
  return <View style={s.section}>{[...missions].sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)).map(mission => {
    const request = store.requests.find(value => value.id === mission.requestId);
    return <Pressable key={mission.id} accessibilityRole="button" accessibilityLabel={`Voir la mission ${request?.serviceType ?? mission.id}, ${dateLabel(mission.date)}`}
      style={({ pressed }) => [styles.mission, pressed && styles.pressed]}
      onPress={() => onNavigate({ screen: 'mission-detail', missionId: mission.id })}>
      <View style={styles.missionBody}>
        <AdminBadge label={missionStatusLabels[mission.status]} tone={mission.status === 'completed' ? 'green' : mission.status === 'cancelled' ? 'red' : 'blue'} />
        <AppText style={s.heading}>{request?.serviceType ?? 'Mission'}</AppText>
        <AppText style={s.muted}>{request?.clientName ?? 'Client non disponible'}</AppText>
        <AppText style={s.text}>{dateLabel(mission.date)} · {mission.startTime}–{mission.endTime}</AppText>
        <AppText style={s.muted}>Consulter la mission</AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.blue} accessible={false} />
    </Pressable>;
  })}</View>;
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  mission: { minHeight: 64, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16,
    backgroundColor: theme.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  missionBody: { flex: 1, gap: 7 }, pressed: { opacity: 0.75 },
}));
