
const Database = require('better-sqlite3');
const db = new Database('mecaerp.db');
try {
  const triggers = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger'").all();
  console.log('Triggers:');
  console.log(JSON.stringify(triggers, null, 2));
  
  const foreignKeys = db.prepare("PRAGMA foreign_key_list('work_order_items')").all();
  console.log('\nForeign Keys for work_order_items:');
  console.log(JSON.stringify(foreignKeys, null, 2));

  const foreignKeysWo = db.prepare("PRAGMA foreign_key_list('work_orders')").all();
  console.log('\nForeign Keys for work_orders:');
  console.log(JSON.stringify(foreignKeysWo, null, 2));
} catch (e) {
  console.error(e);
} finally {
  db.close();
}
