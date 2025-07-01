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
  TextInput,
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

    try {
      await handleSend(textToSend)
      setInputText("")
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.")
    }
  }

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
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <View style={inputStyles.inputContainer}>
          <TextInput
            style={inputStyles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            multiline
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={inputStyles.sendButton} onPress={handleSendMessage}>
            <Text style={inputStyles.sendButtonText}>Gửi</Text>
          </TouchableOpacity>
        </View>

        {isListening && (
          <View style={inputStyles.voiceIndicator}>
            <Text style={inputStyles.voiceText}>🎤 Đang nghe... {partialTranscript}</Text>
          </View>
        )}

        <BottomActions
          onHistoryPress={() => {
            loadChatHistory()
            setHistoryVisible(true)
          }}
          onNotesPress={() => {
            loadNotes()
            setNotesVisible(true)
          }}
          onStudyModePress={() => setStudyPanelVisible(true)}
          isListening={isListening}
          isSpeaking={isSpeaking}
          startListening={startListening}
          stopListening={stopListening}
        />
      </KeyboardAvoidingView>

      <ChatHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        chatHistory={chatHistory}
        onDeleteAll={handleDeleteChatHistory}
      />

      <NotesModal
        visible={notesVisible}
        onClose={() => setNotesVisible(false)}
        notes={notes}
        onDeleteAll={handleDeleteNotes}
        onDeleteNote={handleDeleteNote}
      />

      <StudyModePanel visible={studyPanelVisible} onClose={() => setStudyPanelVisible(false)} />
    </SafeAreaView>
  )
}

const inputStyles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  voiceIndicator: {
    backgroundColor: "#fff3cd",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#ffeaa7",
  },
  voiceText: {
    color: "#856404",
    fontSize: 14,
    fontStyle: "italic",
  },
})

export default ChatScreen
