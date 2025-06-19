import { getDatabase } from './database';

export interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
}

export interface ChatServiceError extends Error {
  code?: string;
  details?: any;
}

// Save message to chat history
export const saveMessage = async (sender: string, message: string): Promise<number> => {
  if (!sender || !message) {
    throw new Error('Sender and message are required');
  }

  try {
    const db = await getDatabase();
    
    return new Promise<number>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'INSERT INTO chat_history (sender, message) VALUES (?, ?);',
            [sender, message],
            (_, results) => {
              console.log('✅ Message saved successfully');
              resolve(results.insertId || 0);
            },
            (_, error) => {
              console.error('❌ Error saving message:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Transaction failed in saveMessage:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ saveMessage failed:', error);
    throw error;
  }
};

// Fetch chat history with limit and offset for pagination
export const fetchChatHistory = async (
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> => {
  try {
    const db = await getDatabase();
    
    return new Promise<ChatMessage[]>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT ? OFFSET ?;',
            [limit, offset],
            (_, results) => {
              const messages: ChatMessage[] = [];
              for (let i = 0; i < results.rows.length; i++) {
                messages.push(results.rows.item(i));
              }
              console.log(`📚 Loaded ${messages.length} chat messages`);
              resolve(messages);
            },
            (_, error) => {
              console.error('❌ Error fetching chat history:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Transaction failed in fetchChatHistory:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ fetchChatHistory failed:', error);
    throw error;
  }
};

// Delete specific chat message by ID
export const deleteChatMessage = async (messageId: number): Promise<void> => {
  try {
    const db = await getDatabase();
    
    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'DELETE FROM chat_history WHERE id = ?;',
            [messageId],
            (_, results) => {
              console.log(`✅ Deleted message ID ${messageId}, rows affected: ${results.rowsAffected}`);
              resolve();
            },
            (_, error) => {
              console.error('❌ Error deleting message:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Transaction failed in deleteChatMessage:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ deleteChatMessage failed:', error);
    throw error;
  }
};

// Get chat history count
export const getChatHistoryCount = async (): Promise<number> => {
  try {
    const db = await getDatabase();
    
    return new Promise<number>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'SELECT COUNT(*) as count FROM chat_history;',
            [],
            (_, results) => {
              const count = results.rows.item(0).count;
              resolve(count);
            },
            (_, error) => {
              console.error('❌ Error getting chat count:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Transaction failed in getChatHistoryCount:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ getChatHistoryCount failed:', error);
    throw error;
  }
};