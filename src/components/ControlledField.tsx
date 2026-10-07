import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from './FormField';

type Props<T extends FieldValues> = Omit<FormFieldProps, 'value' | 'onChangeText' | 'error'> & {
  control: Control<T>;
  name: FieldPath<T>;
};
export function ControlledField<T extends FieldValues>({ control, name, ...props }: Props<T>) {
  return <Controller control={control} name={name} render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) =>
    <FormField {...props} ref={ref} value={typeof value === 'string' ? value : ''} onChangeText={onChange} onBlur={onBlur} error={error?.message} />
  } />;
}
