// database.ts - THÊM checkTables function
import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(false);

const db = SQLite.openDatabase(
  {
    name: 'ChatApp.db',
    location: 'default',
  },
  () => console.log('✅ [Database] Database opened successfully'),
  error => console.error('❌ [Database] DB connection error:', error)
);

export default db;

// ✅ THÊM function này
export const checkTables = () => {
  console.log("🔍 [Database] Checking tables...")
  db.transaction((tx) => {
    // Kiểm tra bảng chat_history
    tx.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='chat_history';",
      [],
      (tx, results) => {
        if (results.rows.length > 0) {
          console.log("✅ [Database] Bảng chat_history đã tồn tại")

          tx.executeSql("SELECT COUNT(*) as count FROM chat_history;", [], (tx, countResults) => {
            const count = countResults.rows.item(0).count
            console.log(`📊 [Database] Số tin nhắn trong database: ${count}`)
          })
        } else {
          console.log("❌ [Database] Bảng chat_history KHÔNG tồn tại!")
        }
      },
      (tx, error) => {
        console.error("❌ [Database] Lỗi kiểm tra bảng chat_history:", error)
        return false
      },
    )

    // ✅ THÊM: Kiểm tra bảng notes
    tx.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='notes';",
      [],
      (tx, results) => {
        if (results.rows.length > 0) {
          console.log("✅ [Database] Bảng notes đã tồn tại")

          tx.executeSql("SELECT COUNT(*) as count FROM notes;", [], (tx, countResults) => {
            const count = countResults.rows.item(0).count
            console.log(`📊 [Database] Số ghi chú trong database: ${count}`)
          })
        } else {
          console.log("❌ [Database] Bảng notes KHÔNG tồn tại!")
        }
      },
      (tx, error) => {
        console.error("❌ [Database] Lỗi kiểm tra bảng notes:", error)
        return false
      },
    )
  })
}


export const deleteAllChatHistory = () => {
  db.transaction(tx => {
    tx.executeSql("DELETE FROM chat_history", [], () => {
      console.log("✅ [Database] Đã xoá toàn bộ lịch sử trò chuyện");
    });
  });
};

export const deleteAllNotes = () => {
  db.transaction(tx => {
    tx.executeSql("DELETE FROM notes", [], () => {
      console.log("✅ [Database] Đã xoá toàn bộ ghi chú");
    });
  });
};