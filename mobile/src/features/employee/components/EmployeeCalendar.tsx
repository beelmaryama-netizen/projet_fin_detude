import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { spacing } from '../../../theme/tokens';
export function EmployeeCalendar({ selected, onSelect, daysWithMissions }: { selected: string; onSelect: (date: string) => void; daysWithMissions: Set<string> }) {
  const { colors } = useAppTheme(); const date = new Date(selected + 'T12:00:00Z');
  const year = date.getUTCFullYear(); const month = date.getUTCMonth();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const key = (day: number) => year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  const changeMonth = (delta: number) => onSelect(new Date(Date.UTC(year, month + delta, 1, 12)).toISOString().slice(0, 10));
  return <View style={{ gap: spacing.sm }}>
    <AppText variant="heading">{new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)}</AppText>
    <View style={{ flexDirection: 'row', gap: spacing.sm }}><Button title="Mois précédent" variant="secondary" style={{ flex: 1 }} onPress={() => changeMonth(-1)} /><Button title="Mois suivant" variant="secondary" style={{ flex: 1 }} onPress={() => changeMonth(1)} /></View>
    <ScrollView horizontal contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ width: 308, flexDirection: 'row', flexWrap: 'wrap' }}>
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day, index) => <AppText key={'day-' + index} variant="caption" style={{ width: 44, textAlign: 'center' }}>{day}</AppText>)}
        {Array.from({ length: offset }, (_, index) => <View key={'blank-' + index} style={{ width: 44, height: 44 }} />)}
        {Array.from({ length: count }, (_, index) => index + 1).map(day => <Pressable key={day} accessibilityRole="button" accessibilityState={{ selected: selected === key(day) }} accessibilityLabel={key(day) + (daysWithMissions.has(key(day)) ? ', mission prévue' : ', aucune mission')} onPress={() => onSelect(key(day))} style={{ width: 44, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: selected === key(day) ? colors.primaryFill : colors.surface }}>
          <AppText style={{ color: selected === key(day) ? colors.white : colors.ink }}>{day}</AppText><AppText variant="caption" style={{ color: selected === key(day) ? colors.white : colors.primary }}>{daysWithMissions.has(key(day)) ? '•' : ' '}</AppText>
        </Pressable>)}
      </View>
    </ScrollView>
    <AppText variant="caption">Un point indique une mission assignée. Horaires de Montréal.</AppText>
  </View>;
}
