import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// GET single entry publicly using TOKEN
router.get("/public/:token", async (req, res) => {
  try {
    const entry = await db.queryOne(`
      SELECT * FROM vehicle_entries
      WHERE public_token = ? AND token_expires_at > CURRENT_TIMESTAMP
    `, [req.params.token]) as any;

    if (!entry) return res.status(404).json({ error: "Link expirado ou inválido" });

    const items = await db.query(`
      SELECT * FROM vehicle_checklist_items
      WHERE entry_id = ?
      ORDER BY sort_order ASC
    `, [entry.id]);

    res.json({ ...entry, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH entry publicly using TOKEN
router.patch("/public/:token", async (req, res) => {
  const data = req.body;
  try {
    const entry = await db.queryOne(`
      SELECT id FROM vehicle_entries
      WHERE public_token = ? AND token_expires_at > CURRENT_TIMESTAMP
    `, [req.params.token]) as any;

    if (!entry) return res.status(404).json({ error: "Link expirado" });

    // Convert values to MySQL-compatible types
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        sanitizedData[key] = null;
      } else if (typeof value === 'boolean') {
        sanitizedData[key] = value ? 1 : 0;
      } else if (typeof value === 'object') {
        console.warn(`Skipping object field: ${key}`, value);
        continue;
      } else {
        sanitizedData[key] = value;
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return res.json({ success: true });
    }

    // Filter out null values to avoid overwriting existing data
    const updateData = Object.fromEntries(
      Object.entries(sanitizedData).filter(([, v]) => v !== null && v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      return res.json({ success: true });
    }

    const fields = Object.keys(updateData).map(key => `\`${key}\` = ?`).join(', ');
    const values = Object.values(updateData);

    await db.execute(`
      UPDATE vehicle_entries
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [...values, entry.id]);

    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ PATCH /entries/public/:token error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// PATCH item photo publicly using TOKEN
router.patch("/public/:token/items/:itemId", async (req, res) => {
  const { image_url } = req.body;
  try {
    const entry = await db.queryOne(`
      SELECT id FROM vehicle_entries
      WHERE public_token = ? AND token_expires_at > CURRENT_TIMESTAMP
    `, [req.params.token]) as any;

    if (!entry) return res.status(404).json({ error: "Link expirado" });

    await db.execute(`
      UPDATE vehicle_checklist_items
      SET image_url = ?, status = 'OK'
      WHERE id = ? AND entry_id = ?
    `, [image_url, req.params.itemId, entry.id]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- AUTH REQUIRED ROUTES ----------------
router.use(authenticateToken);

// POST create entry
router.post("/", async (req: AuthRequest, res) => {
  console.log("POST /api/entries hit", req.body);
  const id = uuidv4();
  const { client_id, vehicle_id } = req.body;

  try {
    // Validate tenant exists
    const tenant = await db.queryOne(`SELECT id FROM tenants WHERE id = ?`, [req.user!.tenant_id]);
    if (!tenant) {
      console.error("❌ Tenant not found:", req.user!.tenant_id);
      return res.status(400).json({ error: "Tenant inválido" });
    }

    // Validate vehicle exists if provided
    if (vehicle_id) {
      const vehicle = await db.queryOne(`SELECT id FROM vehicles WHERE id = ? AND tenant_id = ?`, [vehicle_id, req.user!.tenant_id]);
      if (!vehicle) {
        console.error("❌ Vehicle not found:", vehicle_id);
        return res.status(400).json({ error: "Veículo não encontrado" });
      }
    }

    // Validate client exists if provided
    if (client_id) {
      const client = await db.queryOne(`SELECT id FROM clients WHERE id = ? AND tenant_id = ?`, [client_id, req.user!.tenant_id]);
      if (!client) {
        console.error("❌ Client not found:", client_id);
        return res.status(400).json({ error: "Cliente não encontrado" });
      }
    }

    await db.transaction(async (conn) => {
      await conn.execute(`
        INSERT INTO vehicle_entries (id, tenant_id, client_id, vehicle_id, status)
        VALUES (?, ?, ?, ?, 'DRAFT')
      `, [id, req.user!.tenant_id, client_id || null, vehicle_id || null]);

      if (vehicle_id) {
        // Log entry event in history
        const vehicle = (await conn.execute("SELECT brand, model, plate, km FROM vehicles WHERE id = ?", [vehicle_id]) as any)[0][0] as any;
        await conn.execute(`
          INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id, km)
          VALUES (?, ?, ?, 'ENTRY', ?, ?, ?)
        `, [uuidv4(), vehicle_id, req.user!.tenant_id, `Check-in na oficina: ${vehicle?.brand || ''} ${vehicle?.model || ''} (${vehicle?.plate || ''})`, req.user!.id, req.body.km || vehicle?.km || 0]);
      }

      const items = [
        { category: 'Fotos do Veículo', item: 'Frente do Veículo', sort_order: -5 },
        { category: 'Fotos do Veículo', item: 'Traseira do Veículo', sort_order: -4 },
        { category: 'Fotos do Veículo', item: 'Lateral Esquerda', sort_order: -3 },
        { category: 'Fotos do Veículo', item: 'Lateral Direita', sort_order: -2 },
        { category: 'Fotos do Veículo', item: 'Painel (KM e Luzes)', sort_order: -1 },
      ];

      for (const item of items) {
        await conn.execute(`
          INSERT INTO vehicle_checklist_items (id, entry_id, category, item, status, sort_order)
          VALUES (?, ?, ?, ?, 'NA', ?)
        `, [uuidv4(), id, item.category, item.item, item.sort_order]);
      }
    });

    res.status(201).json({ id });
  } catch (error: any) {
    console.error("❌ POST /entries error:", error.message);
    console.error("Error code:", (error as any).code);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: error.message, code: (error as any).code });
  }
});

// GET entries by vehicle id
router.get("/vehicle/:vehicleId", async (req: AuthRequest, res) => {
  try {
    // Check if vehicle_entries table exists (MySQL compatible)
    const tableCheck = await db.queryOne(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'vehicle_entries'",
      []
    );
    if (!tableCheck) {
      return res.json([]);
    }

    const entries = await db.query(`
      SELECT * FROM vehicle_entries
      WHERE vehicle_id = ? AND tenant_id = ?
      ORDER BY created_at DESC
    `, [req.params.vehicleId, req.user!.tenant_id]);
    res.json(entries);
  } catch (error: any) {
    console.error(`Error fetching entries for vehicle ${req.params.vehicleId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// GET all entries
router.get("/", async (req: AuthRequest, res) => {
  try {
    const entries = await db.query(`
      SELECT * FROM vehicle_entries
      WHERE tenant_id = ?
      ORDER BY created_at DESC
    `, [req.user!.tenant_id]);
    res.json(entries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single entry
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const entry = await db.queryOne(`
      SELECT * FROM vehicle_entries
      WHERE id = ? AND tenant_id = ?
    `, [req.params.id, req.user!.tenant_id]) as any;

    if (!entry) return res.status(404).json({ error: "Entrada não encontrada" });

    const items = await db.query(`
      SELECT * FROM vehicle_checklist_items
      WHERE entry_id = ?
      ORDER BY sort_order ASC
    `, [entry.id]);

    res.json({ ...entry, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update entry
router.patch("/:id", async (req: AuthRequest, res) => {
  const data = req.body;
  try {
    if (Object.keys(data).length === 0) {
      return res.json({ success: true });
    }

    // Convert values to MySQL-compatible types
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        sanitizedData[key] = null;
      } else if (typeof value === 'boolean') {
        sanitizedData[key] = value ? 1 : 0;
      } else if (typeof value === 'object') {
        // Skip objects that aren't null
        console.warn(`Skipping object field: ${key}`, value);
        continue;
      } else {
        sanitizedData[key] = value;
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return res.json({ success: true });
    }

    const fields = Object.keys(sanitizedData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(sanitizedData);

    await db.execute(`
      UPDATE vehicle_entries
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [...values, req.params.id, req.user!.tenant_id]);

    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ PATCH /entries/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// PATCH update item photo (authenticated - admin)
router.patch("/:id/items/:itemId", async (req: AuthRequest, res) => {
  const { image_url } = req.body;
  try {
    // Verify the entry belongs to this tenant
    const entry = await db.queryOne(`
      SELECT id FROM vehicle_entries WHERE id = ? AND tenant_id = ?
    `, [req.params.id, req.user!.tenant_id]) as any;

    if (!entry) return res.status(404).json({ error: "Entrada não encontrada" });

    await db.execute(`
      UPDATE vehicle_checklist_items
      SET image_url = ?, status = CASE WHEN ? IS NULL THEN 'NA' ELSE 'OK' END
      WHERE id = ? AND entry_id = ?
    `, [image_url, image_url, req.params.itemId, req.params.id]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST generate token
router.post("/:id/token", async (req: AuthRequest, res) => {
  try {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60000).toISOString().replace('T', ' ').replace('Z', '');

    const result = await db.execute(`
      UPDATE vehicle_entries
      SET public_token = ?, token_expires_at = ?
      WHERE id = ? AND tenant_id = ?
    `, [token, expiresAt, req.params.id, req.user!.tenant_id]);

    if ((result as any).affectedRows === 0) return res.status(404).json({ error: "Entrada não encontrada" });

    res.json({ token, expiresAt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE entry
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await db.execute("DELETE FROM vehicle_checklist_items WHERE entry_id = ?", [req.params.id]);
    await db.execute("DELETE FROM vehicle_entries WHERE id = ? AND tenant_id = ?", [req.params.id, req.user!.tenant_id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
