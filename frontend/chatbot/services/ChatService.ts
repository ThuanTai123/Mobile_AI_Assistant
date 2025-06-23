import db from '../screens/database';

export const createChatTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    );
  });
};

export const saveMessage = (sender: string, message: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO chat_history (sender, message) VALUES (?, ?);',
        [sender, message],
        () => {
          console.log('✅ Message saved');
          resolve(true); // Trả về thành công
        },
        (tx, error) => {
          console.error('❌ Error saving message', error);
          resolve(false); // Không reject, để tránh crash app
          return false;
        }
      );
    });
  });
};


export const fetchChatHistory = (callback: (messages: any[]) => void) => {
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
        callback(data);
      }
    );
  });
};
