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
