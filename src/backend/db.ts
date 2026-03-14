import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mecaerp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'local',
});

export const db = {
  // Returns array of rows
  query: async (sql: string, params?: any[]): Promise<any[]> => {
    const [rows] = await pool.execute(sql, params || []);
    return rows as any[];
  },

  // Returns first row or null
  queryOne: async (sql: string, params?: any[]): Promise<any | null> => {
    const [rows] = await pool.execute(sql, params || []);
    const arr = rows as any[];
    return arr[0] || null;
  },

  // For INSERT / UPDATE / DELETE
  execute: async (sql: string, params?: any[]): Promise<any> => {
    const [result] = await pool.execute(sql, params || []);
    return result;
  },

  // Transaction helper — receives fn(conn) where conn is a PoolConnection
  transaction: async (fn: (conn: mysql.PoolConnection) => Promise<any>): Promise<any> => {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  pool,
};

// Called from server.ts on startup — tests the connection and sets SQL mode
export async function initDb(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected to database:', process.env.DB_NAME || 'mecaerp');
    conn.release();

    // Create tables if they don't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS vehicle_entries (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        client_id VARCHAR(36) DEFAULT NULL,
        vehicle_id VARCHAR(36) DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        public_token VARCHAR(36) DEFAULT NULL,
        token_expires_at DATETIME DEFAULT NULL,
        responsible_name VARCHAR(255) DEFAULT NULL,
        arrived_by_tow_truck TINYINT(1) DEFAULT 0,
        customer_name VARCHAR(255) DEFAULT NULL,
        customer_document VARCHAR(50) DEFAULT NULL,
        customer_phone VARCHAR(50) DEFAULT NULL,
        customer_zip_code VARCHAR(20) DEFAULT NULL,
        customer_state VARCHAR(10) DEFAULT NULL,
        customer_city VARCHAR(100) DEFAULT NULL,
        customer_neighborhood VARCHAR(100) DEFAULT NULL,
        customer_street VARCHAR(255) DEFAULT NULL,
        customer_number VARCHAR(20) DEFAULT NULL,
        vehicle_plate VARCHAR(20) DEFAULT NULL,
        vehicle_brand VARCHAR(100) DEFAULT NULL,
        vehicle_model VARCHAR(100) DEFAULT NULL,
        vehicle_year VARCHAR(10) DEFAULT NULL,
        vehicle_color VARCHAR(50) DEFAULT NULL,
        fuel_level VARCHAR(20) DEFAULT 'EMPTY',
        requested_service TEXT DEFAULT NULL,
        photos_confirmed TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_tenant (tenant_id),
        KEY idx_token (public_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS vehicle_checklist_items (
        id VARCHAR(36) PRIMARY KEY,
        entry_id VARCHAR(36) NOT NULL,
        category VARCHAR(100) DEFAULT NULL,
        item VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'NA',
        sort_order INT DEFAULT 0,
        image_url LONGTEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY idx_entry (entry_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS warranty_templates (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT DEFAULT NULL,
        days_duration INT DEFAULT 90,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS warranty_terms (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        vehicle_id VARCHAR(36) DEFAULT NULL,
        client_id VARCHAR(36) DEFAULT NULL,
        work_order_id VARCHAR(36) DEFAULT NULL,
        template_id VARCHAR(36) DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT DEFAULT NULL,
        expires_at DATETIME DEFAULT NULL,
        responsible_id VARCHAR(36) DEFAULT NULL,
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_tenant (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS action_categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#6b7280',
        type VARCHAR(50) DEFAULT 'OTHER',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Tables verified/created');

    // Add missing columns to existing tables (safe - ignores if already exists)
    const addCol = async (table: string, col: string, def: string) => {
      try {
        await pool.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
      } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e; // ignore "already exists"
      }
    };

    await addCol('vehicle_entries', 'responsible_name', 'VARCHAR(255) DEFAULT NULL');
    await addCol('vehicle_entries', 'arrived_by_tow_truck', 'TINYINT(1) DEFAULT 0');
    await addCol('vehicle_entries', 'customer_name', 'VARCHAR(255) DEFAULT NULL');
    await addCol('vehicle_entries', 'customer_document', 'VARCHAR(50) DEFAULT NULL');
    await addCol('vehicle_entries', 'customer_phone', 'VARCHAR(50) DEFAULT NULL');
    await addCol('vehicle_entries', 'customer_zip_code', 'VARCHAR(20) DEFAULT NULL');
    await addCol('vehicle_entries', 'customer_state', 'VARCHAR(10) DEFAULT NULL');
    await addCol('vehicle_entries', 'customer_city', 'VARCHAR(100) DEFAULT NULL');
    await addCol('vehicle_entries', 'customer_neighborhood', 'VARCHAR(100) DEFAULT NULL');
    await addCol('vehicle_entries', 'customer_street', 'VARCHAR(255) DEFAULT NULL');
    await addCol('vehicle_entries', 'customer_number', 'VARCHAR(20) DEFAULT NULL');
    await addCol('vehicle_entries', 'vehicle_plate', 'VARCHAR(20) DEFAULT NULL');
    await addCol('vehicle_entries', 'vehicle_brand', 'VARCHAR(100) DEFAULT NULL');
    await addCol('vehicle_entries', 'vehicle_model', 'VARCHAR(100) DEFAULT NULL');
    await addCol('vehicle_entries', 'vehicle_year', 'VARCHAR(10) DEFAULT NULL');
    await addCol('vehicle_entries', 'vehicle_color', 'VARCHAR(50) DEFAULT NULL');
    await addCol('vehicle_entries', 'fuel_level', 'VARCHAR(20) DEFAULT \'EMPTY\'');
    await addCol('vehicle_entries', 'requested_service', 'TEXT DEFAULT NULL');
    await addCol('vehicle_entries', 'photos_confirmed', 'TINYINT(1) DEFAULT 0');
    await addCol('vehicle_entries', 'public_token', 'VARCHAR(36) DEFAULT NULL');
    await addCol('vehicle_entries', 'token_expires_at', 'DATETIME DEFAULT NULL');

    console.log('✅ Columns verified/added');

    // Seed default action categories if none exist
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM action_categories');
    const count = (rows as any[])[0]?.count ?? 0;
    if (count === 0) {
      const defaults = [
        { id: 'cat-manutencao',  name: 'Manutenção',       color: '#3b82f6', type: 'MAINTENANCE' },
        { id: 'cat-qualidade',   name: 'Qualidade',         color: '#10b981', type: 'QUALITY'     },
        { id: 'cat-atendimento', name: 'Atendimento',       color: '#f59e0b', type: 'SERVICE'     },
        { id: 'cat-estoque',     name: 'Estoque',           color: '#8b5cf6', type: 'STOCK'       },
        { id: 'cat-financeiro',  name: 'Financeiro',        color: '#ef4444', type: 'FINANCE'     },
        { id: 'cat-rh',          name: 'Recursos Humanos',  color: '#ec4899', type: 'HR'          },
        { id: 'cat-seguranca',   name: 'Segurança',         color: '#f97316', type: 'SAFETY'      },
        { id: 'cat-outros',      name: 'Outros',            color: '#6b7280', type: 'OTHER'       },
      ];
      for (const cat of defaults) {
        await pool.execute(
          'INSERT IGNORE INTO action_categories (id, name, color, type) VALUES (?, ?, ?, ?)',
          [cat.id, cat.name, cat.color, cat.type]
        );
      }
      console.log('✅ Default action categories seeded');
    }
  } catch (err: any) {
    console.error('❌ MySQL connection error:', err.message);
    throw err;
  }
}

export default db;
