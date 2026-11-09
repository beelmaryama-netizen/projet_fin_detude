import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import { employeeError } from './useEmployeeData';
export function useMissionDirections(address?: string) {
  const [error, setError] = useState<string>();
  const open = async () => {
    if (!address) return; setError(undefined);
    const encoded = encodeURIComponent(address);
    const url = Platform.OS === 'ios' ? 'https://maps.apple.com/?daddr=' + encoded : 'https://www.google.com/maps/dir/?api=1&destination=' + encoded;
    try { await Linking.openURL(url); } catch (error) { setError(employeeError(error)); }
  };
  return { open, error };
}
