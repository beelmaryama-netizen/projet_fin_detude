import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { employerTheme } from '../theme';

type Props = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function EmployerQuickAction({ title, icon, onPress, style }: Props) {
  return <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title.replace(/\n/g, ' ')}
    style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
  >
    <LinearGradient colors={['#173A70', '#0D2348']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.content}>
      <LinearGradient colors={['#2854AB', '#17396E']} style={styles.icon}>
        <Ionicons name={icon} size={25} color={employerTheme.blue} accessible={false} />
      </LinearGradient>
      <AppText style={styles.title}>{title}</AppText>
    </LinearGradient>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '21%', minWidth: 0, minHeight: 108, borderWidth: 1, borderColor: employerTheme.border, borderRadius: 22, overflow: 'hidden' },
  pressed: { opacity: 0.8 },
  content: { flex: 1, paddingHorizontal: 5, paddingVertical: 12, alignItems: 'center', gap: 8 },
  icon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#3A65AD', alignItems: 'center', justifyContent: 'center' },
  title: { alignSelf: 'stretch', color: employerTheme.text, textAlign: 'center', fontSize: 12, lineHeight: 16 },
});
