import Constants from 'expo-constants';

const extraGoogle = (Constants.expoConfig?.extra?.google ?? {}) as Partial<{
  webClientId: string;
}>;

export const googleConfig = {
  webClientId: extraGoogle.webClientId ?? '',
};
