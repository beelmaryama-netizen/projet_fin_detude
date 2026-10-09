import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../../theme/tokens';
import { Action, Card, EmployeeLayout, Field, InfoRow, Notice, Progress, SectionTitle } from '../components/EmployeeUI';
import { useEmployeeStore } from '../hooks/useEmployeeStore';
import { formatDuration, getClosureErrors, getElapsedMs } from '../services/missionRules';
import type { EmployeeScreenProps } from '../types/navigation';
import { Bullet, formatTime, MissionIdentity, MissionUnavailable, screenStyles } from './screenHelpers';

export function MissionActiveScreen({ navigation, route }: EmployeeScreenProps<'Active'>) {
  const mission = useEmployeeStore((state) => state.missions.find((item) => item.id === route.params.missionId));
  const { setIncident, finishIntervention, startMission } = useEmployeeStore();
  const [now, setNow] = useState(Date.now());
  const [attemptedClose, setAttemptedClose] = useState(false);
  useEffect(() => {
    if (mission?.status !== 'IN_PROGRESS') return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [mission?.status]);
  if (!mission) return <MissionUnavailable onBack={() => navigation.navigate('Missions')} />;
  const active = mission.status === 'IN_PROGRESS';
  const remaining = mission.tasks.filter((task) => task.status === 'TODO' || (task.status === 'NOT_APPLICABLE' && !task.justification.trim()));
  const errors = attemptedClose ? getClosureErrors(mission) : {};
  function finish() {
    if (!mission) return;
    setAttemptedClose(true);
    const nextErrors = finishIntervention(mission.id);
    if (!Object.keys(nextErrors).length) navigation.replace('Report', { missionId: mission.id });
  }
  return (
    <EmployeeLayout title={active ? 'Mission en cours' : 'Suivi de mission'} subtitle="Gardez le fil de votre intervention." onBack={() => navigation.goBack()}>
      <Card>
        <MissionIdentity mission={mission} />
        <View style={styles.timer}><View style={styles.timerLabel}><Ionicons name="time-outline" color={colors.primary} size={22} /><Text style={screenStyles.label}>{active ? 'Durée écoulée' : 'Durée de l’intervention'}</Text></View><Text style={styles.time}>{formatDuration(getElapsedMs(mission, now))}</Text><Text style={screenStyles.caption}>{active ? 'Calculée depuis le démarrage de la mission' : 'Horaires réels de la mission'}</Text></View>
        <InfoRow icon="play-circle-outline" label="Heure réelle de début" value={formatTime(mission.startedAt)} />
        {mission.endedAt && <InfoRow icon="stop-circle-outline" label="Heure réelle de fin" value={formatTime(mission.endedAt)} />}
      </Card>
      {!active && <Notice>{mission.status === 'UPCOMING' ? 'Cette mission n’a pas encore démarré.' : mission.status === 'REPORT_PENDING' ? 'L’intervention est clôturée. Complétez le rapport pour terminer la mission.' : 'Cette mission et son rapport sont terminés.'}</Notice>}
      <Card>
        <SectionTitle>Avancement de la mission</SectionTitle><Progress mission={mission} />
        <View style={screenStyles.divider} />
        <Text style={screenStyles.label}>{remaining.length ? `${remaining.length} ${remaining.length > 1 ? 'tâches restantes' : 'tâche restante'}` : 'Toutes les tâches sont renseignées'}</Text>
        {remaining.length ? remaining.map((task) => <Bullet key={task.id}>{task.title}{task.required ? ' · Obligatoire' : ''}{task.status === 'NOT_APPLICABLE' ? ' · Justification manquante' : ''}</Bullet>) : <Text style={screenStyles.body}>Vous pouvez vérifier vos remarques puis clôturer l’intervention.</Text>}
        <Action title={active ? 'Ouvrir la checklist' : 'Consulter la checklist'} variant="secondary" icon="checkbox-outline" onPress={() => navigation.navigate('Checklist', { missionId: mission.id })} />
      </Card>
      <Card>
        <SectionTitle>Un incident à signaler ?</SectionTitle>
        <Text style={screenStyles.body}>Notez ici tout imprévu. Cette information sera reprise dans votre rapport.</Text>
        <Field label="Incident ou difficulté (facultatif)" value={mission.incident} onChangeText={(value) => setIncident(mission.id, value)} editable={active} multiline placeholder="Décrivez la situation et les actions prises…" />
      </Card>
      {active && Object.keys(errors).length > 0 && <Card><Notice tone="error">Quelques points sont à compléter avant la clôture.</Notice>{Object.entries(errors).map(([key, value]) => <Text key={key} style={screenStyles.error}>{mission.tasks.find((task) => task.id === key)?.title ? `${mission.tasks.find((task) => task.id === key)?.title} : ` : ''}{value}</Text>)}<Action title="Corriger la checklist" variant="secondary" onPress={() => navigation.navigate('Checklist', { missionId: mission.id })} /></Card>}
      {active && <><Text style={screenStyles.caption}>La clôture enregistre l’heure de fin. Vous pourrez ensuite rédiger et valider votre rapport.</Text><Action title="Terminer l’intervention" icon="checkmark-circle-outline" onPress={finish} /></>}
      {mission.status === 'UPCOMING' && <Action title="Démarrer la mission" icon="play-outline" onPress={() => startMission(mission.id)} />}
      {mission.status === 'REPORT_PENDING' && <Action title="Compléter le rapport" icon="document-text-outline" onPress={() => navigation.replace('Report', { missionId: mission.id })} />}
      {mission.status === 'COMPLETED' && <Action title="Voir le bilan" onPress={() => navigation.replace('Completed', { missionId: mission.id })} />}
    </EmployeeLayout>
  );
}
const styles = StyleSheet.create({
  timer: { alignItems: 'center', borderRadius: 14, backgroundColor: colors.paleBlue, padding: 20, gap: 6 }, timerLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 }, time: { fontFamily: fonts.titleBold, fontSize: 34, color: colors.primaryDark, letterSpacing: 0.5 },
});

