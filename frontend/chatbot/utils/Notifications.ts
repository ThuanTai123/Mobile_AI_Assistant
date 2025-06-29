// utils/Notifications.ts
import * as Notifications from 'expo-notifications';
import { NotificationTriggerInput } from 'expo-notifications';
import { Platform } from 'react-native';

export const setupNotificationChannel = async () => { 
  const result = await Notifications.setNotificationChannelAsync('reminder', {
    name: 'Reminder',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
  return result;
};

export const scheduleReminderNotification = async (delaySeconds: number, content: string) => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const trigger: NotificationTriggerInput = {
      type: 'timeInterval',
      seconds: delaySeconds,
      repeats: false,
    } as NotificationTriggerInput;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📌 Nhắc nhở',
        body: content,
        sound: 'default',
        badge: 1,
      },
      trigger,
    });

    console.log('✅ Notification scheduled for', delaySeconds, 'seconds');
    return id;
  } catch (err) {
    console.error('❌ Error scheduling notification:', err);
    throw err;
  }
};

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Bạn cần cấp quyền thông báo để nhận nhắc nhở');
    return false;
  }
  return true;
};

export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log("📨 Notification received:", notification.request.content.title);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log("👆 Notification tapped");
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};