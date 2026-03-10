import express from "express";
import { v4 as uuidv4 } from "uuid";
import fs from 'fs';
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

    // Dynamic column detection for work_orders
    const woColumns = db.prepare("PRAGMA table_info('work_orders')").all() as any[];
    const validWoCols = woColumns.map(c => c.name.toLowerCase());
    
    // Choose the best column for mechanic/responsible join
    let mechanicJoin = '';
    let responsibleSelect = '';
    if (validWoCols.includes('responsible_id')) {
      mechanicJoin = 'LEFT JOIN users u ON wo.responsible_id = u.id';
      responsibleSelect = ', u.name as responsible_name';
    } else if (validWoCols.includes('mechanic_id')) {
      mechanicJoin = 'LEFT JOIN users u ON wo.mechanic_id = u.id';
      responsibleSelect = ', u.name as responsible_name';
    }

    // Check if tenant_id exists in work_orders
    const woHasTenant = validWoCols.includes('tenant_id');

    // Fetch work orders history for this vehicle
    const workOrders = db.prepare(`
      SELECT wo.* ${responsibleSelect}
      FROM work_orders wo
      ${mechanicJoin}
      WHERE wo.vehicle_id = ? ${woHasTenant ? 'AND wo.tenant_id = ?' : ''}
      ORDER BY wo.created_at DESC
    `).all(vehicle.id, ...(woHasTenant ? [req.user!.tenant_id] : []));

    // Dynamic column detection for work_order_items
    const woiColumns = db.prepare("PRAGMA table_info('work_order_items')").all() as any[];
    const validWoiCols = woiColumns.map(c => c.name.toLowerCase());

    // For each work order, fetch its items
    const workOrdersWithItems = workOrders.map((wo: any) => {
      const woiFields = ['woi.*'];
      if (validWoiCols.includes('type')) {
        woiFields.push("CASE WHEN woi.type = 'PART' THEN 'PART' ELSE 'SERVICE' END as item_category");
      } else if (validWoiCols.includes('category')) {
        woiFields.push("woi.category as item_category");
      }

      try {
        const items = db.prepare(`
          SELECT ${woiFields.join(', ')}
          FROM work_order_items woi
          WHERE woi.work_order_id = ?
        `).all(wo.id);

        return {
          ...wo,
          items
        };
      } catch (e) {
        console.error(`Error fetching items for WO ${wo.id}:`, e);
        return { ...wo, items: [] };
      }
    });

    vehicle.workOrders = workOrdersWithItems;

    res.json(vehicle);
  } catch (error: any) {
    console.error(`Error fetching vehicle ${req.params.id}:`, error);
    res.status(500).json({ 
      error: error.message, 
      details: "Ocorreu um erro no servidor ao carregar o histórico do veículo. Verifique se o banco de dados está atualizado."
    });
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
