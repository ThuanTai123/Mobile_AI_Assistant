// AppLauncher.ts
import { Linking, Alert, Platform } from 'react-native';

const appSchemes: Record<string, string> = {
  youtube: 'youtube://',
  facebook: 'fb://',
  zalo: 'zalo://',
  gmail: 'googlegmail://',
  spotify: 'spotify://',
  tiktok:'snssdk1233://',
  camera: 'camera://',               // iOS không hỗ trợ scheme này trực tiếp
  photos: 'photos-redirect://',      // Mở app Ảnh (Photos)
  settings: 'App-Prefs://',          // Mở app Cài đặt (iOS Settings)
  // thêm app nếu cần
};

export const openAppByName = async (appName: string): Promise<boolean> => {
  const scheme = appSchemes[appName.toLowerCase()];
  if (!scheme) {
    Alert.alert('Ứng dụng không được hỗ trợ', `Ứng dụng "${appName}" chưa được hỗ trợ mở tự động.`);
    return false;
  }

  try {
    await Linking.openURL(scheme);
    return true;
  } catch (error) {
    Alert.alert('Lỗi mở ứng dụng', `Không thể mở ứng dụng ${appName}: ${error}`);
    return false;
  }
};
// Hàm kiểm tra câu lệnh và mở app nếu đúng định dạng "mở <tên app>"
export const checkAndOpenApp = async (text: string): Promise<{ opened: boolean; appName?: string }> => {
  const trimmedText = text.trim().toLowerCase();
  if (trimmedText.startsWith('mở ')) {
    const appName = trimmedText.slice(3).trim();
    const opened = await openAppByName(appName);
    return { opened, appName };
  }
  return { opened: false };
};
