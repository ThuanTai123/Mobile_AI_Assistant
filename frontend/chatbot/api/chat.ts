import axios from "axios"
import { getCurrentCity } from "../screens/location"
import { handleDeviceCommand } from "../utils/DeviceCommandHandler"
import { getApiUrl } from '../services/apiConfig';

// ⚠️ Đổi IP nội bộ nếu cần

const API_URL = "http://192.168.30.30:5000"

export interface BotResponse {
  reply: string
  type?: string
  note_data?: {
    id: number
    title: string
    content: string
    created_at: string
  }
  audio_url?: string
}

export const processMessage = async (message: string): Promise<BotResponse> => {
  // 1. Thiết bị
  const deviceReply = await handleDeviceCommand(message)
  if (deviceReply) return { reply: deviceReply }

  // 2. Regex phân loại lệnh
  const isWeatherQuery = /thời tiết|trời/.test(message.toLowerCase())
  const isNote = /ghi chú/.test(message.toLowerCase())
  const isTask = /nhắc việc|nhắc tôi/.test(message.toLowerCase())
  const isAppointment = /lịch hẹn|hẹn gặp|đặt lịch/.test(message.toLowerCase())

  try {
    if (isWeatherQuery) {
      const city = await getCurrentCity()
      const res = await axios.post<BotResponse>(`${API_URL}/weather`, { message })
      return res.data
    }

    if (isNote) {
      const res = await axios.post<BotResponse>(`${API_URL}/note`, { content: message })

      // ✅ THÊM: Kiểm tra và xử lý response không đúng format
      if (res.data.reply) {
        // Server trả về đúng format
        return res.data
      } else if ((res.data as any).content || (res.data as any).id) {
        // Server trả về raw record, tự tạo response
        console.warn("⚠️ Server returned raw record, formatting response")
        return {
          reply: `Đã tạo ghi chú thành công!`,
          type: "note_created",
        }
      } else {
        // Fallback
        return {
          reply: "Đã xử lý yêu cầu tạo ghi chú.",
          type: "note_created",
        }
      }
    }

    if (isTask) {
      const res = await axios.post<BotResponse>(`${API_URL}/task`, { task: message })
      return res.data
    }

    if (isAppointment) {
      const res = await axios.post<BotResponse>(`${API_URL}/appointment`, { text: message })
      return res.data
    }

    // Mặc định: gọi chatbot
    const res = await axios.post<BotResponse>(`${API_URL}/chat`, { message })
    return res.data
  } catch (error: any) {
    console.error("Lỗi xử lý message:", error.message)
    throw new Error('❌ Lỗi xử lý message: ' + (error?.response?.data?.error || error?.message));
    return { reply: "Lỗi kết nối đến máy chủ. Vui lòng thử lại sau." }
  }
}
