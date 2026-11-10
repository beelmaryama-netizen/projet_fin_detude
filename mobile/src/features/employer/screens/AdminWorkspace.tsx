import { useEmployerTheme, type EmployerTheme } from '../theme';
import { AdminSupportScreen } from './AdminSupportScreen';
import type { AdminScreenProps } from '../types/admin';
import { AdminOfferScreens } from './AdminOfferScreens';
import { AdminMissionScreens } from './AdminMissionScreens';
import { AdminDirectoryScreens } from './AdminDirectoryScreens';
import { AdminExtraScreens } from './AdminExtraScreens';

export function AdminWorkspace(props: AdminScreenProps) {

  const screen = props.route.screen;
  if (screen === 'support') return <AdminSupportScreen {...props} />;
  if (screen === 'estimate' || screen === 'offer-preview' || screen === 'offer-detail' || screen === 'offers') return <AdminOfferScreens {...props} />;
  if (screen === 'missions' || screen === 'mission-detail' || screen === 'assignment' || screen === 'calendar') return <AdminMissionScreens {...props} />;
  if (screen === 'employees' || screen === 'employee-create' || screen === 'employee-detail' || screen === 'clients' || screen === 'client-detail') return <AdminDirectoryScreens {...props} />;
  return <AdminExtraScreens {...props} />;
}
