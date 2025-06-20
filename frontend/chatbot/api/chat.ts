import axios from 'axios';
import { getCurrentCity } from '../screens/location';
import { handleDeviceCommand } from '../screens/DeviceCommandHandler';

// ⚠️ Đổi IP nội bộ nếu cần
const API_URL = 'http://192.168.30.222:5000';

export interface BotResponse {
  reply: string;
  type?:string;
}

export const processMessage = async (message: string): Promise<BotResponse> => {
  // 1. Thiết bị
  const deviceReply = await handleDeviceCommand(message);
  if (deviceReply) return { reply: deviceReply };

  // 2. Regex phân loại lệnh
  const isWeatherQuery = /thời tiết|trời/.test(message.toLowerCase());
  const isNote = /ghi chú/.test(message.toLowerCase());
  const isTask = /nhắc việc|nhắc tôi/.test(message.toLowerCase());
  const isAppointment = /lịch hẹn|hẹn gặp|đặt lịch/.test(message.toLowerCase());

  try {
    if (isWeatherQuery) {
      const city = await getCurrentCity();
      const res = await axios.post(`${API_URL}/weather`, { message });
      return res.data;
    }

    if (isNote) {
      const res = await axios.post(`${API_URL}/note`, { content: message });
      
      return res.data;
    }

    if (isTask) {
      const res = await axios.post(`${API_URL}/task`, { task: message });
      return res.data;
    }

    if (isAppointment) {
      const res = await axios.post(`${API_URL}/appointment`, { text: message });
      return res.data;
    }

    // Mặc định: gọi chatbot
    const res = await axios.post(`${API_URL}/chat`, { message });
    return res.data;

  } catch (error: any) {
    console.error('Lỗi xử lý message:', error.message);
    return { reply: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.' };
  }
};
