
import Database from 'better-sqlite3';
const db = new Database('mecaerp.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));
for (const table of tables) {
  const info = db.prepare(`PRAGMA table_info('${table.name}')`).all();
  console.log(`\nTable: ${table.name}`);
  console.log(JSON.stringify(info, null, 2));
}
db.close();
