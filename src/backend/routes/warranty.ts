import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Debug route
router.get("/debug", async (req: AuthRequest, res) => {
  try {
    const templatesTable = await db.queryOne("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'warranty_templates'", []);
    const termsTable = await db.queryOne("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'warranty_terms'", []);
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
router.get("/templates", async (req: AuthRequest, res) => {
  try {
    const templates = await db.query(`
      SELECT * FROM warranty_templates WHERE tenant_id = ? ORDER BY title ASC
    `, [req.user!.tenant_id]);
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post("/templates", async (req: AuthRequest, res) => {
  const { title, content, days_duration } = req.body;
  const id = uuidv4();
  try {
    await db.execute(`
      INSERT INTO warranty_templates (id, tenant_id, title, content, days_duration)
      VALUES (?, ?, ?, ?, ?)
    `, [id, req.user!.tenant_id, title, content, days_duration || 90]);

    const template = await db.queryOne("SELECT * FROM warranty_templates WHERE id = ?", [id]);
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.patch("/templates/:id", async (req: AuthRequest, res) => {
  const { title, content, days_duration } = req.body;
  try {
    await db.execute(`
      UPDATE warranty_templates
      SET title = ?, content = ?, days_duration = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [title, content, days_duration, req.params.id, req.user!.tenant_id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete("/templates/:id", async (req: AuthRequest, res) => {
  try {
    await db.execute("DELETE FROM warranty_templates WHERE id = ? AND tenant_id = ?", [req.params.id, req.user!.tenant_id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Issued Terms ---

// List issued terms
router.get("/issued", async (req: AuthRequest, res) => {
  try {
    const terms = await db.query(`
      SELECT t.*, v.plate, c.name as client_name, u.name as responsible_name
      FROM warranty_terms t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.responsible_id = u.id
      WHERE t.tenant_id = ?
      ORDER BY t.issued_at DESC
    `, [req.user!.tenant_id]);
    res.json(terms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Issue new term
router.post("/issued", async (req: AuthRequest, res) => {
  const { vehicle_id, client_id, work_order_id, template_id, title, content, days_duration } = req.body;
  const id = uuidv4();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (days_duration || 90));

  try {
    await db.execute(`
      INSERT INTO warranty_terms (
        id, tenant_id, vehicle_id, client_id, work_order_id, template_id,
        title, content, expires_at, responsible_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, req.user!.tenant_id, vehicle_id, client_id, work_order_id, template_id,
      title, content, expiresAt.toISOString(), req.user!.id
    ]);

    // Log in vehicle history if vehicle_id exists
    if (vehicle_id) {
      await db.execute(`
        INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id)
        VALUES (?, ?, ?, 'MAINTENANCE', ?, ?)
      `, [uuidv4(), vehicle_id, req.user!.tenant_id, `Termo de Garantia Emitido: ${title}`, req.user!.id]);
    }

    const term = await db.queryOne("SELECT * FROM warranty_terms WHERE id = ?", [id]);
    res.status(201).json(term);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
