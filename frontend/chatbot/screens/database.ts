import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export interface DatabaseError extends Error {
  code?: string;
  details?: any;
}

// Get or open database with improved error handling
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (databaseInstance) {
    return databaseInstance;
  }

  try {
    databaseInstance = await SQLite.openDatabase({
      name: 'ChatApp.db',
      location: 'default',
    });
    
    console.log('✅ Database opened successfully');
    return databaseInstance;
  } catch (error) {
    console.error('❌ Failed to open database:', error);
    throw new Error(`Database connection failed: ${error}`);
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  if (databaseInstance) {
    try {
      await databaseInstance.close();
      databaseInstance = null;
      console.log('✅ Database closed successfully');
    } catch (error) {
      console.error('❌ Failed to close database:', error);
      throw error;
    }
  }
};

// Initialize database with tables
export const initializeDatabase = async (): Promise<void> => {
  try {
    const db = await getDatabase();
    
    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          // Create chat_history table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS chat_history (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              sender TEXT NOT NULL,
              message TEXT NOT NULL,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );`
          );
          
          // Create notes table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS notes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`
          );
        },
        error => {
          console.error('❌ Failed to initialize database:', error);
          reject(error);
        },
        () => {
          console.log('✅ Database initialized successfully');
          resolve();
        }
      );
    });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Reset database by dropping all tables
export const resetDatabase = async (): Promise<void> => {
  try {
    const db = await getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql('DROP TABLE IF EXISTS notes');
          tx.executeSql('DROP TABLE IF EXISTS chat_history');
        },
        error => {
          console.error('❌ Failed to reset database:', error);
          reject(error);
        },
        () => {
          console.log('🔄 Database reset completed');
          resolve();
        }
      );
    });

    // Reinitialize tables after reset
    await initializeDatabase();
  } catch (error) {
    console.error('❌ resetDatabase failed:', error);
    throw error;
  }
};

// Delete all notes
export const deleteAllNotes = async (): Promise<void> => {
  try {
    const db = await getDatabase();
    
    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql('DELETE FROM notes', []);
        },
        error => {
          console.error('❌ Failed to delete notes:', error);
          reject(error);
        },
        () => {
          console.log('🗑️ All notes deleted');
          resolve();
        }
      );
    });
  } catch (error) {
    console.error('❌ deleteAllNotes failed:', error);
    throw error;
  }
};

// Delete all chat history
export const deleteAllChatHistory = async (): Promise<void> => {
  try {
    const db = await getDatabase();
    
    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql('DELETE FROM chat_history', []);
        },
        error => {
          console.error('❌ Failed to delete chat history:', error);
          reject(error);
        },
        () => {
          console.log('🗑️ All chat history deleted');
          resolve();
        }
      );
    });
  } catch (error) {
    console.error('❌ deleteAllChatHistory failed:', error);
    throw error;
  }
};