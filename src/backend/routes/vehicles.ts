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
