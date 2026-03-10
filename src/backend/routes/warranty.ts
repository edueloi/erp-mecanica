import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Debug route
router.get("/debug", (req: AuthRequest, res) => {
  try {
    const templatesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='warranty_templates'").get();
    const termsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='warranty_terms'").get();
    res.json({
      templatesTable: !!templatesTable,
      termsTable: !!termsTable,
      user: req.user
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Templates ---

// List templates
router.get("/templates", (req: AuthRequest, res) => {
  try {
    const templates = db.prepare(`
      SELECT * FROM warranty_templates WHERE tenant_id = ? ORDER BY title ASC
    `).all(req.user!.tenant_id);
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post("/templates", (req: AuthRequest, res) => {
  const { title, content, days_duration } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO warranty_templates (id, tenant_id, title, content, days_duration)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user!.tenant_id, title, content, days_duration || 90);
    
    const template = db.prepare("SELECT * FROM warranty_templates WHERE id = ?").get(id);
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.patch("/templates/:id", (req: AuthRequest, res) => {
  const { title, content, days_duration } = req.body;
  try {
    db.prepare(`
      UPDATE warranty_templates 
      SET title = ?, content = ?, days_duration = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(title, content, days_duration, req.params.id, req.user!.tenant_id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete("/templates/:id", (req: AuthRequest, res) => {
  try {
    db.prepare("DELETE FROM warranty_templates WHERE id = ? AND tenant_id = ?").run(req.params.id, req.user!.tenant_id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Issued Terms ---

// List issued terms
router.get("/issued", (req: AuthRequest, res) => {
  try {
    const terms = db.prepare(`
      SELECT t.*, v.plate, c.name as client_name, u.name as responsible_name
      FROM warranty_terms t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.responsible_id = u.id
      WHERE t.tenant_id = ?
      ORDER BY t.issued_at DESC
    `).all(req.user!.tenant_id);
    res.json(terms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Issue new term
router.post("/issued", (req: AuthRequest, res) => {
  const { vehicle_id, client_id, work_order_id, template_id, title, content, days_duration } = req.body;
  const id = uuidv4();
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (days_duration || 90));

  try {
    db.prepare(`
      INSERT INTO warranty_terms (
        id, tenant_id, vehicle_id, client_id, work_order_id, template_id, 
        title, content, expires_at, responsible_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.tenant_id, vehicle_id, client_id, work_order_id, template_id,
      title, content, expiresAt.toISOString(), req.user!.id
    );

    // Log in vehicle history if vehicle_id exists
    if (vehicle_id) {
       db.prepare(`
        INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id)
        VALUES (?, ?, ?, 'MAINTENANCE', ?, ?)
      `).run(uuidv4(), vehicle_id, req.user!.tenant_id, `Termo de Garantia Emitido: ${title}`, req.user!.id);
    }

    const term = db.prepare("SELECT * FROM warranty_terms WHERE id = ?").get(id);
    res.status(201).json(term);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
