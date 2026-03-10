import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", (req: AuthRequest, res) => {
  const { client_id, q } = req.query;
  let query = "SELECT v.*, c.name as client_name FROM vehicles v JOIN clients c ON v.client_id = c.id WHERE v.tenant_id = ?";
  const params: any[] = [req.user!.tenant_id];

  if (client_id) {
    query += " AND v.client_id = ?";
    params.push(client_id);
  }

  if (q) {
    query += " AND (v.plate LIKE ? OR v.model LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  const vehicles = db.prepare(query).all(...params);
  res.json(vehicles);
});

// GET single vehicle with full history
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const vehicle = db.prepare(`
      SELECT v.*, c.name as client_name 
      FROM vehicles v 
      JOIN clients c ON v.client_id = c.id 
      WHERE v.id = ? AND v.tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!vehicle) {
      return res.status(404).json({ error: "Veículo não encontrado" });
    }

    // Fetch work orders history for this vehicle
    const workOrders = db.prepare(`
      SELECT wo.*, u.name as mechanic_name
      FROM work_orders wo
      LEFT JOIN users u ON wo.mechanic_id = u.id
      WHERE wo.vehicle_id = ? AND wo.tenant_id = ?
      ORDER BY wo.created_at DESC
    `).all(vehicle.id, req.user!.tenant_id);

    // For each work order, fetch its items (services and parts)
    const workOrdersWithItems = workOrders.map((wo: any) => {
      const items = db.prepare(`
        SELECT woi.*, 
               COALESCE(p.name, s.name) as name,
               CASE WHEN woi.part_id IS NOT NULL THEN 'PART' ELSE 'SERVICE' END as category
        FROM work_order_items woi
        LEFT JOIN parts p ON woi.part_id = p.id
        LEFT JOIN services s ON woi.service_id = s.id
        WHERE woi.work_order_id = ?
      `).all(wo.id);

      return {
        ...wo,
        items
      };
    });

    vehicle.workOrders = workOrdersWithItems;

    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", (req: AuthRequest, res) => {
  const { client_id, plate, brand, model, year, color, vin, fuel_type, km } = req.body;
  const id = uuidv4();

  try {
    db.prepare(`
      INSERT INTO vehicles (id, tenant_id, client_id, plate, brand, model, year, color, vin, fuel_type, km)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.tenant_id, client_id, plate, brand, model, year, color, vin, fuel_type, km || 0);
    
    const newVehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(id);
    res.status(201).json(newVehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
