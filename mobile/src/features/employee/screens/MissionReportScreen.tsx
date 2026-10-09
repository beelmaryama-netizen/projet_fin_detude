import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { colors } from '../../../theme/tokens';
import { Action, Card, EmployeeLayout, Field, InfoRow, Notice, Progress, SectionTitle } from '../components/EmployeeUI';
import { MissionPhotos } from '../components/MissionPhotos';
import { useEmployeeStore } from '../hooks/useEmployeeStore';
import { formatDuration, getElapsedMs, getReportErrors } from '../services/missionRules';
import type { EmployeeScreenProps } from '../types/navigation';
import { formatDate, formatTime, MissionIdentity, MissionUnavailable, screenStyles } from './screenHelpers';

export function MissionReportScreen({ navigation, route }: EmployeeScreenProps<'Report'>) {
  const mission = useEmployeeStore((state) => state.missions.find((item) => item.id === route.params.missionId));
  const { updateReport, saveDraft, validateReport } = useEmployeeStore();
  const [attemptedValidation, setAttemptedValidation] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  if (!mission) return <MissionUnavailable onBack={() => navigation.navigate('Missions')} />;
  const editable = mission.status === 'REPORT_PENDING';
  const errors = attemptedValidation && editable ? getReportErrors(mission) : {};
  if (mission.status === 'UPCOMING' || mission.status === 'IN_PROGRESS') return (
    <EmployeeLayout title="Rapport de fin" onBack={() => navigation.goBack()}>
      <Card><MissionIdentity mission={mission} /><Notice>Le rapport sera disponible après la clôture de l’intervention.</Notice><Action title={mission.status === 'UPCOMING' ? 'Voir la mission' : 'Reprendre la mission'} onPress={() => navigation.replace(mission.status === 'UPCOMING' ? 'Detail' : 'Active', { missionId: mission.id })} /></Card>
    </EmployeeLayout>
  );
  function validate() {
    if (!mission) return;
    setAttemptedValidation(true);
    const nextErrors = validateReport(mission.id);
    if (!Object.keys(nextErrors).length) navigation.replace('Completed', { missionId: mission.id });
  }
  return (
    <EmployeeLayout title="Rapport de fin de mission" subtitle={editable ? 'Récapitulez votre intervention, puis validez le rapport.' : 'Votre rapport validé, en lecture seule.'} onBack={() => navigation.goBack()}>
      {!editable && <Notice tone="success">Rapport validé{mission.report.validatedAt ? ` le ${formatDate(mission.report.validatedAt)} à ${formatTime(mission.report.validatedAt)}` : ''}.</Notice>}
      <Card>
        <MissionIdentity mission={mission} />
        <InfoRow icon="location-outline" label="Adresse" value={mission.address} />
        <InfoRow icon="calendar-outline" label="Date de l’intervention" value={formatDate(mission.startedAt ?? mission.scheduledStart)} />
        <InfoRow icon="play-circle-outline" label="Début réel" value={formatTime(mission.startedAt)} />
        <InfoRow icon="stop-circle-outline" label="Fin réelle" value={formatTime(mission.endedAt)} />
        <InfoRow icon="time-outline" label="Durée réelle" value={formatDuration(getElapsedMs(mission))} />
        {errors.timing && <Text style={screenStyles.error}>{errors.timing}</Text>}
      </Card>
      <Card>
        <SectionTitle>Récapitulatif de la checklist</SectionTitle><Progress mission={mission} />
        {mission.tasks.map((task) => <View key={task.id} style={{ gap: 4 }}><Text style={screenStyles.label}>{task.title}</Text><Text style={screenStyles.caption}>{task.status === 'DONE' ? 'Réalisée' : task.status === 'NOT_APPLICABLE' ? `Non applicable · ${task.justification}` : 'Non réalisée'}{task.comment ? ` — ${task.comment}` : ''}</Text></View>)}
        {errors.tasks && <Notice tone="error">{errors.tasks}</Notice>}
        <Action title="Consulter la checklist" variant="secondary" icon="checkbox-outline" onPress={() => navigation.navigate('Checklist', { missionId: mission.id })} />
      </Card>
      <Card>
        <SectionTitle>Votre compte rendu</SectionTitle>
        <Field label="Résumé de l’intervention *" value={mission.report.summary} onChangeText={(summary) => { setDraftSaved(false); updateReport(mission.id, { summary }); }} multiline editable={editable} placeholder="Décrivez les travaux réalisés et le résultat obtenu (10 caractères minimum)." error={errors.summary} />
        <Field label="Observations (facultatif)" value={mission.report.observations} onChangeText={(observations) => { setDraftSaved(false); updateReport(mission.id, { observations }); }} multiline editable={editable} placeholder="Une remarque utile pour le suivi de cette mission…" />
        <View style={screenStyles.spread}><Text style={[screenStyles.label, { flex: 1 }]}>Un incident est survenu</Text><Switch style={{ minHeight: 44, minWidth: 52 }} accessibilityLabel="Un incident est survenu" value={mission.report.hasIncident} disabled={!editable} onValueChange={(hasIncident) => { setDraftSaved(false); updateReport(mission.id, { hasIncident }); }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} /></View>
        {mission.report.hasIncident ? <Field label="Description de l’incident *" value={mission.report.incidentDescription} onChangeText={(incidentDescription) => { setDraftSaved(false); updateReport(mission.id, { incidentDescription }); }} multiline editable={editable} placeholder="Décrivez l’incident et les actions prises (10 caractères minimum)." error={errors.incidentDescription} /> : <Text style={screenStyles.caption}>Aucun incident déclaré.</Text>}
        {editable && <Text style={screenStyles.caption}>* Champs obligatoires. Vos saisies restent disponibles pendant la navigation.</Text>}
      </Card>
      <MissionPhotos missionId={mission.id} readOnly={!editable} />
      {errors.status && <Notice tone="error">{errors.status}</Notice>}
      {draftSaved && <Notice tone="success">Brouillon enregistré pour cette session de démonstration.</Notice>}
      {editable ? <>
        {mission.report.savedAt && <Text style={screenStyles.caption}>Dernier enregistrement : {formatTime(mission.report.savedAt)}.</Text>}
        <Action title="Enregistrer le brouillon" variant="secondary" icon="save-outline" onPress={() => { saveDraft(mission.id); setDraftSaved(true); }} />
        <Action title="Valider le rapport" icon="checkmark-circle-outline" onPress={validate} />
        <Action title="Reprendre plus tard" variant="ghost" onPress={() => navigation.replace('Completed', { missionId: mission.id })} />
        <Text style={screenStyles.caption}>La validation termine la mission et rend son rapport consultable en lecture seule. Aucune donnée n’est envoyée à un serveur.</Text>
      </> : <Action title="Retour au bilan de mission" variant="secondary" onPress={() => navigation.popTo('Completed', { missionId: mission.id })} />}
    </EmployeeLayout>
  );
}

