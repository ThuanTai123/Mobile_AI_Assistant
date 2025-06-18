import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'ChatApp.db',
    location: 'default',
  },
  () => console.log('Database opened'),
  error => console.error('DB error:', error)
);

export default db;

export const deleteAllChatHistory = () => {
  db.transaction(tx => {
    tx.executeSql("DELETE FROM chat_history", [], () => {
      console.log("Đã xoá toàn bộ lịch sử trò chuyện");
    });
  });
};

export const deleteAllNotes = () => {
  db.transaction(tx => {
    tx.executeSql("DELETE FROM notes", [], () => {
      console.log("Đã xoá toàn bộ ghi chú");
    });
  });
};

// ✅ THÊM: Function để reset toàn bộ database
export const resetDatabase = () => {
  db.transaction(tx => {
    // Drop tất cả bảng
    tx.executeSql("DROP TABLE IF EXISTS notes", []);
    tx.executeSql("DROP TABLE IF EXISTS chat_history", []);
    console.log("🔄 Database reset completed");
  });
};