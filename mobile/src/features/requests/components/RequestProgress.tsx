import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../../components/AppText';
import { colors, spacing } from '../../../theme/tokens';

const steps = ['Type de service', 'Détails du logement', 'Date et préférences', 'Confirmation'];
export function RequestProgress({ activeStep }: { activeStep: number }) {
  const { width, fontScale } = useWindowDimensions();
  const wrapped = width < 380 || fontScale > 1.2;
  return <View accessibilityLabel={`Étape ${activeStep} sur 4 : ${steps[activeStep - 1]}`} style={styles.row}>
    {steps.map((step, index) => <View key={step} style={[styles.step, wrapped && styles.wrapped]}>
      <View style={[styles.circle, index + 1 <= activeStep && styles.active]}>
        <AppText variant="label" style={{ color: index + 1 <= activeStep ? colors.white : colors.muted }}>{index + 1 < activeStep ? '✓' : index + 1}</AppText>
      </View>
      <AppText variant="caption" style={[styles.label, index + 1 === activeStep && styles.current]}>{step}</AppText>
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
  step: { flex: 1, alignItems: 'center', gap: spacing.sm }, wrapped: { flexBasis: '45%' },
  circle: { width: 30, minHeight: 30, borderRadius: 15, backgroundColor: colors.disabled, justifyContent: 'center', alignItems: 'center' },
  active: { backgroundColor: colors.primary }, label: { textAlign: 'center', color: colors.muted }, current: { color: colors.primary },
});
