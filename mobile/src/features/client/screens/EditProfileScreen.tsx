import { ClientLayout } from '../components/ClientLayout';
import { ControlledField } from '../../../components/ControlledField';
import { Button } from '../../../components/Button';
import { MessageBanner } from '../../../components/MessageBanner';
import { AppText } from '../../../components/AppText';
import { AsyncState } from '../../../components/AsyncState';
import { useClientQuery, errorMessage } from '../hooks/useClientData';
import { useProfileForm } from '../hooks/useProfileForm';
import { profileService } from '../services/profileService';
import type { User } from '../../../types/identity';
import type { ClientScreenProps } from '../../../navigation/types';
function ProfileForm({ user }: { user: User }) {
  const state = useProfileForm(user);
  return <><ControlledField control={state.form.control} name="firstName" label="Prénom" autoComplete="given-name" maxLength={80} /><ControlledField control={state.form.control} name="lastName" label="Nom" autoComplete="family-name" maxLength={80} /><ControlledField control={state.form.control} name="phone" label="Téléphone" keyboardType="phone-pad" autoComplete="tel" maxLength={30} /><AppText>Courriel : {user.email}</AppText><AppText variant="caption">Le changement de courriel nécessitera une vérification via le futur service de compte.</AppText><MessageBanner message={state.save.error ? errorMessage(state.save.error) : undefined} />{state.save.isSuccess && !state.form.formState.isDirty && <MessageBanner tone="success" message="Vos informations ont été enregistrées." />}<Button title="Enregistrer" loading={state.save.isPending} onPress={() => void state.submit()} /></>;
}
export function EditProfileScreen({ navigation }: ClientScreenProps<'EditProfile'>) {
  const query = useClientQuery('profile', profileService.get);
  return <ClientLayout title="Informations personnelles" subtitle="Gardez vos coordonnées à jour." onBack={() => navigation.goBack()}><AsyncState query={query}>{query.data && <ProfileForm user={query.data} />}</AsyncState></ClientLayout>;
}
