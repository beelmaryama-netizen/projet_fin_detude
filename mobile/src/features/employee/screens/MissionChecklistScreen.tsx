import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../../theme/tokens';
import { Action, Card, EmployeeLayout, Field, Notice, Progress, SectionTitle } from '../components/EmployeeUI';
import { useEmployeeStore } from '../hooks/useEmployeeStore';
import type { EmployeeScreenProps } from '../types/navigation';
import { MissionIdentity, MissionUnavailable, screenStyles } from './screenHelpers';

export function MissionChecklistScreen({ navigation, route }: EmployeeScreenProps<'Checklist'>) {
  const mission = useEmployeeStore((state) => state.missions.find((item) => item.id === route.params.missionId));
  const updateTask = useEmployeeStore((state) => state.updateTask);
  const startMission = useEmployeeStore((state) => state.startMission);
  const [openComments, setOpenComments] = useState<string[]>([]);
  if (!mission) return <MissionUnavailable onBack={() => navigation.navigate('Missions')} />;
  const editable = mission.status === 'IN_PROGRESS';
  const zones = [...new Set(mission.tasks.map((task) => task.zone))];
  return (
    <EmployeeLayout title="Checklist de mission" subtitle="Chaque tâche compte pour une intervention soignée." onBack={() => navigation.goBack()}>
      <Card><MissionIdentity mission={mission} /><Progress mission={mission} /></Card>
      {!editable && <Notice>{mission.status === 'UPCOMING' ? 'Consultez les tâches, puis démarrez la mission pour les cocher.' : 'L’intervention est clôturée. La checklist est en lecture seule.'}</Notice>}
      {editable && <Text style={screenStyles.caption}>Vos choix sont conservés automatiquement. Les tâches obligatoires doivent être réalisées ou justifiées si une exception est autorisée.</Text>}
      {zones.map((zone, zoneIndex) => (
        <Card key={zone}>
          <SectionTitle eyebrow={`ZONE ${zoneIndex + 1}`}>{zone}</SectionTitle>
          {mission.tasks.filter((task) => task.zone === zone).map((task) => {
            const commentVisible = openComments.includes(task.id) || Boolean(task.comment);
            return <View key={task.id} style={[styles.task, task.status === 'DONE' && styles.taskDone]}>
              <Pressable accessibilityRole="checkbox" accessibilityLabel={task.title} accessibilityState={{ checked: task.status === 'DONE', disabled: !editable }} disabled={!editable} onPress={() => updateTask(mission.id, task.id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' })} style={styles.taskToggle}>
                <Ionicons name={task.status === 'DONE' ? 'checkbox' : task.status === 'NOT_APPLICABLE' ? 'remove-circle-outline' : 'square-outline'} color={task.status === 'DONE' ? colors.teal : task.status === 'NOT_APPLICABLE' ? colors.muted : colors.primary} size={26} />
                <Text style={[styles.taskTitle, task.status === 'DONE' && styles.taskTitleDone]}>{task.title}</Text>
              </Pressable>
              <View style={screenStyles.spread}><Text style={[styles.taskTag, task.required && styles.required]}>{task.required ? 'Obligatoire' : 'Facultative'}</Text><Text style={screenStyles.caption}>{task.status === 'DONE' ? 'Réalisée' : task.status === 'NOT_APPLICABLE' ? 'Non applicable' : 'À réaliser'}</Text></View>
              {task.allowNotApplicable && editable && <Action title={task.status === 'NOT_APPLICABLE' ? 'Remettre à réaliser' : 'Non applicable'} variant="secondary" icon="remove-circle-outline" onPress={() => updateTask(mission.id, task.id, { status: task.status === 'NOT_APPLICABLE' ? 'TODO' : 'NOT_APPLICABLE' })} />}
              {task.status === 'NOT_APPLICABLE' && <Field label="Justification de l’exception" value={task.justification} onChangeText={(justification) => updateTask(mission.id, task.id, { justification })} multiline editable={editable} placeholder="Pourquoi cette tâche ne s’applique-t-elle pas ?" error={editable && !task.justification.trim() ? 'Une justification est nécessaire pour cette exception.' : undefined} />}
              {commentVisible ? <Field label="Commentaire (facultatif)" value={task.comment} onChangeText={(comment) => updateTask(mission.id, task.id, { comment })} multiline editable={editable} placeholder="Précisez une difficulté ou une remarque…" /> : editable && <Pressable accessibilityRole="button" accessibilityLabel={`Ajouter un commentaire : ${task.title}`} onPress={() => setOpenComments((current) => [...current, task.id])} style={styles.commentButton}><Ionicons name="chatbubble-outline" size={17} color={colors.primary} accessible={false} /><Text style={styles.commentText}>Ajouter un commentaire</Text></Pressable>}
            </View>;
          })}
        </Card>
      ))}
      {mission.tasks.length === 0 && <Card><Text style={screenStyles.body}>Aucune tâche n’est renseignée pour cette mission.</Text></Card>}
      {mission.status === 'UPCOMING' && <Action title="Démarrer la mission" icon="play-outline" onPress={() => { startMission(mission.id); navigation.replace('Active', { missionId: mission.id }); }} />}
      {editable && <Action title="Retour au suivi de mission" icon="arrow-forward" onPress={() => navigation.popTo('Active', { missionId: mission.id })} />}
      {mission.status === 'REPORT_PENDING' && <Action title="Compléter le rapport" icon="document-text-outline" onPress={() => navigation.navigate('Report', { missionId: mission.id })} />}
      {mission.status === 'COMPLETED' && <Action title="Consulter le bilan" variant="secondary" onPress={() => navigation.navigate('Completed', { missionId: mission.id })} />}
    </EmployeeLayout>
  );
}
const styles = StyleSheet.create({
  task: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 10 }, taskDone: { borderColor: '#B9DFD6', backgroundColor: '#FAFDFC' },
  taskToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }, taskTitle: { flex: 1, fontFamily: fonts.medium, color: colors.ink, fontSize: 15, lineHeight: 22 }, taskTitleDone: { color: colors.success },
  taskTag: { alignSelf: 'flex-start', backgroundColor: colors.background, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, fontFamily: fonts.medium, color: colors.muted, fontSize: 12 }, required: { color: colors.primaryDark, backgroundColor: colors.paleBlue },
  commentButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }, commentText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 14 },
});

