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
  onMarkCompleted?: (noteId: number, noteTitle: string) => void;
  upcomingReminders?: Note[];
  isDarkTheme?: boolean;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  visible,
  onClose,
  notes,
  onDeleteAll,
  onDeleteNote,
  onMarkCompleted,
  upcomingReminders = [],
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
    sectionHeader: [
      styles.sectionHeader,
      {
        backgroundColor: isDarkTheme ? "#2d2d2d" : "#f8f9fa",
        borderBottomColor: isDarkTheme ? "#404040" : "#e9ecef",
      }
    ],
    sectionTitle: [
      styles.sectionTitle,
      {
        color: isDarkTheme ? "#fff" : "#495057",
      }
    ],
    noteItem: [
      styles.noteItem,
      {
        backgroundColor: isDarkTheme ? "#2d2d2d" : "#fff3cd",
        borderLeftColor: isDarkTheme ? "#4ECDC4" : "#ffc107",
      }
    ],
    noteTitle: [
      styles.noteTitle,
      {
        color: isDarkTheme ? "#fff" : "#333",
      }
    ],
    noteContent: [
      styles.noteContent,
      {
        color: isDarkTheme ? "#ccc" : "#666",
      }
    ],
    timestampText: [
      styles.timestampText,
      {
        color: isDarkTheme ? "#888" : "#999",
      }
    ],
    reminderTime: [
      styles.reminderTime,
      {
        color: isDarkTheme ? "#4ECDC4" : "#007bff",
      }
    ],
    overdueTime: [
      styles.overdueTime,
      {
        color: isDarkTheme ? "#ff6666" : "#dc3545",
      }
    ],
    overdueNote: [
      styles.overdueNote,
      {
        borderLeftColor: isDarkTheme ? "#ff6666" : "#dc3545",
      }
    ],
    completedNote: [
      styles.completedNote,
      {
        backgroundColor: isDarkTheme ? "#1a1a1a" : "#f8f9fa",
      }
    ],
    completedText: [
      styles.completedText,
      {
        color: isDarkTheme ? "#888" : "#6c757d",
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
    individualDeleteButton: [
      styles.individualDeleteButton,
      {
        backgroundColor: isDarkTheme ? "#333" : "#fff",
      }
    ],
  });

  const themeStyles = getThemeStyles();

  // Helper functions
  const formatReminderTime = (time?: string | null, date?: string | null): string => {
    if (!time) return '';
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    let timeText = `⏰ ${time}`;
    
    if (date) {
      if (date === today) {
        timeText += ' hôm nay';
      } else if (date === tomorrowStr) {
        timeText += ' ngày mai';
      } else {
        const dateObj = new Date(date);
        timeText += ` ${dateObj.toLocaleDateString('vi-VN')}`;
      }
    }
    
    return timeText;
  };

  const isOverdue = (time?: string | null, date?: string | null): boolean => {
    if (!time || !date) return false;
    
    const now = new Date();
    const reminderDateTime = new Date(`${date}T${time}:00`);
    
    return reminderDateTime < now;
  };

  const activeNotes = notes.filter(note => !note.is_completed);
  const completedNotes = notes.filter(note => Boolean(note.is_completed));
  const notesWithReminders = activeNotes.filter(note => Boolean(note.reminder_time));
  const regularNotes = activeNotes.filter(note => !note.reminder_time);

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
            <Text style={themeStyles.modalTitle}>📝 Ghi chú của bạn</Text>
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
            {notes.length > 0 ? (
              <>
                {/* Upcoming Reminders Section */}
                {notesWithReminders.length > 0 && (
                  <>
                    <View style={themeStyles.sectionHeader}>
                      <Text style={themeStyles.sectionTitle}>⏰ Nhắc nhở</Text>
                    </View>
                    {notesWithReminders.map((note, index) => (
                      <View key={`reminder-${note.id || index}`} style={[
                        themeStyles.noteItem,
                        isOverdue(note.reminder_time, note.reminder_date) && themeStyles.overdueNote
                      ]}>
                        <View style={styles.noteHeader}>
                          <View style={styles.noteTitleContainer}>
                            <Text style={themeStyles.noteTitle}>
                              {note.title || note.content || "Không có tiêu đề"}
                            </Text>
                            <Text style={[
                              themeStyles.reminderTime,
                              isOverdue(note.reminder_time, note.reminder_date) && themeStyles.overdueTime
                            ]}>
                              {formatReminderTime(note.reminder_time, note.reminder_date)}
                            </Text>
                          </View>
                          <View style={styles.noteActions}>
                            {onMarkCompleted && (
                              <TouchableOpacity
                                onPress={() => onMarkCompleted(
                                  note.id, 
                                  note.title || note.content || "Ghi chú"
                                )}
                                style={styles.completeButton}
                              >
                                <Ionicons name="checkmark-circle-outline" size={20} color="#27ae60" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => onDeleteNote(
                                note.id, 
                                note.title || note.content || "Ghi chú"
                              )}
                              style={themeStyles.individualDeleteButton}
                            >
                              <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={themeStyles.noteContent}>
                          {note.content || note.title || "Không có nội dung"}
                        </Text>
                        <Text style={themeStyles.timestampText}>
                          {note.created_at 
                            ? new Date(note.created_at).toLocaleString("vi-VN") 
                            : "Không có thời gian"
                          }
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Regular Notes Section */}
                {regularNotes.length > 0 && (
                  <>
                    <View style={themeStyles.sectionHeader}>
                      <Text style={themeStyles.sectionTitle}>📝 Ghi chú thường</Text>
                    </View>
                    {regularNotes.map((note, index) => (
                      <View key={`regular-${note.id || index}`} style={themeStyles.noteItem}>
                        <View style={styles.noteHeader}>
                          <Text style={themeStyles.noteTitle}>
                            {note.title || note.content || "Không có tiêu đề"}
                          </Text>
                          <TouchableOpacity
                            onPress={() => onDeleteNote(
                              note.id, 
                              note.title || note.content || "Ghi chú"
                            )}
                            style={themeStyles.individualDeleteButton}
                          >
                            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                        <Text style={themeStyles.noteContent}>
                          {note.content || note.title || "Không có nội dung"}
                        </Text>
                        <Text style={themeStyles.timestampText}>
                          {note.created_at 
                            ? new Date(note.created_at).toLocaleString("vi-VN") 
                            : "Không có thời gian"
                          }
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Completed Notes Section */}
                {completedNotes.length > 0 && (
                  <>
                    <View style={themeStyles.sectionHeader}>
                      <Text style={themeStyles.sectionTitle}>✅ Đã hoàn thành</Text>
                    </View>
                    {completedNotes.map((note, index) => (
                      <View key={`completed-${note.id || index}`} style={[themeStyles.noteItem, themeStyles.completedNote]}>
                        <View style={styles.noteHeader}>
                          <Text style={[themeStyles.noteTitle, themeStyles.completedText]}>
                            {note.title || note.content || "Không có tiêu đề"}
                          </Text>
                          <TouchableOpacity
                            onPress={() => onDeleteNote(
                              note.id, 
                              note.title || note.content || "Ghi chú"
                            )}
                            style={themeStyles.individualDeleteButton}
                          >
                            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                        <Text style={[themeStyles.noteContent, themeStyles.completedText]}>
                          {note.content || note.title || "Không có nội dung"}
                        </Text>
                        <Text style={themeStyles.timestampText}>
                          {note.created_at 
                            ? new Date(note.created_at).toLocaleString("vi-VN") 
                            : "Không có thời gian"
                          }
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={isDarkTheme ? "#666" : "#ccc"} />
                <Text style={themeStyles.emptyText}>Chưa có ghi chú nào</Text>
                <Text style={themeStyles.emptySubText}>
                  Hãy tạo ghi chú đầu tiên bằng cách nói "tạo ghi chú..." hoặc "nhắc tôi đi ăn cơm lúc 12h"
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};