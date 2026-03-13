import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// List all services for the tenant
router.get("/", async (req: AuthRequest, res) => {
  try {
    const services = await db.query("SELECT * FROM services WHERE tenant_id = ? ORDER BY name ASC", [req.user!.tenant_id]);
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new service
router.post("/", async (req: AuthRequest, res) => {
  const {
    name, code, category, description, estimated_time,
    default_price, estimated_cost, status, type, charging_type,
    warranty_days, allow_discount, requires_diagnosis, compatible_vehicles
  } = req.body;

  try {
    const id = uuidv4();
    await db.execute(`
      INSERT INTO services (
        id, tenant_id, name, code, category, description, estimated_time,
        default_price, estimated_cost, status, type, charging_type, warranty_days,
        allow_discount, requires_diagnosis, compatible_vehicles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, req.user!.tenant_id, name, code, category, description, estimated_time,
      default_price || 0, estimated_cost || 0, status || 'ACTIVE', type || 'LABOR', charging_type || 'FIXED',
      warranty_days || 90, allow_discount ? 1 : 0, requires_diagnosis ? 1 : 0,
      compatible_vehicles
    ]);

    const newService = await db.queryOne("SELECT * FROM services WHERE id = ?", [id]);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a service
router.patch("/:id", async (req: AuthRequest, res) => {
  const data = req.body;
  const allowedFields = [
    'name', 'code', 'category', 'description', 'estimated_time',
    'default_price', 'estimated_cost', 'status', 'type', 'charging_type',
    'warranty_days', 'allow_discount', 'requires_diagnosis', 'compatible_vehicles'
  ];

  try {
    const updates: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        updates.push(`${field} = ?`);
        values.push(field === 'allow_discount' || field === 'requires_diagnosis' ? (data[field] ? 1 : 0) : data[field]);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.params.id, req.user!.tenant_id);

      const query = `UPDATE services SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`;
      await db.execute(query, values);
    }

    const updated = await db.queryOne("SELECT * FROM services WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a service
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const result = await db.execute("DELETE FROM services WHERE id = ? AND tenant_id = ?", [req.params.id, req.user!.tenant_id]);
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Link part to a service
router.post("/:id/parts", async (req: AuthRequest, res) => {
  const { part_id, quantity } = req.body;
  const service_id = req.params.id;
  const tenant_id = req.user!.tenant_id;

  try {
    const existing = await db.queryOne("SELECT id FROM service_parts WHERE service_id = ? AND part_id = ? AND tenant_id = ?", [service_id, part_id, tenant_id]);
    if (existing) {
      return res.status(400).json({ error: "Part already linked to this service" });
    }

    const id = uuidv4();
    await db.execute(`
      INSERT INTO service_parts (id, tenant_id, service_id, part_id, quantity)
      VALUES (?, ?, ?, ?, ?)
    `, [id, tenant_id, service_id, part_id, quantity || 1]);

    const newLink = await db.queryOne(`
      SELECT sp.*, p.name as part_name, p.code as part_code, p.sale_price
      FROM service_parts sp
      JOIN parts p ON p.id = sp.part_id
      WHERE sp.id = ?
    `, [id]);

    res.status(201).json(newLink);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all parts linked to a service
router.get("/:id/parts", async (req: AuthRequest, res) => {
  const service_id = req.params.id;
  const tenant_id = req.user!.tenant_id;

  try {
    const parts = await db.query(`
      SELECT sp.*, p.name as part_name, p.code as part_code, p.sale_price, p.stock_quantity as current_stock
      FROM service_parts sp
      JOIN parts p ON p.id = sp.part_id
      WHERE sp.service_id = ? AND sp.tenant_id = ?
    `, [service_id, tenant_id]);
    res.json(parts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove part link from a service
router.delete("/:id/parts/:part_id", async (req: AuthRequest, res) => {
  const { id: service_id, part_id } = req.params;
  const tenant_id = req.user!.tenant_id;

  try {
    await db.execute("DELETE FROM service_parts WHERE service_id = ? AND part_id = ? AND tenant_id = ?", [service_id, part_id, tenant_id]);
    res.json({ message: "Part link removed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
