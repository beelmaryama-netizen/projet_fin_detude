import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
export type EmployeeTabs = { EmployeeHome: undefined; EmployeeAgenda: undefined; EmployeeHistory: undefined; EmployeeProfile: undefined };
export type EmployeeStack = {
  EmployeeTabs: NavigatorScreenParams<EmployeeTabs> | undefined;
  MissionDetails: { id: string }; BeforePhotos: { id: string }; MissionActive: { id: string };
  MissionChecklist: { id: string }; AfterPhotos: { id: string }; MissionReport: { id: string }; MissionCompleted: { id: string };
  EmployeeNotifications: undefined; EmployeeAppearance: undefined; EmployeePreferences: undefined;
  EmployeeProfileEdit: undefined; EmployeePassword: undefined; EmployeeHelp: { missionId?: string } | undefined;
};
export type EmployeeScreenProps<T extends keyof EmployeeStack> = NativeStackScreenProps<EmployeeStack, T>;
export type EmployeeTabProps<T extends keyof EmployeeTabs> = CompositeScreenProps<BottomTabScreenProps<EmployeeTabs, T>, NativeStackScreenProps<EmployeeStack>>;
