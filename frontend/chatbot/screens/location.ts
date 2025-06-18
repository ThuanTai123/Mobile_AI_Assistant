// utils/location.ts
import * as Location from 'expo-location';

export const getCurrentCity = async (): Promise<string | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Không được cấp quyền truy cập vị trí');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({});
    const geocode = await Location.reverseGeocodeAsync(location.coords);

    const city = geocode[0]?.city || geocode[0]?.region || null;
    console.log('[GPS] Thành phố hiện tại:', city);
    return city;
  } catch (err) {
    console.error('Lỗi khi lấy vị trí:', err);
    return null;
  }
};
