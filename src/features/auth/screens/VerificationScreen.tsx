import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AuthScreenProps } from '../../../navigation/types';
import { AuthLayout } from '../components/AuthLayout';
import { ControlledField } from '../../../components/ControlledField';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { Button } from '../../../components/Button';
import { AppText } from '../../../components/AppText';
import { MessageBanner } from '../../../components/MessageBanner';
import { useVerification } from '../hooks/useVerification';
import { colors, fonts, spacing } from '../../../theme/tokens';

export function VerificationScreen({ route }: AuthScreenProps<'Verification'>) {
  const auth = useVerification(route.params.challenge);
  return <AuthLayout title={auth.resetToken ? 'Nouveau mot de passe' : auth.copy.title}
    subtitle={auth.resetToken ? 'Choisissez un nouveau mot de passe pour votre compte.' : auth.copy.subtitle}
    step={auth.challenge.purpose === 'registration' ? 'INSCRIPTION CLIENT · 2 SUR 2' : undefined}
    onBack={auth.busy ? undefined : auth.restart}>
    <Ionicons name={auth.resetToken ? 'lock-closed-outline' : 'shield-checkmark-outline'} size={40} color={colors.primary} accessible={false} />
    {auth.resetToken ? <View style={styles.fields}>
      <ControlledField control={auth.passwordForm.control} name="password" label="Nouveau mot de passe" password autoComplete="new-password" textContentType="newPassword" autoCapitalize="none" autoCorrect={false} returnKeyType="next" onSubmitEditing={() => auth.passwordForm.setFocus('confirmPassword')} editable={!auth.busy} />
      <PasswordRequirements />
      <ControlledField control={auth.passwordForm.control} name="confirmPassword" label="Confirmer le mot de passe" password autoComplete="new-password" textContentType="newPassword" autoCapitalize="none" autoCorrect={false} returnKeyType="done" onSubmitEditing={() => { if (!auth.busy) void auth.resetPassword(); }} editable={!auth.busy} />
      <MessageBanner message={auth.error} />
      <Button title="Mettre à jour le mot de passe" onPress={() => void auth.resetPassword()} loading={auth.resetPending} />
    </View> : <View style={styles.fields}>
      <View><AppText variant="label" style={styles.muted}>Courriel de vérification</AppText><AppText style={styles.email}>{auth.challenge.email}</AppText></View>
      <ControlledField control={auth.codeForm.control} name="code" label="Code à 6 chiffres" placeholder="000000" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} autoCapitalize="none" autoCorrect={false} style={styles.code} editable={!auth.busy} returnKeyType="done" onSubmitEditing={() => { if (!auth.busy && !auth.expired) void auth.verifyCode(); }} />
      <AppText variant="caption" style={styles.muted}>Le code est valable 5 minutes. Vous pouvez le coller directement dans le champ.</AppText>
      <MessageBanner message={auth.error ?? (auth.expired ? 'Ce code a expiré. Demandez un nouveau code.' : undefined)} />
      <MessageBanner message={auth.notice} tone="success" />
      <Button title="Vérifier le code" onPress={() => void auth.verifyCode()} loading={auth.verifyPending} disabled={auth.busy || auth.expired} />
      <Button title={auth.secondsUntilResend > 0 ? `Renvoyer le code dans ${auth.secondsUntilResend} s` : 'Renvoyer le code'} variant="link" onPress={auth.resendCode} loading={auth.resendPending} disabled={auth.busy || auth.secondsUntilResend > 0} />
    </View>}
    <Button title="Retour à la connexion" variant="link" onPress={auth.restart} disabled={auth.busy} />
  </AuthLayout>;
}
const styles = StyleSheet.create({
  fields: { gap: spacing.md }, muted: { color: colors.muted }, email: { fontFamily: fonts.medium },
  code: { fontSize: 28, letterSpacing: 8, textAlign: 'center', fontFamily: fonts.bold },
});
