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


interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

const ChatScreen = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

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

  const extractNoteFromMessage = (originalMessage: string, botReply: string): string => {
    let content = originalMessage.toLowerCase();
    if (content.includes("tạo ghi chú")) {
      content = content.replace("tạo ghi chú", "").trim();
    }
    if (!content && botReply) {
      const match = botReply.match(/'([^']+)'/);
      if (match) content = match[1];
    }
    return content || "Ghi chú không có tiêu đề";
  };

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

  const handleDeleteNote = (noteId: number, noteTitle: string) => {
    Alert.alert("Xác nhận xoá", `Bạn có chắc chắn muốn xoá ghi chú "${noteTitle}" không?`, [
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

  useEffect(() => {
    const init = async () => {
      await checkTables();
      await createChatTable();
      await createNoteTable();
      loadChatHistory();
      loadNotes();
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
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
