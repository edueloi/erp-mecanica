import Database from 'better-sqlite3';
const db = new Database('mecaerp.db');
try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name).join(', '));
    
    ['work_orders', 'work_order_items', 'vehicles', 'users', 'clients'].forEach(table => {
        const columns = db.prepare(`PRAGMA table_info('${table}')`).all();
        console.log(`Columns in ${table}:`, columns.map(c => c.name).join(', '));
    });
} catch (e) {
    console.error(e);
}
db.close();
