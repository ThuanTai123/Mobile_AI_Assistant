"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from "react-native"
import { studyModeManager, type StudySession } from "../utils/StudyModeManager"
import styles from "../styles/ChatStyles"
interface StudyModePanelProps {
  visible: boolean
  onClose: () => void
}

export const StudyModePanel: React.FC<StudyModePanelProps> = ({ visible, onClose }) => {
  const [isActive, setIsActive] = useState(false)
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageSession: 0,
    pomodoroCount: 0,
  })
  const [selectedMode, setSelectedMode] = useState<"study" | "work" | "focus">("study")

  useEffect(() => {
    if (visible) {
      loadData()
    }
  }, [visible])

  const loadData = async () => {
    const status = studyModeManager.getStatus()
    setIsActive(status.isActive)
    setCurrentSession(status.currentSession)

    const studyStats = await studyModeManager.getStudyStats()
    setStats(studyStats)
  }

  const handleActivateMode = async (mode: "study" | "work" | "focus") => {
    try {
      await studyModeManager.activateStudyMode(mode)
      await loadData()
    } catch (error) {
      console.error("Error activating study mode:", error)
    }
  }

  const handleDeactivateMode = async () => {
    try {
      await studyModeManager.deactivateStudyMode()
      await loadData()
    } catch (error) {
      console.error("Error deactivating study mode:", error)
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "study":
        return "🎓"
      case "work":
        return "💼"
      case "focus":
        return "🎯"
      default:
        return "📚"
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "study":
        return "#4ECDC4"
      case "work":
        return "#45B7D1"
      case "focus":
        return "#96CEB4"
      default:
        return "#4ECDC4"
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎓 Chế độ học tập</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Current Status */}
          <View style={styles.statusCard}>
            <Text style={styles.sectionTitle}>Trạng thái hiện tại</Text>
            {isActive && currentSession ? (
              <View style={styles.activeSession}>
                <Text style={styles.activeMode}>
                  {getModeIcon(currentSession.mode)} Chế độ {currentSession.mode}
                </Text>
                <Text style={styles.sessionInfo}>
                  ⏰ Bắt đầu: {new Date(currentSession.startTime).toLocaleTimeString("vi-VN")}
                </Text>
                <Text style={styles.sessionInfo}>🍅 Pomodoro: {currentSession.pomodoroCount}</Text>
                <TouchableOpacity style={[styles.actionButton, styles.deactivateButton]} onPress={handleDeactivateMode}>
                  <Text style={styles.buttonText}>Tắt chế độ học tập</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.inactiveText}>😴 Không có chế độ nào đang hoạt động</Text>
            )}
          </View>

          {/* Mode Selection */}
          {!isActive && (
            <View style={styles.modeSelection}>
              <Text style={styles.sectionTitle}>Chọn chế độ</Text>
              <View style={styles.modeButtons}>
                {(["study", "work", "focus"] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeButton, { backgroundColor: getModeColor(mode) }]}
                    onPress={() => handleActivateMode(mode)}
                  >
                    <Text style={styles.modeIcon}>{getModeIcon(mode)}</Text>
                    <Text style={styles.modeText}>
                      {mode === "study" ? "Học tập" : mode === "work" ? "Làm việc" : "Tập trung"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Statistics */}
          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>📊 Thống kê</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Phiên học</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalMinutes}</Text>
                <Text style={styles.statLabel}>Phút</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.averageSession}</Text>
                <Text style={styles.statLabel}>TB/Phiên</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.pomodoroCount}</Text>
                <Text style={styles.statLabel}>🍅 Pomodoro</Text>
              </View>
            </View>
          </View>

          {/* Quick Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.sectionTitle}>💡 Mẹo sử dụng</Text>
            <Text style={styles.tipText}>• Nói "Bật chế độ học tập" để kích hoạt</Text>
            <Text style={styles.tipText}>• Nói "Tắt chế độ học tập" để dừng</Text>
            <Text style={styles.tipText}>• Nói "Thống kê học tập" để xem tiến độ</Text>
            <Text style={styles.tipText}>• Chế độ sẽ tự động điều chỉnh độ sáng và âm thanh</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}


