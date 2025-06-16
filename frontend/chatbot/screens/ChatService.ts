import db from './database';

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

export const saveMessage = (sender: string, message: string) => {
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO chat_history (sender, message) VALUES (?, ?);',
      [sender, message],
      () => console.log('Message saved'),
      (tx, error) => console.error('Error saving message', error)
    );
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
