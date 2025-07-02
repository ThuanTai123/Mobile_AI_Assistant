import type React from "react"
import { View, TouchableOpacity, Text, StyleSheet } from "react-native"
import SpeakingMicIcon from "./SpeakingMicIcon"
import styles from "../styles/ChatStyles"

interface BottomActionsProps {
  onHistoryPress: () => void
  onNotesPress: () => void
  onStudyModePress: () => void
  isListening: boolean
  isSpeaking: boolean
  startListening: () => void
  stopListening: () => void
  backgroundColor?: string
  isDarkTheme?: boolean
}

export const BottomActions: React.FC<BottomActionsProps> = ({
  onHistoryPress,
  onNotesPress,
  onStudyModePress,
  isListening,
  isSpeaking,
  startListening,
  stopListening,
  backgroundColor,
  isDarkTheme = false,
}) => {
  // Enhanced dark theme colors
  const getThemeStyles = () => ({
    container: [
      bottomStyles.container,
      {
        backgroundColor: backgroundColor || (isDarkTheme ? "#1F2937" : "#fff"),
        borderTopColor: isDarkTheme ? "#374151" : "#e0e0e0",
      },
    ],
    actionButton: [
      bottomStyles.actionButton,
      {
        backgroundColor: isDarkTheme ? "#374151" : "#f5f5f5",
      },
    ],
    actionText: [
      styles.actionText,
      {
        color: isDarkTheme ? "#9CA3AF" : "#666",
      },
    ],
    voiceButton: [
      bottomStyles.voiceButton,
      {
        backgroundColor: isListening ? "#EF4444" : "#4ECDC4", // Đỏ khi listening, xanh lá khi inactive
      },
    ],
  })

  const themeStyles = getThemeStyles()

  return (
    <View style={themeStyles.container}>
      <View style={styles.actionRow}>
        {/* Lịch sử */}
        <TouchableOpacity style={themeStyles.actionButton} onPress={onHistoryPress}>
          <Text style={styles.actionIcon}>📚</Text>
          <Text style={themeStyles.actionText}>Lịch sử</Text>
        </TouchableOpacity>

        {/* Ghi chú */}
        <TouchableOpacity style={themeStyles.actionButton} onPress={onNotesPress}>
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={themeStyles.actionText}>Ghi chú</Text>
        </TouchableOpacity>

        {/* Học tập */}
        <TouchableOpacity style={themeStyles.actionButton} onPress={onStudyModePress}>
          <Text style={styles.actionIcon}>🎓</Text>
          <Text style={themeStyles.actionText}>Học tập</Text>
        </TouchableOpacity>

        {/* Voice Button */}
        <TouchableOpacity
          style={[themeStyles.voiceButton, isSpeaking && bottomStyles.voiceButtonSpeaking]}
          onPress={isListening ? stopListening : startListening}
          disabled={isSpeaking}
        >
          {isSpeaking ? (
            <SpeakingMicIcon isSpeaking={true} />
          ) : (
            <Text style={bottomStyles.voiceIcon}>{isListening ? "🎤" : "🎙️"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const bottomStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    minWidth: 70,
  },
  voiceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4ECDC4",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voiceButtonSpeaking: {
    backgroundColor: "#4ECDC4",
  },
  voiceIcon: {
    fontSize: 24,
  },
})
