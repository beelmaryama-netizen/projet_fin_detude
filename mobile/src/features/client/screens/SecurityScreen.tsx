import { ClientLayout } from '../components/ClientLayout';
import { Button } from '../../../components/Button';
import { AppText } from '../../../components/AppText';
import { ControlledField } from '../../../components/ControlledField';
import { Card } from '../../../components/Card';
import { MessageBanner } from '../../../components/MessageBanner';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { AsyncState } from '../../../components/AsyncState';
import { useSecurity } from '../hooks/useSecurity';
import { errorMessage } from '../hooks/useClientData';
import { useSession } from '../../auth/hooks/useSession';
import type { ClientScreenProps } from '../../../navigation/types';
export function SecurityScreen({ navigation }: ClientScreenProps<'Security'>) {
  const state = useSecurity(); const session = useSession();
  return <ClientLayout title="Sécurité" subtitle="Gérez l’accès à votre compte. Ces actions sont simulées." onBack={() => navigation.goBack()}>
    <AsyncState query={state.query}>
      {state.query.data?.hasPassword ? <Card><AppText variant="heading">Changer le mot de passe</AppText><ControlledField control={state.passwordForm.control} name="currentPassword" label="Mot de passe actuel" password autoComplete="current-password" /><ControlledField control={state.passwordForm.control} name="password" label="Nouveau mot de passe" password autoComplete="new-password" hint="12 caractères minimum, une majuscule, une minuscule, un chiffre et un symbole." /><ControlledField control={state.passwordForm.control} name="confirmPassword" label="Confirmer le nouveau mot de passe" password autoComplete="new-password" /><MessageBanner message={state.password.error ? errorMessage(state.password.error) : undefined} />{state.password.isSuccess && <MessageBanner tone="success" message="Mot de passe modifié pour ce compte de démonstration." />}<Button title="Modifier le mot de passe" loading={state.password.isPending} onPress={() => void state.changePassword()} /></Card> : <MessageBanner tone="info" message="Ce compte utilise une connexion Google ou Apple. Le mot de passe se gère auprès de ce fournisseur." />}
      <Card><AppText variant="heading">Double authentification</AppText><AppText>{state.query.data?.mfaEnabled ? 'Activée' : 'Désactivée'}</AppText><Button title={state.query.data?.mfaEnabled ? 'Désactiver la double authentification' : 'Activer la double authentification'} variant="secondary" onPress={state.openMfa} />{state.mfa.isSuccess && <MessageBanner tone="success" message="La préférence de sécurité a été mise à jour." />}</Card>
    </AsyncState>
    <MessageBanner message={session.error} /><Button title="Se déconnecter de cet appareil" variant="secondary" loading={session.busy} onPress={session.signOut} />
    <ConfirmModal visible={state.mfaDialog} title="Confirmer le changement de sécurité" message="Simulation uniquement : entrez le code 123456. Aucun courriel n’est envoyé." confirmLabel="Confirmer" busy={state.mfa.isPending} error={state.mfa.error ? errorMessage(state.mfa.error) : undefined} onConfirm={() => void state.changeMfa()} onCancel={state.closeMfa}>
      {state.query.data?.hasPassword && <ControlledField control={state.mfaForm.control} name="currentPassword" label="Mot de passe actuel" password />}
      <ControlledField control={state.mfaForm.control} name="code" label="Code de vérification" keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" />
    </ConfirmModal>
  </ClientLayout>;
}
