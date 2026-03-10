
import Database from 'better-sqlite3';
const db = new Database('mecaerp.db');
const tableInfo = db.prepare("PRAGMA table_info('work_orders')").all();
console.log(JSON.stringify(tableInfo, null, 2));
db.close();
