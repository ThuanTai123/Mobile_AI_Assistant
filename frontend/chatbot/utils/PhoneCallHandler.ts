import { Alert, Linking } from "react-native"
import * as Contacts from "expo-contacts"
import DeviceInfo from 'react-native-device-info'

interface Contact {
  id: string
  name: string
  phoneNumbers: Array<{
    number: string
    label?: string
  }>
}

class PhoneCallHandler {
  private contacts: Contact[] = []

  /**
   * Khởi tạo và load danh bạ
   */
  async initialize(): Promise<void> {
    try {
      const { status } = await Contacts.requestPermissionsAsync()
      if (status === "granted") {
        await this.loadContacts()
        console.log("📞 Phone call handler initialized")
      } else {
        console.log("❌ Contacts permission denied")
      }
    } catch (error) {
      console.error("❌ Error initializing phone handler:", error)
    }
  }

  /**
   * Load danh bạ từ thiết bị
   */
  private async loadContacts(): Promise<void> {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      })

      this.contacts = data
        .filter(
          (contact): contact is Contacts.Contact =>
            !!contact.id &&
            !!contact.name &&
            Array.isArray(contact.phoneNumbers) &&
            contact.phoneNumbers.length > 0
        )
        .map((contact) => ({
          id: contact.id!,
          name: contact.name!,
          phoneNumbers: contact.phoneNumbers!
            .filter((p) => !!p.number)
            .map((p) => ({
              number: p.number!,
              label: p.label,
            })),
        }))

      console.log(`📱 Loaded ${this.contacts.length} contacts`)
    } catch (error) {
      console.error("❌ Error loading contacts:", error)
    }
  }

  /**
   * Xử lý lệnh gọi điện từ text/voice
   */
  async handleCallCommand(message: string): Promise<string | null> {
    const lowerMessage = message.toLowerCase()

    // Kiểm tra các pattern gọi điện
    const callPatterns = [
      /gọi cho (.+)/i,
      /gọi (.+)/i,
      /call (.+)/i,
      /phone (.+)/i,
      /điện thoại (.+)/i,
      /liên hệ (.+)/i,
    ]

    let targetName = ""
    let phoneNumber = ""

    for (const pattern of callPatterns) {
      const match = message.match(pattern)
      if (match) {
        targetName = match[1].trim()
        break
      }
    }

    const phonePattern = /(\+?[\d\s\-]{8,15})/
    const phoneMatch = message.match(phonePattern)
    if (phoneMatch) {
      phoneNumber = phoneMatch[1].replace(/[\s\-]/g, "")
      return await this.makeCall(phoneNumber, "Số điện thoại")
    }

    if (targetName) {
      const contact = this.findContact(targetName)
      if (contact) {
        const primaryPhone = contact.phoneNumbers[0].number
        return await this.makeCall(primaryPhone, contact.name)
      } else {
        return `❌ Không tìm thấy liên hệ "${targetName}" trong danh bạ.`
      }
    }

    return null
  }

  /**
   * Tìm contact trong danh bạ
   */
  private findContact(searchName: string): Contact | null {
    const searchLower = searchName.toLowerCase()

    let found = this.contacts.find((contact) => contact.name.toLowerCase() === searchLower)

    if (!found) {
      found = this.contacts.find((contact) => contact.name.toLowerCase().includes(searchLower))
    }

    if (!found) {
      found = this.contacts.find((contact) => {
        const nameParts = contact.name.toLowerCase().split(" ")
        return nameParts.some((part) => part.includes(searchLower))
      })
    }

    return found || null
  }

  /**
   * Thực hiện cuộc gọi
   */
  private async makeCall(phoneNumber: string, contactName: string): Promise<string> {
    try {
      const cleanNumber = phoneNumber.replace(/[\s\-]/g, "")

      if (!this.isValidPhoneNumber(cleanNumber)) {
        return `❌ Số điện thoại "${phoneNumber}" không hợp lệ.`
      }

      const phoneUrl = `tel:${cleanNumber}`
      const canCall = await Linking.canOpenURL(phoneUrl)

      if (!canCall) {
        return "❌ Thiết bị không hỗ trợ tính năng gọi điện."
      }

      return new Promise((resolve) => {
        Alert.alert("Xác nhận gọi điện", `Bạn có muốn gọi cho ${contactName}?\nSố: ${phoneNumber}`, [
          { text: "Hủy", style: "cancel", onPress: () => resolve("❌ Đã hủy cuộc gọi.") },
          {
            text: "Gọi",
            onPress: async () => {
              try {
                await Linking.openURL(phoneUrl)
                resolve(`📞 Đang gọi cho ${contactName} (${phoneNumber})...`)
              } catch (error) {
                resolve(`❌ Không thể thực hiện cuộc gọi: ${error}`)
              }
            },
          },
        ])
      })
    } catch (error) {
      console.error("❌ Error making call:", error)
      return `❌ Lỗi khi thực hiện cuộc gọi: ${error}`
    }
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/[\s\-+]/g, "")
    if (!/^\d+$/.test(cleaned)) return false
    return cleaned.length >= 7 && cleaned.length <= 15
  }

  /**
   * Lấy danh sách contacts để hiển thị
   */
  getContacts(): Contact[] {
    return this.contacts
  }

  /**
   * Tìm kiếm contacts
   */
  searchContacts(query: string): Contact[] {
    const searchLower = query.toLowerCase()
    return this.contacts.filter((contact) => contact.name.toLowerCase().includes(searchLower))
  }

  /**
   * Xử lý lệnh khẩn cấp
   */
  async handleEmergencyCall(message: string): Promise<string | null> {
    const emergencyPatterns = [/cấp cứu|emergency|911/i, /cảnh sát|police|113/i, /cứu hỏa|fire|114/i, /khẩn cấp/i]

    for (const pattern of emergencyPatterns) {
      if (pattern.test(message)) {
        let number = "115"
        let label = "cấp cứu"

        if (/cảnh sát|police|113/i.test(message)) {
          number = "113"
          label = "cảnh sát"
        } else if (/cứu hỏa|fire|114/i.test(message)) {
          number = "114"
          label = "cứu hỏa"
        }

        return new Promise((resolve) => {
          Alert.alert("⚠️ Cuộc gọi khẩn cấp", `Bạn có chắc chắn muốn gọi ${label} (${number})?`, [
            { text: "Hủy", style: "cancel", onPress: () => resolve("❌ Đã hủy cuộc gọi khẩn cấp.") },
            {
              text: "Gọi ngay",
              style: "destructive",
              onPress: async () => {
                try {
                  await Linking.openURL(`tel:${number}`)
                  resolve(`🚨 Đang gọi ${label} (${number})...`)
                } catch (error) {
                  resolve(`❌ Không thể gọi khẩn cấp: ${error}`)
                }
              },
            },
          ])
        })
      }
    }

    return null
  }

  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.startsWith("84")) {
      return `+84 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
    }
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
    }
    return phoneNumber
  }
}

// Singleton export
const phoneCallHandler = new PhoneCallHandler()
export { phoneCallHandler }
// Exports tiện ích
export const handlePhoneCall = (msg: string) => phoneCallHandler.handleCallCommand(msg)
export const handleEmergencyCall = (msg: string) => phoneCallHandler.handleEmergencyCall(msg)
export const initializePhoneHandler = async () => {
  await phoneCallHandler.initialize()
}
export const getContacts = () => phoneCallHandler.getContacts()
export const searchContacts = (q: string) => phoneCallHandler.searchContacts(q)
console.log("DEBUG: phoneCallHandler =", phoneCallHandler)
