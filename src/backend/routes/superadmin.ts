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

// List all tenants with user counts
router.get("/tenants", (req, res) => {
  try {
    const tenants = db.prepare(`
      SELECT 
        t.*, 
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count 
      FROM tenants t
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
  const { name, document, address, phone, user_limit, admin_name, admin_email, admin_password } = req.body;

  try {
    const tenantId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(admin_password, 10);

    // Start transaction
    const transaction = db.transaction(() => {
      // Create Tenant
      db.prepare(`
        INSERT INTO tenants (id, name, document, address, phone, user_limit) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(tenantId, name, document, address, phone, user_limit || 5);

      // Create Admin User for this tenant
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

// Update tenant limit
router.patch("/tenants/:id/limit", (req, res) => {
  const { id } = req.params;
  const { user_limit } = req.body;

  try {
    db.prepare("UPDATE tenants SET user_limit = ? WHERE id = ?").run(user_limit, id);
    res.json({ message: "User limit updated successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tenant (careful!)
router.delete("/tenants/:id", (req, res) => {
  const { id } = req.params;

  try {
    // Should probably delete all related data or just mark as inactive
    // For now, let's just delete users and tenant
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
