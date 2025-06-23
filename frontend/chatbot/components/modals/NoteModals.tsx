import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../types/Message';
import styles from '../../styles/ChatStyles';

interface NotesModalProps {
  visible: boolean;
  onClose: () => void;
  notes: Note[];
  onDeleteAll: () => void;
  onDeleteNote: (noteId: number, noteTitle: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  visible,
  onClose,
  notes,
  onDeleteAll,
  onDeleteNote,
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
            <Text style={styles.modalTitle}>📝 Ghi chú của bạn</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDeleteAll} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={22} color="#e74c3c" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {notes.length > 0 ? (
              notes.map((note, index) => (
                <View key={note.id || index} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>
                      {note.title || note.content || "Không có tiêu đề"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => onDeleteNote(
                        note.id, 
                        note.title || note.content || "Ghi chú"
                      )}
                      style={styles.individualDeleteButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.noteContent}>
                    {note.content || note.title || "Không có nội dung"}
                  </Text>
                  <Text style={styles.timestampText}>
                    {note.created_at 
                      ? new Date(note.created_at).toLocaleString("vi-VN") 
                      : "Không có thời gian"
                    }
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
                <Text style={styles.emptySubText}>
                  Hãy tạo ghi chú đầu tiên bằng cách nói "tạo ghi chú..."
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};