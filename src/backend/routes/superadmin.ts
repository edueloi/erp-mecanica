import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Get all tenants with user count and plan details
router.get("/tenants", authenticateToken, (req: AuthRequest, res) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: "Access denied" });

  try {
    const tenants = db.prepare(`
      SELECT t.*, 
             p.name as plan_name,
             (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count
      FROM tenants t
      LEFT JOIN pricing_plans p ON t.plan_id = p.id
      ORDER BY t.created_at DESC
    `).all();
    res.json(tenants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant audit logs
router.get("/tenants/:id/logs", authenticateToken, (req: AuthRequest, res) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: "Access denied" });

  try {
    const logs = db.prepare(`
      SELECT l.*, u.name as user_name
      FROM tenant_audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.tenant_id = ?
      ORDER BY l.created_at DESC
    `).all(req.params.id);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update tenant status with payment recording and automatic lock logic
router.patch("/tenants/:id", authenticateToken, (req: AuthRequest, res) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: "Access denied" });

  const { id } = req.params;
  const { status, payment_date, payment_method, ...otherFields } = req.body;

  try {
    const oldTenant = db.prepare("SELECT status FROM tenants WHERE id = ?").get(id) as any;
    
    const transaction = db.transaction(() => {
      // If status is changing to ACTIVE (Manual activation or regular payment)
      if (status === 'ACTIVE') {
        const pDate = payment_date || new Date().toISOString();
        
        // Record payment in audit logs
        db.prepare(`
          INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action_type, description, payment_date, payment_method, old_status, new_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(), id, req.user?.id, 'PAYMENT_RECORDED', 
          `Pagamento registrado via ${payment_method || 'N/A'}`, 
          pDate, payment_method || 'PIX', 
          oldTenant.status, 'ACTIVE'
        );

        // Update last_payment_date to reset the 30+7 day cycle
        db.prepare("UPDATE tenants SET last_payment_date = ?, status = 'ACTIVE' WHERE id = ?").run(pDate, id);
      } else if (status && status !== oldTenant.status) {
        db.prepare(`
          INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action_type, description, old_status, new_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), id, req.user?.id, 'STATUS_CHANGED', `Alteração manual de status`, oldTenant.status, status);
        
        db.prepare("UPDATE tenants SET status = ? WHERE id = ?").run(status, id);
      }

      // Update other basic fields if any
      const updates = Object.keys(otherFields).filter(k => k !== 'status').map(k => `${k} = ?`).join(", ");
      if (updates) {
        db.prepare(`UPDATE tenants SET ${updates} WHERE id = ?`).run(...Object.values(otherFields).filter((_, i) => Object.keys(otherFields)[i] !== 'status'), id);
      }
    });

    transaction();
    res.json({ message: "Tenant updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/plans", authenticateToken, (req, res) => {
  try {
    const plans = db.prepare("SELECT * FROM pricing_plans WHERE active = 1").all();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
