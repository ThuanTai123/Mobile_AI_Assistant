
import db from './database';

const log = console.log;
const error = console.error;

const runQuery = (
  sql: string,
  params: any[] = [],
  onSuccess: (tx: any, results: any) => void = () => {},
  onError: (tx: any, err: any) => boolean = (tx, err) => {
    error('❌ SQL Error:', err);
    return false;
  }
) => {
  db.transaction(tx => {
    tx.executeSql(sql, params, onSuccess, onError);
  });
};

export const createNoteTable = (): Promise<void> =>
  new Promise((resolve, reject) => {
    runQuery('DROP TABLE IF EXISTS notes;', [], () => {
      log('✅ Dropped old notes table');
      runQuery(
        `CREATE TABLE notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => {
          log('✅ Notes table created successfully');
          resolve();
        },
        (tx, err) => {
          error('❌ Error creating notes table:', err);
          reject(err);
          return false;
        }
      );
    }, (tx, err) => {
      error('❌ Error dropping notes table:', err);
      reject(err);
      return false;
    });
  });

export const saveNote = (title: string, content: string): Promise<void> =>
  new Promise((resolve, reject) => {
    log('💾 Saving note:', { title, content });

    if (!title || !content) {
      const err = new Error('Title and content are required');
      error('❌ Validation failed:', err.message);
      return reject(err);
    }

    runQuery(
      'INSERT INTO notes (title, content) VALUES (?, ?);',
      [title, content],
      (tx, res) => {
        log('✅ Note saved, insertId:', res.insertId);
        resolve();
      },
      (tx, err) => {
        error('❌ Error saving note:', err);
        reject(err);
        return false;
      }
    );
  });

export const fetchNotes = (callback: (notes: any[]) => void) => {
  runQuery(
    'SELECT * FROM notes ORDER BY created_at DESC;',
    [],
    (tx, results) => {
      const data = [];
      for (let i = 0; i < results.rows.length; i++) {
        data.push(results.rows.item(i));
      }
      log('📝 Fetched notes:', data.length);
      callback(data);
    },
    (tx, err) => {
      error('❌ Error fetching notes:', err);
      callback([]);
      return false;
    }
  );
};

export const deleteNoteById = (id: number, callback: () => void) => {
  runQuery(
    'DELETE FROM notes WHERE id = ?;',
    [id],
    () => {
      log('✅ Note deleted:', id);
      callback();
    },
    (tx, err) => {
      error('❌ Error deleting note:', err);
      return false;
    }
  );
};

export const testDatabase = () => {
  log('🧪 Testing database...');
  runQuery(
    'PRAGMA table_info(notes);',
    [],
    (tx, res) => {
      log('📋 Notes table structure:');
      for (let i = 0; i < res.rows.length; i++) {
        const col = res.rows.item(i);
        log(`  - ${col.name}: ${col.type}`);
      }
      testInsert();
    },
    (tx, err) => {
      error('❌ Error checking structure:', err);
      return false;
    }
  );
};

const testInsert = () => {
  const title = 'Test Note ' + Date.now();
  const content = 'This is a test note content';

  log('🧪 Testing insert:', { title, content });

  saveNote(title, content)
    .then(() => {
      log('✅ Test insert successful');
      fetchNotes(notes => {
        log('✅ Test fetch successful, found', notes.length, 'notes');
        const last = notes[0];
        if (last?.title?.includes('Test Note')) {
          deleteNoteById(last.id, () => {
            log('✅ Test cleanup completed');
          });
        }
      });
    })
    .catch(err => {
      error('❌ Test insert failed:', err);
    });
};

