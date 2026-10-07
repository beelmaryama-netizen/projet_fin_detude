import { AppText } from '../../../components/AppText';
import { colors } from '../../../theme/tokens';

export function PasswordRequirements() {
  return <AppText variant="caption" style={{ color: colors.muted }}>
    Au moins 12 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial.
  </AppText>;
}
