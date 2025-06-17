// import axios from 'axios';

// // ⚠️ Đổi IP này thành IP nội bộ của máy chạy Flask backend (ví dụ: 192.168.1.5:5000)
// const API_URL = 'http://192.168.1.208:5000'; // Địa chỉ thay đổi khi đổi wifi



// export interface BotResponse {
//   reply: string;
// }

// import { handleDeviceCommand } from '../screens/DeviceCommandHandler';

// export const sendMessageToBot = async (message: string): Promise<BotResponse> => {
//   // 🔧 Xử lý lệnh thiết bị trước khi gọi API
//   const deviceReply = await handleDeviceCommand(message);
//   if (deviceReply) {
//     return { reply: deviceReply };
//   }

//   // Gửi tới Flask nếu không phải lệnh thiết bị
//   try {
//     const response = await axios.post(`${API_URL}/chat`, {
//       message: message,
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error('Error sending message to chatbot:', error.message);
//     return { reply: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.' };
//   }
// };


// export const sendNote = async (note: string): Promise<BotResponse> => {
//   try {
//     const response = await axios.post(`${API_URL}/note`, {
//       note: note,
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error('Error sending note:', error.message);
//     return { reply: 'Không thể lưu ghi chú.' };
//   }
// };

// export const sendTask = async (task: string): Promise<BotResponse> => {
//   try {
//     const response = await axios.post(`${API_URL}/task`, {
//       task: task,
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error('Error sending task:', error.message);
//     return { reply: 'Không thể tạo nhắc việc.' };
//   }
// };

// export const sendAppointment = async (text: string): Promise<BotResponse> => {
//   try {
//     const response = await axios.post(`${API_URL}/appointment`, {
//       text: text,
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error('Error creating appointment:', error.message);
//     return { reply: 'Không thể tạo lịch hẹn.' };
//   }
// };
import axios from 'axios';
import { getCurrentCity } from '../screens/location';
import { handleDeviceCommand } from '../screens/DeviceCommandHandler';

// ⚠️ Đổi IP nội bộ nếu cần
const API_URL = 'http://192.168.1.208:5000';

export interface BotResponse {
  reply: string;
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
      const res = await axios.post(`${API_URL}/weather`, { message, city });
      return res.data;
    }

    if (isNote) {
      const res = await axios.post(`${API_URL}/note`, { note: message });
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
