
const Database = require('better-sqlite3');
const db = new Database('mecaerp.db');
try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name).join(', '));
    for (const table of tables) {
      if (table.name === 'work_orders' || table.name === 'work_order_items') {
          const info = db.prepare(`PRAGMA table_info('${table.name}')`).all();
          console.log(`\nTable: ${table.name}`);
          console.log(JSON.stringify(info, null, 2));
      }
    }
} catch (e) { console.error(e); }
db.close();
