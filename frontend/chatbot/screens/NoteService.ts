import { getDatabase } from './database';

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface NoteServiceError extends Error {
  code?: string;
  details?: any;
}

// Save a new note
export const saveNote = async (noteTitle: string, noteContent: string): Promise<number> => {
  if (!noteTitle?.trim() || !noteContent?.trim()) {
    throw new Error('Title and content are required and cannot be empty');
  }

  try {
    const db = await getDatabase();

    return new Promise<number>((resolve, reject) => {
      console.log('💾 Saving note:', { noteTitle, noteContent });

      db.transaction(
        tx => {
          tx.executeSql(
            'INSERT INTO notes (title, content) VALUES (?, ?)',
            [noteTitle.trim(), noteContent.trim()],
            (_, results) => {
              const insertId = results.insertId || 0;
              console.log('✅ Note saved successfully with ID:', insertId);
              resolve(insertId);
            },
            (_, error) => {
              console.error('❌ Insert failed:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Transaction error in saveNote:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ saveNote failed:', error);
    throw error;
  }
};

// Fetch all notes with pagination
export const fetchNotes = async (
  limit: number = 100,
  offset: number = 0
): Promise<Note[]> => {
  try {
    const db = await getDatabase();

    console.log('📖 Fetching notes...');

    return new Promise<Note[]>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'SELECT * FROM notes ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset],
            (_, results) => {
              const notes: Note[] = [];
              for (let i = 0; i < results.rows.length; i++) {
                notes.push(results.rows.item(i));
              }
              console.log(`📋 ${notes.length} notes fetched`);
              resolve(notes);
            },
            (_, error) => {
              console.error('❌ Fetch failed:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Transaction failed during fetchNotes:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ fetchNotes failed:', error);
    throw error;
  }
};

// Delete note by ID
export const deleteNoteById = async (noteId: number): Promise<void> => {
  if (!noteId || noteId <= 0) {
    throw new Error('Valid note ID is required');
  }

  try {
    const db = await getDatabase();

    console.log('🗑️ Deleting note with ID:', noteId);

    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'DELETE FROM notes WHERE id = ?',
            [noteId],
            (_, results) => {
              console.log(`✅ Deleted note ID ${noteId}, rows affected: ${results.rowsAffected}`);
              if (results.rowsAffected === 0) {
                console.warn(`⚠️ No note found with ID ${noteId}`);
              }
              resolve();
            },
            (_, error) => {
              console.error('❌ Delete failed:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Delete transaction failed:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ deleteNoteById failed:', error);
    throw error;
  }
};

// Update existing note
export const updateNote = async (noteId: number, title: string, content: string): Promise<void> => {
  if (!noteId || noteId <= 0) {
    throw new Error('Valid note ID is required');
  }
  if (!title?.trim() || !content?.trim()) {
    throw new Error('Title and content are required and cannot be empty');
  }

  try {
    const db = await getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'UPDATE notes SET title = ?, content = ? WHERE id = ?',
            [title.trim(), content.trim(), noteId],
            (_, results) => {
              console.log(`✅ Updated note ID ${noteId}, rows affected: ${results.rowsAffected}`);
              if (results.rowsAffected === 0) {
                console.warn(`⚠️ No note found with ID ${noteId}`);
              }
              resolve();
            },
            (_, error) => {
              console.error('❌ Update failed:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Update transaction failed:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ updateNote failed:', error);
    throw error;
  }
};

// Get notes count
export const getNotesCount = async (): Promise<number> => {
  try {
    const db = await getDatabase();

    return new Promise<number>((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'SELECT COUNT(*) as count FROM notes',
            [],
            (_, results) => {
              const count = results.rows.item(0).count;
              console.log(`📊 Notes count: ${count}`);
              resolve(count);
            },
            (_, error) => {
              console.error('❌ Count query failed:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Count transaction failed:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ getNotesCount failed:', error);
    throw error;
  }
};

// Search notes by title or content
export const searchNotes = async (searchTerm: string): Promise<Note[]> => {
  if (!searchTerm?.trim()) {
    return [];
  }

  try {
    const db = await getDatabase();

    return new Promise<Note[]>((resolve, reject) => {
      const searchPattern = `%${searchTerm.trim()}%`;
      
      db.transaction(
        tx => {
          tx.executeSql(
            'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC',
            [searchPattern, searchPattern],
            (_, results) => {
              const notes: Note[] = [];
              for (let i = 0; i < results.rows.length; i++) {
                notes.push(results.rows.item(i));
              }
              console.log(`🔍 Found ${notes.length} notes matching "${searchTerm}"`);
              resolve(notes);
            },
            (_, error) => {
              console.error('❌ Search failed:', error);
              reject(error);
              return false;
            }
          );
        },
        error => {
          console.error('❌ Search transaction failed:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ searchNotes failed:', error);
    throw error;
  }
};