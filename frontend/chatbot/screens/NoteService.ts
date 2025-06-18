import db from './database';

export const createNoteTable = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // ✅ FIXED: Drop và tạo lại bảng với cấu trúc đúng
      tx.executeSql(
        'DROP TABLE IF EXISTS notes;',
        [],
        () => {
          console.log('✅ Dropped old notes table');
          
          // Tạo bảng mới với cấu trúc đúng
          tx.executeSql(
            `CREATE TABLE notes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT,
              content TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`,
            [],
            () => {
              console.log('✅ Notes table created successfully');
              resolve();
            },
            (tx, error) => {
              console.error('❌ Error creating notes table:', error);
              reject(error);
              return false;
            }
          );
        },
        (tx, error) => {
          console.error('❌ Error dropping notes table:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const saveNote = (noteTitle: string, noteContent: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('💾 Attempting to save note:', { title: noteTitle, content: noteContent });
    
    if (!noteTitle || !noteContent) {
      const error = new Error('Title and content are required');
      console.error('❌ Validation failed:', error.message);
      reject(error);
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO notes (title, content) VALUES (?, ?);',
        [noteTitle, noteContent],
        (tx, results) => {
          console.log('✅ Note saved successfully, insertId:', results.insertId);
          resolve();
        },
        (tx, error) => {
          console.error('❌ Error saving note:', error);
          reject(error);
          return false;
        }
      );
    });
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
        console.log('📝 Fetched notes:', data.length);
        callback(data);
      },
      (tx, error) => {
        console.error('❌ Error fetching notes:', error);
        callback([]);
        return false;
      }
    );
  });
};

export const deleteNoteById = (noteId: number, callback: () => void) => {
  db.transaction(tx => {
    tx.executeSql(
      'DELETE FROM notes WHERE id = ?;',
      [noteId],
      () => {
        console.log('✅ Note deleted successfully');
        callback();
      },
      (tx, error) => {
        console.error('❌ Error deleting note:', error);
        return false;
      }
    );
  });
};

// ✅ FIXED: Test function với bảng mới
export const testDatabase = () => {
  console.log('🧪 Testing database...');
  
  // Test bảng structure
  db.transaction(tx => {
    tx.executeSql(
      "PRAGMA table_info(notes);",
      [],
      (tx, results) => {
        console.log('📋 Notes table structure:');
        for (let i = 0; i < results.rows.length; i++) {
          const column = results.rows.item(i);
          console.log(`  - ${column.name}: ${column.type}`);
        }
        
        // Test insert sau khi kiểm tra structure
        testInsert();
      },
      (tx, error) => {
        console.error('❌ Error checking table structure:', error);
        return false;
      }
    );
  });
};

const testInsert = () => {
  const testTitle = "Test Note " + Date.now();
  const testContent = "This is a test note content";
  
  console.log('🧪 Testing insert with:', { title: testTitle, content: testContent });
  
  saveNote(testTitle, testContent)
    .then(() => {
      console.log('✅ Test insert successful');
      
      // Test fetch
      fetchNotes((notes) => {
        console.log('✅ Test fetch successful, found', notes.length, 'notes');
        
        // Cleanup test note
        if (notes.length > 0) {
          const lastNote = notes[0];
          if (lastNote.title && lastNote.title.includes('Test Note')) {
            deleteNoteById(lastNote.id, () => {
              console.log('✅ Test cleanup completed');
            });
          }
        }
      });
    })
    .catch((error) => {
      console.error('❌ Test insert failed:', error);
    });
};