import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema } from '../schemas/clientSchemas';
import { addressService } from '../services/clientServices';
import { useClientMutation } from './useClientData';
import type { AddressInput, ClientAddress } from '../types/client';
export function useAddressForm(address: ClientAddress | undefined, done: () => void) {
  const form = useForm<AddressInput>({ resolver: zodResolver(addressSchema), defaultValues: address ?? { label: 'Maison', street: '', unit: '', city: '', province: 'QC', postalCode: '', accessNotes: '', isDefault: false }, mode: 'onTouched' });
  const save = useClientMutation((user, value: AddressInput) => addressService.save(user, value, address?.id), done);
  return { form, save, submit: form.handleSubmit(value => save.mutate(value)) };
}
