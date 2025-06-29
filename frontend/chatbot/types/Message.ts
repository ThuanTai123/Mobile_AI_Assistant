export interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export interface Note {
  id: number;
  title: string;
  content: string;
  reminder_time?: string | null;        // ✅ NEW: Time in HH:MM format
  reminder_date?: string | null;        // ✅ NEW: Date in YYYY-MM-DD format
  is_completed?: number | boolean;      // ✅ NEW: 0/1 or false/true
  created_at: string;
  
  // ✅ NEW: Computed properties (added by fetchNotes function)
  hasReminder?: boolean;
  reminderText?: string;
}

export interface ReminderNotification {
  id: string;
  noteId: number;
  scheduledTime: Date;
  content: string;
  isActive: boolean;
}

export interface ChatHistoryItem {
  id: number;
  message: string;
  sender: "user" | "bot";
  timestamp: string;
}