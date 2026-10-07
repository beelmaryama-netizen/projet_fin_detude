import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../../theme/tokens';
import { Action, Card, EmployeeLayout, InfoRow, Notice, Progress, SectionTitle } from '../components/EmployeeUI';
import { useEmployeeStore } from '../hooks/useEmployeeStore';
import type { EmployeeMission } from '../types/employee';
import type { EmployeeScreenProps } from '../types/navigation';
import { formatDate, formatTime, MissionIdentity, plannedDuration, screenStyles } from './screenHelpers';

const filters: { value: EmployeeMission['status'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Toutes' }, { value: 'UPCOMING', label: 'À venir' },
  { value: 'IN_PROGRESS', label: 'En cours' }, { value: 'REPORT_PENDING', label: 'À finaliser' }, { value: 'COMPLETED', label: 'Terminées' },
];
export function EmployeeMissionsScreen({ navigation }: EmployeeScreenProps<'Missions'>) {
  const { missions, profile, loading, error, load } = useEmployeeStore();
  const [filter, setFilter] = useState<EmployeeMission['status'] | 'ALL'>('ALL');
  const filtered = missions.filter((mission) => filter === 'ALL' || mission.status === filter);
  const pending = missions.filter((mission) => mission.status === 'REPORT_PENDING').length;
  return (
    <EmployeeLayout title="Mes missions" subtitle={`Bonjour${profile?.firstName ? ` ${profile.firstName}` : ''}, retrouvez vos interventions.`}>
      <Card>
        <SectionTitle eyebrow="VOTRE ACTIVITÉ">Une journée bien organisée</SectionTitle>
        <View style={styles.metrics}>
          {[{ value: missions.filter((m) => m.status === 'UPCOMING').length, label: 'À venir' }, { value: missions.filter((m) => m.status === 'IN_PROGRESS').length, label: 'En cours' }, { value: missions.filter((m) => m.status === 'COMPLETED').length, label: 'Terminées' }].map((metric) => (
            <View key={metric.label} style={styles.metric}><Text style={styles.number}>{metric.value}</Text><Text style={screenStyles.caption}>{metric.label}</Text></View>
          ))}
        </View>
      </Card>
      {pending > 0 && <Notice>{pending === 1 ? 'Un rapport attend votre validation.' : `${pending} rapports attendent votre validation.`} Retrouvez-les dans « À finaliser ».</Notice>}
      {error && <Card><Notice tone="error">{error}</Notice><Action title="Réessayer" onPress={() => { void load(); }} variant="secondary" icon="refresh-outline" /></Card>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: filter === item.value }} onPress={() => setFilter(item.value)} style={[styles.filter, filter === item.value && styles.filterSelected]}><Text style={[styles.filterLabel, filter === item.value && styles.filterLabelSelected]}>{item.label}</Text></Pressable>)}
      </ScrollView>
      {loading ? <Card><ActivityIndicator color={colors.primary} /><Text style={screenStyles.body}>Chargement de vos missions…</Text></Card> : filtered.length === 0 ? (
        <Card><Ionicons name="calendar-outline" color={colors.primary} size={36} /><SectionTitle>{missions.length ? 'Aucune mission dans cette catégorie' : 'Aucune mission attribuée'}</SectionTitle><Text style={screenStyles.body}>{missions.length ? 'Consultez les autres catégories pour retrouver vos interventions.' : 'Les missions qui vous seront attribuées apparaîtront ici.'}</Text><Action title={missions.length ? 'Voir toutes mes missions' : 'Actualiser'} onPress={() => missions.length ? setFilter('ALL') : void load()} variant="secondary" /></Card>
      ) : filtered.map((mission) => (
        <Card key={mission.id}>
          <MissionIdentity mission={mission} />
          <InfoRow icon="calendar-outline" label="Date et horaire" value={`${formatDate(mission.scheduledStart)} · ${formatTime(mission.scheduledStart)}`} />
          <InfoRow icon="location-outline" label="Adresse" value={mission.address} />
          <InfoRow icon="time-outline" label="Durée prévue" value={plannedDuration(mission.plannedMinutes)} />
          {mission.status !== 'UPCOMING' && <Progress mission={mission} />}
          <Action title={mission.status === 'REPORT_PENDING' ? 'Compléter le rapport' : mission.status === 'IN_PROGRESS' ? 'Reprendre la mission' : mission.status === 'COMPLETED' ? 'Voir le bilan' : 'Voir la mission'} icon="arrow-forward" variant={mission.status === 'COMPLETED' ? 'secondary' : 'primary'} onPress={() => navigation.navigate(mission.status === 'REPORT_PENDING' ? 'Report' : mission.status === 'IN_PROGRESS' ? 'Active' : mission.status === 'COMPLETED' ? 'Completed' : 'Detail', { missionId: mission.id })} />
        </Card>
      ))}
    </EmployeeLayout>
  );
}
const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, backgroundColor: colors.paleBlue, borderRadius: 12, alignItems: 'center', padding: 12 },
  number: { color: colors.primaryDark, fontFamily: fonts.titleBold, fontSize: 26 },
  filters: { gap: 8, paddingVertical: 2 }, filter: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 22, backgroundColor: colors.surface },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary }, filterLabel: { fontFamily: fonts.medium, color: colors.muted, fontSize: 14 }, filterLabelSelected: { color: colors.white },
});

