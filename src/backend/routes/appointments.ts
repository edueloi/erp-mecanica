import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// List appointments with filters
router.get("/", (req: AuthRequest, res) => {
  const { date, status, q } = req.query;
  let query = `
    SELECT a.*, c.name as client_name, c.phone as client_phone, v.plate, v.model 
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN vehicles v ON a.vehicle_id = v.id
    WHERE a.tenant_id = ?
  `;
  const params: any[] = [req.user!.tenant_id];

  if (date) {
    query += " AND a.date = ?";
    params.push(date);
  }

  if (status) {
    query += " AND a.status = ?";
    params.push(status);
  }

  if (q) {
    query += " AND (c.name LIKE ? OR v.plate LIKE ? OR c.phone LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  query += " ORDER BY a.date ASC, a.time ASC";

  try {
    const appointments = db.prepare(query).all(...params);
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats for appointments
router.get("/stats", (req: AuthRequest, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'CONFIRMED' AND datetime(date || 'T' || time) >= datetime(?, '-15 minutes') THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'PENDING' AND datetime(date || 'T' || time) >= datetime(?, '-15 minutes') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'ARRIVED' THEN 1 ELSE 0 END) as arrived,
        SUM(CASE WHEN (status IN ('PENDING', 'CONFIRMED') AND datetime(date || 'T' || time) < datetime(?, '-15 minutes')) OR status = 'DELAYED' THEN 1 ELSE 0 END) as delayed
      FROM appointments 
      WHERE tenant_id = ? AND date = ?
    `).get(now, now, now, req.user!.tenant_id, targetDate);
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create appointment
router.post("/", (req: AuthRequest, res) => {
  const { 
    client_id, vehicle_id, date, time, service_description, 
    estimated_duration, notes, internal_notes, origin, send_confirmation 
  } = req.body;
  
  const id = uuidv4();
  const user_id = req.user!.id;
  const tenant_id = req.user!.tenant_id;

  try {
    db.prepare(`
      INSERT INTO appointments (
        id, tenant_id, client_id, vehicle_id, user_id, date, time, 
        service_description, estimated_duration, status, notes, 
        internal_notes, origin, send_confirmation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)
    `).run(
      id, tenant_id, client_id, vehicle_id, user_id, date, time, 
      service_description, estimated_duration || 60, notes, 
      internal_notes, origin, send_confirmation ? 1 : 0
    );

    const newAppointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
    res.status(201).json(newAppointment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment status
router.patch("/:id/status", (req: AuthRequest, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    db.prepare("UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?")
      .run(status, id, req.user!.tenant_id);
    res.json({ message: "Status updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment
router.patch("/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  const fields = Object.keys(req.body).filter(k => k !== 'id' && k !== 'tenant_id');
  
  if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const params = fields.map(f => req.body[f]);
  params.push(id, req.user!.tenant_id);

  try {
    db.prepare(`UPDATE appointments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`)
      .run(...params);
    res.json({ message: "Appointment updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
