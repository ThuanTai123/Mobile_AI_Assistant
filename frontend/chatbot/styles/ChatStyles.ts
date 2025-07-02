
import { StyleSheet,Platform } from "react-native"
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
    actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
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
  reminderBadge: {
  position: 'absolute',
  right: 20,
  top: 10,
  backgroundColor: '#FF6B6B',
  borderRadius: 12,
  paddingHorizontal: 8,
  paddingVertical: 4,
  minWidth: 24,
  alignItems: 'center',
  justifyContent: 'center',
},
// Thêm vào ChatStyles.js
sectionHeader: {
  paddingVertical: 10,
  paddingHorizontal: 15,
  backgroundColor: '#f8f9fa',
  borderBottomWidth: 1,
  borderBottomColor: '#e9ecef',
},
sectionTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#495057',
},
headerButtons: {
  flexDirection: 'row',
  alignItems: 'center',
},
noteTitleContainer: {
  flex: 1,
},
reminderTime: {
  fontSize: 12,
  color: '#007bff',
  fontWeight: '600',
  marginTop: 2,
},
overdueTime: {
  color: '#dc3545',
},
overdueNote: {
  borderLeftWidth: 4,
  borderLeftColor: '#dc3545',
},
noteActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
completeButton: {
  padding: 5,
  marginRight: 5,
},
completedNote: {
  opacity: 0.6,
  backgroundColor: '#f8f9fa',
},
completedText: {
  textDecorationLine: 'line-through',
  color: '#6c757d',
},
reminderBadgeText: {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
},
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  historyItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  senderLabel: {
    fontWeight: "bold",
    color: "#4ECDC4",
  },
  noteItem: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  noteContent: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
  },
  timestampText: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
  },
  debugText: {
    fontSize: 8,
    color: "#999",
    fontStyle: "italic",
    marginTop: 4,
    backgroundColor: "#f0f0f0",
    padding: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 5,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  botMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#45B7B8",
  },
  botBubble: {
    backgroundColor: "#4ECDC4",
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: "#fff",
    paddingTop: 5,
    paddingBottom: Platform.OS === "android" ? 12 : 0,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#F8F8F8",
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#4ECDC4",
    paddingVertical: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  iconButton: {
    padding: 8,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 4,
  },
  individualDeleteButton: {
    padding: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height:1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  activeSession: {
    alignItems: "center",
  },
  activeMode: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4ECDC4",
    marginBottom: 10,
  },
  sessionInfo: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  inactiveText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  modeSelection: {
    marginBottom: 20,
  },
  modeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  modeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  deactivateButton: {
    backgroundColor: "#ff6b6b",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4ECDC4",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  tipsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  
})
export default styles;

