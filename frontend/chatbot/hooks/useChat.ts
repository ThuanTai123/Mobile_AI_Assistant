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
// ✅ FIX: Import TimeParser
import { parseTimeFromMessage } from '../utils/TimeParser';
import { handleOpenMusic } from '../utils/MusicLauncher';

const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

export const useChat = (onApiError?: () => void) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };
  const handleBotResponse = async (text: string) => {
    const botMessage: Message = {
      id: generateId(),
      text,
      sender: "bot",
    };

    setMessages((prev) => [...prev, botMessage]);
    await saveMessage(text, "bot");

    setIsSpeaking(true);
    Speech.speak(text, {
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
  };


  // ✅ UPDATED: Enhanced note extraction with time parsing
  const extractNoteFromMessage = (originalMessage: string, botReply: string): string => {
    let content = originalMessage.toLowerCase();
    
    if (content.includes("tạo ghi chú")) {
      content = content.replace("tạo ghi chú", "").trim();
    }
    
    // Remove time patterns to get clean content
    content = content.replace(/lúc\s+\d{1,2}h\d{0,2}/g, '').trim();
    content = content.replace(/\d{1,2}:\d{2}/g, '').trim();
    content = content.replace(/\d{1,2}\s*giờ(?:\s*\d{1,2}(?:\s*phút)?)?/g, '').trim();
    content = content.replace(/(ngày\s+mai|mai|hôm\s+nay)/g, '').trim();
    content = content.replace(/\d{1,2}(?::(\d{2}))?\s*(am|pm)/gi, '').trim();
    
    if (!content && botReply) {
      const match = botReply.match(/'([^']+)'/);
      if (match) {
        content = match[1];
      }
    }
    
    return content || "Ghi chú không có tiêu đề";
  };

  const handleVoiceResult = (text: string) => {
    console.log("📤 Voice result received:", text);
    setInputText(text);
  };

  const handleSend = async (overrideText?: string) => {
    Vibration.vibrate(50);
    const textToSend = overrideText || inputText.trim();
    if (!textToSend) return;

    console.log("🔍 Processing message:", textToSend);

    // ✅ FIX: Parse time IMMEDIATELY when message is sent
    const timeInfo = parseTimeFromMessage(textToSend);
    console.log("🕐 [useChat] Time info parsed:", timeInfo);

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

    try {
      // Check for app opening
      const { opened, appName } = await checkAndOpenApp(textToSend);
      if (opened) {
        await handleBotResponse(`Đã mở ứng dụng ${appName} cho bạn.`);
        return;
      }

      // 2. Mở nhạc bằng YouTube
      const musicResponse = await handleOpenMusic(textToSend);  // textToSend hoặc msg
      if (musicResponse) {
        await handleBotResponse(musicResponse);
        return;
      }

      // Check for device commands
      const deviceResponse = await handleDeviceCommand(textToSend);
      if (deviceResponse) {
        await handleBotResponse(deviceResponse);
        return;
      }

      console.log("🌐 Calling processMessage API...");
      const botResponse = await processMessage(textToSend);
      console.log("✅ API response received:", botResponse);

      let finalReply = botResponse?.reply || "";
      let responseType = botResponse?.type || "";

      // Check if this should be treated as a note
      const isNoteMessage = textToSend.toLowerCase().includes('ghi chú') || 
                           textToSend.toLowerCase().includes('nhắc') ||
                           timeInfo.isValid;

      console.log("📝 [useChat] Is note message:", isNoteMessage);

      // Handle different response types
      if (!finalReply && (botResponse as any)?.content) {
        finalReply = `Đã tạo ghi chú "${(botResponse as any).content}" thành công!`;
        responseType = "note_created";
      }

      if (!finalReply) {
        finalReply = "Đã xử lý yêu cầu của bạn.";
      }

      // ✅ FIX: Schedule notification BEFORE saving note
      if (timeInfo.isValid) {
        const reminderDateTime = new Date(`${timeInfo.date}T${timeInfo.time}:00`);
        const now = new Date();
        const delayMs = reminderDateTime.getTime() - now.getTime();
        
        console.log(`⏰ [useChat] Reminder details:`);
        console.log(`   - Current time: ${now.toLocaleString('vi-VN')}`);
        console.log(`   - Reminder time: ${reminderDateTime.toLocaleString('vi-VN')}`);
        console.log(`   - Delay (ms): ${delayMs}`);
        console.log(`   - Delay (seconds): ${Math.floor(delayMs / 1000)}`);
        
        if (delayMs > 0) {
          const delaySeconds = Math.floor(delayMs / 1000);
          const noteContent = extractNoteFromMessage(textToSend, finalReply);
          
          console.log(`📢 [useChat] Scheduling notification for: "${noteContent}"`);
          
          try {
            const notificationId = await scheduleReminderNotification(
              delaySeconds, 
              `Nhắc nhở: ${noteContent}`
            );
            console.log(`✅ [useChat] Notification scheduled with ID: ${notificationId}`);
            
            // Update reply to include reminder info
            const timeText = `lúc ${timeInfo.time}`;
            const dateText = timeInfo.date === new Date().toISOString().split('T')[0] 
              ? 'hôm nay' 
              : 'ngày ' + new Date(timeInfo.date).toLocaleDateString('vi-VN');
            
            finalReply += ` Tôi sẽ nhắc bạn ${timeText} ${dateText}.`;
            
          } catch (error) {
            console.error(`❌ [useChat] Failed to schedule notification:`, error);
          }
        } else {
          console.log(`⚠️ [useChat] Reminder time is in the past, not scheduling`);
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

      // ✅ FIX: Save note with parsed time info
      if (responseType === "note_created" || isNoteMessage) {
        const noteContent = extractNoteFromMessage(textToSend, finalReply);
        
        console.log(`💾 [useChat] Saving note: "${noteContent}"`);
        console.log(`💾 [useChat] With time: ${timeInfo.time}, date: ${timeInfo.date}`);
        
        if (noteContent) {
          try {
            const noteId = await saveNote(
              "Ghi chú", 
              noteContent,
              timeInfo.isValid ? timeInfo.time : undefined,
              timeInfo.isValid ? timeInfo.date : undefined
            );
            
            console.log("✅ [useChat] Note saved successfully with ID:", noteId);
            
          } catch (error) {
            console.error("❌ [useChat] Error saving note:", error);
          }
        }
      }

      // Text to speech
      if (finalReply) {
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

    } catch (error) {
      console.error("❌ Lỗi xử lý message:", error);
      
      const errorMessage = "Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn của bạn. Vui lòng thử lại.";
      const errorBotMessage: Message = {
        id: generateId(),
        text: errorMessage,
        sender: "bot",
      };
      
      setMessages((prev) => [...prev, errorBotMessage]);
      scrollToBottom();
      
      if (onApiError) {
        onApiError();
      }
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
    handleVoiceResult,
    scrollToBottom,
  };
};