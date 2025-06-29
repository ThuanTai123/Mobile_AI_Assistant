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
}

export const NotesModal: React.FC<NotesModalProps> = ({
  visible,
  onClose,
  notes,
  onDeleteAll,
  onDeleteNote,
  onMarkCompleted,
  upcomingReminders = [],
}) => {
  // ✅ FIXED: Type-safe helper function
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

  // ✅ FIXED: Type-safe overdue check
  const isOverdue = (time?: string | null, date?: string | null): boolean => {
    if (!time || !date) return false;
    
    const now = new Date();
    const reminderDateTime = new Date(`${date}T${time}:00`);
    
    return reminderDateTime < now;
  };

  // ✅ FIXED: Type-safe note filtering
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
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📝 Ghi chú của bạn</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={onDeleteAll} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {notes.length > 0 ? (
              <>
                {/* Upcoming Reminders Section */}
                {notesWithReminders.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>⏰ Nhắc nhở</Text>
                    </View>
                    {notesWithReminders.map((note, index) => (
                      <View key={`reminder-${note.id || index}`} style={[
                        styles.noteItem,
                        isOverdue(note.reminder_time, note.reminder_date) && styles.overdueNote
                      ]}>
                        <View style={styles.noteHeader}>
                          <View style={styles.noteTitleContainer}>
                            <Text style={styles.noteTitle}>
                              {note.title || note.content || "Không có tiêu đề"}
                            </Text>
                            <Text style={[
                              styles.reminderTime,
                              isOverdue(note.reminder_time, note.reminder_date) && styles.overdueTime
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
                              style={styles.individualDeleteButton}
                            >
                              <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                            </TouchableOpacity>
                          </View>
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
                    ))}
                  </>
                )}

                {/* Regular Notes Section */}
                {regularNotes.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>📝 Ghi chú thường</Text>
                    </View>
                    {regularNotes.map((note, index) => (
                      <View key={`regular-${note.id || index}`} style={styles.noteItem}>
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
                    ))}
                  </>
                )}

                {/* Completed Notes Section */}
                {completedNotes.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>✅ Đã hoàn thành</Text>
                    </View>
                    {completedNotes.map((note, index) => (
                      <View key={`completed-${note.id || index}`} style={[styles.noteItem, styles.completedNote]}>
                        <View style={styles.noteHeader}>
                          <Text style={[styles.noteTitle, styles.completedText]}>
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
                        <Text style={[styles.noteContent, styles.completedText]}>
                          {note.content || note.title || "Không có nội dung"}
                        </Text>
                        <Text style={styles.timestampText}>
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
                <Ionicons name="document-text-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
                <Text style={styles.emptySubText}>
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