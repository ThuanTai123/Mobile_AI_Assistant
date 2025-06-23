import {
  toggleFlashlight,
  toggleNotification,
  increaseVolume,
  decreaseVolume,
  openNavigationBar,
} from '../screens/DeviceControls';

import * as Brightness from 'expo-brightness';
import AndroidOpenSettings from 'react-native-android-open-settings';

/**
 * Xử lý các lệnh điều khiển thiết bị từ chatbot.
 * @param message Tin nhắn người dùng nhập vào
 * @returns Trả về phản hồi phù hợp nếu là lệnh điều khiển, ngược lại trả về null
 */
export const handleDeviceCommand = async (message: string): Promise<string | null> => {
  const msg = message.toLowerCase();

  // Flashlight
  if (msg.includes('bật đèn flash')) {
    await toggleFlashlight(true);
    return 'Đã bật đèn flash 🔦';
  }

  if (msg.includes('tắt đèn flash')) {
    await toggleFlashlight(false);
    return 'Đã tắt đèn flash 🔦';
  }

  // Notification
  if (msg.includes('bật thông báo')) {
    toggleNotification(true);
    return 'Đã bật thông báo 🛎️';
  }

  if (msg.includes('tắt thông báo')) {
    toggleNotification(false);
    return 'Đã tắt thông báo 🛎️';
  }

  // Âm lượng
  if (msg.includes('tăng âm lượng')) {
    increaseVolume();
    return 'Đã tăng âm lượng 🔊';
  }

  if (msg.includes('giảm âm lượng')) {
    decreaseVolume();
    return 'Đã giảm âm lượng 🔉';
  }

  // Thanh điều hướng
  if (msg.includes('mở thanh điều hướng')) {
    openNavigationBar();
    return 'Đã mở thanh điều hướng 📱';
  }

  // Độ sáng màn hình
  if (msg.includes('tăng độ sáng')) {
    const current = await Brightness.getBrightnessAsync();
    await Brightness.setBrightnessAsync(Math.min(current + 0.2, 1));
    return '🌞 Đã tăng độ sáng màn hình.';
  }

  if (msg.includes('giảm độ sáng')) {
    const current = await Brightness.getBrightnessAsync();
    await Brightness.setBrightnessAsync(Math.max(current - 0.2, 0.1));
    return '🌙 Đã giảm độ sáng màn hình.';
  }

  // Mở cài đặt WiFi
  if (msg.includes('bật wifi') || msg.includes('mở wifi')) {
    AndroidOpenSettings.wifiSettings();
    return '🔌 Đang mở cài đặt WiFi để bạn bật.';
  }

  if (msg.includes('tắt wifi')) {
    AndroidOpenSettings.wifiSettings();
    return '🔌 Đang mở cài đặt WiFi để bạn tắt.';
  }

  // Mở cài đặt Bluetooth
  if (msg.includes('bật bluetooth') || msg.includes('mở bluetooth')) {
    AndroidOpenSettings.bluetoothSettings();
    return '📶 Đang mở cài đặt Bluetooth để bạn bật.';
  }

  if (msg.includes('tắt bluetooth')) {
    AndroidOpenSettings.bluetoothSettings();
    return '📶 Đang mở cài đặt Bluetooth để bạn tắt.';
  }

  return null;
};
