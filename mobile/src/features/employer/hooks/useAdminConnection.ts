import { useEffect } from 'react';
import { apiMode } from '../../../services/api/config';
import { useAuthStore } from '../../../store/authStore';
import { clearApiAdmin, loadAdminData, useAdminApiStatus } from '../services/apiAdminService';
export function useAdminConnection() {
 const id = useAuthStore(s => s.session?.user.id);
 useEffect(() => {
  if (!apiMode) return;
  clearApiAdmin();
  let disposed = false;
  const refresh = () => { if (!disposed && !useAdminApiStatus.getState().busy) void loadAdminData().then(() => { if (!disposed) useAdminApiStatus.setState({ error: undefined }); }).catch((e: unknown) => { if (!disposed) useAdminApiStatus.setState({ error: e instanceof Error ? e.message : 'Chargement impossible' }); }); };
  refresh(); const timer = setInterval(refresh, 15000);
  return () => { disposed = true; clearInterval(timer); clearApiAdmin(); };
 }, [id]);
}
