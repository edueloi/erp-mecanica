const db = require('better-sqlite3')('mecaerp.db');
const tenantId = '031d2716-6751-4757-8794-a6210ede52ed';

const accounts = db.prepare('SELECT id, name FROM cash_accounts WHERE tenant_id = ?').all(tenantId);
console.log('Accounts:', accounts);

const txs = db.prepare('SELECT id, description, amount, status, date FROM cashflow_transactions WHERE tenant_id = ?').all(tenantId);
console.log('Transactions:', txs);

const poItems = db.prepare(`
  SELECT poi.*, p.name, p.supplier_id 
  FROM purchase_order_items poi 
  LEFT JOIN parts p ON poi.part_id = p.id 
  WHERE poi.purchase_order_id = '8f3bb70f-0b28-477c-a370-2b0d3a627046'
`).all();
console.log('PO Items:', poItems);
