"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import styles from "../styles/ChatStyles"

interface StudyModePanelProps {
  visible: boolean
  onClose: () => void
  isDarkTheme?: boolean
}

export const StudyModePanel: React.FC<StudyModePanelProps> = ({ visible, onClose, isDarkTheme = false }) => {
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const [sessionTime, setSessionTime] = useState(0)
  const [isActive, setIsActive] = useState(false)

  // Dynamic styles based on theme
  const getThemeStyles = () => ({
    overlay: [
      styles.overlay,
      {
        backgroundColor: isDarkTheme ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
      },
    ],
    modalContainer: [
      styles.modalContainer,
      {
        backgroundColor: isDarkTheme ? "#1a1a1a" : "#fff",
      },
    ],
    modalHeader: [
      styles.modalHeader,
      {
        borderBottomColor: isDarkTheme ? "#333" : "#eee",
      },
    ],
    modalTitle: [
      styles.modalTitle,
      {
        color: isDarkTheme ? "#fff" : "#333",
      },
    ],
    statusCard: [
      styles.statusCard,
      {
        backgroundColor: isDarkTheme ? "#2d2d2d" : "#fff",
      },
    ],
    activeMode: [
      styles.activeMode,
      {
        color: isDarkTheme ? "#4ECDC4" : "#4ECDC4",
      },
    ],
    sessionInfo: [
      styles.sessionInfo,
      {
        color: isDarkTheme ? "#ccc" : "#666",
      },
    ],
    inactiveText: [
      styles.inactiveText,
      {
        color: isDarkTheme ? "#888" : "#999",
      },
    ],
    statsCard: [
      styles.statsCard,
      {
        backgroundColor: isDarkTheme ? "#2d2d2d" : "#fff",
      },
    ],
    statNumber: [
      styles.statNumber,
      {
        color: isDarkTheme ? "#4ECDC4" : "#4ECDC4",
      },
    ],
    statLabel: [
      styles.statLabel,
      {
        color: isDarkTheme ? "#ccc" : "#666",
      },
    ],
    tipsCard: [
      styles.tipsCard,
      {
        backgroundColor: isDarkTheme ? "#2d2d2d" : "#fff",
      },
    ],
    tipText: [
      styles.tipText,
      {
        color: isDarkTheme ? "#ccc" : "#666",
      },
    ],
  })

  const themeStyles = getThemeStyles()

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && activeMode) {
      interval = setInterval(() => {
        setSessionTime((time) => time + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, activeMode])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Start study session
  const startSession = (mode: string) => {
    setActiveMode(mode)
    setIsActive(true)
    setSessionTime(0)
  }

  // Stop study session
  const stopSession = () => {
    setIsActive(false)
    setActiveMode(null)
    setSessionTime(0)
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={themeStyles.overlay}>
        <View style={themeStyles.modalContainer}>
          <View style={themeStyles.modalHeader}>
            <Text style={themeStyles.modalTitle}>🎓 Chế độ học tập</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDarkTheme ? "#ccc" : "#666"} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Current Session Status */}
            <View style={themeStyles.statusCard}>
              {activeMode ? (
                <View style={styles.activeSession}>
                  <Text style={themeStyles.activeMode}>
                    {activeMode === "focus" ? "🎯 Tập trung" : activeMode === "review" ? "📚 Ôn tập" : "✍️ Ghi chú"}
                  </Text>
                  <Text style={themeStyles.sessionInfo}>Thời gian: {formatTime(sessionTime)}</Text>
                  <Text style={themeStyles.sessionInfo}>Trạng thái: {isActive ? "Đang hoạt động" : "Tạm dừng"}</Text>
                  <TouchableOpacity style={[styles.actionButton, styles.deactivateButton]} onPress={stopSession}>
                    <Text style={styles.buttonText}>Kết thúc phiên</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={themeStyles.inactiveText}>Chưa có phiên học tập nào đang hoạt động</Text>
              )}
            </View>

            {/* Mode Selection */}
            {!activeMode && (
              <View style={styles.modeSelection}>
                <View style={styles.modeButtons}>
                  <TouchableOpacity
                    style={[styles.modeButton, { backgroundColor: "#4ECDC4" }]}
                    onPress={() => startSession("focus")}
                  >
                    <Text style={styles.modeIcon}>🎯</Text>
                    <Text style={styles.modeText}>Tập trung</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeButton, { backgroundColor: "#45B7B8" }]}
                    onPress={() => startSession("review")}
                  >
                    <Text style={styles.modeIcon}>📚</Text>
                    <Text style={styles.modeText}>Ôn tập</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeButton, { backgroundColor: "#96CEB4" }]}
                    onPress={() => startSession("notes")}
                  >
                    <Text style={styles.modeIcon}>✍️</Text>
                    <Text style={styles.modeText}>Ghi chú</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Study Stats */}
            <View style={themeStyles.statsCard}>
              <Text style={themeStyles.modalTitle}>📊 Thống kê học tập</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={themeStyles.statNumber}>0</Text>
                  <Text style={themeStyles.statLabel}>Phiên hôm nay</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={themeStyles.statNumber}>0</Text>
                  <Text style={themeStyles.statLabel}>Phút học</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={themeStyles.statNumber}>0</Text>
                  <Text style={themeStyles.statLabel}>Ghi chú</Text>
                </View>
              </View>
            </View>

            {/* Study Tips */}
            <View style={themeStyles.tipsCard}>
              <Text style={themeStyles.modalTitle}>💡 Mẹo học tập</Text>
              <Text style={themeStyles.tipText}>• Sử dụng kỹ thuật Pomodoro: 25 phút tập trung, 5 phút nghỉ</Text>
              <Text style={themeStyles.tipText}>• Tạo ghi chú bằng giọng nói để ghi lại ý tưởng nhanh chóng</Text>
              <Text style={themeStyles.tipText}>• Ôn tập thường xuyên để củng cố kiến thức</Text>
              <Text style={themeStyles.tipText}>• Tạo nhắc nhở để không bỏ lỡ thời gian học quan trọng</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}
