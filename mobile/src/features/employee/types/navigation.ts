import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type EmployeeStackParamList = {
  Welcome: undefined;
  Missions: undefined;
  Detail: { missionId: string };
  Checklist: { missionId: string };
  Active: { missionId: string };
  Completed: { missionId: string };
  Report: { missionId: string };
};

export type EmployeeScreenProps<T extends keyof EmployeeStackParamList> = NativeStackScreenProps<EmployeeStackParamList, T>;
