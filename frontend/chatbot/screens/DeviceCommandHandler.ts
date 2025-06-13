import {
  toggleFlashlight,
  toggleNotification,
  increaseVolume,
  decreaseVolume,
  openNavigationBar,
} from './DeviceControls';

/**
 * Xử lý các lệnh điều khiển thiết bị từ chatbot.
 * @param message Tin nhắn người dùng nhập vào
 * @returns Trả về phản hồi phù hợp nếu là lệnh điều khiển, ngược lại trả về null
 */
export const handleDeviceCommand = async (message: string): Promise<string | null> => {
  const msg = message.toLowerCase();

  if (msg.includes('bật đèn flash')) {
    await toggleFlashlight(true);
    return 'Đã bật đèn flash 🔦';
  }

  if (msg.includes('tắt đèn flash')) {
    await toggleFlashlight(false);
    return 'Đã tắt đèn flash 🔦';
  }

  if (msg.includes('bật thông báo')) {
    toggleNotification(true);
    return 'Đã bật thông báo 🛎️';
  }

  if (msg.includes('tắt thông báo')) {
    toggleNotification(false);
    return 'Đã tắt thông báo 🛎️';
  }

  if (msg.includes('tăng âm lượng')) {
    increaseVolume();
    return 'Đã tăng âm lượng 🔊';
  }

  if (msg.includes('giảm âm lượng')) {
    decreaseVolume();
    return 'Đã giảm âm lượng 🔉';
  }

  if (msg.includes('mở thanh điều hướng')) {
    openNavigationBar();
    return 'Đã mở thanh điều hướng 📱';
  }

  return null;
};
