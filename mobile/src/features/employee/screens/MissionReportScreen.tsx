import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScreenLayout } from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { ControlledField } from '../../../components/ControlledField';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { AsyncState } from '../../../components/AsyncState';
import { completionSchema } from '../schemas/employeeSchemas';
import { useEmployeeMission, useEmployeeMutation, employeeError } from '../hooks/useEmployeeData';
import { useEmployeeDraftStore, emptyEmployeeDraft } from '../store/employeeDraftStore';
import { employeeService } from '../services/employeeService';
import type { CompletionReport } from '../types/employee';
import type { EmployeeScreenProps } from '../navigation/types';
export function MissionReportScreen({ route, navigation }: EmployeeScreenProps<'MissionReport'>) {
 const { id } = route.params; const query = useEmployeeMission(id); const [report, setReport] = useState<CompletionReport>();
 const form = useForm<CompletionReport>({ resolver: zodResolver(completionSchema), defaultValues: useEmployeeDraftStore.getState().drafts[id] ?? emptyEmployeeDraft() });
 useEffect(() => { const subscription = form.watch(value => useEmployeeDraftStore.getState().update(id, { note: value.note ?? '', incident: value.incident ?? '' })); return () => subscription.unsubscribe(); }, [form, id]);
 const complete = useEmployeeMutation(employeeService.complete, () => { useEmployeeDraftStore.getState().clear(id); navigation.reset({ index: 1, routes: [{ name: 'EmployeeTabs' }, { name: 'MissionCompleted', params: { id } }] }); });
 return <ScreenLayout title="Rapport de fin" subtitle="L’heure de fin sera enregistrée à la confirmation." onBack={() => navigation.goBack()}><AsyncState query={query}>{query.data && <>
  <AppText>{query.data.checklist.filter(item => item.isDone).length} / {query.data.checklist.length} tâches cochées</AppText>
  {query.data.status === 'IN_PROGRESS' ? <>
   {query.data.checklist.some(item => !item.isDone) && <AppText>Des tâches restent non cochées. Précisez la raison dans votre rapport si nécessaire.</AppText>}
   <ControlledField control={form.control} name="note" label="Commentaire de fin" multiline maxLength={1500} />
   <ControlledField control={form.control} name="incident" label="Incident ou difficulté (facultatif)" multiline maxLength={500} />
   <Button title="Vérifier les photos après" variant="secondary" onPress={() => navigation.navigate('AfterPhotos', { id })} />
   <Button title="Terminer la mission" onPress={form.handleSubmit(setReport)} />
  </> : <AppText>Cette mission n’est plus en cours.</AppText>}
 </>}</AsyncState><ConfirmModal visible={!!report} title="Confirmer la fin ?" message="La mission deviendra consultable uniquement. Vérifiez votre checklist, vos photos et votre rapport." confirmLabel="Confirmer la fin" busy={complete.isPending} error={complete.error ? employeeError(complete.error) : undefined} onCancel={() => { if (!complete.isPending) setReport(undefined); }} onConfirm={() => { if (report) complete.mutate({ id, report }); }} /></ScreenLayout>;
}
