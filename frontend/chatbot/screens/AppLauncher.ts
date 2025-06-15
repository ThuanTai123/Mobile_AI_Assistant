import { Linking, Alert, Platform } from 'react-native';

const appSchemes: Record<string, { android: string; ios: string; fallback?: string }> = {
  youtube:   { android: 'vnd.youtube://', ios: 'youtube://', fallback: 'https://www.youtube.com' },
  facebook:  { android: 'fb://',          ios: 'fb://',       fallback: 'https://www.facebook.com' },
  zalo:      { android: 'zalo://',        ios: 'zalo://',     fallback: 'https://zalo.me' },
  gmail:     { android: 'googlegmail://', ios: 'googlegmail://', fallback: 'https://mail.google.com' },
  spotify:   { android: 'spotify://',     ios: 'spotify://',  fallback: 'https://open.spotify.com' },
  tiktok:    { android: 'snssdk1233://',  ios: 'snssdk1233://', fallback: 'https://www.tiktok.com' },
  settings:  { android: 'android.settings.SETTINGS', ios: 'App-Prefs://' },
};

export const openAppByName = async (appName: string): Promise<boolean> => {
  const entry = appSchemes[appName.toLowerCase()];
  if (!entry) {
    Alert.alert('Ứng dụng không được hỗ trợ', `Ứng dụng "${appName}" chưa được hỗ trợ mở tự động.`);
    return false;
  }

  const scheme = Platform.OS === 'android' ? entry.android : entry.ios;
  const fallback = entry.fallback;

    try {
    await Linking.openURL(scheme);
    return true;
  } catch (error) {
    if (fallback) {
      try {
        await Linking.openURL(fallback);
        return true;
      } catch (fallbackError) {
        Alert.alert('Lỗi mở ứng dụng', `Không thể mở fallback "${fallback}": ${fallbackError}`);
        return false;
      }
    } else {
      Alert.alert('Lỗi mở ứng dụng', `Không thể mở ứng dụng "${appName}": ${error}`);
      return false;
    }
  }
};

export const checkAndOpenApp = async (text: string): Promise<{ opened: boolean; appName?: string }> => {
  const trimmedText = text.trim().toLowerCase();
  if (trimmedText.startsWith('mở ')) {
    const appName = trimmedText.slice(3).trim();
    const opened = await openAppByName(appName);
    return { opened, appName };
  }
  return { opened: false };
};
