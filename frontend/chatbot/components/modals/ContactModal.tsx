"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Linking } from "react-native"
import { phoneCallHandler } from "../../utils/PhoneCallHandler"

interface Contact {
  id: string
  name: string
  phoneNumbers: Array<{
    number: string
    label?: string
  }>
}

interface ContactsModalProps {
  visible: boolean
  onClose: () => void
}

export const ContactsModal: React.FC<ContactsModalProps> = ({ visible, onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])

  useEffect(() => {
    if (visible) {
      loadContacts()
    }
  }, [visible])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = phoneCallHandler.searchContacts(searchQuery)
      setFilteredContacts(filtered)
    } else {
      setFilteredContacts(contacts)
    }
  }, [searchQuery, contacts])

  const loadContacts = () => {
    const allContacts = phoneCallHandler.getContacts()
    setContacts(allContacts)
    setFilteredContacts(allContacts)
  }

  const handleCall = (contact: Contact) => {
    const primaryPhone = contact.phoneNumbers[0].number

    Alert.alert("Xác nhận gọi điện", `Bạn có muốn gọi cho ${contact.name}?\nSố: ${primaryPhone}`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Gọi",
        onPress: async () => {
          try {
            await Linking.openURL(`tel:${primaryPhone}`)
          } catch (error) {
            Alert.alert("Lỗi", "Không thể thực hiện cuộc gọi")
          }
        },
      },
    ])
  }

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => handleCall(item)}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{phoneCallHandler.formatPhoneNumber(item.phoneNumbers[0].number)}</Text>
      </View>
      <View style={styles.callButton}>
        <Text style={styles.callIcon}>📞</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📞 Danh bạ</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm liên hệ..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          style={styles.contactsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{searchQuery ? "Không tìm thấy liên hệ" : "Không có liên hệ nào"}</Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>💡 Nói "Gọi cho [tên]" để gọi điện nhanh</Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
  },
  callIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
})
