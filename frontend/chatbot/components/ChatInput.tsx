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
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  onSend,
  isListening,
  partialTranscript,
}) => {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập..."
          placeholderTextColor="#999"
          returnKeyType="send"
          onSubmitEditing={onSend}
          multiline
        />
        <TouchableOpacity onPress={onSend} style={styles.sendButton}>
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
    </View>
  );
};