import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcryptLib from 'bcryptjs';

const db = new Database('mecaerp.db');

export function initDb() {
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
