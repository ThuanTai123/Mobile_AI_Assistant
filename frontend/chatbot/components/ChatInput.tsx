import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/ChatStyles';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  isListening: boolean;
  partialTranscript: string;
  isDarkTheme?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  onSend,
  isListening,
  partialTranscript,
  isDarkTheme = false,
}) => {
  // Dynamic styles based on theme using existing ChatStyles
  const getThemeStyles = () => ({
    inputContainer: [
      styles.inputContainer,
      {
        backgroundColor: isDarkTheme ? "#1a1a1a" : "#fff",
      }
    ],
    textInput: [
      styles.textInput,
      {
        backgroundColor: isDarkTheme ? "#2d2d2d" : "#F8F8F8",
        borderColor: isDarkTheme ? "#404040" : "#E0E0E0",
        color: isDarkTheme ? "#fff" : "#000",
      }
    ],
    partialTranscriptContainer: {
      padding: 8,
      paddingHorizontal: 12,
      backgroundColor: isDarkTheme ? "#2d2d2d" : "#f0f9ff",
      borderTopWidth: 1,
      borderTopColor: isDarkTheme ? "#404040" : "#e0f7fa",
    },
    partialTranscriptText: {
      fontStyle: "italic" as const, // Fix TypeScript error
      color: isDarkTheme ? "#4ECDC4" : "#555",
    },
    partialTranscriptBold: {
      fontWeight: "600" as const, // Fix TypeScript error
      color: isDarkTheme ? "#fff" : "#000",
    },
  });

  const themeStyles = getThemeStyles();

  return (
    <View style={themeStyles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={themeStyles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập..."
          placeholderTextColor={isDarkTheme ? "#888" : "#999"}
          returnKeyType="send"
          onSubmitEditing={onSend}
          multiline
        />
        <TouchableOpacity onPress={onSend} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {isListening && partialTranscript !== "" && (
        <View style={themeStyles.partialTranscriptContainer}>
          <Text style={themeStyles.partialTranscriptText}>
            🎙️ Đang nói: <Text style={themeStyles.partialTranscriptBold}>{partialTranscript}</Text>
          </Text>
        </View>
      )}
    </View>
  );
};