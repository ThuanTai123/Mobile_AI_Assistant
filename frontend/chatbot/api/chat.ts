import axios from "axios"
import { getCurrentCity } from "../screens/location"
import { handleDeviceCommand } from "../utils/DeviceCommandHandler"

const API_URL = "https://mobile-ai-assistant.onrender.com"
// const API_URL = "http://192.168.1.88:5000"
export interface BotResponse {
  [x: string]: any
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

export const wakeUpServer = async () => {
  try {
    await axios.post('http://<YOUR_FLASK_SERVER>/chat', {
      message: 'wake_up_ping',
    });
    console.log('✅ Server is waking up...');
  } catch (error:unknown) {
    const err = error as Error
    console.log('⚠️ Failed to wake up server:', err.message);
  }
};

export const processMessage = async (message: string): Promise<BotResponse> => {
  console.log("🌐 API Call starting for message:", message);
  
  const deviceReply = await handleDeviceCommand(message)
  if (deviceReply) return { reply: deviceReply }

  const weatherKeywords = ["thời tiết", "trời", "mưa", "nắng", "nhiệt độ", "có mưa", "có nắng", "trời mưa", "trời nắng"];
  const isWeatherQuery = weatherKeywords.some(kw => message.toLowerCase().includes(kw));
  const isNote = /ghi chú/.test(message.toLowerCase())
  const isTask = /nhắc việc|nhắc tôi/.test(message.toLowerCase())
  const isAppointment = /lịch hẹn|hẹn gặp|đặt lịch/.test(message.toLowerCase())

  try {
    let endpoint = '';
    let payload = {};

    if (isWeatherQuery) {    
      endpoint = '/weather';
      const city = await getCurrentCity()
      payload = { message, city };
      console.log("Calling weather with city:", city)
    } else if (isNote) {
      endpoint = '/note';
      payload = { content: message };
    } else if (isTask) {
      endpoint = '/task';
      payload = { task: message };
    } else if (isAppointment) {
      endpoint = '/appointment';
      payload = { text: message };
    } else {
      endpoint = '/chat';
      payload = { message };
    }

    console.log(`🌐 Calling: ${API_URL}${endpoint}`);

    const res = await axios.post<BotResponse>(`${API_URL}${endpoint}`, payload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log("✅ API Response received:", res.status, res.data);

    // ✅ NEW: Handle server errors that still return a response
    if (res.data.error) {
      console.warn("⚠️ Server returned error but with response:", res.data.error);
      
      // If server provides a reply despite the error, use it
      if (res.data.reply) {
        return { reply: res.data.reply };
      }
      
      // Otherwise provide a fallback
      return { reply: "Xin lỗi, tôi gặp một chút sự cố. Hãy thử lại nhé!" };
    }

    // Handle note creation response
    if (isNote) {
      if (res.data.reply) {
        return res.data;
      } else if ((res.data as any).content || (res.data as any).id) {
        return {
          reply: `Đã tạo ghi chú thành công!`,
          type: "note_created",
        };
      } else {
        return {
          reply: "Đã xử lý yêu cầu tạo ghi chú.",
          type: "note_created",
        };
      }
    }

    return res.data;

  } catch (error: any) {
    console.error("❌ API Error Details:");
    console.error("- Error message:", error.message);
    
    if (error.response) {
      console.error("- Response status:", error.response.status);
      console.error("- Response data:", error.response.data);
      
      // ✅ NEW: Handle TTS rate limit specifically
      if (error.response.status === 500 && 
          error.response.data?.error?.includes("429") && 
          error.response.data?.error?.includes("TTS")) {
        
        console.warn("🎤 TTS API rate limited, but continuing with text response");
        
        // If server provides a reply despite TTS failure, use it
        if (error.response.data?.reply) {
          return { reply: error.response.data.reply };
        }
        
        // Provide a generic response for the user's message
        return { 
          reply: getGenericResponse(message)
        };
      }
      
      // Handle other server errors
      if (error.response.status === 500) {
        return { 
          reply: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút." 
        };
      }
    } else if (error.request) {
      return { 
        reply: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng." 
      };
    }

    return { 
      reply: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau." 
    };
  }
}

// ✅ NEW: Helper function for generic responses
const getGenericResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("xin chào") || lowerMessage.includes("hello")) {
    return "Xin chào! Tôi là Ruby Assistant. Tôi có thể giúp gì cho bạn?";
  }
  
  if (lowerMessage.includes("cảm ơn")) {
    return "Không có gì! Tôi luôn sẵn sàng giúp đỡ bạn.";
  }
  
  if (lowerMessage.includes("tạm biệt") || lowerMessage.includes("bye")) {
    return "Tạm biệt! Hẹn gặp lại bạn sau nhé!";
  }
  
  return "Tôi hiểu bạn đang nói gì, nhưng hiện tại tôi gặp một chút sự cố kỹ thuật. Hãy thử lại sau nhé!";
}