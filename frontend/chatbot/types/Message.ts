export interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface ChatHistoryItem {
  id: number;
  message: string;
  sender: "user" | "bot";
  timestamp: string;
}