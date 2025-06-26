import Torch from 'react-native-torch';
import SystemSetting from 'react-native-system-setting';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import * as Brightness from 'expo-brightness';

let notificationOn = true;

/**
 * Bật hoặc tắt đèn flash thật
 */
export const toggleFlashlight = async (turnOn: boolean) => {
  try {
    await Torch.switchState(turnOn);
    console.log(`Đèn flash đã ${turnOn ? 'bật' : 'tắt'}`);
  } catch (err) {
    console.warn('Lỗi bật/tắt đèn flash:', err);
  }
};

/**
 * Bật hoặc tắt thông báo (chỉ giả lập trạng thái)
 */
export const toggleNotification = (turnOn: boolean) => {
  notificationOn = turnOn;
  console.log(`Thông báo đã ${turnOn ? 'bật' : 'tắt'}`);
};

/**
 * Kiểm tra trạng thái thông báo hiện tại
 */
export const areNotificationsEnabled = () => notificationOn;

/**
 * Tăng âm lượng hệ thống
 */
export const increaseVolume = async () => {
  try {
    const current = await SystemSetting.getVolume();
    const next = Math.min(current + 0.1, 1);
    await SystemSetting.setVolume(next);
    console.log('Tăng âm lượng lên:', next);
  } catch (err) {
    console.warn('Lỗi khi tăng âm lượng:', err);
  }
};

//Chỉnh âm thanh
export const setVolumeLevel = async (levelPercent: number) => {
  try {
    const level = Math.max(0, Math.min(levelPercent, 100)) / 100; // chuyển về 0 - 1
    await SystemSetting.setVolume(level);
    console.log(`Đã đặt âm lượng tới mức: ${levelPercent}%`);
  } catch (err) {
    console.warn('Lỗi khi đặt âm lượng:', err);
  }
};

/**
 * Giảm âm lượng hệ thống
 */
export const decreaseVolume = async () => {
  try {
    const current = await SystemSetting.getVolume();
    const next = Math.max(current - 0.1, 0);
    await SystemSetting.setVolume(next);
    console.log('Giảm âm lượng xuống:', next);
  } catch (err) {
    console.warn('Lỗi khi giảm âm lượng:', err);
  }
};

//Đặt độ sáng
export const setBrightnessLevel = async (levelPercent: number) => {
  try {
    const level = Math.max(0, Math.min(levelPercent, 100)) / 100;
    await Brightness.setBrightnessAsync(level);
    console.log(`Đã đặt độ sáng tới mức: ${levelPercent}%`);
  } catch (err) {
    console.warn('Lỗi khi đặt độ sáng:', err);
  }
};

// Lấy mức âm lượng hiện tại (0 - 100)
export const getVolumeLevel = async (): Promise<number> => {
  try {
    const volume = await SystemSetting.getVolume();
    return Math.round(volume * 100);
  } catch (err) {
    console.warn('Lỗi khi lấy âm lượng:', err);
    return -1;
  }
};

// Lấy mức độ sáng hiện tại (0 - 100)
export const getBrightnessLevel = async (): Promise<number> => {
  try {
    const brightness = await Brightness.getBrightnessAsync();
    return Math.round(brightness * 100);
  } catch (err) {
    console.warn('Lỗi khi lấy độ sáng:', err);
    return -1;
  }
};

/**
 * Mở thanh điều hướng (chỉ có tác dụng gọi về màn hình chính nếu khả thi)
 */
export const openNavigationBar = () => {
  Linking.openURL('home:'); // Android không hỗ trợ thực sự, dùng như placeholder
};
