"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface StudyModePanelProps {
  visible: boolean
  onClose: () => void
  isDarkTheme?: boolean
}

export const StudyModePanel: React.FC<StudyModePanelProps> = ({ visible, onClose, isDarkTheme = false }) => {
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const [sessionTime, setSessionTime] = useState(0)
  const [isActive, setIsActive] = useState(false)

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

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    overlay: {
      ...styles.overlay,
      backgroundColor: isDarkTheme ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
    },
    modalContainer: {
      ...styles.modalContainer,
      backgroundColor: isDarkTheme ? "#1a1a1a" : "#fff",
    },
    modalHeader: {
      ...styles.modalHeader,
      borderBottomColor: isDarkTheme ? "#333" : "#eee",
    },
    modalTitle: {
      ...styles.modalTitle,
      color: isDarkTheme ? "#fff" : "#333",
    },
    statusCard: {
      ...styles.statusCard,
      backgroundColor: isDarkTheme ? "#2d2d2d" : "#fff",
    },
    activeMode: {
      ...styles.activeMode,
      color: "#4ECDC4",
    },
    sessionInfo: {
      ...styles.sessionInfo,
      color: isDarkTheme ? "#ccc" : "#666",
    },
    inactiveText: {
      ...styles.inactiveText,
      color: isDarkTheme ? "#888" : "#999",
    },
    statsCard: {
      ...styles.statsCard,
      backgroundColor: isDarkTheme ? "#2d2d2d" : "#fff",
    },
    statNumber: {
      ...styles.statNumber,
      color: "#4ECDC4",
    },
    statLabel: {
      ...styles.statLabel,
      color: isDarkTheme ? "#ccc" : "#666",
    },
    tipsCard: {
      ...styles.tipsCard,
      backgroundColor: isDarkTheme ? "#2d2d2d" : "#fff",
    },
    tipText: {
      ...styles.tipText,
      color: isDarkTheme ? "#ccc" : "#666",
    },
  })

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalHeader}>
            <Text style={dynamicStyles.modalTitle}>🎓 Chế độ học tập</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDarkTheme ? "#ccc" : "#666"} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Current Session Status */}
            <View style={dynamicStyles.statusCard}>
              {activeMode ? (
                <View style={styles.activeSession}>
                  <Text style={dynamicStyles.activeMode}>
                    {activeMode === "focus" ? "🎯 Tập trung" : activeMode === "review" ? "📚 Ôn tập" : "✍️ Ghi chú"}
                  </Text>
                  <Text style={dynamicStyles.sessionInfo}>Thời gian: {formatTime(sessionTime)}</Text>
                  <Text style={dynamicStyles.sessionInfo}>Trạng thái: {isActive ? "Đang hoạt động" : "Tạm dừng"}</Text>
                  <TouchableOpacity style={[styles.actionButton, styles.deactivateButton]} onPress={stopSession}>
                    <Text style={styles.buttonText}>Kết thúc phiên</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={dynamicStyles.inactiveText}>Chưa có phiên học tập nào đang hoạt động</Text>
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
            <View style={dynamicStyles.statsCard}>
              <Text style={dynamicStyles.modalTitle}>📊 Thống kê học tập</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={dynamicStyles.statNumber}>0</Text>
                  <Text style={dynamicStyles.statLabel}>Phiên hôm nay</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={dynamicStyles.statNumber}>0</Text>
                  <Text style={dynamicStyles.statLabel}>Phút học</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={dynamicStyles.statNumber}>0</Text>
                  <Text style={dynamicStyles.statLabel}>Ghi chú</Text>
                </View>
              </View>
            </View>

            {/* Study Tips */}
            <View style={dynamicStyles.tipsCard}>
              <Text style={dynamicStyles.modalTitle}>💡 Mẹo học tập</Text>
              <Text style={dynamicStyles.tipText}>• Sử dụng kỹ thuật Pomodoro: 25 phút tập trung, 5 phút nghỉ</Text>
              <Text style={dynamicStyles.tipText}>• Tạo ghi chú bằng giọng nói để ghi lại ý tưởng nhanh chóng</Text>
              <Text style={dynamicStyles.tipText}>• Ôn tập thường xuyên để củng cố kiến thức</Text>
              <Text style={dynamicStyles.tipText}>• Tạo nhắc nhở để không bỏ lỡ thời gian học quan trọng</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "90%",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  statusCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  activeSession: {
    alignItems: "center",
  },
  activeMode: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sessionInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  inactiveText: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 15,
  },
  deactivateButton: {
    backgroundColor: "#FF6B6B",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  modeSelection: {
    marginBottom: 20,
  },
  modeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  modeButton: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modeIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  modeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
  statsCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  tipsCard: {
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
})
