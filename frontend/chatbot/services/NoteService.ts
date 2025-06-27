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

export const createNoteTable = (): Promise<void> =>
  new Promise((resolve, reject) => {
    runQuery('DROP TABLE IF EXISTS notes;', [], () => {
      log('✅ Đã xoá bảng ghi chú cũ');
      runQuery(
        `CREATE TABLE notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => {
          log('✅ Tạo bảng ghi chú thành công');
          resolve();
        },
        (tx, err) => {
          error('❌ Lỗi khi tạo bảng ghi chú:', err);
          reject(err);
          return false;
        }
      );
    }, (tx, err) => {
      error('❌ Lỗi khi xoá bảng ghi chú:', err);
      reject(err);
      return false;
    });
  });

export const saveNote = (title: string, content: string): Promise<void> =>
  new Promise((resolve, reject) => {
    log('💾 Đang lưu ghi chú:', { title, content });

    if (!title || !content) {
      const err = new Error('Tiêu đề và nội dung là bắt buộc');
      error('❌ Lỗi xác thực:', err.message);
      return reject(err);
    }

    const createdAt = new Date().toISOString(); // Thời gian hiện tại

    runQuery(
      'INSERT INTO notes (title, content, created_at) VALUES (?, ?, ?);',
      [title, content, createdAt],
      (tx, res) => {
        log('✅ Đã lưu ghi chú, insertId:', res.insertId);
        resolve();
      },
      (tx, err) => {
        error('❌ Lỗi khi lưu ghi chú:', err);
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

export const testDatabase = () => {
  log('🧪 Đang kiểm tra cơ sở dữ liệu...');
  runQuery(
    'PRAGMA table_info(notes);',
    [],
    (tx, res) => {
      log('📋 Cấu trúc bảng ghi chú:');
      for (let i = 0; i < res.rows.length; i++) {
        const col = res.rows.item(i);
        log(`  - ${col.name}: ${col.type}`);
      }
      testInsert();
    },
    (tx, err) => {
      error('❌ Lỗi khi kiểm tra cấu trúc:', err);
      return false;
    }
  );
};

const testInsert = () => {
  const title = 'Ghi chú kiểm thử ' + Date.now();
  const content = 'Đây là nội dung ghi chú kiểm thử';

  log('🧪 Đang thử thêm mới:', { title, content });

  saveNote(title, content)
    .then(() => {
      log('✅ Thêm mới kiểm thử thành công');
      fetchNotes(notes => {
        log('✅ Lấy ghi chú kiểm thử thành công, tìm thấy', notes.length, 'ghi chú');
        const last = notes[0];
        if (last?.title?.includes('Ghi chú kiểm thử')) {
          deleteNoteById(last.id, () => {
            log('✅ Dọn dẹp kiểm thử hoàn tất');
          });
        }
      });
    })
    .catch(err => {
      error('❌ Thêm mới kiểm thử thất bại:', err);
    });
};
