import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatHistoryItem } from '../../types/Message';
import styles from '../../styles/ChatStyles';

interface ChatHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  chatHistory: ChatHistoryItem[];
  onDeleteAll: () => void;
  isDarkTheme?: boolean;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  visible,
  onClose,
  chatHistory,
  onDeleteAll,
  isDarkTheme = false,
}) => {
  // Dynamic styles based on theme using existing ChatStyles
  const getThemeStyles = () => ({
    overlay: [
      styles.overlay,
      {
        backgroundColor: isDarkTheme ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
      }
    ],
    modalContainer: [
      styles.modalContainer,
      {
        backgroundColor: isDarkTheme ? "#1a1a1a" : "#fff",
      }
    ],
    modalHeader: [
      styles.modalHeader,
      {
        borderBottomColor: isDarkTheme ? "#333" : "#eee",
      }
    ],
    modalTitle: [
      styles.modalTitle,
      {
        color: isDarkTheme ? "#fff" : "#333",
      }
    ],
    historyItem: [
      styles.historyItem,
      {
        backgroundColor: isDarkTheme ? "#2d2d2d" : "#f8f9fa",
      }
    ],
    historyText: [
      styles.historyText,
      {
        color: isDarkTheme ? "#ccc" : "#333",
      }
    ],
    timestampText: [
      styles.timestampText,
      {
        color: isDarkTheme ? "#888" : "#999",
      }
    ],
    emptyText: [
      styles.emptyText,
      {
        color: isDarkTheme ? "#ccc" : "#666",
      }
    ],
    emptySubText: [
      styles.emptySubText,
      {
        color: isDarkTheme ? "#888" : "#999",
      }
    ],
  });

  const themeStyles = getThemeStyles();

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <View style={themeStyles.overlay}>
        <View style={themeStyles.modalContainer}>
          <View style={themeStyles.modalHeader}>
            <Text style={themeStyles.modalTitle}>🕒 Lịch sử trò chuyện</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={onDeleteAll} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={isDarkTheme ? "#ccc" : "#666"} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.modalContent}>
            {chatHistory.length > 0 ? (
              chatHistory.map((item, index) => (
                <View key={index} style={themeStyles.historyItem}>
                  <Text style={themeStyles.historyText}>
                    <Text style={styles.senderLabel}>{item.sender}:</Text> {item.message}
                  </Text>
                  <Text style={themeStyles.timestampText}>
                    {new Date(item.timestamp).toLocaleString("vi-VN")}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={isDarkTheme ? "#666" : "#ccc"} />
                <Text style={themeStyles.emptyText}>Chưa có lịch sử trò chuyện</Text>
                <Text style={themeStyles.emptySubText}>Hãy bắt đầu cuộc trò chuyện đầu tiên!</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};