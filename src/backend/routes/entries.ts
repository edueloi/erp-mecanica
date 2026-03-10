import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// GET single entry publicly using TOKEN
router.get("/public/:token", (req, res) => {
  try {
    const entry = db.prepare(`
      SELECT * FROM vehicle_entries 
      WHERE public_token = ? AND token_expires_at > CURRENT_TIMESTAMP
    `).get(req.params.token) as any;

    if (!entry) return res.status(404).json({ error: "Link expirado ou inválido" });

    const items = db.prepare(`
      SELECT * FROM vehicle_checklist_items 
      WHERE entry_id = ?
      ORDER BY sort_order ASC
    `).all(entry.id);

    res.json({ ...entry, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH entry publicly using TOKEN
router.patch("/public/:token", (req, res) => {
  const data = req.body;
  try {
    const entry = db.prepare(`
      SELECT id FROM vehicle_entries 
      WHERE public_token = ? AND token_expires_at > CURRENT_TIMESTAMP
    `).get(req.params.token) as any;

    if (!entry) return res.status(404).json({ error: "Link expirado" });

    // Convert values to SQLite-compatible types
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

    const fields = Object.keys(sanitizedData).map(key => `${key} = COALESCE(?, ${key})`).join(', ');
    const values = Object.values(sanitizedData);
    
    db.prepare(`
      UPDATE vehicle_entries 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(...values, entry.id);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ PATCH /entries/public/:token error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// PATCH item photo publicly using TOKEN
router.patch("/public/:token/items/:itemId", (req, res) => {
  const { image_url } = req.body;
  try {
    const entry = db.prepare(`
      SELECT id FROM vehicle_entries 
      WHERE public_token = ? AND token_expires_at > CURRENT_TIMESTAMP
    `).get(req.params.token) as any;

    if (!entry) return res.status(404).json({ error: "Link expirado" });

    db.prepare(`
      UPDATE vehicle_checklist_items 
      SET image_url = ?, status = 'OK'
      WHERE id = ? AND entry_id = ?
    `).run(image_url, req.params.itemId, entry.id);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- AUTH REQUIRED ROUTES ----------------
router.use(authenticateToken);

// POST create entry
router.post("/", (req: AuthRequest, res) => {
  console.log("POST /api/entries hit", req.body);
  const id = uuidv4();
  const { client_id, vehicle_id } = req.body;
  
  try {
    // Validate tenant exists
    const tenant = db.prepare(`SELECT id FROM tenants WHERE id = ?`).get(req.user!.tenant_id);
    if (!tenant) {
      console.error("❌ Tenant not found:", req.user!.tenant_id);
      return res.status(400).json({ error: "Tenant inválido" });
    }

    // Validate vehicle exists if provided
    if (vehicle_id) {
      const vehicle = db.prepare(`SELECT id FROM vehicles WHERE id = ? AND tenant_id = ?`).get(vehicle_id, req.user!.tenant_id);
      if (!vehicle) {
        console.error("❌ Vehicle not found:", vehicle_id);
        return res.status(400).json({ error: "Veículo não encontrado" });
      }
    }

    // Validate client exists if provided
    if (client_id) {
      const client = db.prepare(`SELECT id FROM clients WHERE id = ? AND tenant_id = ?`).get(client_id, req.user!.tenant_id);
      if (!client) {
        console.error("❌ Client not found:", client_id);
        return res.status(400).json({ error: "Cliente não encontrado" });
      }
    }

    db.transaction(() => {
      db.prepare(`
        INSERT INTO vehicle_entries (id, tenant_id, client_id, vehicle_id, status)
        VALUES (?, ?, ?, ?, 'DRAFT')
      `).run(id, req.user!.tenant_id, client_id || null, vehicle_id || null);

      const items = [
        { category: 'Fotos do Veículo', item: 'Frente do Veículo', sort_order: -5 },
        { category: 'Fotos do Veículo', item: 'Traseira do Veículo', sort_order: -4 },
        { category: 'Fotos do Veículo', item: 'Lateral Esquerda', sort_order: -3 },
        { category: 'Fotos do Veículo', item: 'Lateral Direita', sort_order: -2 },
        { category: 'Fotos do Veículo', item: 'Painel (KM e Luzes)', sort_order: -1 },
      ];

      const stmt = db.prepare(`
        INSERT INTO vehicle_checklist_items (id, entry_id, category, item, status, sort_order)
        VALUES (?, ?, ?, ?, 'NA', ?)
      `);

      for (const item of items) {
        stmt.run(uuidv4(), id, item.category, item.item, item.sort_order);
      }
    })();

    res.status(201).json({ id });
  } catch (error: any) {
    console.error("❌ POST /entries error:", error.message);
    console.error("Error code:", error.code);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// GET entries by vehicle id
router.get("/vehicle/:vehicleId", (req: AuthRequest, res) => {
  try {
    // Check if vehicle_entries table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='vehicle_entries'").get();
    if (!tableCheck) {
      return res.json([]);
    }

    const entries = db.prepare(`
      SELECT * FROM vehicle_entries 
      WHERE vehicle_id = ? AND tenant_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.vehicleId, req.user!.tenant_id);
    res.json(entries);
  } catch (error: any) {
    console.error(`Error fetching entries for vehicle ${req.params.vehicleId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// GET all entries
router.get("/", (req: AuthRequest, res) => {
  try {
    const entries = db.prepare(`
      SELECT * FROM vehicle_entries 
      WHERE tenant_id = ? 
      ORDER BY created_at DESC
    `).all(req.user!.tenant_id);
    res.json(entries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single entry
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const entry = db.prepare(`
      SELECT * FROM vehicle_entries 
      WHERE id = ? AND tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!entry) return res.status(404).json({ error: "Entrada não encontrada" });

    const items = db.prepare(`
      SELECT * FROM vehicle_checklist_items 
      WHERE entry_id = ?
      ORDER BY sort_order ASC
    `).all(entry.id);

    res.json({ ...entry, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update entry
router.patch("/:id", (req: AuthRequest, res) => {
  const data = req.body;
  try {
    if (Object.keys(data).length === 0) {
      return res.json({ success: true });
    }
    
    // Convert values to SQLite-compatible types
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
    
    db.prepare(`
      UPDATE vehicle_entries 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(...values, req.params.id, req.user!.tenant_id);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ PATCH /entries/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// PATCH update item photo (authenticated - admin)
router.patch("/:id/items/:itemId", (req: AuthRequest, res) => {
  const { image_url } = req.body;
  try {
    // Verify the entry belongs to this tenant
    const entry = db.prepare(`
      SELECT id FROM vehicle_entries WHERE id = ? AND tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!entry) return res.status(404).json({ error: "Entrada não encontrada" });

    db.prepare(`
      UPDATE vehicle_checklist_items 
      SET image_url = ?, status = CASE WHEN ? IS NULL THEN 'NA' ELSE 'OK' END
      WHERE id = ? AND entry_id = ?
    `).run(image_url, image_url, req.params.itemId, req.params.id);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST generate token
router.post("/:id/token", (req: AuthRequest, res) => {
  try {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60000).toISOString().replace('T', ' ').replace('Z', ''); 

    const result = db.prepare(`
      UPDATE vehicle_entries 
      SET public_token = ?, token_expires_at = ?
      WHERE id = ? AND tenant_id = ?
    `).run(token, expiresAt, req.params.id, req.user!.tenant_id);

    if (result.changes === 0) return res.status(404).json({ error: "Entrada não encontrada" });

    res.json({ token, expiresAt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE entry
router.delete("/:id", (req: AuthRequest, res) => {
  try {
    db.prepare("DELETE FROM vehicle_checklist_items WHERE entry_id = ?").run(req.params.id);
    db.prepare("DELETE FROM vehicle_entries WHERE id = ? AND tenant_id = ?").run(req.params.id, req.user!.tenant_id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
