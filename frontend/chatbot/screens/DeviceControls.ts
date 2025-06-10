import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

let flashOn = false;
let notificationOn = true;

export const openNavigationBar = () => {
  Alert.alert('Mở thanh điều hướng', 'Bạn đã trở về màn hình chính.');
  Linking.openURL('home:'); // Chỉ là ví dụ, Expo Go không mở được thanh điều hướng thật
};

export const toggleFlashlight = async (turnOn: boolean) => {
  flashOn = turnOn;
  Alert.alert('Đèn flash', flashOn ? 'Đèn flash đã bật' : 'Đèn flash đã tắt');
};

export const toggleNotification = (turnOn: boolean) => {
  notificationOn = turnOn;
  Alert.alert('Thông báo', notificationOn ? 'Thông báo đã bật' : 'Thông báo đã tắt');
};

export const increaseVolume = () => {
  Alert.alert('Âm lượng', 'Tăng âm lượng (giả lập)');
};

export const decreaseVolume = () => {
  Alert.alert('Âm lượng', 'Giảm âm lượng (giả lập)');
};
