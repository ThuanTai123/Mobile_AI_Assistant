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
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  visible,
  onClose,
  chatHistory,
  onDeleteAll,
}) => {
  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🕒 Lịch sử trò chuyện</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDeleteAll} style={styles.deleteButton}>
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
                  <Text style={styles.timestampText}>
                    {new Date(item.timestamp).toLocaleString("vi-VN")}
                  </Text>
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
  );
};