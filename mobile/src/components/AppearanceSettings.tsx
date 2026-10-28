import { View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { Card } from './Card';
import { SelectionCard } from './SelectionCard';
import { MessageBanner } from './MessageBanner';
export function AppearanceSettings() {
  const theme = useAppTheme();
  return <Card>
    <AppText variant="heading">Apparence</AppText>
    <View accessibilityRole="radiogroup" accessibilityLabel="Apparence de l’application" style={{ gap: spacing.sm }}>
      {([{ value: 'system', title: 'Selon l’appareil', icon: 'phone-portrait-outline' }, { value: 'light', title: 'Mode clair', icon: 'sunny-outline' }, { value: 'dark', title: 'Mode sombre', icon: 'moon-outline' }] as const).map(option =>
        <SelectionCard key={option.value} title={option.title} icon={option.icon} selected={theme.preference === option.value} onPress={() => theme.setPreference(option.value)} />)}
    </View>
    <MessageBanner message={theme.error} />
  </Card>;
}
