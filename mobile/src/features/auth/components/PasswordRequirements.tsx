import { AppText } from '../../../components/AppText';
import { useAppTheme } from '../../../theme/ThemeProvider';

export function PasswordRequirements() {
  const { colors } = useAppTheme();

  return <AppText variant="caption" style={{ color: colors.muted }}>
    Au moins 12 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial.
  </AppText>;
}
