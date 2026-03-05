import Database from 'better-sqlite3';
const db = new Database('mecaerp.db');
const tenantId = '031d2716-6751-4757-8794-a6210ede52ed';

console.log('--- Accounts ---');
const accounts = db.prepare('SELECT id, name FROM cash_accounts WHERE tenant_id = ?').all(tenantId);
console.log(accounts);

console.log('--- Transactions ---');
const txs = db.prepare('SELECT id, description, amount, status, date, source_type FROM cashflow_transactions WHERE tenant_id = ?').all(tenantId);
console.log(txs);

console.log('--- Parts of the PO ---');
const items = db.prepare(`
  SELECT poi.id as item_id, poi.part_id, p.name, p.cost_price, p.supplier_id, p.stock_quantity
  FROM purchase_order_items poi
  JOIN parts p ON poi.part_id = p.id
  WHERE poi.purchase_order_id = '8f3bb70f-0b28-477c-a370-2b0d3a627046'
`).all();
console.log(items);

console.log('--- PO Info ---');
const po = db.prepare("SELECT * FROM purchase_orders WHERE id = '8f3bb70f-0b28-477c-a370-2b0d3a627046'").get();
console.log(po);
