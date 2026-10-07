import { forwardRef, useId, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './AppText';
import { colors, fonts, radii, spacing } from '../theme/tokens';

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  password?: boolean;
}
export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, hint, password = false, style, onFocus, onBlur, ...props }, ref,
) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const id = useId();
  return <View style={styles.group}>
    <AppText variant="label" nativeID={`${id}-label`}>{label}</AppText>
    <View style={[styles.control, focused && styles.focused, !!error && styles.invalid]}>
      <TextInput ref={ref} {...props} accessibilityLabel={label} accessibilityLabelledBy={`${id}-label`}
        accessibilityHint={error ?? hint} placeholderTextColor={colors.muted}
        secureTextEntry={password && !visible}
        onFocus={event => { setFocused(true); onFocus?.(event); }}
        onBlur={event => { setFocused(false); onBlur?.(event); }}
        style={[styles.input, style]} />
      {password && <Pressable onPress={() => setVisible(value => !value)} accessibilityRole="button"
        accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        accessibilityState={{ checked: visible }} style={styles.eye}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} accessible={false} />
      </Pressable>}
    </View>
    {error ? <AppText variant="caption" accessibilityLiveRegion="polite" style={styles.error}>{error}</AppText>
      : hint ? <AppText variant="caption" style={styles.hint}>{hint}</AppText> : null}
  </View>;
});
const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  control: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.control },
  focused: { borderColor: colors.primary, boxShadow: '0 0 0 2px #1565C020' },
  invalid: { borderColor: colors.danger },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: spacing.md, paddingVertical: 14, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  eye: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.danger },
  hint: { color: colors.muted },
});
