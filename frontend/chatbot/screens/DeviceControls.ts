import Torch from 'react-native-torch';
import SystemSetting from 'react-native-system-setting';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

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

/**
 * Mở thanh điều hướng (chỉ có tác dụng gọi về màn hình chính nếu khả thi)
 */
export const openNavigationBar = () => {
  Linking.openURL('home:'); // Android không hỗ trợ thực sự, dùng như placeholder
};
