
const Database = require('better-sqlite3');
const db = new Database('mecaerp.db');
try {
  const table = 'work_orders';
  const info = db.prepare(`PRAGMA table_info('${table}')`).all();
  console.log(`Table: ${table}`);
  console.log(JSON.stringify(info, null, 2));
  
  const itemsTable = 'work_order_items';
  const itemsInfo = db.prepare(`PRAGMA table_info('${itemsTable}')`).all();
  console.log(`\nTable: ${itemsTable}`);
  console.log(JSON.stringify(itemsInfo, null, 2));
} catch (e) {
  console.error(e);
} finally {
  db.close();
}
