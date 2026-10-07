import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../components/AppText';
import { fonts } from '../../../theme/tokens';
import { employerTheme } from '../theme';

const palettes = {
  blue: {
    card: ['#1B448F', '#10264F'] as const,
    circle: ['#2F6BDD', '#20439A'] as const,
    bars: ['#71C8FF', '#357EF0'] as const,
    border: '#3B70C6',
  },
  teal: {
    card: ['#20526A', '#102E49'] as const,
    circle: ['#3B8DA8', '#225D7C'] as const,
    bars: ['#79DFED', '#3199B8'] as const,
    border: '#4C9BB2',
  },
  muted: {
    card: ['#193761', '#102343'] as const,
    circle: ['#335C97', '#23416F'] as const,
    bars: ['#7298CB', '#365A8F'] as const,
    border: '#355B91',
  },
} as const;

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
          <Ionicons name={icon} size={27} color={employerTheme.text} accessible={false} />
        </LinearGradient>
        <View style={styles.copy}>
          <AppText style={styles.value}>{value}</AppText>
          {!compact && <AppText style={styles.label}>{label}</AppText>}
        </View>
        <Ionicons name="chevron-forward" size={17} color={employerTheme.text} style={styles.chevron} accessible={false} />
      </View>
      {compact && <AppText style={styles.label}>{label}</AppText>}

      <View style={styles.comparison}>
        <View style={[styles.trend, trend !== null && trend > 0 && styles.positiveTrend]}>
          <Ionicons
            name={trend === null || trend === 0 ? 'remove' : trend > 0 ? 'arrow-up' : 'arrow-down'}
            size={15}
            color={trend !== null && trend > 0 ? employerTheme.success : employerTheme.muted}
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

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '46%', minWidth: 0, minHeight: 178, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  pressed: { opacity: 0.8 },
  content: { flex: 1, padding: 10, gap: 6 },
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', columnGap: 10, rowGap: 4 },
  icon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#FFFFFF20', alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  compactTop: { columnGap: 8 },
  compactIcon: { width: 40, height: 40 },
  copy: { flexGrow: 1, flexBasis: 52, minWidth: 0, paddingRight: 8 },
  value: { fontFamily: fonts.titleBold, color: employerTheme.text, fontSize: 34, lineHeight: 39 },
  label: { color: employerTheme.text, fontSize: 13, lineHeight: 17 },
  chevron: { position: 'absolute', right: -3, top: 7 },
  comparison: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 4, marginTop: 'auto' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#7799D133', borderRadius: 18, paddingHorizontal: 8, paddingVertical: 2 },
  positiveTrend: { backgroundColor: '#36AF7C55' },
  trendText: { fontFamily: fonts.bold, color: employerTheme.text, fontSize: 11, lineHeight: 16 },
  caption: { flexShrink: 1, color: employerTheme.muted, fontSize: 9, lineHeight: 12 },
  chart: { height: 34, flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingHorizontal: 1 },
  bar: { flexGrow: 1, flexBasis: 0, maxWidth: 16, borderRadius: 2 },
});
