import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { 
  checkMicrophonePermission, 
  requestMicrophonePermission,
  showPermissionAlert 
} from '../utils/voicePermissions';

export const usePermissions = () => {
  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền thông báo",
          "Bạn cần cấp quyền thông báo để nhận nhắc nhở",
          [{ text: 'OK' }]
        );
        return false;
      }
      console.log('✅ Notification permission granted');
      return true;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  };

  const initializePermissions = async () => {
    console.log('🔐 Initializing permissions...');
    
    // Kiểm tra quyền microphone
    const hasMicPermission = await checkMicrophonePermission();
    if (!hasMicPermission) {
      console.log('🎤 Requesting microphone permission...');
      const granted = await requestMicrophonePermission();
      if (!granted) {
        showPermissionAlert();
      }
    } else {
      console.log('✅ Microphone permission already granted');
    }

    // Kiểm tra quyền thông báo
    await requestNotificationPermissions();
    
    console.log('✅ Permissions initialization completed');
  };

  useEffect(() => {
    initializePermissions();
  }, []);

  return {
    requestMicrophonePermission,
    requestNotificationPermissions,
    checkMicrophonePermission,
  };
};