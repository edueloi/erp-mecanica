import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// List all services for the tenant
router.get("/", (req: AuthRequest, res) => {
  try {
    const services = db.prepare("SELECT * FROM services WHERE tenant_id = ? ORDER BY name ASC").all(req.user!.tenant_id);
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new service
router.post("/", (req: AuthRequest, res) => {
  const { 
    name, code, category, description, estimated_time, 
    default_price, estimated_cost, status, type, 
    warranty_days, allow_discount, requires_diagnosis, compatible_vehicles 
  } = req.body;

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO services (
        id, tenant_id, name, code, category, description, estimated_time,
        default_price, estimated_cost, status, type, warranty_days,
        allow_discount, requires_diagnosis, compatible_vehicles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.tenant_id, name, code, category, description, estimated_time,
      default_price || 0, estimated_cost || 0, status || 'ACTIVE', type || 'LABOR', 
      warranty_days || 90, allow_discount ? 1 : 0, requires_diagnosis ? 1 : 0, 
      compatible_vehicles
    );

    const newService = db.prepare("SELECT * FROM services WHERE id = ?").get(id);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a service
router.patch("/:id", (req: AuthRequest, res) => {
  const data = req.body;
  const allowedFields = [
    'name', 'code', 'category', 'description', 'estimated_time',
    'default_price', 'estimated_cost', 'status', 'type',
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
      db.prepare(query).run(...values);
    }

    const updated = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a service
router.delete("/:id", (req: AuthRequest, res) => {
  try {
    const result = db.prepare("DELETE FROM services WHERE id = ? AND tenant_id = ?").run(req.params.id, req.user!.tenant_id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
