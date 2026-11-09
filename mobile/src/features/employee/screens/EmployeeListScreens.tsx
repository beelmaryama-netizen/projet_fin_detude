import { useState } from 'react';
import { ScreenLayout } from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { AsyncState, EmptyState } from '../../../components/AsyncState';
import { FilterTabs } from '../../../components/FilterTabs';
import { Button } from '../../../components/Button';
import { MissionCard } from '../components/MissionCard';
import { EmployeeCalendar } from '../components/EmployeeCalendar';
import { employeeService } from '../services/employeeService';
import { useEmployeeQuery, useEmployeeUser } from '../hooks/useEmployeeData';
import { dayKey } from '../services/employeeFormatters';
import type { EmployeeTabProps } from '../navigation/types';
export function EmployeeHomeScreen({ navigation }: EmployeeTabProps<'EmployeeHome'>) {
  const user = useEmployeeUser(); const query = useEmployeeQuery('missions', employeeService.list);
  const [filter, setFilter] = useState<'today' | 'upcoming'>('today'); const today = dayKey(new Date());
  const missions = (query.data ?? []).filter(item => ['PLANNED', 'IN_PROGRESS'].includes(item.status) && (filter === 'today' ? dayKey(item.startAt) === today || item.status === 'IN_PROGRESS' : dayKey(item.startAt) > today)).sort((a,b) => a.startAt.localeCompare(b.startAt));
  return <ScreenLayout title={'Bonjour, ' + user.firstName} subtitle="Vos missions assignées." onNotifications={() => navigation.navigate('EmployeeNotifications')} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <FilterTabs value={filter} onChange={setFilter} options={[{ value: 'today', label: 'Aujourd’hui' }, { value: 'upcoming', label: 'À venir' }]} />
    <AsyncState query={query}>{missions.length ? missions.map(mission => <MissionCard key={mission.id} mission={mission} onPress={() => navigation.navigate('MissionDetails', { id: mission.id })} />) : <EmptyState title="Aucune mission prévue" description="Vos nouvelles assignations apparaîtront ici." />}</AsyncState>
  </ScreenLayout>;
}
export function EmployeeAgendaScreen({ navigation }: EmployeeTabProps<'EmployeeAgenda'>) {
  const query = useEmployeeQuery('missions', employeeService.list); const [selected, setSelected] = useState(dayKey(new Date()));
  const missions = (query.data ?? []).filter(item => dayKey(item.startAt) === selected).sort((a,b) => a.startAt.localeCompare(b.startAt));
  return <ScreenLayout title="Agenda" subtitle="Consultez vos missions par date." onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <EmployeeCalendar selected={selected} onSelect={setSelected} daysWithMissions={new Set((query.data ?? []).map(item => dayKey(item.startAt)))} />
    <Button title="Revenir à aujourd’hui" variant="link" onPress={() => setSelected(dayKey(new Date()))} />
    <AppText variant="label">{selected}</AppText><AsyncState query={query}>{missions.length ? missions.map(mission => <MissionCard key={mission.id} mission={mission} onPress={() => navigation.navigate('MissionDetails', { id: mission.id })} />) : <EmptyState title="Aucune mission à cette date" />}</AsyncState>
  </ScreenLayout>;
}
export function EmployeeHistoryScreen({ navigation }: EmployeeTabProps<'EmployeeHistory'>) {
  const query = useEmployeeQuery('missions', employeeService.list); const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const limit = Date.now() - (period === 'week' ? 7 : 30) * 86400000;
  const missions = (query.data ?? []).filter(item => ['COMPLETED', 'CANCELLED'].includes(item.status) && (period === 'all' || Date.parse(item.completedAt ?? item.startAt) >= limit)).sort((a,b) => (b.completedAt ?? b.startAt).localeCompare(a.completedAt ?? a.startAt));
  return <ScreenLayout title="Historique" subtitle="Vos missions terminées et annulées." onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <FilterTabs value={period} onChange={setPeriod} options={[{ value: 'week', label: '7 jours' }, { value: 'month', label: '30 jours' }, { value: 'all', label: 'Tout' }]} />
    <AsyncState query={query}>{missions.length ? missions.map(mission => <MissionCard key={mission.id} mission={mission} onPress={() => navigation.navigate('MissionDetails', { id: mission.id })} />) : <EmptyState title="Aucune mission dans cette période" />}</AsyncState>
  </ScreenLayout>;
}
