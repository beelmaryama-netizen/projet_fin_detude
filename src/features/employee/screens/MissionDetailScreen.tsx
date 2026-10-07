import React from 'react';
import { Text, View } from 'react-native';
import { Action, Card, EmployeeLayout, InfoRow, Progress, SectionTitle } from '../components/EmployeeUI';
import { useEmployeeStore } from '../hooks/useEmployeeStore';
import type { EmployeeScreenProps } from '../types/navigation';
import { Bullet, formatDate, formatTime, MissionIdentity, MissionUnavailable, plannedDuration, screenStyles } from './screenHelpers';

export function MissionDetailScreen({ navigation, route }: EmployeeScreenProps<'Detail'>) {
  const mission = useEmployeeStore((state) => state.missions.find((item) => item.id === route.params.missionId));
  const startMission = useEmployeeStore((state) => state.startMission);
  if (!mission) return <MissionUnavailable onBack={() => navigation.navigate('Missions')} />;
  const zones = [...new Set(mission.tasks.map((task) => task.zone))];
  return (
    <EmployeeLayout title="Détail de la mission" subtitle="Les informations utiles avant votre intervention." onBack={() => navigation.goBack()}>
      <Card><MissionIdentity mission={mission} /><InfoRow icon="location-outline" label="Adresse" value={mission.address} /><InfoRow icon="calendar-outline" label="Date" value={formatDate(mission.scheduledStart)} /><InfoRow icon="time-outline" label="Horaire et durée prévue" value={`${formatTime(mission.scheduledStart)} · ${plannedDuration(mission.plannedMinutes)}`} /></Card>
      <Card><SectionTitle eyebrow="BIEN PRÉPARER VOTRE INTERVENTION">Consignes particulières</SectionTitle>{mission.instructions.length ? mission.instructions.map((instruction, index) => <Bullet key={index}>{instruction}</Bullet>) : <Text style={screenStyles.body}>Aucune consigne particulière.</Text>}</Card>
      <Card><SectionTitle>Matériel nécessaire</SectionTitle>{mission.equipment.length ? mission.equipment.map((item, index) => <Bullet key={index} checked>{item}</Bullet>) : <Text style={screenStyles.body}>Aucun matériel particulier indiqué.</Text>}</Card>
      <Card>
        <SectionTitle>Votre checklist</SectionTitle>
        <Text style={screenStyles.body}>{mission.tasks.length} tâches réparties dans {zones.length} {zones.length > 1 ? 'zones' : 'zone'}, dont {mission.tasks.filter((task) => task.required).length} obligatoires.</Text>
        <View style={screenStyles.stack}>{zones.map((zone) => <View key={zone} style={screenStyles.spread}><Text style={screenStyles.label}>{zone}</Text><Text style={screenStyles.caption}>{mission.tasks.filter((task) => task.zone === zone).length} tâches</Text></View>)}</View>
        <Progress mission={mission} />
        <Action title="Voir la checklist" variant="secondary" icon="checkbox-outline" onPress={() => navigation.navigate('Checklist', { missionId: mission.id })} />
      </Card>
      {mission.status === 'UPCOMING' && <Action title="Démarrer la mission" icon="play-outline" onPress={() => { startMission(mission.id); navigation.navigate('Active', { missionId: mission.id }); }} />}
      {mission.status === 'IN_PROGRESS' && <Action title="Reprendre la mission" icon="play-outline" onPress={() => navigation.navigate('Active', { missionId: mission.id })} />}
      {mission.status === 'REPORT_PENDING' && <Action title="Compléter le rapport" icon="document-text-outline" onPress={() => navigation.navigate('Report', { missionId: mission.id })} />}
      {mission.status === 'COMPLETED' && <Action title="Consulter le bilan" icon="checkmark-circle-outline" onPress={() => navigation.navigate('Completed', { missionId: mission.id })} />}
    </EmployeeLayout>
  );
}
