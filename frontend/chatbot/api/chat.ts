import axios from 'axios';

// ⚠️ Đổi IP này thành IP nội bộ của máy chạy Flask backend (ví dụ: 192.168.1.5:5000)
const API_URL = 'http://192.168.1.208:5000'; // Địa chỉ thay đổi khi đổi wifi



export interface BotResponse {
  reply: string;
}

import { handleDeviceCommand } from '../screens/DeviceCommandHandler';

export const sendMessageToBot = async (message: string): Promise<BotResponse> => {
  // 🔧 Xử lý lệnh thiết bị trước khi gọi API
  const deviceReply = await handleDeviceCommand(message);
  if (deviceReply) {
    return { reply: deviceReply };
  }

  // Gửi tới Flask nếu không phải lệnh thiết bị
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      message: message,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending message to chatbot:', error.message);
    return { reply: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.' };
  }
};


export const sendNote = async (note: string): Promise<BotResponse> => {
  try {
    const response = await axios.post(`${API_URL}/note`, {
      note: note,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending note:', error.message);
    return { reply: 'Không thể lưu ghi chú.' };
  }
};

export const sendTask = async (task: string): Promise<BotResponse> => {
  try {
    const response = await axios.post(`${API_URL}/task`, {
      task: task,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending task:', error.message);
    return { reply: 'Không thể tạo nhắc việc.' };
  }
};

export const sendAppointment = async (text: string): Promise<BotResponse> => {
  try {
    const response = await axios.post(`${API_URL}/appointment`, {
      text: text,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating appointment:', error.message);
    return { reply: 'Không thể tạo lịch hẹn.' };
  }
};
