import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcryptLib from 'bcryptjs';

const db = new Database('mecaerp.db');

export function initDb() {
  // Deep Clean for broken SQLite triggers (fix for main.users_old error)
  try {
    const allTriggers = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='trigger'").all() as any[];
    for (const trigger of allTriggers) {
      if (trigger.sql && (trigger.sql.includes('_old') || trigger.sql.includes('users_old') || trigger.sql.includes('clients_old'))) {
        console.log(`🗑️  Removing legacy/broken trigger: ${trigger.name}`);
        db.exec(`DROP TRIGGER IF EXISTS "${trigger.name}"`);
      }
    }
  } catch (e) {
    console.error("Error during trigger cleanup:", e);
  }

  db.exec('CREATE TABLE IF NOT EXISTS pricing_plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, user_limit INTEGER NOT NULL, monthly_value REAL NOT NULL, months_duration INTEGER DEFAULT 1, active BOOLEAN DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  db.exec(`CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, document TEXT, address TEXT, phone TEXT, user_limit INTEGER DEFAULT 5, subscription_value REAL DEFAULT 0, due_day INTEGER DEFAULT 5, last_payment_date DATETIME, status TEXT DEFAULT 'ACTIVE', plan_id TEXT, seller_id TEXT, logo_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, password TEXT NOT NULL, role TEXT CHECK(role IN ("SUPER_ADMIN", "ADMIN", "MECHANIC", "ATTENDANT", "FINANCE", "VENDEDOR")) NOT NULL, cpf TEXT, phone TEXT, profession TEXT, photo_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  
  // Services Catalog
  db.exec(`CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY, 
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    category TEXT,
    description TEXT,
    estimated_time TEXT,
    default_price REAL DEFAULT 0,
    estimated_cost REAL DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    type TEXT DEFAULT 'LABOR',
    warranty_days INTEGER DEFAULT 90,
    allow_discount BOOLEAN DEFAULT 1,
    requires_diagnosis BOOLEAN DEFAULT 0,
    compatible_vehicles TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  try { db.exec("ALTER TABLE services ADD COLUMN charging_type TEXT DEFAULT 'FIXED'"); } catch (e) {}

  // Service Parts / Kits
  db.exec(`CREATE TABLE IF NOT EXISTS service_parts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE
  )`);

  // Migrations for new profile fields
  try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN cpf TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN profession TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN surname TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN biography TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN education TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN permissions TEXT'); } catch (e) {}

  // Tenant migrations
  try { db.exec('ALTER TABLE tenants ADD COLUMN last_payment_date DATETIME'); } catch (e) {}

  // Work Order items long description
  try { db.exec('ALTER TABLE work_order_items ADD COLUMN long_description TEXT'); } catch (e) {}

  // Work Order new fields
  try { db.exec('ALTER TABLE work_orders ADD COLUMN start_date DATETIME'); } catch (e) {}
  try { db.exec('ALTER TABLE work_orders ADD COLUMN finish_date DATETIME'); } catch (e) {}
  try { db.exec('ALTER TABLE work_orders ADD COLUMN guarantee TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE work_orders ADD COLUMN technical_report TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE work_orders ADD COLUMN defect TEXT'); } catch (e) {}

  // Appointments migrations for internal events
  try { db.exec("ALTER TABLE appointments ADD COLUMN type TEXT DEFAULT 'CLIENT'"); } catch (e) {}
  try { db.exec('ALTER TABLE appointments ADD COLUMN title TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE appointments ADD COLUMN color TEXT'); } catch (e) {}

  db.exec('CREATE TABLE IF NOT EXISTS tenant_audit_logs (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT, action_type TEXT NOT NULL, description TEXT, payment_date DATETIME, payment_method TEXT, old_status TEXT, new_status TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  
  // Custom Permissions Profiles
  db.exec('CREATE TABLE IF NOT EXISTS permission_profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, permissions TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  
  // User Preferences
  db.exec(`CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    theme_mode TEXT DEFAULT 'light',
    primary_color TEXT DEFAULT '#1e293b',
    secondary_color TEXT DEFAULT '#64748b',
    sidebar_color TEXT DEFAULT '#0f172a',
    sidebar_text_color TEXT DEFAULT '#94a3b8',
    header_color TEXT DEFAULT '#ffffff',
    sidebar_collapsed INTEGER DEFAULT 0,
    show_dashboard_cards INTEGER DEFAULT 1,
    default_rows_per_page INTEGER DEFAULT 20,
    filters_json TEXT DEFAULT '{}',
    table_preferences_json TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Migrations for more colors
  try { db.exec('ALTER TABLE user_preferences ADD COLUMN secondary_color TEXT DEFAULT "#64748b"'); } catch (e) {}
  try { db.exec('ALTER TABLE user_preferences ADD COLUMN sidebar_color TEXT DEFAULT "#0f172a"'); } catch (e) {}
  try { db.exec('ALTER TABLE user_preferences ADD COLUMN sidebar_text_color TEXT DEFAULT "#94a3b8"'); } catch (e) {}
  try { db.exec('ALTER TABLE user_preferences ADD COLUMN header_color TEXT DEFAULT "#ffffff"'); } catch (e) {}

  // Unified Vehicle History
  db.exec(`CREATE TABLE IF NOT EXISTS vehicle_history_logs (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    event_type TEXT CHECK(event_type IN ('REGISTRATION', 'OWNERSHIP', 'ENTRY', 'EXIT', 'MAINTENANCE', 'RECALL', 'RE-ENTRY')) NOT NULL,
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    responsible_id TEXT,
    km INTEGER,
    value REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Vehicle Attachments (Photos and Documents)
  db.exec(`CREATE TABLE IF NOT EXISTS vehicle_attachments (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('PHOTO', 'DOCUMENT')) NOT NULL,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    size INTEGER,
    mime_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Termos de Garantia (Modelos e Emitidos)
  db.exec(`CREATE TABLE IF NOT EXISTS warranty_templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    days_duration INTEGER DEFAULT 90,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS warranty_terms (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    vehicle_id TEXT,
    client_id TEXT,
    work_order_id TEXT,
    template_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    status TEXT DEFAULT 'ACTIVE',
    responsible_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Financial Tables
  db.exec(`CREATE TABLE IF NOT EXISTS cash_accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'cash',
    active INTEGER DEFAULT 1,
    initial_balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS cashflow_transactions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT CHECK(type IN ('in', 'out')) NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    description TEXT,
    account_id TEXT,
    related_account_id TEXT,
    payment_method TEXT,
    status TEXT DEFAULT 'confirmed',
    source_type TEXT DEFAULT 'manual',
    source_id TEXT,
    attachment_url TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS accounts_receivable (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    work_order_id TEXT,
    installment_number INTEGER DEFAULT 1,
    total_installments INTEGER DEFAULT 1,
    description TEXT,
    original_amount REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    due_date TEXT NOT NULL,
    paid_at TEXT,
    status TEXT DEFAULT 'OPEN',
    payment_method TEXT,
    document_number TEXT,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS receivable_payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT,
    document_number TEXT,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS accounts_payable (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    purchase_order_id TEXT,
    installment_number INTEGER DEFAULT 1,
    total_installments INTEGER DEFAULT 1,
    description TEXT,
    original_amount REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    due_date TEXT NOT NULL,
    paid_at TEXT,
    status TEXT DEFAULT 'OPEN',
    payment_method TEXT,
    document_number TEXT,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS payable_payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT,
    document_number TEXT,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS cash_closes (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    date TEXT NOT NULL,
    opening_balance REAL DEFAULT 0,
    expected_balance REAL DEFAULT 0,
    counted_balance REAL DEFAULT 0,
    difference REAL DEFAULT 0,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Purchase and Stock
  db.exec(`CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    number TEXT NOT NULL,
    order_date TEXT DEFAULT CURRENT_TIMESTAMP,
    expected_delivery TEXT,
    status TEXT DEFAULT 'DRAFT',
    freight REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS purchase_order_items (
    id TEXT PRIMARY KEY,
    purchase_order_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_cost REAL NOT NULL,
    subtotal REAL NOT NULL,
    received_quantity REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('ENTRY', 'EXIT', 'ADJUSTMENT', 'OS_USED', 'PURCHASE_ORDER')) NOT NULL,
    quantity REAL NOT NULL,
    unit_cost REAL,
    unit_price REAL,
    reference_id TEXT,
    reference_type TEXT,
    invoice_number TEXT,
    reason TEXT,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // WhatsApp Tables
  db.exec(`CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    session_name TEXT DEFAULT 'default',
    status TEXT DEFAULT 'disconnected',
    phone_number TEXT,
    qr_code TEXT,
    is_active INTEGER DEFAULT 1,
    last_connected_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    phone TEXT,
    phone_e164 TEXT,
    display_name TEXT,
    contact_name TEXT,
    client_id TEXT,
    vehicle_plate TEXT,
    work_order_id TEXT,
    assigned_to_user_id TEXT,
    status TEXT DEFAULT 'open',
    tags TEXT,
    unread_count INTEGER DEFAULT 0,
    last_message_at DATETIME,
    last_message_preview TEXT,
    bot_enabled INTEGER DEFAULT 0,
    bot_topic TEXT,
    bot_state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    direction TEXT CHECK(direction IN ('in', 'out')) NOT NULL,
    type TEXT DEFAULT 'text',
    body TEXT,
    media_url TEXT,
    sent_status TEXT DEFAULT 'pending',
    origin TEXT DEFAULT 'human',
    related_type TEXT,
    related_id TEXT,
    template_id TEXT,
    wpp_message_id TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    body TEXT NOT NULL,
    variables_json TEXT,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    template_id TEXT,
    conditions_json TEXT,
    delay_minutes INTEGER DEFAULT 0,
    business_hours_only INTEGER DEFAULT 1,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS whatsapp_automation_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    rule_id TEXT,
    message_id TEXT,
    phone TEXT,
    status TEXT,
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS wa_lid_map (
    tenant_id TEXT NOT NULL,
    lid TEXT NOT NULL,
    phone TEXT NOT NULL,
    PRIMARY KEY (tenant_id, lid)
  )`);

  // WhatsApp migrations (for existing databases)
  try { db.exec('ALTER TABLE whatsapp_conversations ADD COLUMN bot_state TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE whatsapp_conversations ADD COLUMN bot_enabled INTEGER DEFAULT 0'); } catch (e) {}
  try { db.exec('ALTER TABLE whatsapp_conversations ADD COLUMN bot_topic TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE whatsapp_conversations ADD COLUMN phone_e164 TEXT'); } catch (e) {}

  try {
    const superAdminEmail = 'admin@mecaerp.com.br';
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(superAdminEmail);
    if (!existingAdmin) {
      const systemTenantId = 'system-tenant-id';
      db.prepare(`INSERT OR IGNORE INTO tenants (id, name, status) VALUES (?, ?, 'ACTIVE')`).run(systemTenantId, 'MecaERP Cloud');
      const hash = bcryptLib.hashSync('Mec@123', 10);
      db.prepare(`INSERT INTO users (id, tenant_id, name, email, password, role) VALUES (?, ?, 'Super Admin', ?, ?, 'SUPER_ADMIN')`).run(uuidv4(), systemTenantId, superAdminEmail, hash);
    }
  } catch (e) {}
}
export default db;
