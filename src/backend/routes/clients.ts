import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", (req: AuthRequest, res) => {
  const { q, status } = req.query;
  let query = "SELECT * FROM clients WHERE tenant_id = ?";
  const params: any[] = [req.user!.tenant_id];

  if (q) {
    query += " AND (name LIKE ? OR document LIKE ? OR email LIKE ? OR phone LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY name ASC";
  const clients = db.prepare(query).all(...params);
  res.json(clients.map((c: any) => ({ ...c, tags: JSON.parse(c.tags || "[]") })));
});

router.post("/", (req: AuthRequest, res) => {
  const { 
    type, name, document, email, phone, status, zip_code, street, number, 
    neighborhood, city, state, complement, reference, birth_date, 
    state_registration, alt_phone, alt_name, pref_contact, best_time, 
    internal_notes, tags 
  } = req.body;
  const id = uuidv4();

  try {
    db.prepare(`
      INSERT INTO clients (
        id, tenant_id, type, name, document, email, phone, status, zip_code, 
        street, number, neighborhood, city, state, complement, reference, 
        birth_date, state_registration, alt_phone, alt_name, pref_contact, 
        best_time, internal_notes, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.tenant_id, type || 'PF', name, document, email, phone, 
      status || 'ACTIVE', zip_code, street, number, neighborhood, city, state, 
      complement, reference, birth_date, state_registration, alt_phone, 
      alt_name, pref_contact || 'WHATSAPP', best_time, internal_notes, 
      JSON.stringify(tags || [])
    );
    
    const newClient = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
    res.status(201).json(newClient);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", (req: AuthRequest, res) => {
  const client = db.prepare("SELECT * FROM clients WHERE id = ? AND tenant_id = ?")
    .get(req.params.id, req.user!.tenant_id) as any;
  
  if (!client) return res.status(404).json({ error: "Client not found" });
  
  client.tags = JSON.parse(client.tags || "[]");
  
  // Include relationships
  const vehicles = db.prepare("SELECT * FROM vehicles WHERE client_id = ?").all(req.params.id);
  const workOrders = db.prepare(`
    SELECT wo.*, v.plate, v.model 
    FROM work_orders wo 
    JOIN vehicles v ON wo.vehicle_id = v.id 
    WHERE wo.client_id = ? 
    ORDER BY wo.created_at DESC
  `).all(req.params.id);
  
  res.json({ ...client, vehicles, workOrders });
});

router.patch("/:id", (req: AuthRequest, res) => {
  const fields = Object.keys(req.body).filter(k => k !== 'id' && k !== 'tenant_id');
  if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const params = fields.map(f => {
    const val = req.body[f];
    return (f === 'tags') ? JSON.stringify(val) : val;
  });
  params.push(req.params.id, req.user!.tenant_id);

  try {
    db.prepare(`UPDATE clients SET ${setClause} WHERE id = ? AND tenant_id = ?`)
      .run(...params);
    res.json({ message: "Client updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
