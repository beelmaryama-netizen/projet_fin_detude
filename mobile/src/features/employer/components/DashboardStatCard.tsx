import { useEmployerTheme, type EmployerTheme } from '../theme';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';

const createPalettes = (theme: EmployerTheme) => ({
  blue: {
    card: [theme.surface, theme.surface] as const,
    circle: [theme.paleBlue, theme.paleBlue] as const,
    bars: [theme.blue, theme.blue] as const,
    border: theme.border,
  },
  teal: {
    card: [theme.surface, theme.surface] as const,
    circle: [theme.paleBlue, theme.paleBlue] as const,
    bars: [theme.teal, theme.teal] as const,
    border: theme.border,
  },
  muted: {
    card: [theme.surface, theme.surface] as const,
    circle: [theme.paleBlue, theme.paleBlue] as const,
    bars: [theme.blue, theme.blue] as const,
    border: theme.border,
  },
} as const);

type Props = {
  label: string;
  value: number;
  icon: ComponentProps<typeof Ionicons>['name'];
  tone?: 'blue' | 'teal' | 'muted';
  trend: number | null;
  bars: readonly number[];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function DashboardStatCard({ label, value, icon, tone = 'blue', trend, bars, onPress, style, compact = false }: Props) {
  const theme = useEmployerTheme();
  const palettes = createPalettes(theme);
  const styles = createStyles(theme);

  const palette = palettes[tone];
  const trendText = trend === null ? '—' : `${trend > 0 ? '+' : ''}${trend}%`;
  const comparison = trend === null ? 'Comparaison indisponible' : `${trendText} par rapport à la période précédente`;
  const tallestBar = Math.max(1, ...bars);

  return <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${label} : ${value}. ${comparison}.`}
    accessibilityHint="Afficher les détails de cet indicateur"
    style={({ pressed }) => [styles.card, { borderColor: palette.border }, style, pressed && styles.pressed]}
  >
    <LinearGradient colors={palette.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.content}>
      <View style={[styles.top, compact && styles.compactTop]}>
        <LinearGradient colors={palette.circle} style={[styles.icon, compact && styles.compactIcon]}>
          <Ionicons name={icon} size={27} color={theme.text} accessible={false} />
        </LinearGradient>
        <View style={styles.copy}>
          <AppText style={styles.value}>{value}</AppText>
          {!compact && <AppText style={styles.label}>{label}</AppText>}
        </View>
        <Ionicons name="chevron-forward" size={17} color={theme.text} style={styles.chevron} accessible={false} />
      </View>
      {compact && <AppText style={styles.label}>{label}</AppText>}

      <View style={styles.comparison}>
        <View style={[styles.trend, trend !== null && trend > 0 && styles.positiveTrend]}>
          <Ionicons
            name={trend === null || trend === 0 ? 'remove' : trend > 0 ? 'arrow-up' : 'arrow-down'}
            size={15}
            color={trend !== null && trend > 0 ? theme.success : theme.muted}
            accessible={false}
          />
          <AppText style={styles.trendText}>{trendText}</AppText>
        </View>
        <AppText style={styles.caption}>vs période précédente</AppText>
      </View>

      <View style={styles.chart} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {bars.map((bar, index) => <LinearGradient
          key={index}
          colors={palette.bars}
          style={[styles.bar, { height: Math.max(5, Math.max(0, bar) / tallestBar * 32) }]}
        />)}
      </View>
    </LinearGradient>
  </Pressable>;
}

const createStyles = (theme: EmployerTheme) => (StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '46%', minWidth: 0, minHeight: 178, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  pressed: { opacity: 0.8 },
  content: { flex: 1, padding: 16, gap: 8 },
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', columnGap: 10, rowGap: 4 },
  icon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  compactTop: { columnGap: 8 },
  compactIcon: { width: 40, height: 40 },
  copy: { flexGrow: 1, flexBasis: 52, minWidth: 0, paddingRight: 8 },
  value: { fontFamily: fonts.titleBold, color: theme.text, fontSize: 34, lineHeight: 39 },
  label: { color: theme.text, fontSize: 13, lineHeight: 17 },
  chevron: { position: 'absolute', right: -3, top: 7 },
  comparison: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 4, marginTop: 'auto' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.paleBlue, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 2 },
  positiveTrend: { backgroundColor: theme.successSurface },
  trendText: { fontFamily: fonts.bold, color: theme.text, fontSize: 11, lineHeight: 16 },
  caption: { flexShrink: 1, color: theme.muted, fontSize: 12, lineHeight: 18 },
  chart: { height: 34, flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingHorizontal: 1 },
  bar: { flexGrow: 1, flexBasis: 0, maxWidth: 16, borderRadius: 2 },
}));
