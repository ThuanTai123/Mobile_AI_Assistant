import {
  toggleFlashlight,
  toggleNotification,
  increaseVolume,
  decreaseVolume,
  openNavigationBar,
  setVolumeLevel,
  setBrightnessLevel,
  getVolumeLevel,
  getBrightnessLevel,
} from '../screens/DeviceControls'

import * as Brightness from 'expo-brightness'
import AndroidOpenSettings from 'react-native-android-open-settings'
import { studyModeManager } from './StudyModeManager'
import { phoneCallHandler , handleEmergencyCall } from './PhoneCallHandler' // ✅ Dùng đúng instance

export const handlePhoneCommands = async (message: string): Promise<string | null> => {
  // ✅ Gọi từ instance thay vì import hàm trực tiếp
  const emergencyResponse = await phoneCallHandler.handleEmergencyCall(message)
  if (emergencyResponse) return emergencyResponse

  const callResponse = await phoneCallHandler.handleCallCommand(message)
  if (callResponse) return callResponse

  return null
}

export const handleStudyCommands = async (message: string): Promise<string | null> => {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("bật chế độ học") || lowerMessage.includes("chế độ học tập")) {
    return await studyModeManager.activateStudyMode("study")
  }

  if (lowerMessage.includes("bật chế độ làm việc") || lowerMessage.includes("chế độ work")) {
    return await studyModeManager.activateStudyMode("work")
  }

  if (lowerMessage.includes("bật chế độ tập trung") || lowerMessage.includes("chế độ focus")) {
    return await studyModeManager.activateStudyMode("focus")
  }

  if (lowerMessage.includes("tắt chế độ học") || lowerMessage.includes("dừng học tập")) {
    return await studyModeManager.deactivateStudyMode()
  }

  if (lowerMessage.includes("thống kê học tập") || lowerMessage.includes("xem tiến độ")) {
    const stats = await studyModeManager.getStudyStats()
    return (
      `📊 Thống kê học tập:\n` +
      `📚 Tổng phiên: ${stats.totalSessions}\n` +
      `⏰ Tổng thời gian: ${stats.totalMinutes} phút\n` +
      `📈 Trung bình/phiên: ${stats.averageSession} phút\n` +
      `🍅 Pomodoro hoàn thành: ${stats.pomodoroCount}`
    )
  }

  if (lowerMessage.includes("trạng thái học tập") || lowerMessage.includes("đang học không")) {
    const status = studyModeManager.getStatus()
    if (status.isActive && status.currentSession) {
      const startTime = new Date(status.currentSession.startTime)
      const elapsed = Math.round((Date.now() - startTime.getTime()) / (1000 * 60))
      return (
        `🎓 Đang trong chế độ ${status.currentSession.mode}\n` +
        `⏰ Đã học: ${elapsed} phút\n` +
        `🍅 Pomodoro: ${status.currentSession.pomodoroCount}`
      )
    } else {
      return "😴 Hiện tại không trong chế độ học tập nào."
    }
  }

  return null
}

export const handleDeviceCommand = async (message: string): Promise<string | null> => {
  const msg = message.toLowerCase()
  .replace(/wi[\s-]?fi/g, 'wifi') // chuẩn hóa: wi-fi, wi fi => wifi
  .replace(/\s+/g, ' ')           // xoá khoảng trắng thừa


  const phoneResponse = await handlePhoneCommands(message)
  if (phoneResponse) return phoneResponse

  const studyResponse = await handleStudyCommands(message)
  if (studyResponse) return studyResponse

  const extractLevel = (msg: string): number | null => {
    const match = msg.match(/(?:mức|đặt|đến|tới)\s*(\d{1,3})\s*(%|phần trăm)?/)
    if (match) {
      const level = parseInt(match[1], 10)
      return Math.max(0, Math.min(100, level))
    }
    return null
  }

  // Flashlight
  if (msg.includes('bật đèn flash')) {
    await toggleFlashlight(true)
    return 'Đã bật đèn flash 🔦'
  }

  if (msg.includes('tắt đèn flash')) {
    await toggleFlashlight(false)
    return 'Đã tắt đèn flash 🔦'
  }

  // Notification
  if (msg.includes('bật thông báo')) {
    toggleNotification(true)
    return 'Đã bật thông báo 🛎️'
  }

  if (msg.includes('tắt thông báo')) {
    toggleNotification(false)
    return 'Đã tắt thông báo 🛎️'
  }

  // Âm lượng
  if (msg.includes('âm lượng')) {
    const level = extractLevel(msg)
    if (level !== null) {
      await setVolumeLevel(level)
      return `Đã đặt âm lượng đến mức ${level}% 🔊`
    }
    if (msg.includes('tăng')) {
      await increaseVolume()
      return 'Đã tăng âm lượng 🔊'
    }
    if (msg.includes('giảm')) {
      await decreaseVolume()
      return 'Đã giảm âm lượng 🔉'
    }
  }

  // Thanh điều hướng
  if (msg.includes('mở thanh điều hướng')) {
    openNavigationBar()
    return 'Đã mở thanh điều hướng 📱'
  }

  // Độ sáng
  if (msg.includes('độ sáng')) {
    const level = extractLevel(msg)
    if (level !== null) {
      await setBrightnessLevel(level)
      return `Đã đặt độ sáng đến mức ${level}% 🌞`
    }

    const current = await Brightness.getBrightnessAsync()
    if (msg.includes('tăng')) {
      await Brightness.setBrightnessAsync(Math.min(current + 0.2, 1))
      return '🌞 Đã tăng độ sáng.'
    }
    if (msg.includes('giảm')) {
      await Brightness.setBrightnessAsync(Math.max(current - 0.2, 0.1))
      return '🌙 Đã giảm độ sáng.'
    }
  }

  // Lấy độ sáng hiện tại
  const brightnessRegex = /((độ sáng|sáng màn hình|mức sáng).*(hiện tại|bao nhiêu|là bao nhiêu|là mấy|%)|bao nhiêu phần trăm độ sáng|sáng bao nhiêu)/i
  if (brightnessRegex.test(msg)) {
    const level = await getBrightnessLevel()
    return level >= 0
      ? `🌞 Độ sáng hiện tại là ${level}%.`
      : 'Không thể lấy được độ sáng.'
  }

  // Lấy âm lượng hiện tại
  const volumeRegex = /((âm lượng|mức âm|mức âm thanh).*(hiện tại|bao nhiêu|là bao nhiêu|là mấy|%)|bao nhiêu phần trăm âm lượng|âm lượng bao nhiêu)/i
  if (volumeRegex.test(msg)) {
    const level = await getVolumeLevel()
    return level >= 0
      ? `🔊 Âm lượng hiện tại là ${level}%.`
      : 'Không thể lấy được mức âm lượng.'
  }

  // Cài đặt WiFi
  if (msg.includes('bật wifi') || msg.includes('mở wifi')) {
    AndroidOpenSettings.wifiSettings()
    return '🔌 Đang mở cài đặt WiFi để bạn bật.'
  }

  if (msg.includes('tắt wifi')) {
    AndroidOpenSettings.wifiSettings()
    return '🔌 Đang mở cài đặt WiFi để bạn tắt.'
  }

  // Bluetooth
  if (msg.includes('bật bluetooth') || msg.includes('mở bluetooth')) {
    AndroidOpenSettings.bluetoothSettings()
    return '📶 Đang mở cài đặt Bluetooth để bạn bật.'
  }

  if (msg.includes('tắt bluetooth')) {
    AndroidOpenSettings.bluetoothSettings()
    return '📶 Đang mở cài đặt Bluetooth để bạn tắt.'
  }

  return null
}
