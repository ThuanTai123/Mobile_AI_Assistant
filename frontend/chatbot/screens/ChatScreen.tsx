"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
} from "react-native"
import {
  setupNotificationChannel,
  requestNotificationPermission,
  setupNotificationHandler,
  scheduleReminderNotification,
} from './Notifications'; 
import { handleDeviceCommand } from './DeviceCommandHandler';
import { Ionicons } from '@expo/vector-icons';
import { checkAndOpenApp } from './AppLauncher';
import * as Speech from 'expo-speech';
// import { sendMessageToBot } from '../api/chat';
import * as Notifications from 'expo-notifications';
import styles from "../styles/ChatStyles";
import { PermissionsAndroid } from 'react-native';
import useVoice from './useVoice';
import SpeakingMicIcon from './SpeakingMicIcon';
import { getCurrentCity } from './location';
import { processMessage } from '../api/chat';
import { createChatTable, fetchChatHistory, saveMessage } from "./ChatService"
import { createNoteTable, fetchNotes, saveNote, deleteNoteById, testDatabase } from "./NoteService"
import { deleteAllChatHistory, deleteAllNotes } from "./database"

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Yêu cầu quyền Microphone',
          message: 'Ứng dụng cần quyền truy cập micro để nhận dạng giọng nói.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Từ chối',
          buttonPositive: 'Đồng ý',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Quyền bị từ chối', 'Không thể sử dụng chức năng ghi âm.');
      }
    } catch (err) {
      console.warn(err);
    }
  }
};


interface Message {
  id: number
  text: string
  sender: "user" | "bot"
}

const generateId = () => Date.now() + Math.floor(Math.random() * 1000)

const ChatScreen = () => {

  const [notes, setNotes] = useState<any[]>([])
  const [historyVisible, setHistoryVisible] = useState(false)
  const [notesVisible, setNotesVisible] = useState(false)
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { isListening, results,partialTranscript, startListening, stopListening } = useVoice();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const handleVoiceResult = (text: string) => {
  console.log('📤 Gửi voice:', text);
  setInputText(text);    // Hiển thị vào input (nếu cần)
};

  // Hàm load lại dữ liệu từ database
  const loadChatHistory = () => {
    fetchChatHistory((history: any[]) => {
      setChatHistory(history)
      console.log("📚 Loaded chat history:", history.length, "messages")
    })
  }

  const loadNotes = () => {
    fetchNotes((notesList: any[]) => {
      setNotes(notesList)
      console.log("📝 Loaded notes:", notesList.length, "notes")
      // ✅ THÊM: Debug chi tiết từng ghi chú
      notesList.forEach((note, index) => {
        console.log(`📋 Note ${index + 1}:`, {
          id: note.id,
          title: note.title,
          content: note.content,
          created_at: note.created_at
        });
      });
    })
  }
  // Hàm xóa ghi chú theo ID
  const handleDeleteNote = (noteId: number, noteTitle: string) => {
    Alert.alert(
      "Xác nhận xoá",
      `Bạn có chắc chắn muốn xoá ghi chú "${noteTitle}" không?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => {
            deleteNoteById(noteId, () => {
              loadNotes();
            });
          },
        },
      ]
    );
  };
  const handleDeleteNotes = () => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá toàn bộ ghi chú không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => {
            deleteAllNotes();
            setNotes([]);
          },
        },
      ]
    );
  };

  const handleDeleteChatHistory = () => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá toàn bộ lịch sử trò chuyện không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => {
            deleteAllChatHistory();
            setChatHistory([]);
          },
        },
      ]
    );
  };  
  useEffect(() => {  
    const init = async () => {
    await setupNotificationHandler();
    await requestNotificationPermission();  
    await setupNotificationChannel();
    await requestPermissions();
    await requestMicrophonePermission();
    };
    
    init();
  }, []);
  useEffect(() => {
    if (results.length > 0) {
      const latestText = results[0]
      handleVoiceResult(latestText)
    }
  }, [results]);

 useEffect(() => {
      const fetchCity = async () => {
        const city = await getCurrentCity();
        if (city) {
          setCurrentCity(city);
        }
      };
      fetchCity(); // gọi ngay khi màn hình load
    }, 
  []);
  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== "granted") {
      alert("Bạn cần cấp quyền thông báo để nhận nhắc nhở")
    }
  }

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true })
  }

  // ✅ FIXED: handleSend với async/await cho note creation
  // ✅ FIXED: Sửa lỗi TypeScript cho error handling
const handleSend = async (overrideText?: string) => {
  Vibration.vibrate(50)
  const textToSend = overrideText || inputText.trim()
  if (!textToSend) return

  console.log("🔍 Processing message:", textToSend);

  const userMessage: Message = {
    id: generateId(),
    text: textToSend,
    sender: "user",
  }

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();
    
    const { opened, appName } = await checkAndOpenApp(textToSend);
    if (opened) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          text: `Đã mở ứng dụng ${appName} cho bạn.`,
          sender: 'bot',
        },
      ]);
      return;
    }
 // Thử xử lý lệnh thiết bị trước
  const deviceResponse = await handleDeviceCommand(textToSend);
  if (deviceResponse) {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), text: deviceResponse, sender: 'bot' },
    ]);
    // ✅ Không gọi bot nữa nếu đã xử lý
    setIsSpeaking(true);
    Speech.speak(deviceResponse, {
      language: 'vi-VN',
      pitch: 1,
      rate: 1,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    return;
  }

  // Nếu không xử lý thiết bị, mới gọi bot
  const botResponse = await processMessage(textToSend);
  const isReminder = /đã tạo nhắc/i.test(botResponse.reply);
  if (isReminder) {
    const match = textToSend.match(/(\d+)\s*(giây|giay|seconds?)/i)
    if (match) {
      const delaySeconds = Number.parseInt(match[1])
      if (!isNaN(delaySeconds)) {
        await scheduleReminderNotification(delaySeconds, textToSend)
      }
    }
  }
    
    const botMessage: Message = {
      id: generateId(),
      text: botResponse.reply,
      sender: 'bot',
    };
    
    setMessages((prev) => [...prev, botMessage]);
    scrollToBottom();
    console.log("✅ Bot type:", botResponse.type)
    if (botResponse.type === 'note_created') {
      loadNotes();
      setNotesVisible(true);
    }
    if (!isReminder) {
      setIsSpeaking(true);
      Speech.speak(botResponse.reply, {
      language: 'vi-VN',
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
   
  };


  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.sender === "user" ? styles.userMessage : styles.botMessage]}>
      <View style={[styles.messageBubble, item.sender === "user" ? styles.userBubble : styles.botBubble]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4ECDC4" barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>RUBY ASSISTANT</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập..."
              placeholderTextColor="#999"
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              multiline
            />
            <TouchableOpacity onPress={() => handleSend()} style={styles.sendButton}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {isListening && partialTranscript !== "" && (
            <View style={{ padding: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontStyle: "italic", color: "#555" }}>
                🎙️ Đang nói: <Text style={{ fontWeight: "600" }}>{partialTranscript}</Text>
              </Text>
            </View>
          )}
          <View style={styles.bottomIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                loadChatHistory()
                setHistoryVisible(true)
              }}
            >
              <Ionicons name="time-outline" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={isListening ? stopListening : startListening}>
              {isSpeaking ? (
                <SpeakingMicIcon isSpeaking={true} />
              ) : (
                <Ionicons name={isListening ? "mic" : "mic-outline"} size={28} color={isListening ? "red" : "#000"} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                loadNotes()
                setNotesVisible(true)
              }}
            >
              <Ionicons name="calendar-outline" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal transparent visible={historyVisible} animationType="slide" onRequestClose={() => setHistoryVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🕒 Lịch sử trò chuyện</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteChatHistory} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {chatHistory.length > 0 ? (
                chatHistory.map((item, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyText}>
                      <Text style={styles.senderLabel}>{item.sender}:</Text> {item.message}
                    </Text>
                    <Text style={styles.timestampText}>{new Date(item.timestamp).toLocaleString("vi-VN")}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Chưa có lịch sử trò chuyện</Text>
                  <Text style={styles.emptySubText}>Hãy bắt đầu cuộc trò chuyện đầu tiên!</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ✅ FIXED: Modal Ghi chú với debug chi tiết */}
      <Modal transparent visible={notesVisible} animationType="slide" onRequestClose={() => setNotesVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Ghi chú của bạn</Text>
              <TouchableOpacity onPress={() => setNotesVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteNotes} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {notes.length > 0 ? (
                notes.map((note, index) => {
                  console.log(`🎨 Rendering note ${index + 1}:`, note);
                  
                  return (
                    <View key={note.id || index} style={styles.noteItem}>
                      <View style={styles.noteHeader}>
                        <Text style={styles.noteTitle}>
                          {note.title || note.content || "Không có tiêu đề"}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => handleDeleteNote(note.id, note.title || note.content || "Ghi chú")}
                          style={styles.individualDeleteButton}
                        >
                          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.noteContent}>
                        {note.content || note.title || "Không có nội dung"}
                      </Text>
                      <Text style={styles.timestampText}>
                        {note.created_at ? new Date(note.created_at).toLocaleString("vi-VN") : "Không có thời gian"}
                      </Text>
                      <Text style={styles.debugText}>
                        DEBUG: ID={note.id}, Title="{note.title}", Content="{note.content}"
                      </Text>
                    </View>
                  )
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
                  <Text style={styles.emptySubText}>Hãy tạo ghi chú đầu tiên bằng cách nói "tạo ghi chú..."</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
export default ChatScreen
