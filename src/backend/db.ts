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

  console.log("Database initialized successfully.");
}

export default db;
