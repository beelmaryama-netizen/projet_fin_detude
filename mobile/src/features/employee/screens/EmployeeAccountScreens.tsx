import { apiMode } from '../../../services/api/config';
import { request } from '../../../services/api/transport';
import type { UserDto } from '../../../services/api/dto';
import { useAdminStore } from '../../employer/store/adminStore';
import { SupportHistory } from '../../../components/SupportHistory';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScreenLayout } from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { ControlledField } from '../../../components/ControlledField';
import { MessageBanner } from '../../../components/MessageBanner';
import { AppearanceSettings } from '../../../components/AppearanceSettings';
import { AsyncState } from '../../../components/AsyncState';
import { ToggleRow } from '../../../components/ToggleRow';
import { useSession } from '../../auth/hooks/useSession';
import { authService } from '../../auth/services/authService';
import { useAuthStore } from '../../../store/authStore';
import { useEmployeeUser, useEmployeeQuery, useEmployeeMutation, employeeError } from '../hooks/useEmployeeData';
import { employeeService } from '../services/employeeService';
import { employeePasswordSchema, employeeProfileSchema, contactSchema } from '../schemas/employeeSchemas';
import type { User } from '../../../types/identity';
import type { EmployeeScreenProps, EmployeeTabProps } from '../navigation/types';
function updateSession(user: User) { const state = useAuthStore.getState(); if (state.session?.user.id === user.id) state.setSession({ ...state.session, user }); }
export function EmployeeProfileScreen({ navigation }: EmployeeTabProps<'EmployeeProfile'>) {
 const user = useEmployeeUser(); const session = useSession();
 const localAvailability = useAdminStore(s => s.employees.find(e => e.email === user.email)?.workingHours);
 const profile = useEmployeeQuery('availability', async () => apiMode ? (await request<UserDto>('GET', '/auth/me')).employeeDetails?.workingHours : localAvailability);
 const availability = apiMode ? profile.data : localAvailability;
 return <ScreenLayout title="Mon profil"><Card><AppText variant="heading">{user.firstName} {user.lastName}</AppText><AppText>{user.email}</AppText><AppText>Employé</AppText></Card>
 <Card><AppText variant="heading">Mes disponibilités</AppText><AppText>{availability ? availability.days.map(day => ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][day]).join(', ') + ' · ' + availability.start + ' – ' + availability.end : 'À confirmer avec l’administration'}</AppText><AppText>Contactez l’administration pour modifier vos horaires.</AppText></Card>
 <Button title="Mes informations" variant="secondary" onPress={() => navigation.navigate('EmployeeProfileEdit')} />
 <Button title="Mon agenda" variant="secondary" onPress={() => navigation.navigate('EmployeeAgenda')} />
 <Button title="Apparence" variant="secondary" onPress={() => navigation.navigate('EmployeeAppearance')} />
 <Button title="Préférences de notifications" variant="secondary" onPress={() => navigation.navigate('EmployeePreferences')} />
 <Button title="Changer mon mot de passe" variant="secondary" onPress={() => navigation.navigate('EmployeePassword')} />
 <Button title="Contacter l’administration" variant="secondary" onPress={() => navigation.navigate('EmployeeHelp')} />
 <MessageBanner message={session.error} /><Button title="Se déconnecter" loading={session.busy} onPress={session.signOut} /></ScreenLayout>;
}
export function EmployeeAppearanceScreen({ navigation }: EmployeeScreenProps<'EmployeeAppearance'>) { return <ScreenLayout title="Apparence" onBack={() => navigation.goBack()}><AppearanceSettings /></ScreenLayout>; }
export function EmployeeProfileEditScreen({ navigation }: EmployeeScreenProps<'EmployeeProfileEdit'>) {
 const user = useEmployeeUser();
 const form = useForm<z.infer<typeof employeeProfileSchema>>({ resolver: zodResolver(employeeProfileSchema), defaultValues: { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' } });
 const save = useEmployeeMutation((account, value: z.infer<typeof employeeProfileSchema>) => authService.updateProfile(account.id, value), updated => { updateSession(updated); navigation.goBack(); });
 return <ScreenLayout showFormLogo title="Mes informations" onBack={() => navigation.goBack()}><ControlledField control={form.control} name="firstName" label="Prénom" autoComplete="given-name" /><ControlledField control={form.control} name="lastName" label="Nom" autoComplete="family-name" /><ControlledField control={form.control} name="phone" label="Téléphone" keyboardType="phone-pad" /><MessageBanner message={save.error ? employeeError(save.error) : undefined} /><Button title="Enregistrer" loading={save.isPending} onPress={form.handleSubmit(value => save.mutate(value))} /></ScreenLayout>;
}
export function EmployeePasswordScreen({ navigation }: EmployeeScreenProps<'EmployeePassword'>) {
 const user = useEmployeeUser(); const session = useSession();
 const form = useForm<z.infer<typeof employeePasswordSchema>>({ resolver: zodResolver(employeePasswordSchema), defaultValues: { currentPassword: '', password: '', confirmPassword: '' } });
 const save = useEmployeeMutation(async (account, value: z.infer<typeof employeePasswordSchema>) => { await authService.changePassword(account.id, value.currentPassword, value.password); return authService.getProfile(account.id); }, updated => { updateSession(updated); if (!user.mustChangePassword) navigation.goBack(); });
 return <ScreenLayout showFormLogo bottomSafeArea title={user.mustChangePassword ? 'Bienvenue dans votre espace' : 'Mot de passe'} subtitle={user.mustChangePassword ? 'Remplacez votre mot de passe temporaire avant de continuer.' : 'Choisissez un mot de passe personnel.'} onBack={user.mustChangePassword ? undefined : () => navigation.goBack()}>
 <ControlledField control={form.control} name="currentPassword" label="Mot de passe actuel" secureTextEntry autoComplete="current-password" />
 <ControlledField control={form.control} name="password" label="Nouveau mot de passe" secureTextEntry autoComplete="new-password" />
 <AppText>Au moins 12 caractères, avec majuscule, minuscule, chiffre et symbole.</AppText>
 <ControlledField control={form.control} name="confirmPassword" label="Confirmer le nouveau mot de passe" secureTextEntry />
 <MessageBanner message={save.error ? employeeError(save.error) : session.error} /><Button title="Enregistrer mon mot de passe" loading={save.isPending} onPress={form.handleSubmit(value => save.mutate(value))} />
 {user.mustChangePassword && <Button title="Se déconnecter" variant="secondary" disabled={save.isPending} loading={session.busy} onPress={session.signOut} />}</ScreenLayout>;
}
export function EmployeeNotificationsScreen({ navigation }: EmployeeScreenProps<'EmployeeNotifications'>) {
 const query = useEmployeeQuery('notifications', employeeService.notifications);
 const read = useEmployeeMutation(employeeService.readNotification);
 return <ScreenLayout title="Notifications" onBack={() => navigation.goBack()}><AsyncState query={query}>{query.data?.length === 0 && <AppText>Aucune notification.</AppText>}{query.data?.map(item => <Card key={item.id}><AppText variant="heading">{item.title}</AppText><AppText>{item.message}</AppText><AppText>{item.read ? 'Lue' : 'Non lue'}</AppText><Button title="Voir la mission" onPress={() => { read.mutate(item.id); navigation.navigate('MissionDetails', { id: item.missionId }); }} /></Card>)}</AsyncState><MessageBanner message={read.error ? employeeError(read.error) : undefined} /></ScreenLayout>;
}
export function EmployeePreferencesScreen({ navigation }: EmployeeScreenProps<'EmployeePreferences'>) {
 const query = useEmployeeQuery('preferences', employeeService.preferences); const save = useEmployeeMutation(employeeService.savePreferences);
 return <ScreenLayout title="Notifications" subtitle="Choisissez les notifications à recevoir." onBack={() => navigation.goBack()}><AsyncState query={query}>{query.data && <Card><ToggleRow label="Nouvelles affectations" value={query.data.assignments} disabled={save.isPending} onChange={assignments => { if (query.data) save.mutate({ ...query.data, assignments }); }} /><ToggleRow label="Changements de planning" value={query.data.changes} disabled={save.isPending} onChange={changes => { if (query.data) save.mutate({ ...query.data, changes }); }} /></Card>}</AsyncState><MessageBanner message={save.error ? employeeError(save.error) : undefined} /></ScreenLayout>;
}
export function EmployeeHelpScreen({ navigation, route }: EmployeeScreenProps<'EmployeeHelp'>) {
 const [reference, setReference] = useState<string>();
 const form = useForm<z.infer<typeof contactSchema>>({ resolver: zodResolver(contactSchema), defaultValues: { message: '', missionId: route.params?.missionId } });
 const send = useEmployeeMutation(employeeService.contact, result => { setReference(result); form.reset(); });
 return <ScreenLayout showFormLogo title="Contacter l’administration" subtitle="Décrivez votre question ou un problème lié à votre intervention." onBack={() => navigation.goBack()}>{!apiMode && <AppText>Mode démonstration : aucun message externe ne sera envoyé.</AppText>}{reference && <Card><AppText>Référence : {reference}</AppText></Card>}<ControlledField control={form.control} name="message" label="Votre message" multiline maxLength={2000} /><MessageBanner message={send.error ? employeeError(send.error) : undefined} /><Button title={apiMode ? "Envoyer le message" : "Simuler l’envoi"} loading={send.isPending} onPress={form.handleSubmit(value => send.mutate(value))} /><SupportHistory /></ScreenLayout>;
}
