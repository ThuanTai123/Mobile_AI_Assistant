import { Linking, Alert, Platform } from 'react-native';

const appSchemes: Record<string, { android: string; ios: string; fallback?: string }> = {
  youtube:    { android: 'vnd.youtube://', ios: 'youtube://', fallback: 'https://www.youtube.com' },
  facebook:   { android: 'fb://', ios: 'fb://', fallback: 'https://www.facebook.com' },
  messenger:  { android: 'fb-messenger://', ios: 'fb-messenger://', fallback: 'https://www.messenger.com' },
  instagram:  { android: 'instagram://user?username=', ios: 'instagram://user?username=', fallback: 'https://www.instagram.com' },
  zalo:       { android: 'zalo://', ios: 'zalo://', fallback: 'https://zalo.me' },
  gmail:      { android: 'googlegmail://', ios: 'googlegmail://', fallback: 'https://mail.google.com' },
  chrome:     { android: 'googlechrome://', ios: 'googlechrome://', fallback: 'https://www.google.com/chrome/' },
  google:     { android: 'google://', ios: 'google://', fallback: 'https://www.google.com' },
  google_maps:{ android: 'geo:0,0?q=', ios: 'comgooglemaps://?q=', fallback: 'https://maps.google.com' },
  spotify:    { android: 'spotify://', ios: 'spotify://', fallback: 'https://open.spotify.com' },
  tiktok:     { android: 'snssdk1233://', ios: 'snssdk1233://', fallback: 'https://www.tiktok.com' },
  whatsapp:   { android: 'whatsapp://send?text=', ios: 'whatsapp://send?text=', fallback: 'https://www.whatsapp.com' },
  telegram:   { android: 'tg://resolve?domain=', ios: 'tg://resolve?domain=', fallback: 'https://t.me' },
  shopee:     { android: 'shopeeid://', ios: 'shopeeid://', fallback: 'https://shopee.vn' },
  lazada:     { android: 'lazada://', ios: 'lazada://', fallback: 'https://www.lazada.vn' },
  grab:       { android: 'grab://', ios: 'grab://', fallback: 'https://www.grab.com' },
  viber:      { android: 'viber://', ios: 'viber://', fallback: 'https://www.viber.com' },
  skype:      { android: 'skype:', ios: 'skype:', fallback: 'https://www.skype.com' },
  zalo_pay:   { android: 'zalopay://', ios: 'zalopay://', fallback: 'https://zalopay.vn' },
  settings:   { android: 'android.settings.SETTINGS', ios: 'App-Prefs://' },
  phone:      { android: 'tel:', ios: 'tel:' },
  sms:        { android: 'sms:', ios: 'sms:' },
  calendar:   { android: 'content://com.android.calendar/time/', ios: 'calshow:', fallback: '' },
  mail:       { android: 'mailto:', ios: 'mailto:', fallback: '' }
};


/**
 * Mở ứng dụng theo tên và truyền số (nếu là phone)
 */
export const openAppByName = async (appName: string, phoneNumber?: string): Promise<boolean> => {
  const entry = appSchemes[appName.toLowerCase()];
  if (!entry) {
    Alert.alert('Ứng dụng không được hỗ trợ', `Ứng dụng "${appName}" chưa được hỗ trợ mở tự động.`);
    return false;
  }

  const baseScheme = Platform.OS === 'android' ? entry.android : entry.ios;
  const scheme = appName === 'phone' && phoneNumber 
    ? `${baseScheme}${phoneNumber}` // ✅ tel:0906...
    : baseScheme;
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

/**
 * Tự động phát hiện và mở ứng dụng nếu text chứa "mở ..." hoặc "gọi ..."
 */
export const checkAndOpenApp = async (
  text: string
): Promise<{ opened: boolean; appName?: string; message?: string }> => {
  const trimmedText = text.trim().toLowerCase();

  // Trường hợp: "gọi 0906xxxxxx"
  if (trimmedText.startsWith('gọi ')) {
    const phoneMatch = trimmedText.match(/gọi\s+(\+?[\d\s\-]+)/i);
    if (phoneMatch) {
      const phoneNumber = phoneMatch[1].replace(/\s|-/g, '');
      const opened = await openAppByName('phone', phoneNumber);
      return { opened, appName: 'phone' };
    }
  }

  // Trường hợp: "mở ứng dụng youtube giúp tôi", "mở zalo dùm với", v.v.
  const match = trimmedText.match(/mở(?: ứng dụng)?\s+([a-zA-Z0-9\u00C0-\u1EF9\s\-_.]+?)(?:\s*(giúp|dùm|với|nhé|nha|đi)?\s*)?$/u);
  if (match) {
    const appNameRaw = match[1]?.trim();
    if (!appNameRaw) {
      return { opened: false, message: 'Vui lòng nói tên ứng dụng bạn muốn mở' };
    }

    const appName = appNameRaw.toLowerCase();
    const supportedApps = Object.keys(appSchemes);

    for (const key of supportedApps) {
      if (appName.includes(key)) {
        const opened = await openAppByName(key);
        if (opened) {
          return { opened: true, appName: key };
        } else {
          return { opened: false, appName: key, message: `Không thể mở ứng dụng "${key}" trên thiết bị.` };
        }
      }
    }

    return {
      opened: false,
      appName,
      message: `Không tìm thấy ứng dụng "${appName}" trong danh sách hỗ trợ`
    };
  }

  // Trường hợp: chỉ nói "mở ứng dụng"
  if (/^mở( ứng dụng)?$/u.test(trimmedText)) {
    return { opened: false, message: 'Vui lòng nói tên ứng dụng bạn muốn mở' };
  }

  return { opened: false };
};
