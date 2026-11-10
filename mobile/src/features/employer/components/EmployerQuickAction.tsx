import { useEmployerTheme, type EmployerTheme } from '../theme';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';

type Props = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function EmployerQuickAction({ title, icon, onPress, style }: Props) {
  const theme = useEmployerTheme();
  const styles = createStyles(theme);

  return <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title.replace(/\n/g, ' ')}
    style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
  >
    <LinearGradient colors={[theme.surface, theme.surface]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.content}>
      <LinearGradient colors={[theme.paleBlue, theme.paleBlue]} style={styles.icon}>
        <Ionicons name={icon} size={25} color={theme.blue} accessible={false} />
      </LinearGradient>
      <AppText style={styles.title}>{title}</AppText>
    </LinearGradient>
  </Pressable>;
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '45%', minWidth: 0, minHeight: 108, borderWidth: 1, borderColor: theme.border, borderRadius: 16, overflow: 'hidden' },
  pressed: { opacity: 0.8 },
  content: { flex: 1, paddingHorizontal: 5, paddingVertical: 12, alignItems: 'center', gap: 8 },
  icon: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  title: { alignSelf: 'stretch', color: theme.text, textAlign: 'center', fontSize: 12, lineHeight: 16 },
}));
