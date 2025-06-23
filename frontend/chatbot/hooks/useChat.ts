import { useState, useRef, useEffect } from 'react';
import { FlatList, Vibration } from 'react-native';
import * as Speech from 'expo-speech';
import { Message } from '../types/Message';
import { processMessage } from '../api/chat';
import { saveMessage } from '../services/ChatService';
import { saveNote } from '../services/NoteService';
import { handleDeviceCommand } from '../utils/DeviceCommandHandler';
import { checkAndOpenApp } from '../utils/AppLauncher';
import { scheduleReminderNotification } from '../utils/Notifications';

const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const extractNoteFromMessage = (originalMessage: string, botReply: string): string => {
    let content = originalMessage.toLowerCase();
    
    if (content.includes("tạo ghi chú")) {
      content = content.replace("tạo ghi chú", "").trim();
    }

    if (!content && botReply) {
      const match = botReply.match(/'([^']+)'/);
      if (match) {
        content = match[1];
      }
    }

    return content || "Ghi chú không có tiêu đề";
  };

  // ✅ THÊM: Hàm xử lý kết quả voice
  const handleVoiceResult = (text: string) => {
    console.log("📤 Voice result received:", text);
    setInputText(text);
    // Có thể tự động gửi hoặc để user xác nhận
    // handleSend(text);
  };

  const handleSend = async (overrideText?: string) => {
    Vibration.vibrate(50);
    const textToSend = overrideText || inputText.trim();
    if (!textToSend) return;

    console.log("🔍 Processing message:", textToSend);

    const userMessage: Message = {
      id: generateId(),
      text: textToSend,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    scrollToBottom();

    // Save user message
    try {
      await saveMessage(textToSend, "user");
      console.log("💾 User message saved successfully");
    } catch (error) {
      console.error("❌ Error saving user message:", error);
    }

    // Check for app opening
    const { opened, appName } = await checkAndOpenApp(textToSend);
    if (opened) {
      const appResponse = `Đã mở ứng dụng ${appName} cho bạn.`;
      const botMessage: Message = {
        id: generateId(),
        text: appResponse,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
      await saveMessage(appResponse, "bot");
      return;
    }

    // Check for device commands
    const deviceResponse = await handleDeviceCommand(textToSend);
    if (deviceResponse) {
      const botMessage: Message = {
        id: generateId(),
        text: deviceResponse,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
      await saveMessage(deviceResponse, "bot");
      
      setIsSpeaking(true);
      Speech.speak(deviceResponse, {
        language: "vi-VN",
        pitch: 1,
        rate: 1,
        onDone: () => {
          setIsSpeaking(false);
          setIsRecording(false);
        },
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
      return;
    }

    // Process with bot
    const botResponse = await processMessage(textToSend);
    let finalReply = botResponse.reply;
    let responseType = botResponse.type;

    if (!finalReply && (botResponse as any).content) {
      finalReply = `Đã tạo ghi chú "${(botResponse as any).content}" thành công!`;
      responseType = "note_created";
    }

    if (!finalReply) {
      finalReply = "Đã xử lý yêu cầu của bạn.";
    }

    // Handle reminders
    const isReminder = /đã tạo nhắc/i.test(finalReply);
    if (isReminder) {
      const match = textToSend.match(/(\d+)\s*(giây|giay|seconds?)/i);
      if (match) {
        const delaySeconds = Number.parseInt(match[1]);
        if (!isNaN(delaySeconds)) {
          await scheduleReminderNotification(delaySeconds, textToSend);
        }
      }
    }

    const botMessage: Message = {
      id: generateId(),
      text: finalReply,
      sender: "bot",
    };

    setMessages((prev) => [...prev, botMessage]);
    scrollToBottom();
    await saveMessage(finalReply, "bot");

    // Handle note creation
    if (responseType === "note_created") {
      const noteContent = extractNoteFromMessage(textToSend, finalReply);
      if (noteContent) {
        try {
          await saveNote("Ghi chú", noteContent);
          console.log("✅ Note saved successfully");
        } catch (error) {
          console.error("❌ Error saving note:", error);
        }
      }
    }

    // Text to speech
    if (!isReminder && finalReply) {
      setIsSpeaking(true);
      Speech.speak(finalReply, {
        language: "vi-VN",
        pitch: 1,
        rate: 1,
        onDone: () => {
          setIsSpeaking(false);
          setIsRecording(false);
        },
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  return {
    messages,
    inputText,
    setInputText,
    isSpeaking,
    isRecording,
    setIsRecording,
    flatListRef,
    handleSend,
    handleVoiceResult, // ✅ THÊM: Export hàm này
    scrollToBottom,
  };
};