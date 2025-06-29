import db from '../screens/database';

const log = console.log;
const error = console.error;

const runQuery = (
  sql: string,
  params: any[] = [],
  onSuccess: (tx: any, results: any) => void = () => {},
  onError: (tx: any, err: any) => boolean = (tx, err) => {
    error('❌ Lỗi SQL:', err);
    return false;
  }
) => {
  db.transaction(tx => {
    tx.executeSql(sql, params, onSuccess, onError);
  });
};

// ✅ UPDATED: Thêm cột reminder_time và reminder_date
export const createNoteTable = (): Promise<void> =>
  new Promise((resolve, reject) => {
    runQuery(
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        reminder_time TEXT,
        reminder_date TEXT,
        is_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      [],
      () => {
        log('✅ Bảng ghi chú đã sẵn sàng');
        // Check if we need to add new columns to existing table
        addMissingColumns();
        resolve();
      },
      (tx, err) => {
        error('❌ Lỗi khi tạo bảng ghi chú:', err);
        reject(err);
        return false;
      }
    );
  });

// ✅ NEW: Thêm cột mới nếu bảng đã tồn tại
const addMissingColumns = () => {
  // Add reminder_time column if it doesn't exist
  runQuery(
    `ALTER TABLE notes ADD COLUMN reminder_time TEXT;`,
    [],
    () => log('✅ Đã thêm cột reminder_time'),
    () => true // Ignore error if column already exists
  );
  
  // Add reminder_date column if it doesn't exist
  runQuery(
    `ALTER TABLE notes ADD COLUMN reminder_date TEXT;`,
    [],
    () => log('✅ Đã thêm cột reminder_date'),
    () => true // Ignore error if column already exists
  );
  
  // Add is_completed column if it doesn't exist
  runQuery(
    `ALTER TABLE notes ADD COLUMN is_completed INTEGER DEFAULT 0;`,
    [],
    () => log('✅ Đã thêm cột is_completed'),
    () => true // Ignore error if column already exists
  );
};

// ✅ UPDATED: Lưu ghi chú với thời gian hẹn
export const saveNote = (
  title: string, 
  content: string, 
  reminderTime?: string, 
  reminderDate?: string
): Promise<number> =>
  new Promise((resolve, reject) => {
    log('💾 Đang lưu ghi chú:', { title, content, reminderTime, reminderDate });

    if (!title || !content) {
      const err = new Error('Tiêu đề và nội dung là bắt buộc');
      error('❌ Lỗi xác thực:', err.message);
      return reject(err);
    }

    const createdAt = new Date().toISOString();

    runQuery(
      'INSERT INTO notes (title, content, reminder_time, reminder_date, created_at) VALUES (?, ?, ?, ?, ?);',
      [title, content, reminderTime || null, reminderDate || null, createdAt],
      (tx, res) => {
        log('✅ Đã lưu ghi chú, insertId:', res.insertId);
        resolve(res.insertId);
      },
      (tx, err) => {
        error('❌ Lỗi khi lưu ghi chú:', err);
        reject(err);
        return false;
      }
    );
  });

// ✅ UPDATED: Lấy ghi chú với thông tin thời gian
export const fetchNotes = (callback: (notes: any[]) => void) => {
  runQuery(
    'SELECT * FROM notes ORDER BY created_at DESC;',
    [],
    (tx, results) => {
      const data = [];
      for (let i = 0; i < results.rows.length; i++) {
        const note = results.rows.item(i);
        // Format reminder info
        if (note.reminder_time || note.reminder_date) {
          note.hasReminder = true;
          note.reminderText = formatReminderText(note.reminder_time, note.reminder_date);
        } else {
          note.hasReminder = false;
        }
        data.push(note);
      }
      log('📝 Đã lấy ghi chú:', data.length);
      callback(data);
    },
    (tx, err) => {
      error('❌ Lỗi khi lấy ghi chú:', err);
      callback([]);
      return false;
    }
  );
};

// ✅ NEW: Lấy ghi chú có nhắc nhở sắp tới
export const getUpcomingReminders = (callback: (notes: any[]) => void) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  runQuery(
    `SELECT * FROM notes 
     WHERE (reminder_date = ? OR reminder_date IS NULL) 
     AND reminder_time IS NOT NULL 
     AND is_completed = 0
     ORDER BY reminder_time ASC;`,
    [today],
    (tx, results) => {
      const data = [];
      for (let i = 0; i < results.rows.length; i++) {
        data.push(results.rows.item(i));
      }
      log('⏰ Đã lấy nhắc nhở sắp tới:', data.length);
      callback(data);
    },
    (tx, err) => {
      error('❌ Lỗi khi lấy nhắc nhở:', err);
      callback([]);
      return false;
    }
  );
};

// ✅ NEW: Đánh dấu ghi chú đã hoàn thành
export const markNoteCompleted = (id: number, callback?: () => void) => {
  runQuery(
    'UPDATE notes SET is_completed = 1 WHERE id = ?;',
    [id],
    () => {
      log('✅ Đã đánh dấu hoàn thành ghi chú ID:', id);
      if (callback) callback();
    },
    (tx, err) => {
      error('❌ Lỗi khi đánh dấu hoàn thành:', err);
      return false;
    }
  );
};

// ✅ NEW: Hàm format thời gian nhắc nhở
const formatReminderText = (time?: string, date?: string): string => {
  if (!time) return '';
  
  let result = `⏰ ${time}`;
  if (date && date !== new Date().toISOString().split('T')[0]) {
    result += ` (${formatDate(date)})`;
  }
  return result;
};

// ✅ NEW: Format ngày tháng
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (dateString === today.toISOString().split('T')[0]) {
    return 'Hôm nay';
  } else if (dateString === tomorrow.toISOString().split('T')[0]) {
    return 'Ngày mai';
  } else {
    return date.toLocaleDateString('vi-VN');
  }
};

// Các hàm khác giữ nguyên...
export const deleteNoteById = (id: number, callback: () => void) => {
  runQuery(
    'DELETE FROM notes WHERE id = ?;',
    [id],
    () => {
      log('✅ Đã xoá ghi chú có ID:', id);
      callback();
    },
    (tx, err) => {
      error('❌ Lỗi khi xoá ghi chú:', err);
      return false;
    }
  );
};

export const deleteAllNotes = (callback?: () => void) => {
  runQuery(
    'DELETE FROM notes;',
    [],
    () => {
      log('✅ Đã xoá tất cả ghi chú');
      if (callback) callback();
    },
    (tx, err) => {
      error('❌ Lỗi khi xoá tất cả ghi chú:', err);
      return false;
    }
  );
};