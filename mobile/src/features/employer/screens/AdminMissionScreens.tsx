import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { AdminWorkspace } from './AdminWorkspace';
import { AdminBadge, AdminButton, AdminCard, AdminSectionTitle, AdminTextField, adminStyles, formatAdminDateTime } from '../components/AdminUI';
import { employerTheme as theme } from '../theme';
import { useAdminStore } from '../store/adminStore';
import type { AdminMission, AdminMissionStatus, AdminStackParamList } from '../types/admin';

const missionLabels: Record<AdminMissionStatus, string> = {
  TO_ASSIGN: 'À assigner', PLANNED: 'Planifiée', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée',
};
const missionTone = (status: AdminMissionStatus) =>
  status === 'COMPLETED' ? 'green' : status === 'CANCELLED' ? 'red' : status === 'IN_PROGRESS' ? 'gold' : 'blue';

export function MissionsToAssignScreen({ navigation }: NativeStackScreenProps<AdminStackParamList, 'MissionsToAssign'>) {
  const missions = useAdminStore(state => state.missions.filter(item => item.status === 'TO_ASSIGN'));
  return <AdminWorkspace title="Missions à assigner" subtitle="Offres acceptées en attente d’une équipe." onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 51" />
    <AdminButton title="Ouvrir le calendrier" icon="calendar-outline" variant="secondary" onPress={() => navigation.navigate('DispatchCalendar')} />
    {missions.map(mission => <MissionCard key={mission.id} mission={mission}>
      <View style={styles.actions}>
        <View style={styles.action}><AdminButton title="Consulter le dossier" variant="secondary" onPress={() => navigation.navigate('MissionDetail', { missionId: mission.id })} /></View>
        <View style={styles.action}><AdminButton title="Assigner l’équipe" icon="people-outline" onPress={() => navigation.navigate('AssignEmployees', { missionId: mission.id })} /></View>
      </View>
    </MissionCard>)}
    {!missions.length && <AdminCard><AppText style={adminStyles.text}>Toutes les missions acceptées sont déjà assignées.</AppText></AdminCard>}
  </AdminWorkspace>;
}

export function AssignEmployeesScreen({ navigation, route }: NativeStackScreenProps<AdminStackParamList, 'AssignEmployees'>) {
  const mission = useAdminStore(state => state.missions.find(item => item.id === route.params.missionId));
  const employees = useAdminStore(state => state.employees);
  const missions = useAdminStore(state => state.missions);
  const assignMission = useAdminStore(state => state.assignMission);
  const [selected, setSelected] = useState<string[]>(mission?.employeeIds ?? []);
  const [message, setMessage] = useState('');

  if (!mission) return <AdminWorkspace title="Mission introuvable" onBack={() => navigation.goBack()}><AdminCard><AppText style={adminStyles.text}>Cette mission n’existe plus.</AppText></AdminCard></AdminWorkspace>;
  const currentMission = mission;

  function employeeHasConflict(employeeId: string) {
    return missions.some(other => other.id !== currentMission.id && other.status !== 'CANCELLED' && other.employeeIds.includes(employeeId) &&
      new Date(currentMission.startAt).getTime() < new Date(other.endAt).getTime() &&
      new Date(other.startAt).getTime() < new Date(currentMission.endAt).getTime());
  }

  function toggle(id: string) {
    const employee = employees.find(item => item.id === id);
    if (!employee || employee.status !== 'ACTIVE' || employeeHasConflict(id)) return;
    setMessage('');
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < currentMission.employeeCount ? [...current, id] : current);
  }

  function confirm() {
    const result = assignMission(currentMission.id, selected);
    if (!result.ok) setMessage(result.message ?? 'Affectation impossible.');
    else navigation.replace('MissionDetail', { missionId: currentMission.id });
  }

  return <AdminWorkspace title="Assigner un employé" subtitle={'Sélectionnez exactement ' + mission.employeeCount + ' employé(s).'} onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 52" />
    <AdminCard>
      <AdminSectionTitle>Contexte de la mission</AdminSectionTitle>
      <AppText style={styles.title}>{mission.clientName}</AppText>
      <AppText style={adminStyles.muted}>{mission.serviceName}</AppText>
      <AppText style={adminStyles.muted}>{formatAdminDateTime(mission.startAt)} → {formatAdminDateTime(mission.endAt)}</AppText>
    </AdminCard>
    {employees.map(employee => {
      const conflict = employeeHasConflict(employee.id);
      const blocked = employee.status !== 'ACTIVE' || conflict;
      const checked = selected.includes(employee.id);
      return <Pressable key={employee.id} disabled={blocked} onPress={() => toggle(employee.id)} style={({ pressed }) => [styles.employeeCard, checked && styles.employeeSelected, blocked && styles.employeeBlocked, pressed && styles.pressed]}>
        <View style={styles.employeeTop}>
          <View style={styles.avatar}><AppText style={styles.avatarText}>{employee.firstName[0]}{employee.lastName[0]}</AppText></View>
          <View style={styles.employeeCopy}>
            <AppText style={styles.employeeName}>{employee.firstName} {employee.lastName}</AppText>
            <AppText style={adminStyles.muted}>{employee.city} · {employee.specialties.join(', ')}</AppText>
            <AppText style={adminStyles.muted}>{employee.availability}</AppText>
          </View>
          <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={blocked ? '#6B7F9D' : theme.blue} />
        </View>
        {employee.status === 'SUSPENDED' && <AdminBadge label="Suspendu" tone="red" />}
        {conflict && <AdminBadge label="Conflit de mission" tone="gold" />}
      </Pressable>;
    })}
    <AdminCard>
      <AdminSectionTitle>Récapitulatif</AdminSectionTitle>
      <AppText style={adminStyles.text}>{selected.length} / {mission.employeeCount} sélectionné(s)</AppText>
      {selected.map(id => {
        const employee = employees.find(item => item.id === id);
        return employee ? <AppText key={id} style={adminStyles.muted}>• {employee.firstName} {employee.lastName}</AppText> : null;
      })}
      {!!message && <AppText style={styles.error}>{message}</AppText>}
      <AdminButton title="Confirmer l’affectation" icon="checkmark-circle-outline" disabled={selected.length !== mission.employeeCount} onPress={confirm} />
    </AdminCard>
  </AdminWorkspace>;
}

export function DispatchCalendarScreen({ navigation }: NativeStackScreenProps<AdminStackParamList, 'DispatchCalendar'>) {
  const missions = useAdminStore(state => state.missions);
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const [selectedDate, setSelectedDate] = useState('2026-10-24');

  const days = useMemo(() => {
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [month]);

  const monthLabel = month.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
  const selectedMissions = missions.filter(item => item.startAt.slice(0, 10) === selectedDate && item.status !== 'CANCELLED');

  function changeMonth(offset: number) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }
  function selectDay(day: number) {
    const value = month.getFullYear() + '-' + String(month.getMonth() + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    setSelectedDate(value);
  }

  return <AdminWorkspace title="Calendrier / Dispatch" subtitle="Les mêmes missions alimentent le calendrier et les listes." onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 53" />
    <AdminCard>
      <View style={styles.calendarHead}>
        <Pressable onPress={() => changeMonth(-1)} style={styles.calendarNav}><Ionicons name="chevron-back" size={22} color={theme.text} /></Pressable>
        <AppText style={styles.month}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</AppText>
        <Pressable onPress={() => changeMonth(1)} style={styles.calendarNav}><Ionicons name="chevron-forward" size={22} color={theme.text} /></Pressable>
      </View>
      <View style={styles.calendarGrid}>
        {days.map(day => {
          const key = month.getFullYear() + '-' + String(month.getMonth() + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
          const hasMission = missions.some(item => item.startAt.slice(0, 10) === key && item.status !== 'CANCELLED');
          const active = selectedDate === key;
          return <Pressable key={key} onPress={() => selectDay(day)} style={[styles.day, active && styles.dayActive]}>
            <AppText style={[styles.dayText, active && styles.dayTextActive]}>{day}</AppText>
            {hasMission && <View style={styles.dot} />}
          </Pressable>;
        })}
      </View>
      <AdminButton title="Retour à aujourd’hui" variant="ghost" icon="today-outline" onPress={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSelectedDate(d.toISOString().slice(0, 10)); }} />
    </AdminCard>
    <AdminSectionTitle>Interventions du {selectedDate}</AdminSectionTitle>
    {selectedMissions.map(mission => <MissionCard key={mission.id} mission={mission}>
      <AdminButton title="Voir le détail" variant="secondary" onPress={() => navigation.navigate('MissionDetail', { missionId: mission.id })} />
    </MissionCard>)}
    {!selectedMissions.length && <AdminCard><AppText style={adminStyles.text}>Aucune intervention ce jour-là.</AppText></AdminCard>}
  </AdminWorkspace>;
}

export function AdminMissionDetailScreen({ navigation, route }: NativeStackScreenProps<AdminStackParamList, 'MissionDetail'>) {
  const mission = useAdminStore(state => state.missions.find(item => item.id === route.params.missionId));
  const employees = useAdminStore(state => state.employees);
  const updateSchedule = useAdminStore(state => state.updateMissionSchedule);
  const cancelMission = useAdminStore(state => state.cancelMission);
  const [startAt, setStartAt] = useState(mission?.startAt ?? '');
  const [endAt, setEndAt] = useState(mission?.endAt ?? '');
  const [message, setMessage] = useState('');
  if (!mission) return <AdminWorkspace title="Mission introuvable" onBack={() => navigation.goBack()}><AdminCard><AppText style={adminStyles.text}>Cette mission n’existe plus.</AppText></AdminCard></AdminWorkspace>;
  const currentMission = mission;

  const assigned = mission.employeeIds.map(id => employees.find(item => item.id === id)).filter(Boolean);
  const locked = mission.status === 'IN_PROGRESS' || mission.status === 'COMPLETED' || mission.status === 'CANCELLED';

  function saveSchedule() {
    const result = updateSchedule(currentMission.id, startAt, endAt);
    setMessage(result.ok ? 'Créneau mis à jour.' : result.message ?? 'Modification impossible.');
  }

  function confirmCancel() {
    Alert.alert('Annuler la mission', 'Cette action conserve la mission dans l’historique.', [
      { text: 'Retour', style: 'cancel' },
      { text: 'Annuler la mission', style: 'destructive', onPress: () => cancelMission(currentMission.id) },
    ]);
  }

  return <AdminWorkspace title="Détail mission admin" subtitle="Consultation, affectation, créneau et historique." onBack={() => navigation.goBack()}>
    <AdminBadge label="ÉCRAN 55" />
    <MissionCard mission={mission} />
    <AdminCard>
      <AdminSectionTitle>Équipe assignée</AdminSectionTitle>
      {assigned.length ? assigned.map(employee => employee && <AppText key={employee.id} style={adminStyles.text}>• {employee.firstName} {employee.lastName}</AppText>) : <AppText style={adminStyles.muted}>Aucune équipe assignée.</AppText>}
      {!locked && <AdminButton title={assigned.length ? 'Réassigner l’équipe' : 'Assigner l’équipe'} icon="people-outline" variant="secondary" onPress={() => navigation.navigate('AssignEmployees', { missionId: mission.id })} />}
    </AdminCard>
    <AdminCard>
      <AdminSectionTitle>Consignes et checklist</AdminSectionTitle>
      <AppText style={adminStyles.text}>{mission.instructions || 'Aucune consigne particulière.'}</AppText>
      {mission.checklist.map(item => <AppText key={item} style={adminStyles.muted}>□ {item}</AppText>)}
    </AdminCard>
    <AdminCard>
      <AdminSectionTitle>Créneau</AdminSectionTitle>
      <AdminTextField label="Début (ISO)" value={startAt} onChangeText={setStartAt} editable={!locked} />
      <AdminTextField label="Fin (ISO)" value={endAt} onChangeText={setEndAt} editable={!locked} />
      {!!message && <AppText style={message.includes('mis à jour') ? styles.success : styles.error}>{message}</AppText>}
      {!locked && <AdminButton title="Enregistrer le créneau" icon="calendar-outline" onPress={saveSchedule} />}
    </AdminCard>
    <AdminCard>
      <AdminSectionTitle>Historique</AdminSectionTitle>
      {mission.logs.slice().reverse().map(item => <View key={item.id} style={styles.logRow}><View style={styles.logDot} /><View style={styles.employeeCopy}><AppText style={adminStyles.text}>{item.label}</AppText><AppText style={adminStyles.muted}>{formatAdminDateTime(item.at)}</AppText></View></View>)}
    </AdminCard>
    {!locked && <AdminButton title="Annuler la mission" icon="trash-outline" variant="danger" onPress={confirmCancel} />}
  </AdminWorkspace>;
}

function MissionCard({ mission, children }: { mission: AdminMission; children?: ReactNode }) {
  return <AdminCard>
    <View style={styles.cardHead}><AdminBadge label={mission.reference} /><AdminBadge label={missionLabels[mission.status]} tone={missionTone(mission.status)} /></View>
    <AppText style={styles.title}>{mission.clientName}</AppText>
    <AppText style={adminStyles.muted}>{mission.serviceName}</AppText>
    <Detail icon="location-outline" value={mission.address} />
    <Detail icon="calendar-outline" value={formatAdminDateTime(mission.startAt)} />
    <Detail icon="people-outline" value={mission.employeeCount + ' employé(s) requis'} />
    {children}
  </AdminCard>;
}

function Detail({ icon, value }: { icon: ComponentProps<typeof Ionicons>['name']; value: string }) {
  return <View style={styles.detail}><Ionicons name={icon} size={18} color={theme.blue} /><AppText style={styles.detailText}>{value}</AppText></View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { flexGrow: 1, flexBasis: '44%', minWidth: 150 },
  cardHead: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  title: { color: theme.text, fontFamily: fonts.titleBold, fontSize: 19, lineHeight: 27 },
  detail: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  detailText: { flex: 1, color: theme.text },
  employeeCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 14, gap: 10 },
  employeeSelected: { borderColor: theme.blue, backgroundColor: '#153B6D' },
  employeeBlocked: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
  employeeTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#265A9D', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.text, fontFamily: fonts.bold },
  employeeCopy: { flex: 1, gap: 3 },
  employeeName: { color: theme.text, fontFamily: fonts.bold },
  error: { color: '#FF9BA5' },
  success: { color: theme.success },
  calendarHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarNav: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  month: { color: theme.text, fontFamily: fonts.titleBold, fontSize: 18 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  day: { width: '13%', minWidth: 39, aspectRatio: 1, borderRadius: 12, backgroundColor: theme.backgroundDeep, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dayActive: { backgroundColor: '#285FA6', borderColor: theme.blue },
  dayText: { color: theme.muted, fontSize: 12 },
  dayTextActive: { color: theme.text, fontFamily: fonts.bold },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.teal },
  logRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  logDot: { width: 9, height: 9, marginTop: 6, borderRadius: 5, backgroundColor: theme.teal },
});
