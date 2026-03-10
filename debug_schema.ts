import Database from 'better-sqlite3';

const db = new Database('mecaerp.db');

const tables = ['vehicles', 'clients', 'work_orders', 'work_order_items', 'users'];

tables.forEach(table => {
    try {
        console.log(`\n--- Schema for table: ${table} ---`);
        const info = db.prepare(`PRAGMA table_info(${table})`).all();
        console.table(info);
    } catch (error) {
        console.error(`Error getting info for table ${table}:`, error);
    }
});

db.close();
