import Database from 'better-sqlite3';
const db = new Database('mecaerp.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map((t: any) => t.name).join(', '));

const tablesToCheck = ['accounts_receivable', 'accounts_payable', 'cashflow_transactions', 'purchase_orders'];
for (const table of tablesToCheck) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  if (info.length > 0) {
    console.log(`Table ${table} exists with columns:`, info.map((c: any) => c.name).join(', '));
  } else {
    console.log(`Table ${table} does not exist`);
  }
}
