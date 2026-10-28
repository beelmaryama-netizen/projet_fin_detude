import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Challenge } from '../features/auth/types/auth';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RequestCategory } from '../features/requests/types/request';

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
  BusinessRequest: { step: 0 | 1 | 2 | 3 | 4 | 5 };
  ResidentialPropertyDetailsScreen: undefined;
  RequestFlowPlaceholder: { category: RequestCategory };
  ResidentialSchedulePreferences: undefined;
  RequestReview: undefined;
  RequestSubmitted: { id: string };
  RequestDetails: { id: string };
  MyQuotes: undefined;
  QuoteDetails: { id: string };
  EditProfile: undefined;
  Appearance: undefined;
  MyAddresses: undefined;
  AddressForm: { id?: string } | undefined;
  NotificationPreferences: undefined;
  Security: undefined;
  Support: undefined;
  ContactSupport: undefined;
  ReservationDetails: { id: string };
  Notifications: undefined;
};
export type RootStackParamList = AuthStackParamList & { Client: NavigatorScreenParams<ClientStackParamList> | undefined };
export type ClientScreenProps<T extends keyof ClientStackParamList> = NativeStackScreenProps<ClientStackParamList, T>;
export type ClientTabScreenProps<T extends keyof ClientTabParamList> = CompositeScreenProps<BottomTabScreenProps<ClientTabParamList, T>, NativeStackScreenProps<ClientStackParamList>>;
