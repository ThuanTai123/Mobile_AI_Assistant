import db from './database';

export const createNoteTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    );
  });
};

export const saveNote = (noteText: string) => {
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO notes (content) VALUES (?);',
      [noteText],
      () => console.log('Note saved'),
      (tx, error) => console.error('Error saving note', error)
    );
  });
};

export const fetchNotes = (callback: (notes: any[]) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM notes ORDER BY created_at DESC;',
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
