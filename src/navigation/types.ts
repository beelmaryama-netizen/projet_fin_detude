import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Challenge } from '../features/auth/types/auth';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RequestCategory } from '../features/requests/types/request';
import type { EmployeeStackParamList } from '../features/employee/types/navigation';

export type AuthStackParamList = {
  Splash: undefined;
  Login: { notice?: string; email?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Verification: { challenge: Challenge };
};
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;

export type ClientTabParamList = {
  ClientHomeScreen: undefined;
  ClientRequests: undefined;
  ClientReservations: undefined;
  ClientProfile: undefined;
};
export type ClientStackParamList = {
  ClientTabs: NavigatorScreenParams<ClientTabParamList> | undefined;
  RequestTypeScreen: undefined;
  ResidentialPropertyDetailsScreen: undefined;
  RequestFlowPlaceholder: { category: RequestCategory };
  RequestNextStep: undefined;
  ReservationDetails: { id: string };
  Notifications: undefined;
};
export type RootStackParamList = AuthStackParamList & {
  Client: NavigatorScreenParams<ClientStackParamList> | undefined;
  EmployerDashboard: undefined;
  Employee: NavigatorScreenParams<EmployeeStackParamList> | undefined;
};
export type ClientScreenProps<T extends keyof ClientStackParamList> = NativeStackScreenProps<ClientStackParamList, T>;
export type ClientTabScreenProps<T extends keyof ClientTabParamList> = CompositeScreenProps<BottomTabScreenProps<ClientTabParamList, T>, NativeStackScreenProps<ClientStackParamList>>;
