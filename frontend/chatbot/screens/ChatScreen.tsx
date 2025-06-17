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
} from "./Notifications"
import { handleDeviceCommand } from "./DeviceCommandHandler"
import { Ionicons } from "@expo/vector-icons"
import { checkAndOpenApp } from "./AppLauncher"
import * as Speech from "expo-speech"
import { sendMessageToBot } from "../api/chat"
import * as Notifications from "expo-notifications"
import { PermissionsAndroid } from "react-native"
import useVoice from "./useVoice"
import SpeakingMicIcon from "./SpeakingMicIcon"
import SQLite from "react-native-sqlite-storage"
import { createChatTable, fetchChatHistory, saveMessage } from "./ChatService"
import { createNoteTable, fetchNotes, saveNote } from "./NoteService"
import { deleteAllChatHistory, deleteAllNotes } from "./database"

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
}

const generateId = () => Date.now() + Math.floor(Math.random() * 1000)

const ChatScreen = () => {
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [historyVisible, setHistoryVisible] = useState(false)
  const [notesVisible, setNotesVisible] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const { isListening, results, partialTranscript, startListening, stopListening } = useVoice()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const db = SQLite.openDatabase(
    {
      name: "ChatApp.db",
      location: "default",
    },
    () => console.log("Database opened"),
    (error: any) => console.error("DB error:", error),
  )
  const handleVoiceResult = (text: string) => {
    console.log("📤 Gửi voice:", text)
    setInputText(text) // Hiển thị vào input (nếu cần)
  }

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
    })
  }

  useEffect(() => {
    const init = async () => {
      await setupNotificationHandler()
      await requestNotificationPermission()
      await setupNotificationChannel()
      //Khởi tạo bảng chat & note
      createChatTable()
      createNoteTable()

      // Load dữ liệu lịch sử
      loadChatHistory()
      loadNotes()
    }
    requestPermissions()
    const requestMicrophonePermission = async () => {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: "Microphone Permission",
          message: "App needs access to your microphone " + "so you can record voice messages.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        })
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("You can use the microphone")
        } else {
          console.log("Microphone permission denied")
        }
      } catch (err) {
        console.warn(err)
      }
    }
    requestMicrophonePermission()
    init()
  }, [])
  useEffect(() => {
    if (results.length > 0) {
      const latestText = results[0]
      handleVoiceResult(latestText)
    }
  }, [results])

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== "granted") {
      alert("Bạn cần cấp quyền thông báo để nhận nhắc nhở")
    }
  }

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true })
  }

  const handleSend = async (overrideText?: string) => {
    Vibration.vibrate(50)
    const textToSend = overrideText || inputText.trim()
    if (!textToSend) return

    const userMessage: Message = {
      id: generateId(),
      text: textToSend,
      sender: "user",
    }

    // ✅ Lưu tin nhắn user vào database
    saveMessage("user", textToSend)

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    scrollToBottom()

    const { opened, appName } = await checkAndOpenApp(textToSend)
    if (opened) {
      const appResponse = `Đã mở ứng dụng ${appName} cho bạn.`
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          text: appResponse,
          sender: "bot",
        },
      ])
      // ✅ Lưu phản hồi bot vào database
      saveMessage("bot", appResponse)
      return
    }

    // Thử xử lý lệnh thiết bị trước
    const deviceResponse = await handleDeviceCommand(textToSend)
    if (deviceResponse) {
      setMessages((prev) => [...prev, { id: generateId(), text: deviceResponse, sender: "bot" }])
      // ✅ Lưu phản hồi thiết bị vào database
      saveMessage("bot", deviceResponse)

      setIsSpeaking(true)
      Speech.speak(deviceResponse, {
        language: "vi-VN",
        pitch: 1,
        rate: 1,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
      return
    }

    // Nếu không xử lý thiết bị, mới gọi bot
    const botResponse = await sendMessageToBot(textToSend)
    const isReminder = /đã tạo nhắc/i.test(botResponse.reply)

    // ✅ Kiểm tra nếu là lệnh tạo ghi chú
    const isCreateNote = /tạo ghi chú/i.test(textToSend)
    if (isCreateNote) {
      // Trích xuất nội dung ghi chú từ tin nhắn
      const noteContent = textToSend.replace(/tạo ghi chú/i, "").trim()
      if (noteContent) {
        // Lưu ghi chú vào database
        saveNote("Ghi chú", noteContent)
        console.log("💾 Đã lưu ghi chú:", noteContent)

        // Load lại danh sách ghi chú
        setTimeout(() => {
          loadNotes()
        }, 500)
      }
    }

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
      sender: "bot",
    }

    // ✅ Lưu phản hồi bot vào database
    saveMessage("bot", botResponse.reply)

    setMessages((prev) => [...prev, botMessage])
    scrollToBottom()

    // ✅ Load lại lịch sử chat sau khi lưu
    setTimeout(() => {
      loadChatHistory()
    }, 500)

    if (!isReminder) {
      setIsSpeaking(true)
      Speech.speak(botResponse.reply, {
        language: "vi-VN",
        pitch: 1,
        rate: 1,
        onDone: () => {
          setIsSpeaking(false)
          setIsRecording(false)
        },
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
      return
    }
  }

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
          deleteAllChatHistory(); // Gọi SQLite
          setChatHistory([]);     // Reset UI
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
          deleteAllNotes(); // Gọi SQLite
          setNotes([]);     // Reset UI
        },
      },
    ]
  );
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>RUBY ASSISTANT</Text>
        </View>

        {/* Messages */}
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

        {/* Input Area */}
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
          {/* Bottom Icons */}
          <View style={styles.bottomIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                loadChatHistory() // Load lại dữ liệu trước khi hiển thị
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
                loadNotes() // Load lại dữ liệu trước khi hiển thị
                setNotesVisible(true)
              }}
            >
              <Ionicons name="calendar-outline" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Lịch sử trò chuyện */}
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

      {/* Modal Ghi chú */}
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
                notes.map((note, index) => (
                  <View key={index} style={styles.noteItem}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <Text style={styles.noteContent}>{note.content}</Text>
                    <Text style={styles.timestampText}>{new Date(note.timestamp).toLocaleString("vi-VN")}</Text>
                  </View>
                ))
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  historyItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  senderLabel: {
    fontWeight: "bold",
    color: "#4ECDC4",
  },
  noteItem: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  noteContent: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 5,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  botMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#45B7B8",
  },
  botBubble: {
    backgroundColor: "#4ECDC4",
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: "#fff",
    paddingTop: 5,
    paddingBottom: Platform.OS === "android" ? 12 : 0,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#F8F8F8",
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#4ECDC4",
    paddingVertical: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  iconButton: {
    padding: 8,
  },
  deleteButton: {
  marginLeft: 10,
  padding: 4,
},
})
