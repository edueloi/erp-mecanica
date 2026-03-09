import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Middleware to check if user is SUPER_ADMIN
const isSuperAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Access denied. Super Admin only." });
  }
  next();
};

router.use(authenticateToken);
router.use(isSuperAdmin);

// ========================================
// SUPERADMIN SETTINGS
// ========================================

router.get("/settings", (req, res) => {
  try {
    let settings = db.prepare("SELECT * FROM superadmin_settings LIMIT 1").get() as any;

    if (!settings) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO superadmin_settings (id, power_bi_title, default_user_limit, default_due_day, default_subscription_value)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, 'Painel Financeiro', 5, 5, 0);

      settings = db.prepare("SELECT * FROM superadmin_settings WHERE id = ?").get(id);
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/settings", (req, res) => {
  const {
    power_bi_url,
    power_bi_title,
    billing_url,
    onboarding_url,
    support_url,
    default_user_limit,
    default_due_day,
    default_subscription_value,
  } = req.body;

  try {
    let settings = db.prepare("SELECT id FROM superadmin_settings LIMIT 1").get() as any;

    if (!settings) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO superadmin_settings (id, power_bi_title, default_user_limit, default_due_day, default_subscription_value)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, 'Painel Financeiro', 5, 5, 0);
      settings = { id };
    }

    db.prepare(`
      UPDATE superadmin_settings
      SET power_bi_url = COALESCE(?, power_bi_url),
          power_bi_title = COALESCE(?, power_bi_title),
          billing_url = COALESCE(?, billing_url),
          onboarding_url = COALESCE(?, onboarding_url),
          support_url = COALESCE(?, support_url),
          default_user_limit = COALESCE(?, default_user_limit),
          default_due_day = COALESCE(?, default_due_day),
          default_subscription_value = COALESCE(?, default_subscription_value),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      power_bi_url,
      power_bi_title,
      billing_url,
      onboarding_url,
      support_url,
      default_user_limit,
      default_due_day,
      default_subscription_value,
      settings.id
    );

    const updated = db.prepare("SELECT * FROM superadmin_settings WHERE id = ?").get(settings.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// PRICING PLANS ROUTES
// ========================================

router.get("/plans", (req, res) => {
  try {
    const plans = db.prepare("SELECT * FROM pricing_plans ORDER BY monthly_value ASC").all();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/plans", (req, res) => {
  const { name, description, user_limit, monthly_value, months_duration } = req.body;
  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO pricing_plans (id, name, description, user_limit, monthly_value, months_duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, description, user_limit, monthly_value, months_duration || 1);
    res.status(201).json({ id, message: "Plan created successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/plans/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, user_limit, monthly_value, months_duration, active } = req.body;
  try {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (user_limit !== undefined) { fields.push("user_limit = ?"); values.push(user_limit); }
    if (monthly_value !== undefined) { fields.push("monthly_value = ?"); values.push(monthly_value); }
    if (months_duration !== undefined) { fields.push("months_duration = ?"); values.push(months_duration); }
    if (active !== undefined) { fields.push("active = ?"); values.push(active ? 1 : 0); }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(id);
    db.prepare(`UPDATE pricing_plans SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    res.json({ message: "Plan updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/plans/:id", (req, res) => {
  const { id } = req.params;
  try {
    const usage = db.prepare("SELECT COUNT(*) as count FROM tenants WHERE plan_id = ?").get(id) as any;
    if (usage.count > 0) {
      return res.status(400).json({ error: "Cannot delete plan being used by workshops" });
    }
    db.prepare("DELETE FROM pricing_plans WHERE id = ?").run(id);
    res.json({ message: "Plan deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// TENANT ROUTES
// ========================================

// List all tenants with user counts, plan info and admin email
router.get("/tenants", (req, res) => {
  try {
    const tenants = db.prepare(`
      SELECT 
        t.*, 
        p.name as plan_name,
        (SELECT email FROM users WHERE tenant_id = t.id AND role = 'ADMIN' LIMIT 1) as admin_email,
        (SELECT name FROM users WHERE tenant_id = t.id AND role = 'ADMIN' LIMIT 1) as admin_name,
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count 
      FROM tenants t
      LEFT JOIN pricing_plans p ON t.plan_id = p.id
      WHERE t.id != 'system-tenant-id'
      ORDER BY t.name ASC
    `).all();
    res.json(tenants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new tenant and its first admin
router.post("/tenants", async (req, res) => {
  const { 
    name, document, address, phone, user_limit, 
    admin_name, admin_email, admin_password, 
    subscription_value, due_day, plan_id, logo_url
  } = req.body;

  try {
    const tenantId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(admin_password, 10);

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO tenants (id, name, document, address, phone, user_limit, subscription_value, due_day, plan_id, logo_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tenantId, name, document, address, phone, user_limit || 5, subscription_value || 0, due_day || 5, plan_id || null, logo_url || null);

      db.prepare(`
        INSERT INTO users (id, tenant_id, name, email, password, role) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, tenantId, admin_name, admin_email, hashedPassword, 'ADMIN');
    });

    transaction();
    res.status(201).json({ message: "Tenant and admin user created successfully.", tenantId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update tenant info
router.patch("/tenants/:id", (req, res) => {
  const { id } = req.params;
  const { 
    name, document, phone, address, user_limit, 
    subscription_value, due_day, status, plan_id, logo_url,
    admin_name, admin_email, admin_password
  } = req.body;

  try {
    const transaction = db.transaction(() => {
      // 1. Update Tenant
      const tFields = [];
      const tValues = [];
      if (name !== undefined) { tFields.push("name = ?"); tValues.push(name); }
      if (document !== undefined) { tFields.push("document = ?"); tValues.push(document); }
      if (phone !== undefined) { tFields.push("phone = ?"); tValues.push(phone); }
      if (address !== undefined) { tFields.push("address = ?"); tValues.push(address); }
      if (user_limit !== undefined) { tFields.push("user_limit = ?"); tValues.push(user_limit); }
      if (subscription_value !== undefined) { tFields.push("subscription_value = ?"); tValues.push(subscription_value); }
      if (due_day !== undefined) { tFields.push("due_day = ?"); tValues.push(due_day); }
      if (status !== undefined) { tFields.push("status = ?"); tValues.push(status); }
      if (plan_id !== undefined) { tFields.push("plan_id = ?"); tValues.push(plan_id); }
      if (logo_url !== undefined) { tFields.push("logo_url = ?"); tValues.push(logo_url); }

      if (tFields.length > 0) {
        tValues.push(id);
        db.prepare(`UPDATE tenants SET ${tFields.join(", ")} WHERE id = ?`).run(...tValues);
      }

      // 2. Update Primary Admin if provided
      if (admin_name || admin_email || admin_password) {
        // Find the first ADMIN of this tenant
        const admin = db.prepare("SELECT id FROM users WHERE tenant_id = ? AND role = 'ADMIN' LIMIT 1").get(id) as any;
        if (admin) {
          const uFields = [];
          const uValues = [];
          if (admin_name) { uFields.push("name = ?"); uValues.push(admin_name); }
          if (admin_email) { uFields.push("email = ?"); uValues.push(admin_email); }
          if (admin_password) { 
            const hashedPassword = bcrypt.hashSync(admin_password, 10);
            uFields.push("password = ?"); 
            uValues.push(hashedPassword); 
          }
          
          if (uFields.length > 0) {
            uValues.push(admin.id);
            db.prepare(`UPDATE users SET ${uFields.join(", ")} WHERE id = ?`).run(...uValues);
          }
        }
      }
    });

    transaction();
    res.json({ message: "Tenant and Admin updated successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get users of a specific tenant
router.get("/tenants/:id/users", (req, res) => {
  const { id } = req.params;
  try {
    const users = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE tenant_id = ?").all(id);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tenant
router.delete("/tenants/:id", (req, res) => {
  const { id } = req.params;
  try {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM users WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM tenants WHERE id = ?").run(id);
    });
    transaction();
    res.json({ message: "Tenant deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
