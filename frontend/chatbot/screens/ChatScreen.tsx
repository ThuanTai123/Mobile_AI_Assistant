"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import styles from "../styles/ChatStyles";
import useVoice from "../hooks/useVoice";
import { getCurrentCity } from "./location";
import {
  createChatTable,
  fetchChatHistory,
  saveMessageAsync,
} from "../services/ChatService";
import {
  createNoteTable,
  fetchNotes,
  saveNote,
  deleteNoteById,
  markNoteCompleted,
  getUpcomingReminders,
} from "../services/NoteService";
import {
  deleteAllChatHistory,
  deleteAllNotes,
  checkTables,
} from "./database";
import { BottomActions } from "../components/BottomActions";
import { ChatHistoryModal } from "../components/modals/HistoryModals";
import { NotesModal } from "../components/modals/NoteModals";
import { ChatInput } from "../components/ChatInput";
import { usePermissions } from "../hooks/usePermission";
import { useChat } from "../hooks/useChat";
import {
  setupNotificationChannel,
  setupNotificationHandler,
  requestNotificationPermission,
} from "../utils/Notifications";
import * as Notifications from 'expo-notifications';

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const ChatScreen = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);

  usePermissions();

  const {
    messages,
    inputText,
    setInputText,
    isSpeaking,
    flatListRef,
    handleSend,
    handleVoiceResult,
  } = useChat();

  const {
    isListening,
    results,
    partialTranscript,
    error,
    startListening,
    stopListening,
  } = useVoice();

  useEffect(() => {
    if (results.length > 0) {
      const latestText = results[0];
      handleVoiceResult(latestText);
    }
  }, [results]);

  useEffect(() => {
    if (error) console.error("🎤 Voice error:", error);
  }, [error]);

  const loadChatHistory = () => {
    fetchChatHistory((history: any[]) => {
      setChatHistory(history);
    });
  };

  const loadNotes = () => {
    fetchNotes((notesList: any[]) => {
      setNotes(notesList);
    });
  };

  const loadUpcomingReminders = () => {
    getUpcomingReminders((reminders: any[]) => {
      setUpcomingReminders(reminders);
    });
  };

  const handleMarkCompleted = (noteId: number, noteTitle: string) => {
    Alert.alert(
      "Hoàn thành", 
      `Đánh dấu "${noteTitle}" đã hoàn thành?`, 
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Hoàn thành",
          style: "default",
          onPress: () => {
            markNoteCompleted(noteId, () => {
              loadNotes();
              loadUpcomingReminders();
            });
          },
        },
      ]
    );
  };

  const handleDeleteNote = (noteId: number, noteTitle: string) => {
    Alert.alert("Xác nhận xoá", `Bạn có chắc chắn muốn xoá ghi chú "${noteTitle}" không?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => {
          deleteNoteById(noteId, () => {
            loadNotes();
            loadUpcomingReminders();
          });
        },
      },
    ]);
  };

  const handleDeleteNotes = () => {
    Alert.alert("Xác nhận xoá", "Bạn có chắc chắn muốn xoá toàn bộ ghi chú không?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => {
          deleteAllNotes();
          setNotes([]);
          setUpcomingReminders([]);
        },
      },
    ]);
  };

  const handleDeleteChatHistory = () => {
    Alert.alert("Xác nhận xoá", "Bạn có chắc chắn muốn xoá toàn bộ lịch sử trò chuyện không?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => {
          deleteAllChatHistory();
          setChatHistory([]);
        },
      },
    ]);
  };

  // Setup notifications
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await requestNotificationPermission();
        await setupNotificationChannel();
        setupNotificationHandler();
      } catch (error) {
        console.error('❌ Error setting up notifications:', error);
      }
    };
    setupNotifications();
  }, []);

  // Handle notification responses
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification tapped');
    });
    return () => subscription.remove();
  }, []);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      await checkTables();
      await createChatTable();
      await createNoteTable();
      loadChatHistory();
      loadNotes();
      loadUpcomingReminders();
    };
    init();
  }, []);

  useEffect(() => {
    const fetchCity = async () => {
      const city = await getCurrentCity();
      if (city) setCurrentCity(city);
    };
    fetchCity();
  }, []);

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.sender === "user" ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4ECDC4" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSend={() => handleSend()}
          isListening={isListening}
          partialTranscript={partialTranscript}
        />

        <BottomActions
          onHistoryPress={() => {
            loadChatHistory();
            setHistoryVisible(true);
          }}
          onNotesPress={() => {
            loadNotes();
            setNotesVisible(true);
          }}
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
        onMarkCompleted={handleMarkCompleted}
        upcomingReminders={upcomingReminders}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;