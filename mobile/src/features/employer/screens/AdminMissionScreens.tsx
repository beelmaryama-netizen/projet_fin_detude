import { useEmployerTheme, type EmployerTheme } from '../theme';
import { useAdminFilterStore } from '../../../store/adminFilterStore';
import { useAuthStore } from '../../../store/authStore';
import { AttachmentGallery } from '../../../components/AttachmentGallery';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { AdminBadge, AdminCard, AdminChips, AdminDetail, AdminEmpty, AdminField, AdminNotice, AdminPage, useAdminStyles } from '../components/AdminUI';
import { EmployerActionButton } from '../components/EmployerActionButton';
import { EmployerDialog } from '../components/EmployerDialog';
import { dateLabel, formatMoney, isValidDate, localDate, timeMinutes } from '../services/adminHelpers';
import { useAdminStore, employeeAvailable } from '../store/adminStore';
import { missionStatusLabels, type AdminEmployee, type AdminMission, type AdminRoute, type AdminScreenProps, type AdminStore, type MissionStatus } from '../types/admin';

type Navigate = AdminScreenProps['onNavigate'];
const statusOptions = [
  { value: 'all', label: 'Toutes' },
  { value: 'unassigned', label: 'À assigner' },
  { value: 'planned', label: 'Planifiées' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'completed', label: 'Terminées' },
  { value: 'cancelled', label: 'Annulées' },
] as const;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-CA');
const employeeName = (employee?: AdminEmployee) => employee ? `${employee.firstName} ${employee.lastName}` : 'Aucun employé assigné';
const missionEmployeeIds = (mission: AdminMission) => mission.employeeIds?.length ? mission.employeeIds : mission.employeeId ? [mission.employeeId] : [];
const missionTeam = (store: AdminStore, mission: AdminMission) => missionEmployeeIds(mission).map(id => store.employees.find(employee => employee.id === id)).filter((employee): employee is AdminEmployee => Boolean(employee));
const teamLabel = (store: AdminStore, mission: AdminMission) => missionTeam(store, mission).map(employeeName).join(', ') || 'Aucun employé assigné';
const canOrganize = (mission: AdminMission) => mission.status === 'unassigned' || mission.status === 'planned';
const orderMissions = (a: AdminMission, b: AdminMission) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

function MissionBadge({ status }: { status: MissionStatus }) {


  const tone = status === 'completed' ? 'green' : status === 'cancelled' ? 'red' : status === 'unassigned' ? 'orange' : status === 'in-progress' ? 'blue' : 'muted';
  return <AdminBadge label={missionStatusLabels[status]} tone={tone} />;
}

function MissionCard({ mission, store, onNavigate, showAssign = true }: { mission: AdminMission; store: AdminStore; onNavigate: Navigate; showAssign?: boolean }) {
 const ui = useAdminStyles();

  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  const request = store.requests.find(item => item.id === mission.requestId);
  return <AdminCard>
    <View style={ui.row}><MissionBadge status={mission.status} /><AppText style={ui.muted}>{mission.id}</AppText></View>
    <AppText accessibilityRole="header" style={ui.heading}>{request?.serviceType ?? 'Prestation non disponible'}</AppText>
    <AppText style={ui.text}>{request?.clientName ?? 'Client non disponible'}</AppText>
    <View style={styles.infoRow}><Ionicons name="calendar-outline" size={18} color={theme.blue} /><AppText style={[ui.muted, styles.flex]}>{dateLabel(mission.date)} · {mission.startTime}–{mission.endTime}</AppText></View>
    <View style={styles.infoRow}><Ionicons name="location-outline" size={18} color={theme.blue} /><AppText style={[ui.muted, styles.flex]}>{request?.location ?? 'Adresse non disponible'}</AppText></View>
    <View style={styles.infoRow}><Ionicons name="people-outline" size={18} color={theme.blue} /><AppText style={[ui.muted, styles.flex]}>{teamLabel(store, mission)}</AppText></View>
    <View style={ui.split}>
      <EmployerActionButton title="Voir la mission" variant="secondary" icon="eye-outline" style={ui.grow} onPress={() => onNavigate({ screen: 'mission-detail', missionId: mission.id })} />
      {showAssign && canOrganize(mission) && <EmployerActionButton title={mission.employeeId ? 'Réassigner' : 'Assigner un employé'} icon="person-add-outline" style={ui.grow} onPress={() => onNavigate({ screen: 'assignment', missionId: mission.id })} />}
    </View>
  </AdminCard>;
}

function MissionsList({ route, onNavigate, onBack }: AdminScreenProps & { route: Extract<AdminRoute, { screen: 'missions' }> }) {
 const ui = useAdminStyles();


  const store = useAdminStore();
  const owner = useAuthStore(s => s.session?.user.id ?? 'admin');
  const [saved] = useState(() => useAdminFilterStore.getState().byOwner[owner]);
  const [status, setStatus] = useState(route.filter ?? saved?.status ?? 'all');
  const [query, setQuery] = useState(saved?.query ?? '');
  const [employeeId, setEmployeeId] = useState(saved?.employeeId ?? 'all');
  const [service, setService] = useState(saved?.service ?? 'all');
  const [date, setDate] = useState(saved?.date ?? '');
  const [period, setPeriod] = useState<{ from?: string; to?: string }>(() => route.dateFrom || route.dateTo ? { from: route.dateFrom, to: route.dateTo } : saved?.period ?? {});
  const [expanded, setExpanded] = useState(saved?.expanded ?? false);
  useEffect(() => { useAdminFilterStore.getState().save(owner, { status, query, employeeId, service, date, period, expanded }); }, [owner, status, query, employeeId, service, date, period, expanded]);
  const serviceNames = Array.from(new Set(store.requests.map(request => request.serviceType))).sort();
  const invalidDate = date.length > 0 && !isValidDate(date);
  const filtered = store.missions.filter(mission => {
    const request = store.requests.find(item => item.id === mission.requestId);
    const searchText = normalize([mission.id, request?.clientName, request?.serviceType, request?.location, teamLabel(store, mission)].join(' '));
    return (status === 'all' || mission.status === status)
      && (employeeId === 'all' || (employeeId === 'unassigned' ? !missionEmployeeIds(mission).length : missionEmployeeIds(mission).includes(employeeId)))
      && (service === 'all' || request?.serviceType === service)
      && (!period.from || mission.date >= period.from)
      && (!period.to || mission.date <= period.to)
      && (!date || (!invalidDate && mission.date === date))
      && searchText.includes(normalize(query.trim()));
  }).sort(orderMissions);
  const resetFilters = () => { setStatus('all'); setEmployeeId('all'); setService('all'); setDate(''); setQuery(''); setPeriod({}); };
  return <AdminPage title={route.filter === 'unassigned' ? 'Missions à assigner' : 'Toutes les missions'} subtitle="Organisez les interventions, leurs horaires et les affectations." onBack={onBack}>
    <EmployerActionButton title="Ouvrir le calendrier" variant="secondary" icon="calendar-outline" onPress={() => onNavigate({ screen: 'calendar' })} />
    <AdminField label="Rechercher une mission" placeholder="Client, service, employé ou référence" value={query} onChangeText={setQuery} autoCorrect={false} />
    <AdminChips options={statusOptions} value={status} onChange={value => setStatus(value as MissionStatus | 'all')} />
    {(period.from || period.to) && <AdminCard>
      <AdminBadge label="Période sélectionnée depuis le tableau de bord" />
      <AppText style={ui.text}>{period.from && period.to ? `Du ${dateLabel(period.from)} au ${dateLabel(period.to)} inclus` : period.from ? `À partir du ${dateLabel(period.from)}` : `Jusqu’au ${dateLabel(period.to!)}`}</AppText>
      <EmployerActionButton title="Effacer la période" icon="close-outline" variant="secondary" onPress={() => setPeriod({})} />
    </AdminCard>}
    <EmployerActionButton title={expanded ? 'Masquer les filtres avancés' : 'Filtrer par employé, service et date'} icon={expanded ? 'chevron-up-outline' : 'options-outline'} variant="link" onPress={() => setExpanded(!expanded)} />
    {expanded && <AdminCard>
      <AppText style={ui.heading}>Affiner la recherche</AppText>
      <AppText style={ui.muted}>Employé</AppText>
      <AdminChips value={employeeId} onChange={setEmployeeId} options={[
        { value: 'all', label: 'Tous les employés' }, { value: 'unassigned', label: 'Sans affectation' },
        ...store.employees.map(employee => ({ value: employee.id, label: employeeName(employee) })),
      ]} />
      <AppText style={ui.muted}>Service</AppText>
      <AdminChips value={service} onChange={setService} options={[{ value: 'all', label: 'Tous les services' }, ...serviceNames.map(name => ({ value: name, label: name }))]} />
      <AdminField label="Date de la mission" value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" autoCapitalize="none" keyboardType="numbers-and-punctuation" error={invalidDate ? 'Indiquez une date valide au format AAAA-MM-JJ.' : undefined} hint={period.from || period.to ? 'Ce filtre s’ajoute à la période sélectionnée. Laissez vide pour conserver toute la période.' : 'Laissez vide pour afficher toutes les dates.'} />
      <EmployerActionButton title="Réinitialiser les filtres" variant="secondary" onPress={resetFilters} />
    </AdminCard>}
    <AppText accessibilityLiveRegion="polite" style={ui.muted}>{filtered.length} mission{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''} · Démonstration locale</AppText>
    {filtered.length ? filtered.map(mission => <MissionCard key={mission.id} mission={mission} store={store} onNavigate={onNavigate} />)
      : <AdminEmpty title="Aucune mission correspondante" message="Ajustez les filtres. Les offres acceptées créent les missions à assigner." action={<EmployerActionButton title="Réinitialiser les filtres" variant="secondary" onPress={resetFilters} />} />}
  </AdminPage>;
}

function overlappingMission(store: AdminStore, mission: AdminMission, employeeId: string): AdminMission | undefined {
  const start = timeMinutes(mission.startTime);
  const end = timeMinutes(mission.endTime);
  if (start === null || end === null) return undefined;
  return store.missions.find(other => {
    if (other.id === mission.id || !missionEmployeeIds(other).includes(employeeId) || other.date !== mission.date || other.status === 'cancelled' || other.status === 'completed') return false;
    const otherStart = timeMinutes(other.startTime);
    const otherEnd = timeMinutes(other.endTime);
    return otherStart !== null && otherEnd !== null && start < otherEnd && end > otherStart;
  });
}

function AssignmentScreen({ route, onNavigate, onBack }: AdminScreenProps & { route: Extract<AdminRoute, { screen: 'mission-detail' | 'assignment' }> }) {
 const ui = useAdminStyles();

  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  const store = useAdminStore();
  const mission = store.missions.find(item => item.id === route.missionId);
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState(() => mission ? [...missionEmployeeIds(mission)] : []);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [assigned, setAssigned] = useState(false);
  if (!mission) return <MissingMission onBack={onBack} />;
  const request = store.requests.find(item => item.id === mission.requestId);
  const requiredCount = Math.max(1, store.offers.find(offer => offer.id === mission.offerId)?.employeeCount ?? 1);
  const validSelection = selection.length === requiredCount && selection.every(id => store.employees.some(employee => employee.id === id && employee.active) && !overlappingMission(store, mission, id));
  const employees = store.employees.filter(employee => normalize(`${employeeName(employee)} ${employee.city} ${employee.specialties.join(' ')}`).includes(normalize(query.trim())))
    .sort((a, b) => Number(b.active) - Number(a.active) || employeeName(a).localeCompare(employeeName(b), 'fr'));
  const confirm = () => {
    const result = store.setMissionEmployees(mission.id, selection);
    setConfirming(false);
    setError(!result.ok);
    setAssigned(result.ok);
    setMessage(result.ok ? 'Équipe assignée à la mission dans la démonstration locale.' : result.error);
  };
  return <AdminPage title="Assigner un employé" subtitle="Vérifiez les spécialités et les disponibilités avant de confirmer." onBack={onBack}>
    <AdminCard>
      <MissionBadge status={mission.status} />
      <AppText style={ui.heading}>{request?.serviceType ?? 'Mission'} · {request?.clientName ?? mission.id}</AppText>
      <AppText style={ui.text}>{dateLabel(mission.date)} · {mission.startTime}–{mission.endTime}</AppText>
      <AppText style={ui.muted}>{request?.location ?? 'Lieu non disponible'}</AppText>
      <AppText style={ui.muted}>Équipe actuelle : {teamLabel(store, mission)}</AppText>
      <AdminBadge label={`${requiredCount} employé${requiredCount > 1 ? 's' : ''} requis par l’offre`} tone="blue" />
    </AdminCard>
    <AdminNotice message={message} error={error} />
    {assigned && <EmployerActionButton title="Voir la mission mise à jour" icon="checkmark-circle-outline" onPress={() => onNavigate({ screen: 'mission-detail', missionId: mission.id })} />}
    {!canOrganize(mission) ? <AdminEmpty title="Affectation indisponible" message="L’affectation est modifiable pour les missions à assigner ou planifiées. Le suivi de l’intervention appartient à l’employé." action={<EmployerActionButton title="Voir la mission" variant="secondary" onPress={() => onNavigate({ screen: 'mission-detail', missionId: mission.id })} />} /> : <>
      <AdminField label="Rechercher un employé" placeholder="Nom, ville ou spécialité" value={query} onChangeText={setQuery} autoCorrect={false} />
      <AppText style={ui.muted}>Les horaires disponibles et les conflits avec les autres missions sont vérifiés avant l’affectation.</AppText>
      <AdminCard>
        <AppText accessibilityLiveRegion="polite" style={ui.heading}>{selection.length} / {requiredCount} employé{requiredCount > 1 ? 's' : ''} sélectionné{selection.length > 1 ? 's' : ''}</AppText>
        <AppText style={ui.text}>{selection.map(id => employeeName(store.employees.find(employee => employee.id === id))).join(', ') || 'Aucun employé sélectionné'}</AppText>
        {selection.length > 0 && <EmployerActionButton title="Vider la sélection" variant="secondary" onPress={() => { setSelection([]); setAssigned(false); setMessage(''); }} />}
      </AdminCard>
      {employees.map(employee => {
        const conflict = overlappingMission(store, mission, employee.id);
        const current = missionEmployeeIds(mission).includes(employee.id);
        const selected = selection.includes(employee.id);
        const outsideHours = !employeeAvailable(employee, mission.date, mission.startTime, mission.endTime);
        const unavailable = !selected && (outsideHours || Boolean(conflict) || selection.length >= requiredCount);
        return <AdminCard key={employee.id}>
          <View style={ui.row}><AppText style={[ui.heading, styles.flex]}>{employeeName(employee)}</AppText><AdminBadge label={!employee.active ? 'Compte inactif' : conflict ? 'Conflit horaire' : current ? 'Déjà assigné' : 'Sans conflit'} tone={!employee.active ? 'muted' : conflict ? 'red' : current ? 'blue' : 'green'} /></View>
          <AdminDetail label="Spécialités" value={employee.specialties.join(' · ') || 'Non précisées'} />
          <AdminDetail label="Ville" value={employee.city || 'Non précisée'} />
          <AdminDetail label="Disponibilités déclarées" value={employee.availability || 'À vérifier avec l’employé'} />
          {employee.active && outsideHours && <AppText style={ui.error}>Ce créneau est en dehors des horaires disponibles de cet employé.</AppText>}
          {conflict && <AppText style={ui.error}>Indisponible de {conflict.startTime} à {conflict.endTime} : mission {conflict.id}.</AppText>}
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`${employeeName(employee)}${!employee.active ? ', compte inactif' : conflict ? ', conflit horaire' : ''}`} accessibilityState={{ checked: selected, disabled: unavailable }} disabled={unavailable}
            style={[styles.staffChoice, selected && styles.staffSelected, unavailable && styles.disabled]} onPress={() => { setMessage(''); setAssigned(false); setSelection(previous => selected ? previous.filter(id => id !== employee.id) : [...previous, employee.id]); }}>
            <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={23} color={theme.blue} accessible={false} />
            <AppText style={[ui.text, styles.flex]}>{selected ? 'Retirer de l’équipe choisie' : !employee.active ? 'Compte inactif' : conflict ? 'Créneau indisponible' : selection.length >= requiredCount ? 'Équipe complète' : 'Ajouter à l’équipe'}</AppText>
          </Pressable>
        </AdminCard>;
      })}
      {!employees.length && <AdminEmpty title="Aucun employé trouvé" message="Essayez une autre recherche ou consultez la gestion des employés." action={<EmployerActionButton title="Gérer les employés" variant="secondary" onPress={() => onNavigate({ screen: 'employees' })} />} />}
      <EmployerActionButton title="Confirmer l’équipe choisie" icon="people-outline" disabled={!validSelection} onPress={() => setConfirming(true)} />
      {!validSelection && <AppText style={ui.muted}>Choisissez exactement {requiredCount} employé{requiredCount > 1 ? 's actifs et disponibles' : ' actif et disponible'} pour confirmer l’affectation.</AppText>}
    </>}
    {confirming && <EmployerDialog title="Confirmer l’affectation" onClose={() => setConfirming(false)}>
      <AppText style={ui.text}>Assigner cette équipe le {dateLabel(mission.date)}, de {mission.startTime} à {mission.endTime} ?</AppText>
      {selection.map(id => <AppText key={id} style={ui.text}>• {employeeName(store.employees.find(employee => employee.id === id))}</AppText>)}
      <AppText style={ui.muted}>Cette action met à jour les données de démonstration. Aucune notification externe n’est envoyée.</AppText>
      <EmployerActionButton title="Confirmer l’affectation" icon="checkmark-outline" onPress={confirm} />
      <EmployerActionButton title="Retour au choix" variant="secondary" onPress={() => setConfirming(false)} />
    </EmployerDialog>}
  </AdminPage>;
}

function MissionDetailScreen({ route, onNavigate, onBack }: AdminScreenProps & { route: Extract<AdminRoute, { screen: 'mission-detail' | 'assignment' }> }) {
 const ui = useAdminStyles();

  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  const store = useAdminStore();
  const mission = store.missions.find(item => item.id === route.missionId);
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(mission?.date ?? '');
  const [startTime, setStartTime] = useState(mission?.startTime ?? '');
  const [endTime, setEndTime] = useState(mission?.endTime ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ date?: string; start?: string; end?: string }>({});
  const [confirmCancel, setConfirmCancel] = useState(false);
  if (!mission) return <MissingMission onBack={onBack} />;
  const request = store.requests.find(item => item.id === mission.requestId);
  const team = missionTeam(store, mission);
  const client = store.clients.find(item => item.requestIds.includes(mission.requestId));
  const offer = store.offers.find(item => item.id === mission.offerId);
  const audit = store.audit.filter(event => event.entityId === mission.id).sort((a, b) => b.at.localeCompare(a.at));
  const completedTasks = mission.checklist.filter(task => task.completed).length;
  const saveSchedule = () => {
    const start = timeMinutes(startTime), end = timeMinutes(endTime);
    const errors = {
      date: isValidDate(date) ? undefined : 'Indiquez une date valide au format AAAA-MM-JJ.',
      start: start === null ? 'Utilisez le format HH:mm, par exemple 09:00.' : undefined,
      end: end === null ? 'Utilisez le format HH:mm, par exemple 12:00.' : start !== null && end <= start ? 'La fin doit être après le début, le même jour.' : undefined,
    };
    setFieldErrors(errors);
    if (errors.date || errors.start || errors.end) return;
    const result = store.rescheduleMission(mission.id, date, startTime, endTime);
    setError(!result.ok);
    setMessage(result.ok ? 'Horaire mis à jour dans la démonstration locale.' : result.error);
    if (result.ok) setEditing(false);
  };
  const cancel = () => {
    const result = store.cancelMission(mission.id);
    setConfirmCancel(false);
    setError(!result.ok);
    setMessage(result.ok ? 'Mission annulée dans la démonstration locale.' : result.error);
  };
  return <AdminPage title="Détail de la mission" subtitle={mission.id} onBack={onBack}>
    <AdminNotice message={message} error={error} />
    <AdminCard>
      <MissionBadge status={mission.status} />
      <AppText accessibilityRole="header" style={ui.heading}>{request?.serviceType ?? 'Prestation non disponible'}</AppText>
      <AdminDetail label="Client" value={request?.clientName ?? client?.name ?? 'Non disponible'} />
      <AdminDetail label="Lieu d’intervention" value={client?.address ?? request?.location ?? 'Non disponible'} />
      <View style={ui.split}><View style={ui.grow}><AdminDetail label="Date" value={dateLabel(mission.date)} /></View><View style={ui.grow}><AdminDetail label="Horaire prévu" value={`${mission.startTime}–${mission.endTime}`} /></View></View>
      <AdminDetail label="Photos obligatoires" value={['Avant : ' + (mission.requiresBeforePhotos ? 'oui' : 'non'), 'Après : ' + (mission.requiresAfterPhotos ? 'oui' : 'non')].join(' · ')} />
      <AttachmentGallery photos={mission.photos ?? []} />
      {mission.incident && <AdminDetail label="Incident signalé" value={mission.incident} />}
      <AdminDetail label="Équipe assignée" value={teamLabel(store, mission)} />
      {team.map(employee => <AdminDetail key={employee.id} label={`Contact · ${employeeName(employee)}`} value={[employee.phone, employee.email].filter(Boolean).join(' · ') || 'Non disponible'} />)}
      {client && <AdminDetail label="Contact client" value={[client.phone, client.email].filter(Boolean).join(' · ') || 'Non disponible'} />}
      {canOrganize(mission) && <View style={ui.split}>
        <EmployerActionButton title={mission.employeeId ? 'Modifier l’affectation' : 'Assigner un employé'} icon="person-add-outline" style={ui.grow} onPress={() => onNavigate({ screen: 'assignment', missionId: mission.id })} />
        <EmployerActionButton title={editing ? 'Fermer la modification' : 'Modifier l’horaire'} variant="secondary" icon="time-outline" style={ui.grow} onPress={() => { setDate(mission.date); setStartTime(mission.startTime); setEndTime(mission.endTime); setFieldErrors({}); setEditing(!editing); setMessage(''); }} />
      </View>}
      {editing && canOrganize(mission) && <View style={ui.divider}>
        <AppText style={ui.heading}>Nouvel horaire</AppText>
        <AdminField label="Date (AAAA-MM-JJ)" placeholder={localDate()} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" error={fieldErrors.date} />
        <View style={ui.split}>
          <View style={ui.grow}><AdminField label="Début (HH:mm)" placeholder="09:00" value={startTime} onChangeText={setStartTime} keyboardType="numbers-and-punctuation" error={fieldErrors.start} /></View>
          <View style={ui.grow}><AdminField label="Fin (HH:mm)" placeholder="12:00" value={endTime} onChangeText={setEndTime} keyboardType="numbers-and-punctuation" error={fieldErrors.end} /></View>
        </View>
        <AppText style={ui.muted}>Le nouvel horaire est vérifié contre les autres missions de l’employé assigné.</AppText>
        <EmployerActionButton title="Enregistrer l’horaire" icon="save-outline" onPress={saveSchedule} />
      </View>}
    </AdminCard>
    <AdminCard>
      <AppText accessibilityRole="header" style={ui.heading}>Demande et estimation</AppText>
      {request ? <>
        <AdminDetail label="Référence de la demande" value={request.id} />
        <AdminDetail label="Catégorie" value={{ RESIDENTIAL: 'Résidentiel', COMMERCIAL: 'Commercial', INDUSTRIAL: 'Industriel', MEDICAL: 'Médical', OTHER: 'Autre' }[request.category]} />
        <AdminDetail label="Date souhaitée par le client" value={dateLabel(request.preferredDate)} />
        <AdminDetail label="Besoin du client" value={request.description || 'Aucune description disponible.'} />
      </> : <AppText style={ui.muted}>La demande associée n’est pas disponible.</AppText>}
      {offer ? <><AdminDetail label="Montant de l’offre, taxes comprises" value={formatMoney(offer.totalCents)} /><AdminDetail label="Équipe et durée estimées" value={`${offer.employeeCount} employé${offer.employeeCount > 1 ? 's' : ''} · ${offer.durationHours} h`} /><EmployerActionButton title="Consulter l’offre" variant="secondary" icon="document-text-outline" onPress={() => onNavigate({ screen: 'offer-detail', offerId: offer.id })} /></>
        : <AppText style={ui.muted}>Aucune offre associée à cette mission de démonstration.</AppText>}
      <AdminDetail label="Consignes de la mission" value={mission.notes || 'Aucune consigne supplémentaire.'} />
    </AdminCard>
    <AdminCard>
      <AppText accessibilityRole="header" style={ui.heading}>Suivi de l’intervention</AppText>
      <AppText style={ui.muted}>Consultation uniquement. L’employé renseigne la checklist et le rapport dans son espace.</AppText>
      <AppText style={ui.text}>{completedTasks} tâche{completedTasks > 1 ? 's' : ''} réalisée{completedTasks > 1 ? 's' : ''} sur {mission.checklist.length}</AppText>
      {mission.checklist.length ? mission.checklist.map(task => <View key={task.id} style={styles.infoRow} accessible accessibilityLabel={`${task.label} : ${task.completed ? 'réalisée' : 'à réaliser'}`}>
        <Ionicons name={task.completed ? 'checkmark-circle' : 'ellipse-outline'} size={21} color={task.completed ? theme.success : theme.muted} accessible={false} />
        <AppText style={[ui.text, styles.flex]}>{task.label}{task.note ? ' — Note : ' + task.note : ''}</AppText>
      </View>) : <AppText style={ui.muted}>Aucune tâche renseignée pour cette mission.</AppText>}
      {mission.startedAt && <AdminDetail label="Début réel" value={timestampLabel(mission.startedAt)} />}
      {mission.completedAt && <AdminDetail label="Fin réelle" value={timestampLabel(mission.completedAt)} />}
      {mission.status === 'completed' && <View style={ui.divider}><AppText style={ui.heading}>Rapport de fin de mission</AppText><AppText style={ui.text}>{mission.report?.trim() || 'Rapport non disponible pour cette mission de démonstration.'}</AppText></View>}
      {mission.status !== 'completed' && <AppText style={ui.muted}>Le rapport sera consultable après la fin de la mission.</AppText>}
    </AdminCard>
    <AdminCard>
      <AppText accessibilityRole="header" style={ui.heading}>Historique administratif</AppText>
      {audit.length ? audit.map(event => <View key={event.id} style={ui.divider}><AppText style={ui.muted}>{timestampLabel(event.at)}</AppText><AppText style={ui.text}>{event.text}</AppText></View>) : <AppText style={ui.muted}>Aucune modification administrative enregistrée.</AppText>}
    </AdminCard>
    {canOrganize(mission) && <EmployerActionButton title="Annuler cette mission" variant="secondary" icon="close-circle-outline" onPress={() => setConfirmCancel(true)} />}
    {confirmCancel && <EmployerDialog title="Annuler la mission ?" onClose={() => setConfirmCancel(false)}>
      <AppText style={ui.text}>Cette intervention ne sera plus planifiée pour le {dateLabel(mission.date)}. Son dossier et son historique seront conservés.</AppText>
      <AppText style={ui.muted}>L’annulation s’applique à la démonstration locale. Aucun message n’est envoyé au client ou à l’employé.</AppText>
      <EmployerActionButton title="Confirmer l’annulation" onPress={cancel} />
      <EmployerActionButton title="Conserver la mission" variant="secondary" onPress={() => setConfirmCancel(false)} />
    </EmployerDialog>}
  </AdminPage>;
}

function timestampLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CalendarScreen({ onNavigate, onBack }: AdminScreenProps) {
 const ui = useAdminStyles();

  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  const store = useAdminStore();
  const { fontScale } = useWindowDimensions();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [gridWidth, setGridWidth] = useState(308);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const firstOffset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((firstOffset + daysInMonth) / 7) * 7;
  const visibleMissions = store.missions.filter(mission => includeCancelled || mission.status !== 'cancelled');
  const dayMissions = visibleMissions.filter(mission => mission.date === selectedDate).sort(orderMissions);
  const monthMissions = visibleMissions.filter(mission => mission.date.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-`));
  const moveMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1, 12);
    setMonth(next); setSelectedDate(localDate(next));
  };
  const goToday = () => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12)); setSelectedDate(localDate(now)); };
  return <AdminPage title="Calendrier / dispatch" subtitle="Consultez les interventions par date et ouvrez leur dossier pour les organiser." onBack={onBack}>
    <View style={ui.split}>
      <EmployerActionButton title="Aujourd’hui" variant="secondary" icon="today-outline" style={ui.grow} onPress={goToday} />
      <EmployerActionButton title="Missions à assigner" icon="person-add-outline" style={ui.grow} onPress={() => onNavigate({ screen: 'missions', filter: 'unassigned' })} />
    </View>
    <AdminCard>
      <View style={styles.monthHeader}>
        <Pressable style={styles.monthButton} accessibilityRole="button" accessibilityLabel="Mois précédent" onPress={() => moveMonth(-1)}><Ionicons name="chevron-back" size={22} color={theme.blue} /></Pressable>
        <AppText accessibilityLiveRegion="polite" style={[ui.heading, styles.monthTitle]}>{month.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}</AppText>
        <Pressable style={styles.monthButton} accessibilityRole="button" accessibilityLabel="Mois suivant" onPress={() => moveMonth(1)}><Ionicons name="chevron-forward" size={22} color={theme.blue} /></Pressable>
      </View>
      <AppText style={ui.muted}>{monthMissions.length} intervention{monthMissions.length > 1 ? 's' : ''} ce mois · Les nombres sous les dates indiquent les missions.</AppText>
      <View onLayout={event => setGridWidth(Math.max(308, event.nativeEvent.layout.width))}>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.calendarScroll}>
          <View style={{ width: Math.max(gridWidth, 308 * Math.max(1, fontScale)) }}>
            <View style={styles.calendarRow}>{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <AppText key={day} style={styles.weekday}>{day}</AppText>)}</View>
            <View style={styles.calendarRow}>
              {Array.from({ length: cellCount }, (_, index) => {
                const day = index - firstOffset + 1;
                if (day < 1 || day > daysInMonth) return <View key={`empty-${index}`} style={styles.emptyDay} />;
                const date = localDate(new Date(month.getFullYear(), month.getMonth(), day, 12));
                const count = visibleMissions.filter(mission => mission.date === date).length;
                const selected = selectedDate === date;
                const today = localDate() === date;
                return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${dateLabel(date)}, ${count} mission${count > 1 ? 's' : ''}${today ? ', aujourd’hui' : ''}`} accessibilityState={{ selected }} onPress={() => setSelectedDate(date)}
                  style={[styles.day, today && styles.today, selected && styles.selectedDay]}>
                  <AppText style={[styles.dayNumber, selected && styles.selectedDayNumber]}>{day}</AppText>
                  <AppText style={[styles.dayCount, selected && styles.selectedDayNumber]}>{count ? `${count} m.` : ' '}</AppText>
                </Pressable>;
              })}
            </View>
          </View>
        </ScrollView>
      </View>
      <AppText style={ui.muted}>Touchez une date pour voir les missions. Sur un petit écran, faites défiler le calendrier horizontalement.</AppText>
      <AdminChips value={includeCancelled ? 'all' : 'active'} onChange={value => setIncludeCancelled(value === 'all')} options={[{ value: 'active', label: 'Hors annulations' }, { value: 'all', label: 'Inclure les annulations' }]} />
    </AdminCard>
    <AppText accessibilityRole="header" style={ui.heading}>{dateLabel(selectedDate)}</AppText>
    <AppText accessibilityLiveRegion="polite" style={ui.muted}>{dayMissions.length} mission{dayMissions.length > 1 ? 's' : ''} pour cette date</AppText>
    {dayMissions.length ? dayMissions.map(mission => <MissionCard key={mission.id} mission={mission} store={store} onNavigate={onNavigate} />)
      : <AdminEmpty title="Aucune intervention ce jour" message="Choisissez une autre date ou consultez la liste complète des missions." action={<EmployerActionButton title="Toutes les missions" variant="secondary" onPress={() => onNavigate({ screen: 'missions', filter: 'all' })} />} />}
  </AdminPage>;
}

function MissingMission({ onBack }: { onBack: () => void }) {


  return <AdminPage title="Mission introuvable" onBack={onBack}><AdminEmpty title="Ce dossier n’est plus disponible" message="Revenez à la liste des missions pour ouvrir un autre dossier." /></AdminPage>;
}

export function AdminMissionScreens(props: AdminScreenProps) {


  switch (props.route.screen) {
    case 'missions': return <MissionsList key={`missions-${props.route.filter ?? 'all'}-${props.route.dateFrom ?? ''}-${props.route.dateTo ?? ''}`} {...props} route={props.route} />;
    case 'mission-detail': return <MissionDetailScreen key={props.route.missionId} {...props} route={props.route} />;
    case 'assignment': return <AssignmentScreen key={props.route.missionId} {...props} route={props.route} />;
    case 'calendar': return <CalendarScreen {...props} />;
    default: return null;
  }
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  flex: { flex: 1, flexShrink: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  staffChoice: { minHeight: 48, paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  staffSelected: { borderColor: theme.blue, backgroundColor: theme.paleBlue },
  disabled: { opacity: 0.45 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthTitle: { flex: 1, textAlign: 'center', textTransform: 'capitalize' },
  monthButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12 },
  calendarScroll: { paddingBottom: 9 },
  calendarRow: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.285714%', color: theme.muted, fontSize: 11, lineHeight: 20, paddingVertical: 7, textAlign: 'center', fontFamily: fonts.medium },
  emptyDay: { width: '14.285714%', minHeight: 55 },
  day: { width: '14.285714%', minHeight: 55, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, borderWidth: 1, borderColor: 'transparent', borderRadius: 10 },
  today: { borderColor: theme.blue },
  selectedDay: { backgroundColor: theme.paleBlue, borderColor: theme.blue },
  dayNumber: { color: theme.text, fontSize: 14, lineHeight: 22, fontFamily: fonts.bold },
  dayCount: { color: theme.teal, fontSize: 10, lineHeight: 17 },
  selectedDayNumber: { color: theme.text },
}));
