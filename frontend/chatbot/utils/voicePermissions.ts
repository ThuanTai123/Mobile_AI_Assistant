import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export const checkMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return result;
    } catch (err) {
      console.error('Error checking microphone permission:', err);
      return false;
    }
  }
  // Cho iOS, mặc định return true vì sẽ được hỏi khi sử dụng
  return true;
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Quyền truy cập Microphone',
          message: 'Ứng dụng cần quyền truy cập microphone để nhận dạng giọng nói.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Từ chối',
          buttonPositive: 'Đồng ý',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Microphone permission granted');
        return true;
      } else {
        console.log('❌ Microphone permission denied');
        Alert.alert(
          'Quyền bị từ chối',
          'Không thể sử dụng chức năng nhận dạng giọng nói mà không có quyền microphone.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (err) {
      console.error('Error requesting microphone permission:', err);
      return false;
    }
  }
  
  // Cho iOS, return true vì permission sẽ được hỏi tự động
  return true;
};

export const showPermissionAlert = () => {
  Alert.alert(
    'Cần quyền Microphone',
    'Để sử dụng tính năng nhận dạng giọng nói, bạn cần cấp quyền truy cập microphone trong Cài đặt.',
    [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Mở Cài đặt', 
        onPress: () => {
          Linking.openSettings();
        }
      }
    ]
  );
};