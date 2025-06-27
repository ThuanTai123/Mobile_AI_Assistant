// ChatService.ts - MỞ RỘNG, GIỮ NGUYÊN GỐC
import db from '../screens/database';

/** 📌 Tạo bảng chat */
export const createChatTable = (callback?: () => void) => {
  console.log("🔧 Creating chat table...");
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      [],
      () => {
        console.log('✅ Chat table created successfully');
        if (callback) callback();
      },
      (tx, error) => {
        console.error('❌ Error creating chat table:', error);
        return false;
      }
    );
  });
};

/** ✅ Lưu tin nhắn - version callback (gốc) */
export const saveMessage = (message: string, sender: string, callback?: (success: boolean) => void) => {
  console.log(`🔄 [ChatService] Saving: "${message}" from ${sender}`);

  const timestamp = new Date().toISOString();

  db.transaction(
    tx => {
      tx.executeSql(
        'INSERT INTO chat_history (sender, message, timestamp) VALUES (?, ?, ?);',
        [sender, message, timestamp],
        (tx, results) => {
          console.log('✅ [ChatService] Message saved successfully, insertId:', results.insertId);
          if (callback) callback(true);
        },
        (tx, error) => {
          console.error('❌ [ChatService] Error saving message:', error);
          if (callback) callback(false);
          return false;
        }
      );
    },
    error => {
      console.error('❌ [ChatService] Transaction error:', error);
      if (callback) callback(false);
    },
    () => {
      console.log('✅ [ChatService] Transaction completed successfully');
    }
  );
};

/** ✅ Lưu tin nhắn - version async/await */
export const saveMessageAsync = async (message: string, sender: string): Promise<boolean> => {
  const timestamp = new Date().toISOString();
  console.log(`🔄 [ChatService] (async) Saving: "${message}" from ${sender} at ${timestamp}`);

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO chat_history (sender, message, timestamp) VALUES (?, ?, ?);',
        [sender, message, timestamp],
        (tx, results) => {
          console.log('✅ [ChatService] (async) Saved with insertId:', results.insertId);
          resolve(true);
        },
        (tx, error) => {
          console.error('❌ [ChatService] (async) SQL Error:', error);
          reject(false);
          return false;
        }
      );
    },
    error => {
      console.error('❌ [ChatService] (async) Transaction Error:', error);
      reject(false);
    });
  });
};

/** ✅ Lấy toàn bộ lịch sử - giữ nguyên bản gốc */
export const fetchChatHistory = (callback: (messages: any[]) => void) => {
  console.log("🔍 [ChatService] Fetching chat history...");
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM chat_history ORDER BY timestamp DESC;',
      [],
      (tx, results) => {
        const rows = results.rows;
        const data = [];
        for (let i = 0; i < rows.length; i++) {
          data.push(rows.item(i));
        }
        console.log(`📚 [ChatService] Fetched ${data.length} messages from database`);
        callback(data);
      },
      (tx, error) => {
        console.error('❌ [ChatService] Error fetching chat history:', error);
        callback([]);
        return false;
      }
    );
  });
};

/** ✅ Lấy tin nhắn theo khoảng thời gian */
export const fetchMessagesByTimeRange = async (startISO: string, endISO: string): Promise<any[]> => {
  console.log(`⏳ [ChatService] Fetching messages from ${startISO} to ${endISO}`);

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM chat_history WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC;`,
        [startISO, endISO],
        (tx, results) => {
          const messages = [];
          for (let i = 0; i < results.rows.length; i++) {
            messages.push(results.rows.item(i));
          }
          console.log(`📥 [ChatService] Found ${messages.length} messages in time range`);
          resolve(messages);
        },
        (tx, error) => {
          console.error('❌ [ChatService] Error fetching by time range:', error);
          reject([]);
          return false;
        }
      );
    },
    error => {
      console.error('❌ [ChatService] Transaction error in time range fetch:', error);
      reject([]);
    });
  });
};

/** ✅ Xóa toàn bộ tin nhắn (phục vụ test hoặc reset app) */
export const deleteAllMessages = async (): Promise<void> => {
  console.log('🗑️ [ChatService] Deleting all chat messages...');
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM chat_history;',
        [],
        () => {
          console.log('✅ [ChatService] All messages deleted');
          resolve();
        },
        (tx, error) => {
          console.error('❌ [ChatService] Error deleting messages:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};
