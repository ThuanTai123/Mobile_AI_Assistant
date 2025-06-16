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
