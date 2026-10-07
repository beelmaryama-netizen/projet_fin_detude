import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../../theme/tokens';
import { Action, Card, EmployeeLayout, InfoRow, Notice, Progress, SectionTitle } from '../components/EmployeeUI';
import { useEmployeeStore } from '../hooks/useEmployeeStore';
import { formatDuration, getElapsedMs, getProgress } from '../services/missionRules';
import type { EmployeeScreenProps } from '../types/navigation';
import { Bullet, formatDate, formatTime, MissionIdentity, MissionUnavailable, screenStyles } from './screenHelpers';

export function MissionCompletedScreen({ navigation, route }: EmployeeScreenProps<'Completed'>) {
  const mission = useEmployeeStore((state) => state.missions.find((item) => item.id === route.params.missionId));
  if (!mission) return <MissionUnavailable onBack={() => navigation.navigate('Missions')} />;
  const completed = mission.status === 'COMPLETED';
  const pending = mission.status === 'REPORT_PENDING';
  const progress = getProgress(mission);
  if (!completed && !pending) return (
    <EmployeeLayout title="Bilan de mission" onBack={() => navigation.goBack()}><Card><MissionIdentity mission={mission} /><Notice>Le bilan sera disponible à la fin de votre intervention.</Notice><Action title={mission.status === 'UPCOMING' ? 'Voir la mission' : 'Reprendre la mission'} onPress={() => navigation.replace(mission.status === 'UPCOMING' ? 'Detail' : 'Active', { missionId: mission.id })} /></Card></EmployeeLayout>
  );
  return (
    <EmployeeLayout title={completed ? 'Mission terminée' : 'Rapport à compléter'} subtitle={completed ? 'Votre intervention est finalisée.' : 'Une dernière étape avant de terminer la mission.'} onBack={() => navigation.goBack()}>
      <Card>
        <View style={styles.confirmation}><View style={[styles.icon, !completed && styles.pendingIcon]}><Ionicons name={completed ? 'checkmark-circle-outline' : 'document-text-outline'} color={completed ? colors.teal : colors.primary} size={40} /></View><Text style={styles.confirmationTitle}>{completed ? 'Mission terminée' : 'Intervention clôturée'}</Text><Text style={[screenStyles.body, { textAlign: 'center' }]}>{completed ? 'Votre rapport a été validé. Merci pour votre travail !' : 'Le rapport doit être complété et validé pour terminer la mission.'}</Text></View>
        <View style={screenStyles.divider} /><MissionIdentity mission={mission} />
      </Card>
      <Card><SectionTitle>Votre intervention en bref</SectionTitle><InfoRow icon="calendar-outline" label="Date" value={formatDate(mission.startedAt ?? mission.scheduledStart)} /><InfoRow icon="play-circle-outline" label="Début réel" value={formatTime(mission.startedAt)} /><InfoRow icon="stop-circle-outline" label="Fin réelle" value={formatTime(mission.endedAt)} /><InfoRow icon="time-outline" label="Durée réelle" value={formatDuration(getElapsedMs(mission))} /></Card>
      <Card><SectionTitle>Les tâches de votre mission</SectionTitle><Progress mission={mission} /><Text style={screenStyles.body}>{progress.done} {progress.done > 1 ? 'tâches réalisées' : 'tâche réalisée'}{progress.notApplicable ? ` et ${progress.notApplicable} ${progress.notApplicable > 1 ? 'exceptions justifiées' : 'exception justifiée'}` : ''}.</Text>{mission.tasks.filter((task) => task.status === 'DONE').map((task) => <Bullet key={task.id} checked>{task.title}</Bullet>)}{mission.tasks.filter((task) => task.status === 'NOT_APPLICABLE').map((task) => <Bullet key={task.id}>{task.title} · Non applicable : {task.justification}</Bullet>)}{progress.remaining > 0 && <Text style={screenStyles.caption}>{progress.remaining} {progress.remaining > 1 ? 'tâches facultatives non réalisées.' : 'tâche facultative non réalisée.'}</Text>}</Card>
      <Card>
        <SectionTitle>Rapport et remarques</SectionTitle>
        <Notice tone={completed ? 'success' : 'info'}>{completed ? 'Rapport validé' : 'Rapport à compléter'}{completed && mission.report.validatedAt ? ` · ${formatTime(mission.report.validatedAt)}` : ''}</Notice>
        {!!mission.report.summary && <><Text style={screenStyles.label}>Résumé de l’intervention</Text><Text style={screenStyles.body}>{mission.report.summary}</Text></>}
        <Text style={screenStyles.label}>Incidents</Text><Text style={screenStyles.body}>{mission.report.hasIncident ? mission.report.incidentDescription : 'Aucun incident déclaré.'}</Text>
        {!!mission.report.observations && <><Text style={screenStyles.label}>Observations</Text><Text style={screenStyles.body}>{mission.report.observations}</Text></>}
      </Card>
      <Action title={completed ? 'Consulter le rapport' : 'Reprendre le rapport'} icon="document-text-outline" onPress={() => navigation.navigate('Report', { missionId: mission.id })} />
      <Action title="Retour à mes missions" variant="secondary" onPress={() => navigation.popToTop()} />
    </EmployeeLayout>
  );
}
const styles = StyleSheet.create({
  confirmation: { alignItems: 'center', gap: 12 }, icon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.successSurface, alignItems: 'center', justifyContent: 'center' }, pendingIcon: { backgroundColor: colors.paleBlue }, confirmationTitle: { fontFamily: fonts.title, color: colors.ink, fontSize: 22, textAlign: 'center' },
});
