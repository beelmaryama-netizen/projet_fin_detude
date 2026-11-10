export const apiMode = process.env.EXPO_PUBLIC_DATA_MODE !== 'demo';
export const apiBaseURL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
