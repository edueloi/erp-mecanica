import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcryptLib from 'bcryptjs';

const db = new Database('mecaerp.db');

export function initDb() {
  db.exec('CREATE TABLE IF NOT EXISTS pricing_plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, user_limit INTEGER NOT NULL, monthly_value REAL NOT NULL, months_duration INTEGER DEFAULT 1, active BOOLEAN DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  db.exec(`CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, document TEXT, address TEXT, phone TEXT, user_limit INTEGER DEFAULT 5, subscription_value REAL DEFAULT 0, due_day INTEGER DEFAULT 5, last_payment_date DATETIME, status TEXT DEFAULT 'ACTIVE', plan_id TEXT, seller_id TEXT, logo_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL, cpf TEXT, phone TEXT, profession TEXT, photo_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  
  // Migrations for new profile fields
  try { db.exec('ALTER TABLE users ADD COLUMN surname TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN biography TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN education TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN permissions TEXT'); } catch (e) {}

  db.exec('CREATE TABLE IF NOT EXISTS tenant_audit_logs (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT, action_type TEXT NOT NULL, description TEXT, payment_date DATETIME, payment_method TEXT, old_status TEXT, new_status TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  
  // Custom Permissions Profiles
  db.exec('CREATE TABLE IF NOT EXISTS permission_profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, permissions TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  
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
