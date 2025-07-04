"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from "react-native"

import styles from "../styles/ChatStyles"
import useVoice from "../hooks/useVoice"
import { getCurrentCity } from "./location"
import { createChatTable, fetchChatHistory } from "../services/ChatService"
import { createNoteTable, fetchNotes, deleteNoteById } from "../services/NoteService"
import { deleteAllChatHistory, deleteAllNotes, checkTables } from "./database"
import { BottomActions } from "../components/BottomActions"
import { ChatHistoryModal } from "../components/modals/HistoryModals"
import { NotesModal } from "../components/modals/NoteModals"
import { usePermissions } from "../hooks/usePermission"
import { useChat } from "../hooks/useChat"
import { StudyModePanel } from "../components/StudyModePanel"
import {
  setupNotificationChannel,
  requestNotificationPermission,
  setupNotificationHandler,
} from "../utils/Notifications"
import { initializePhoneHandler } from "../utils/PhoneCallHandler"
import { ChatInput } from "../components/ChatInput"

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
}

const ChatScreen = () => {
  const [notes, setNotes] = useState<any[]>([])
  const [historyVisible, setHistoryVisible] = useState(false)
  const [notesVisible, setNotesVisible] = useState(false)
  const [studyPanelVisible, setStudyPanelVisible] = useState(false)
  const [currentCity, setCurrentCity] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [inputText, setInputText] = useState("")
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  usePermissions()

  const { messages, isSpeaking, flatListRef, handleSend, handleVoiceResult } = useChat()
  const { isListening, results, partialTranscript, startListening, stopListening } = useVoice()

  useEffect(() => {
    if (results.length > 0) {
      const latestText = results[0]
      handleVoiceResult(latestText)
      setInputText(latestText)
    }
  }, [results])

  useEffect(() => {
    const init = async () => {
      await checkTables()
      await createChatTable()
      await createNoteTable()
      await requestNotificationPermission()
      setupNotificationHandler()
      if (Platform.OS === "android") await setupNotificationChannel()
      await initializePhoneHandler()
      loadChatHistory()
      loadNotes()
    }
    init()
  }, [])

  useEffect(() => {
    const fetchCity = async () => {
      const city = await getCurrentCity()
      if (city) setCurrentCity(city)
    }
    fetchCity()
  }, [])

  const loadChatHistory = () => {
    fetchChatHistory((history: any[]) => setChatHistory(history))
  }

  const loadNotes = () => {
    fetchNotes((notesList: any[]) => setNotes(notesList))
  }

  const handleDeleteNote = (noteId: number, noteTitle: string) => {
    Alert.alert("Xác nhận xoá", `Bạn có chắc chắn muốn xoá ghi chú "${noteTitle}" không?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => {
          deleteNoteById(noteId, () => loadNotes())
        },
      },
    ])
  }

  const handleDeleteNotes = () => {
    Alert.alert("Xác nhận xoá", "Bạn có chắc chắn muốn xoá toàn bộ ghi chú không?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => {
          deleteAllNotes()
          setNotes([])
        },
      },
    ])
  }

  const handleDeleteChatHistory = () => {
    Alert.alert("Xác nhận xoá", "Bạn có chắc chắn muốn xoá toàn bộ lịch sử trò chuyện không?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => {
          deleteAllChatHistory()
          setChatHistory([])
        },
      },
    ])
  }

  const handleSendMessage = async () => {
    const textToSend = inputText.trim()
    if (!textToSend) return
    setInputText("")
    try {
      await handleSend(textToSend)
      setInputText("")
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.")
    }
  }

  // Dynamic theme styles
  const getThemeStyles = () => ({
    container: {
      ...styles.container,
      backgroundColor: isDarkTheme ? "#0f0f0f" : "#F5F5F5",
    },
    header: {
      ...styles.header,
      backgroundColor: isDarkTheme ? "#1a1a1a" : "#4ECDC4",
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    headerText: {
      ...styles.headerText,
      color: isDarkTheme ? "#ffffff" : "#000",
      fontWeight: "bold" as const,
    },
    messagesList: {
      ...styles.messagesList,
      backgroundColor: isDarkTheme ? "#0f0f0f" : "#F5F5F5",
    },
    userBubble: {
      ...styles.userBubble,
      backgroundColor: isDarkTheme ? "#4ECDC4" : "#45B7B8",
    },
    botBubble: {
      ...styles.botBubble,
      backgroundColor: isDarkTheme ? "#2d2d2d" : "#4ECDC4",
      borderWidth: isDarkTheme ? 1 : 0,
      borderColor: isDarkTheme ? "#404040" : "transparent",
    },
    messageText: {
      ...styles.messageText,
      color: "#fff",
    },
    voiceIndicator: {
      backgroundColor: isDarkTheme ? "#2d2d2d" : "#fff3cd",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkTheme ? "#404040" : "#ffeaa7",
    },
    voiceText: {
      color: isDarkTheme ? "#ffd700" : "#856404",
      fontSize: 14,
      fontStyle: "italic",
    },
  })

  const themeStyles = getThemeStyles()

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer, 
      item.sender === "user" ? styles.userMessage : styles.botMessage
    ]}>
      <View style={[
        styles.messageBubble, 
        item.sender === "user" 
          ? themeStyles.userBubble
          : themeStyles.botBubble
      ]}>
        <Text style={themeStyles.messageText}>
          {item.text}
        </Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={themeStyles.container}>
      <StatusBar 
        backgroundColor={isDarkTheme ? "#1a1a1a" : "#4ECDC4"} 
        barStyle={isDarkTheme ? "light-content" : "dark-content"} 
      />

      <View style={themeStyles.header}>
        <Text style={themeStyles.headerText}>
          RUBY ASSISTANT
        </Text>
        
        {/* Enhanced Theme Toggle Button */}
        <TouchableOpacity
          onPress={() => setIsDarkTheme(!isDarkTheme)}
          style={[
            darkThemeStyles.themeToggle,
            {
              backgroundColor: isDarkTheme ? "#333333" : "#e0f7fa",
              borderColor: isDarkTheme ? "#555555" : "#b2ebf2",
            }
          ]}
          activeOpacity={0.7}
        >
          <Text style={darkThemeStyles.themeIcon}>
            {isDarkTheme ? "☀️" : "🌙"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          style={themeStyles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSend={() => handleSendMessage()}
          isListening={isListening}
          partialTranscript={partialTranscript}
          isDarkTheme={isDarkTheme}
        />

        {isListening && (
          <View style={themeStyles.voiceIndicator}>
            <View style={darkThemeStyles.voiceContainer}>
              <View style={darkThemeStyles.recordingDot} />
              <Text style={themeStyles.voiceText}>
                🎤 Đang nghe... {partialTranscript}
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <BottomActions
        onHistoryPress={() => {
          loadChatHistory();
          setHistoryVisible(true);
        }}
        onNotesPress={() => {
          loadNotes();
          setNotesVisible(true);
        }}
        onStudyModePress={() => setStudyPanelVisible(true)}
        isListening={isListening}
        isSpeaking={isSpeaking}
        startListening={startListening}
        stopListening={stopListening}
        backgroundColor={isDarkTheme ? "#1a1a1a" : "#ffffff"}
        isDarkTheme={isDarkTheme}
      />

      <ChatHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        chatHistory={chatHistory}
        onDeleteAll={handleDeleteChatHistory}
        isDarkTheme={isDarkTheme}
      />

      <NotesModal
        visible={notesVisible}
        onClose={() => setNotesVisible(false)}
        notes={notes}
        onDeleteAll={handleDeleteNotes}
        onDeleteNote={handleDeleteNote}
        isDarkTheme={isDarkTheme}
      />

      <StudyModePanel
        visible={studyPanelVisible}
        onClose={() => setStudyPanelVisible(false)}
        isDarkTheme={isDarkTheme}
      />
    </SafeAreaView>
  );
}

// Dark theme specific styles
const darkThemeStyles = StyleSheet.create({
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  themeIcon: {
    fontSize: 20,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginRight: 8,
    // Animation sẽ được thêm sau nếu cần
  },
})

export default ChatScreen