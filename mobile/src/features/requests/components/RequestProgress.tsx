import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../../components/AppText';
import { spacing } from '../../../theme/tokens';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { AppPalette } from '../../../theme/palette';

const steps = ['Type de service', 'Détails du logement', 'Date et préférences', 'Confirmation'];

export function RequestProgress({ activeStep }: { activeStep: number }) {
  const { width, fontScale } = useWindowDimensions();
  const wrapped = width < 380 || fontScale > 1.2;
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return <View accessibilityLabel={'Étape ' + activeStep + ' sur 4 : ' + steps[activeStep - 1]} style={styles.row}>
    {steps.map((step, index) => {
      const completed = index + 1 < activeStep;
      const active = index + 1 === activeStep;
      return <View key={step} style={[styles.step, wrapped && styles.wrapped]}>
        <View style={[styles.circle, (completed || active) && styles.active]}>
          <AppText variant="label" style={{ color: completed || active ? palette.white : palette.textSecondary }}>{completed ? '✓' : index + 1}</AppText>
        </View>
        <AppText variant="caption" style={[styles.label, active && styles.current]}>{step}</AppText>
      </View>;
    })}
  </View>;
}

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderColor: palette.border },
    step: { flex: 1, alignItems: 'center', gap: spacing.sm }, wrapped: { flexBasis: '45%' },
    circle: { width: 32, minHeight: 32, borderRadius: 16, backgroundColor: palette.iconSoft, justifyContent: 'center', alignItems: 'center' },
    active: { backgroundColor: palette.primary }, label: { textAlign: 'center', color: palette.textSecondary }, current: { color: palette.primary },
  });
}
