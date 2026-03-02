import Database from "better-sqlite3";
import path from "path";

const db = new Database("mecaerp.db");

export function initDb() {
  // Tenants (Oficinas)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      document TEXT,
      address TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('ADMIN', 'MECHANIC', 'ATTENDANT', 'FINANCE')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Clients
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('PF', 'PJ')) DEFAULT 'PF',
      name TEXT NOT NULL,
      document TEXT,
      email TEXT,
      phone TEXT,
      status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')) DEFAULT 'ACTIVE',
      zip_code TEXT,
      street TEXT,
      number TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      complement TEXT,
      reference TEXT,
      birth_date TEXT,
      state_registration TEXT,
      alt_phone TEXT,
      alt_name TEXT,
      pref_contact TEXT CHECK(pref_contact IN ('WHATSAPP', 'PHONE', 'EMAIL')) DEFAULT 'WHATSAPP',
      best_time TEXT,
      internal_notes TEXT,
      tags TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Communication Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS communication_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('WHATSAPP', 'EMAIL')) NOT NULL,
      template_name TEXT,
      content TEXT NOT NULL,
      status TEXT CHECK(status IN ('SENT', 'ERROR')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Vehicles
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      plate TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      year INTEGER,
      color TEXT,
      vin TEXT,
      fuel_type TEXT,
      km INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Work Orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      responsible_id TEXT,
      number TEXT NOT NULL,
      status TEXT CHECK(status IN ('OPEN', 'DIAGNOSIS', 'WAITING_APPROVAL', 'APPROVED', 'EXECUTING', 'WAITING_PARTS', 'FINISHED', 'DELIVERED', 'CANCELLED')) NOT NULL,
      priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH')) DEFAULT 'MEDIUM',
      complaint TEXT,
      symptoms TEXT, -- JSON array of tags
      diagnosis TEXT,
      checklist TEXT, -- JSON object
      evaluation TEXT, -- JSON object
      approval_data TEXT, -- JSON object (signature, date, etc)
      payment_data TEXT, -- JSON object
      delivery_data TEXT, -- JSON object
      photos TEXT, -- JSON array of objects {url, type, legend}
      internal_notes TEXT,
      total_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      taxes REAL DEFAULT 0,
      delivery_forecast DATETIME,
      approval_required BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (responsible_id) REFERENCES users(id)
    )
  `);

  // Work Order Items (Parts and Services)
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_items (
      id TEXT PRIMARY KEY,
      work_order_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('SERVICE', 'PART')) NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      mechanic_id TEXT,
      warranty_days INTEGER DEFAULT 0,
      sku TEXT,
      status TEXT DEFAULT 'PENDING',
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (mechanic_id) REFERENCES users(id)
    )
  `);

  // Audit Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Appointments
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      service_description TEXT,
      estimated_duration INTEGER DEFAULT 60,
      status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'DELAYED')) DEFAULT 'PENDING',
      notes TEXT,
      internal_notes TEXT,
      origin TEXT,
      send_confirmation BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Parts (Peças)
  db.exec(`
    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      supplier_code TEXT,
      category TEXT,
      brand TEXT,
      supplier_id TEXT,
      cost_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      stock_quantity REAL DEFAULT 0,
      min_stock REAL DEFAULT 0,
      location TEXT,
      compatibility TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Stock Movements (Movimentações de Estoque)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('ENTRY', 'EXIT', 'OS_USED', 'ADJUSTMENT', 'LOSS')) NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL DEFAULT 0,
      reference_id TEXT,
      reference_type TEXT,
      invoice_number TEXT,
      reason TEXT,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (part_id) REFERENCES parts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Suppliers (Fornecedores)
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      trade_name TEXT,
      cnpj TEXT,
      ie TEXT,
      category TEXT,
      status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')) DEFAULT 'ACTIVE',
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      website TEXT,
      contact_name TEXT,
      sales_rep TEXT,
      sales_rep_phone TEXT,
      zip_code TEXT,
      street TEXT,
      number TEXT,
      complement TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      payment_terms TEXT,
      payment_methods TEXT,
      notes TEXT,
      is_preferred BOOLEAN DEFAULT 0,
      avg_delivery_days INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Purchase Orders (Pedidos de Compra)
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      number TEXT NOT NULL,
      status TEXT CHECK(status IN ('DRAFT', 'SENT', 'CONFIRMED', 'PARTIAL', 'RECEIVED', 'CANCELLED')) DEFAULT 'DRAFT',
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expected_delivery DATETIME,
      freight REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Purchase Order Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      purchase_order_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      subtotal REAL NOT NULL,
      received_quantity REAL DEFAULT 0,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (part_id) REFERENCES parts(id)
    )
  `);

  // Supplier Parts (vinculação peça-fornecedor)
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_parts (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      supplier_code TEXT,
      last_cost REAL DEFAULT 0,
      is_preferred BOOLEAN DEFAULT 0,
      last_purchase_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (part_id) REFERENCES parts(id),
      UNIQUE(supplier_id, part_id)
    )
  `);

  // Accounts Receivable (Contas a Receber)
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts_receivable (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      work_order_id TEXT,
      installment_number INTEGER DEFAULT 1,
      total_installments INTEGER DEFAULT 1,
      description TEXT NOT NULL,
      original_amount REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      balance REAL NOT NULL,
      due_date DATE NOT NULL,
      status TEXT CHECK(status IN ('OPEN', 'PARTIAL', 'PAID', 'OVERDUE')) DEFAULT 'OPEN',
      payment_method TEXT,
      document_number TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Receivable Payments (Histórico de Pagamentos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS receivable_payments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_method TEXT NOT NULL,
      document_number TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (account_id) REFERENCES accounts_receivable(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Add history column to work_orders if it doesn't exist
  try {
    // Check if column exists first
    const columnCheck = db.prepare(`SELECT COUNT(*) as count FROM pragma_table_info('work_orders') WHERE name='history'`).get() as any;
    
    if (columnCheck.count === 0) {
      db.exec(`ALTER TABLE work_orders ADD COLUMN history TEXT DEFAULT '[]'`);
      console.log("✅ Added history column to work_orders table");
    } else {
      console.log("✅ History column already exists in work_orders table");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding history column:", e.message);
  }

  // Add part_id column to work_order_items if it doesn't exist
  try {
    const columnCheck = db.prepare(`SELECT COUNT(*) as count FROM pragma_table_info('work_order_items') WHERE name='part_id'`).get() as any;
    
    if (columnCheck.count === 0) {
      db.exec(`ALTER TABLE work_order_items ADD COLUMN part_id TEXT`);
      console.log("✅ Added part_id column to work_order_items table");
    } else {
      console.log("✅ part_id column already exists in work_order_items table");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding part_id column:", e.message);
  }

  console.log("Database initialized successfully.");
}

export default db;
