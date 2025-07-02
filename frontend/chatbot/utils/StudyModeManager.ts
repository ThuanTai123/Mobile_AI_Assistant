import { Vibration } from "react-native"
import * as Notifications from "expo-notifications"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { checkAndOpenApp } from "./AppLauncher"
import { scheduleReminderNotification } from "./Notifications"
import { setVolumeLevel } from "../screens/DeviceControls"

export interface StudyModeConfig {
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
  duration: number
  completed: boolean
  pomodoroCount: number
}

class StudyModeManager {
  private currentSession: StudySession | null = null
  private pomodoroTimer: NodeJS.Timeout | null = null
  private isActive = false

  private defaultConfigs: Record<string, StudyModeConfig> = {
    study: {
      silentMode: true,
      pomodoroMinutes: 25,
      breakMinutes: 5,
      studyApps: ["study", "notes", "calculator", "dictionary"],
      autoOpenApp: "notes",
    },
    work: {
      silentMode: true,
      pomodoroMinutes: 45,
      breakMinutes: 10,
      studyApps: ["email", "calendar", "documents", "slack"],
      autoOpenApp: "calendar",
    },
    focus: {
      silentMode: true,
      pomodoroMinutes: 30,
      breakMinutes: 5,
      studyApps: ["meditation", "music", "timer"],
      autoOpenApp: "timer",
    },
  }

  async activateStudyMode(mode: "study" | "work" | "focus" = "study"): Promise<string> {
    if (this.isActive) {
      return `Chế độ ${mode} đã được bật. Hãy tắt chế độ hiện tại trước.`
    }

    const config = this.defaultConfigs[mode]

    await this.applyStudyConfiguration(config)

    this.currentSession = {
      id: Date.now().toString(),
      mode,
      startTime: new Date().toISOString(),
      duration: config.pomodoroMinutes,
      completed: false,
      pomodoroCount: 0,
    }

    await this.saveSession(this.currentSession)
    await this.startPomodoroTimer(config.pomodoroMinutes, config.breakMinutes)

    if (config.autoOpenApp) {
      setTimeout(() => checkAndOpenApp(config.autoOpenApp!), 2000)
    }

    this.isActive = true
    Vibration.vibrate([100, 50, 100])

    return `✅ Đã bật chế độ ${mode}!\n🔇 Im lặng: ${config.silentMode ? "Bật" : "Tắt"}\n⏰ Pomodoro: ${config.pomodoroMinutes} phút`
  }

  async deactivateStudyMode(): Promise<string> {
    if (!this.isActive) return "Không có chế độ nào đang hoạt động."

    if (this.pomodoroTimer) clearTimeout(this.pomodoroTimer)

    if (this.currentSession) {
      this.currentSession.endTime = new Date().toISOString()
      this.currentSession.completed = true
      await this.saveSession(this.currentSession)
    }

    this.isActive = false
    this.currentSession = null
    Vibration.vibrate([50, 100, 50])

    return "✅ Đã tắt chế độ học tập."
  }

  private async applyStudyConfiguration(config: StudyModeConfig): Promise<void> {
    await setVolumeLevel(0)
    if (config.silentMode) {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      })
    }
  }

  private async startPomodoroTimer(studyMin: number, breakMin: number) {
    await scheduleReminderNotification(5, `🎓 Bắt đầu phiên học ${studyMin} phút!`)
    this.pomodoroTimer = setTimeout(() => this.handleStudyEnd(studyMin, breakMin), studyMin * 60 * 1000)
  }

  private async handleStudyEnd(studyMin: number, breakMin: number) {
    if (this.currentSession) this.currentSession.pomodoroCount++

    await scheduleReminderNotification(0, `🎉 Hoàn thành phiên học! Nghỉ ${breakMin} phút.`)
    Vibration.vibrate([200, 100, 200])

    this.pomodoroTimer = setTimeout(() => this.startPomodoroTimer(studyMin, breakMin), breakMin * 60 * 1000)
  }

  private async saveSession(session: StudySession) {
    const sessions = await this.getSessions()
    sessions.push(session)
    await AsyncStorage.setItem("study_sessions", JSON.stringify(sessions))
  }

  async getSessions(): Promise<StudySession[]> {
    const data = await AsyncStorage.getItem("study_sessions")
    return data ? JSON.parse(data) : []
  }

  async getStudyStats() {
    const sessions = (await this.getSessions()).filter((s) => s.completed)
    const totalMinutes = sessions.reduce((sum, s) => {
      const start = new Date(s.startTime)
      const end = s.endTime ? new Date(s.endTime) : new Date()
      return sum + Math.round((end.getTime() - start.getTime()) / 60000)
    }, 0)

    return {
      totalSessions: sessions.length,
      totalMinutes,
      averageSession: sessions.length ? Math.round(totalMinutes / sessions.length) : 0,
      pomodoroCount: sessions.reduce((sum, s) => sum + s.pomodoroCount, 0),
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      currentSession: this.currentSession,
    }
  }
}

export const studyModeManager = new StudyModeManager()
export const activateStudyMode = (mode: "study" | "work" | "focus" = "study") =>
  studyModeManager.activateStudyMode(mode)
export const deactivateStudyMode = () => studyModeManager.deactivateStudyMode()
export const getStudyStats = () => studyModeManager.getStudyStats()
export const getStudyStatus = () => studyModeManager.getStatus()
