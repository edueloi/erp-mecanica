
import Database from 'better-sqlite3';

const db = new Database('mecaerp.db');

try {
  console.log('Fetching table info for work_orders...');
  const columns = db.prepare("PRAGMA table_info('work_orders')").all();
  console.log('Columns in work_orders:', columns.map((c: any) => c.name).join(', '));
  
  const sample = db.prepare("SELECT * FROM work_orders LIMIT 1").get();
  console.log('Sample Data Key Count:', sample ? Object.keys(sample).length : 'NO DATA');
} catch (error: any) {
  console.error('DATABASE ERROR:', error.message);
} finally {
  db.close();
}
