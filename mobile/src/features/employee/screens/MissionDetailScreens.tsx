import { ScreenLayout } from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { AsyncState } from '../../../components/AsyncState';
import { StatusChip } from '../../../components/StatusChip';
import { MessageBanner } from '../../../components/MessageBanner';
import { MissionCard } from '../components/MissionCard';
import { useEmployeeMission, useEmployeeMutation, employeeError } from '../hooks/useEmployeeData';
import { useMissionDirections } from '../hooks/useMissionActions';
import { employeeService } from '../services/employeeService';
import { missionProgress, missionTime } from '../services/employeeFormatters';
import { ToggleRow } from '../../../components/ToggleRow';
import type { EmployeeScreenProps } from '../navigation/types';
export function MissionDetailsScreen({ navigation, route }: EmployeeScreenProps<'MissionDetails'>) {
  const query = useEmployeeMission(route.params.id); const mission = query.data; const directions = useMissionDirections(mission?.address);
  return <ScreenLayout title="Détail de la mission" onBack={() => navigation.goBack()}>
    <AsyncState query={query}>{mission && <>
      <MissionCard mission={mission} actionLabel={mission.status === "IN_PROGRESS" ? "Suivre la mission" : "Consulter la checklist"} onPress={() => mission.status === 'IN_PROGRESS' ? navigation.navigate('MissionActive', { id: mission.id }) : navigation.navigate('MissionChecklist', { id: mission.id })} />
      <Card><AppText variant="heading">Service et tâches</AppText><AppText>{mission.description}</AppText><AppText>{missionProgress(mission)}</AppText><AppText>Équipe : {mission.team.join(', ')}</AppText></Card>
      <Card><AppText variant="heading">Accès et consignes</AppText><AppText>{mission.accessNotes}</AppText><AppText>{mission.instructions}</AppText></Card>
      <MessageBanner message={directions.error} /><Button title="Ouvrir l’itinéraire" variant="secondary" icon="navigate-outline" onPress={() => void directions.open()} />
      <Button title="Contacter l’administration" variant="secondary" onPress={() => navigation.navigate('EmployeeHelp', { missionId: mission.id })} />
      {mission.status === 'PLANNED' && <Button title="Préparer le démarrage" onPress={() => navigation.navigate('BeforePhotos', { id: mission.id })} />}
      {mission.status === 'IN_PROGRESS' && <Button title="Reprendre la mission" onPress={() => navigation.navigate('MissionActive', { id: mission.id })} />}
      {mission.status === 'COMPLETED' && <Card><AppText variant="heading">Rapport de fin</AppText><AppText>{mission.report || 'Aucun commentaire.'}</AppText><AppText>Incident : {mission.incident || 'Aucun signalé.'}</AppText>{mission.completedAt && <AppText>Terminée à {missionTime(mission.completedAt)}</AppText>}</Card>}
      <Button title="Consulter les photos avant" variant="link" onPress={() => navigation.navigate('BeforePhotos', { id: mission.id })} />
      {mission.status !== 'PLANNED' && <Button title="Consulter les photos après" variant="link" onPress={() => navigation.navigate('AfterPhotos', { id: mission.id })} />}
    </>}</AsyncState>
  </ScreenLayout>;
}
export function MissionActiveScreen({ navigation, route }: EmployeeScreenProps<'MissionActive'>) {
  const query = useEmployeeMission(route.params.id); const mission = query.data;
  return <ScreenLayout title="Mission en cours" onBack={() => navigation.goBack()} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
    <AsyncState query={query}>{mission && <>
      <AppText variant="heading">{mission.title}</AppText><AppText>{mission.address}</AppText>
      {mission.status === 'IN_PROGRESS' ? <>
        <StatusChip label="En cours" /><AppText>Débutée à {mission.startedAt ? missionTime(mission.startedAt) : '—'}</AppText><AppText>{missionProgress(mission)}</AppText>
        <Card><AppText variant="label">Consignes</AppText><AppText>{mission.instructions}</AppText></Card>
        <Button title="Mettre à jour la checklist" onPress={() => navigation.navigate('MissionChecklist', { id: mission.id })} />
        <Button title="Photos avant" variant="secondary" onPress={() => navigation.navigate('BeforePhotos', { id: mission.id })} />
        <Button title="Préparer la fin de mission" variant="secondary" onPress={() => navigation.navigate('AfterPhotos', { id: mission.id })} />
        <Button title="Ajouter une note / signaler un incident" variant="link" onPress={() => navigation.navigate('MissionReport', { id: mission.id })} />
      </> : <MessageBanner tone="info" message="Cette mission n’est plus en cours. Consultez son détail actualisé." />}
      <Button title="Contacter l’administration" variant="secondary" onPress={() => navigation.navigate('EmployeeHelp', { missionId: mission.id })} />
    </>}</AsyncState>
  </ScreenLayout>;
}
export function MissionChecklistScreen({ navigation, route }: EmployeeScreenProps<'MissionChecklist'>) {
  const query = useEmployeeMission(route.params.id); const mutation = useEmployeeMutation(employeeService.toggle); const mission = query.data;
  return <ScreenLayout title="Checklist de mission" subtitle="Les tâches sont préparées par l’administration. Les changements sont enregistrés au fur et à mesure dans cette démonstration." onBack={() => navigation.goBack()}>
    <AsyncState query={query}>{mission && <><AppText>{missionProgress(mission)}</AppText>{mission.checklist.map(item => <ToggleRow key={item.id} label={item.label} value={item.isDone} disabled={mutation.isPending || mission.status !== 'IN_PROGRESS'} onChange={isDone => mutation.mutate({ id: mission.id, itemId: item.id, isDone })} />)}{mission.status !== 'IN_PROGRESS' && <MessageBanner tone="info" message="La checklist est consultable ici et modifiable uniquement pendant la mission." />}</>}</AsyncState>
    <MessageBanner message={mutation.error ? employeeError(mutation.error) : undefined} /><Button title="Retour à la mission" variant="secondary" onPress={() => navigation.goBack()} />
  </ScreenLayout>;
}
export function MissionCompletedScreen({ navigation, route }: EmployeeScreenProps<'MissionCompleted'>) {
  const query = useEmployeeMission(route.params.id);
  return <ScreenLayout title="Mission terminée" subtitle="Consultez le résultat de la clôture." onBack={() => navigation.navigate('EmployeeTabs', { screen: 'EmployeeHome' })}>
    <AsyncState query={query}>{query.data && <><StatusChip label={query.data.status === 'COMPLETED' ? 'Terminée' : 'Statut à vérifier'} tone="success" /><AppText>{query.data.title}</AppText>{query.data.completedAt && <AppText>Clôturée à {missionTime(query.data.completedAt)}</AppText>}<MessageBanner tone="info" message="Clôture enregistrée dans la démonstration. Aucune synchronisation serveur n’a été effectuée." /></>}</AsyncState>
    <Button title="Retour aux missions" onPress={() => navigation.navigate('EmployeeTabs', { screen: 'EmployeeHome' })} /><Button title="Voir l’historique" variant="secondary" onPress={() => navigation.navigate('EmployeeTabs', { screen: 'EmployeeHistory' })} />
  </ScreenLayout>;
}
