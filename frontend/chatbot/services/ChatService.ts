// ChatService.ts - SỬA LẠI HOÀN TOÀN
import db from '../screens/database';

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

// ✅ QUAN TRỌNG: Sửa signature function
export const saveMessage = (message: string, sender: string, callback?: (success: boolean) => void) => {
  console.log(`🔄 [ChatService] Saving: "${message}" from ${sender}`);
  
  db.transaction(
    tx => {
      tx.executeSql(
        'INSERT INTO chat_history (sender, message) VALUES (?, ?);',
        [sender, message],
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