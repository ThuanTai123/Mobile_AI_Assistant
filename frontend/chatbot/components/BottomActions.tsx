import type React from "react"
import { View, TouchableOpacity, Text, StyleSheet } from "react-native"
import { Ionicons } from '@expo/vector-icons';
import SpeakingMicIcon from './SpeakingMicIcon';



interface BottomActionsProps {
  onHistoryPress: () => void
  onNotesPress: () => void
  onStudyModePress: () => void
  isListening: boolean
  isSpeaking: boolean
  startListening: () => void
  stopListening: () => void
}

export const BottomActions: React.FC<BottomActionsProps> = ({
  onHistoryPress,
  onNotesPress,
  onStudyModePress,
  isListening,
  isSpeaking,
  startListening,
  stopListening,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        {/* Lịch sử */}
        <TouchableOpacity style={styles.actionButton} onPress={onHistoryPress}>
          <Text style={styles.actionIcon}>📚</Text>
          <Text style={styles.actionText}>Lịch sử</Text>
        </TouchableOpacity>

        {/* Ghi chú */}
        <TouchableOpacity style={styles.actionButton} onPress={onNotesPress}>
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>Ghi chú</Text>
        </TouchableOpacity>

        {/* Học tập */}
        <TouchableOpacity style={styles.actionButton} onPress={onStudyModePress}>
          <Text style={styles.actionIcon}>🎓</Text>
          <Text style={styles.actionText}>Học tập</Text>
        </TouchableOpacity>

        {/* Voice Button */}
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isListening && styles.voiceButtonActive,
            isSpeaking && styles.voiceButtonSpeaking,
          ]}
          onPress={isListening ? stopListening : startListening}
          disabled={isSpeaking}
        >
          {isSpeaking ? (
            <SpeakingMicIcon isSpeaking={true} />
          ) : (
            <Text style={styles.voiceIcon}>
              {isListening ? "🎤" : "🎙️"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    minWidth: 70,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  voiceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voiceButtonActive: {
    backgroundColor: "#ff6b6b",
    transform: [{ scale: 1.1 }],
  },
  voiceButtonSpeaking: {
    backgroundColor: "#ffa726",
  },
  voiceIcon: {
    fontSize: 24,
  },
})
