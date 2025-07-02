import { Vibration } from "react-native"
import * as Brightness from "expo-brightness"
import * as Notifications from "expo-notifications"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { checkAndOpenApp } from "./AppLauncher"
import { scheduleReminderNotification } from "./Notifications"
import { setBrightnessLevel } from "../screens/DeviceControls"

export interface StudyModeConfig {
  brightness: number
  silentMode: boolean
  pomodoroMinutes: number
  breakMinutes: number
  studyApps: string[]
  autoOpenApp?: string
}

export interface StudySession {
  id: string
  mode: "study" | "work" | "focus"
  startTime: string
  endTime?: string
  duration: number // in minutes
  completed: boolean
  pomodoroCount: number
}

class StudyModeManager {
  private currentSession: StudySession | null = null
  private originalBrightness = 1
  private originalNotificationSettings: any = null
  private pomodoroTimer: NodeJS.Timeout | null = null
  private isActive = false

  // Default configurations
  private defaultConfigs: Record<string, StudyModeConfig> = {
    study: {
      brightness: 0.3,
      silentMode: true,
      pomodoroMinutes: 25,
      breakMinutes: 5,
      studyApps: ["study", "notes", "calculator", "dictionary"],
      autoOpenApp: "notes",
    },
    work: {
      brightness: 0.5,
      silentMode: true,
      pomodoroMinutes: 45,
      breakMinutes: 10,
      studyApps: ["email", "calendar", "documents", "slack"],
      autoOpenApp: "calendar",
    },
    focus: {
      brightness: 0.4,
      silentMode: true,
      pomodoroMinutes: 30,
      breakMinutes: 5,
      studyApps: ["meditation", "music", "timer"],
      autoOpenApp: "timer",
    },
  }

  /**
   * Bật chế độ học tập/làm việc
   */
  async activateStudyMode(mode: "study" | "work" | "focus" = "study"): Promise<string> {
    try {
      console.log(`🎓 Activating ${mode} mode...`)

      if (this.isActive) {
        return `Chế độ ${mode} đã được bật rồi. Hãy tắt chế độ hiện tại trước.`
      }

      const config = this.defaultConfigs[mode]

      // Lưu trạng thái hiện tại
      await this.saveCurrentState()

      // Áp dụng cấu hình chế độ học tập
      await this.applyStudyConfiguration(config)

      // Tạo session mới
      this.currentSession = {
        id: Date.now().toString(),
        mode,
        startTime: new Date().toISOString(),
        duration: config.pomodoroMinutes,
        completed: false,
        pomodoroCount: 0,
      }

      // Lưu session
      await this.saveSession(this.currentSession)

      // Bắt đầu Pomodoro timer
      await this.startPomodoroTimer(config.pomodoroMinutes, config.breakMinutes)

      // Mở ứng dụng nếu có
      if (config.autoOpenApp) {
        setTimeout(async () => {
          await checkAndOpenApp(config.autoOpenApp!)
        }, 2000)
      }

      this.isActive = true
      Vibration.vibrate([100, 50, 100])

      const modeNames = {
        study: "học tập",
        work: "làm việc",
        focus: "tập trung",
      }

      return (
        `✅ Đã bật chế độ ${modeNames[mode]}!\n` +
        `📱 Độ sáng: ${Math.round(config.brightness * 100)}%\n` +
        `🔇 Chế độ im lặng: ${config.silentMode ? "Bật" : "Tắt"}\n` +
        `⏰ Pomodoro: ${config.pomodoroMinutes} phút\n` +
        `☕ Nghỉ giải lao: ${config.breakMinutes} phút`
      )
    } catch (error: any) {
      console.error("❌ Error activating study mode:", error)
      return `Lỗi khi bật chế độ học tập: ${error.message}`
    }
  }

  /**
   * Tắt chế độ học tập
   */
  async deactivateStudyMode(): Promise<string> {
    try {
      console.log("🔚 Deactivating study mode...")

      if (!this.isActive) {
        return "Không có chế độ học tập nào đang hoạt động."
      }

      // Dừng timer
      if (this.pomodoroTimer) {
        clearTimeout(this.pomodoroTimer)
        this.pomodoroTimer = null
      }

      // Khôi phục trạng thái ban đầu
      await this.restoreOriginalState()

      // Kết thúc session
      if (this.currentSession) {
        this.currentSession.endTime = new Date().toISOString()
        this.currentSession.completed = true
        await this.saveSession(this.currentSession)
      }

      this.isActive = false
      this.currentSession = null

      Vibration.vibrate([50, 100, 50])

      return "✅ Đã tắt chế độ học tập. Chúc bạn học tập hiệu quả!"
    } catch (error: any) {
      console.error("❌ Error deactivating study mode:", error)
      return `Lỗi khi tắt chế độ học tập: ${error.message}`
    }
  }

  /**
   * Lưu trạng thái hiện tại của thiết bị
   */
  private async saveCurrentState(): Promise<void> {
    try {
      // Lưu độ sáng hiện tại
      this.originalBrightness = await Brightness.getBrightnessAsync()

      // Lưu cài đặt thông báo hiện tại
      this.originalNotificationSettings = await Notifications.getPermissionsAsync()

      console.log("💾 Saved original device state")
    } catch (error) {
      console.error("❌ Error saving original state:", error)
    }
  }

  /**
   * Áp dụng cấu hình chế độ học tập
   */
  private async applyStudyConfiguration(config: StudyModeConfig): Promise<void> {
    try {
      // Điều chỉnh độ sáng
      await setBrightnessLevel(30)
      console.log(`🔆 Brightness set to ${Math.round(config.brightness * 100)}%`)

      // Cấu hình chế độ im lặng
      if (config.silentMode) {
        await this.enableSilentMode()
      }

      console.log("⚙️ Study configuration applied")
    } catch (error) {
      console.error("❌ Error applying study configuration:", error)
    }
  }

  /**
   * Bật chế độ im lặng
   */
  private async enableSilentMode(): Promise<void> {
    try {
      // Tắt âm thanh thông báo
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false, // Tắt âm thanh
          shouldSetBadge: true,
          shouldShowBanner: true,   // ✅ thêm trường mới
          shouldShowList: true,     // ✅ thêm trường mới
        }),
      })

      console.log("🔇 Silent mode enabled")
    } catch (error) {
      console.error("❌ Error enabling silent mode:", error)
    }
  }

  /**
   * Bắt đầu Pomodoro timer
   */
  private async startPomodoroTimer(studyMinutes: number, breakMinutes: number): Promise<void> {
    try {
      const studyMilliseconds = studyMinutes * 60 * 1000
      const breakMilliseconds = breakMinutes * 60 * 1000

      console.log(`⏰ Starting Pomodoro: ${studyMinutes}min study, ${breakMinutes}min break`)

      // Lên lịch thông báo bắt đầu
      await scheduleReminderNotification(
        5, // 5 giây để test, thực tế có thể là 0
        `🎓 Bắt đầu phiên học ${studyMinutes} phút!`,
      )

      // Timer cho phiên học
      this.pomodoroTimer = setTimeout(async () => {
        await this.handleStudySessionEnd(studyMinutes, breakMinutes)
      }, studyMilliseconds)
    } catch (error) {
      console.error("❌ Error starting Pomodoro timer:", error)
    }
  }

  /**
   * Xử lý khi kết thúc phiên học
   */
  private async handleStudySessionEnd(studyMinutes: number, breakMinutes: number): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.pomodoroCount++
      }

      // Thông báo kết thúc phiên học
      await scheduleReminderNotification(
        0,
        `🎉 Hoàn thành phiên học ${studyMinutes} phút! Nghỉ giải lao ${breakMinutes} phút.`,
      )

      Vibration.vibrate([200, 100, 200, 100, 200])

      // Bắt đầu timer nghỉ giải lao
      this.pomodoroTimer = setTimeout(
        async () => {
          await this.handleBreakEnd(studyMinutes, breakMinutes)
        },
        breakMinutes * 60 * 1000,
      )
    } catch (error) {
      console.error("❌ Error handling study session end:", error)
    }
  }

  /**
   * Xử lý khi kết thúc giờ nghỉ
   */
  private async handleBreakEnd(studyMinutes: number, breakMinutes: number): Promise<void> {
    try {
      // Thông báo kết thúc giờ nghỉ
      await scheduleReminderNotification(0, `⏰ Hết giờ nghỉ! Bắt đầu phiên học tiếp theo.`)

      Vibration.vibrate([100, 50, 100])

      // Bắt đầu phiên học mới
      await this.startPomodoroTimer(studyMinutes, breakMinutes)
    } catch (error) {
      console.error("❌ Error handling break end:", error)
    }
  }

  /**
   * Khôi phục trạng thái ban đầu
   */
  private async restoreOriginalState(): Promise<void> {
    try {
      // Khôi phục độ sáng
      if (this.originalBrightness) {
        await Brightness.setBrightnessAsync(this.originalBrightness)
        console.log("🔆 Brightness restored")
      }

      // Khôi phục cài đặt thông báo
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true, // Bật lại âm thanh
          shouldSetBadge: true,
          shouldShowBanner: true,   // ✅ thêm trường mới
          shouldShowList: true,     // ✅ thêm trường mới
        }),
      })

      console.log("🔊 Notification settings restored")
    } catch (error) {
      console.error("❌ Error restoring original state:", error)
    }
  }

  /**
   * Lưu session vào AsyncStorage
   */
  private async saveSession(session: StudySession): Promise<void> {
    try {
      const sessions = await this.getSessions()
      sessions.push(session)
      await AsyncStorage.setItem("study_sessions", JSON.stringify(sessions))
      console.log("💾 Session saved")
    } catch (error) {
      console.error("❌ Error saving session:", error)
    }
  }

  /**
   * Lấy danh sách sessions
   */
  async getSessions(): Promise<StudySession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem("study_sessions")
      return sessionsJson ? JSON.parse(sessionsJson) : []
    } catch (error) {
      console.error("❌ Error getting sessions:", error)
      return []
    }
  }

  /**
   * Lấy thống kê học tập
   */
  async getStudyStats(): Promise<{
    totalSessions: number
    totalMinutes: number
    averageSession: number
    pomodoroCount: number
  }> {
    try {
      const sessions = await this.getSessions()
      const completedSessions = sessions.filter((s) => s.completed)

      const totalMinutes = completedSessions.reduce((sum, session) => {
        const start = new Date(session.startTime)
        const end = session.endTime ? new Date(session.endTime) : new Date()
        return sum + Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      }, 0)

      const pomodoroCount = completedSessions.reduce((sum, session) => sum + session.pomodoroCount, 0)

      return {
        totalSessions: completedSessions.length,
        totalMinutes,
        averageSession: completedSessions.length > 0 ? Math.round(totalMinutes / completedSessions.length) : 0,
        pomodoroCount,
      }
    } catch (error) {
      console.error("❌ Error getting study stats:", error)
      return { totalSessions: 0, totalMinutes: 0, averageSession: 0, pomodoroCount: 0 }
    }
  }

  /**
   * Kiểm tra trạng thái hiện tại
   */
  getStatus(): { isActive: boolean; currentSession: StudySession | null } {
    return {
      isActive: this.isActive,
      currentSession: this.currentSession,
    }
  }

  /**
   * Tùy chỉnh cấu hình
   */
  async updateConfig(mode: "study" | "work" | "focus", config: Partial<StudyModeConfig>): Promise<void> {
    try {
      this.defaultConfigs[mode] = { ...this.defaultConfigs[mode], ...config }
      await AsyncStorage.setItem("study_configs", JSON.stringify(this.defaultConfigs))
      console.log(`⚙️ Updated ${mode} configuration`)
    } catch (error) {
      console.error("❌ Error updating config:", error)
    }
  }

  /**
   * Tải cấu hình đã lưu
   */
  async loadConfigs(): Promise<void> {
    try {
      const configsJson = await AsyncStorage.getItem("study_configs")
      if (configsJson) {
        this.defaultConfigs = { ...this.defaultConfigs, ...JSON.parse(configsJson) }
        console.log("⚙️ Loaded saved configurations")
      }
    } catch (error) {
      console.error("❌ Error loading configs:", error)
    }
  }
}

// Export singleton instance
export const studyModeManager = new StudyModeManager()

// Export helper functions
export const activateStudyMode = (mode: "study" | "work" | "focus" = "study") =>
  studyModeManager.activateStudyMode(mode)

export const deactivateStudyMode = () => studyModeManager.deactivateStudyMode()

export const getStudyStats = () => studyModeManager.getStudyStats()

export const getStudyStatus = () => studyModeManager.getStatus()
