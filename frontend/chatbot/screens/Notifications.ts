// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Khởi tạo channel cho Android để đảm bảo thông báo có âm thanh và delay đúng.
 */
export const setupNotificationChannel = async () => { 
    await Notifications.setNotificationChannelAsync('reminder', {
      name: 'Nhắc nhở',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
};

/**
 * Đặt lịch gửi thông báo sau delay (theo giây).
 * @param delaySeconds - số giây delay
 * @param content - nội dung thông báo
 */
export const scheduleReminderNotification = async (delaySeconds: number, content: string) => {
  console.log(`⏳ Đặt lịch sau ${delaySeconds} giây`);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📌 Nhắc nhở',
      body: content,
      sound: 'default',
    },
    trigger: {
      seconds: delaySeconds,
      channelId: 'reminder',
    },
  });
};

/**
 * Yêu cầu quyền nhận thông báo (chỉ thực hiện 1 lần khi app chạy).
 */
export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Bạn cần cấp quyền thông báo để nhận nhắc nhở');
  }
};

/**
 * Cấu hình handler xử lý khi nhận thông báo.
 */
export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};
