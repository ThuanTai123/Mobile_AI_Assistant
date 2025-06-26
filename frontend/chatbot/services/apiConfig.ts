// services/apiConfig.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'API_URL';

export const setApiUrl = async (url: string) => {
  await AsyncStorage.setItem(API_KEY, url);
};

export const getApiUrl = async (): Promise<string> => {
  const url = await AsyncStorage.getItem(API_KEY);
  return url || 'http://192.168.1.100:5000'; // fallback mặc định
};
