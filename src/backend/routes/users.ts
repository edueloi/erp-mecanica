import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// List users for the current tenant
router.get("/", (req: AuthRequest, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, permissions, created_at 
      FROM users 
      WHERE tenant_id = ? 
      ORDER BY name ASC
    `).all(req.user!.tenant_id);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (tenant admin only)
router.post("/", async (req: AuthRequest, res) => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const { name, email, password, role, permissions } = req.body;
  const tenant_id = req.user!.tenant_id;

  try {
    // Check user limit
    const tenant = db.prepare("SELECT user_limit FROM tenants WHERE id = ?").get(tenant_id) as any;
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE tenant_id = ?").get(tenant_id) as any;

    if (userCount.count >= tenant.user_limit && req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({ 
        error: `Limite de usuários atingido (${tenant.user_limit}). Entre em contato com o suporte.` 
      });
    }

    // Check if email exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare(`
      INSERT INTO users (id, tenant_id, name, email, password, role, permissions) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, tenant_id, name, email, hashedPassword, role, JSON.stringify(permissions || {}));

    res.status(201).json({ message: "Usuário criado com sucesso.", id: userId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.patch("/:id", async (req: AuthRequest, res) => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPER_ADMIN" && req.user?.id !== req.params.id) {
    return res.status(403).json({ error: "Access denied." });
  }

  const { name, email, role, password, permissions } = req.body;
  const { id } = req.params;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare("UPDATE users SET name = ?, email = ?, role = ?, password = ?, permissions = ? WHERE id = ? AND tenant_id = ?")
        .run(name, email, role, hashedPassword, JSON.stringify(permissions || {}), id, req.user!.tenant_id);
    } else {
      db.prepare("UPDATE users SET name = ?, email = ?, role = ?, permissions = ? WHERE id = ? AND tenant_id = ?")
        .run(name, email, role, JSON.stringify(permissions || {}), id, req.user!.tenant_id);
    }
    res.json({ message: "Usuário atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete("/:id", (req: AuthRequest, res) => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const { id } = req.params;

  try {
    // Cannot delete yourself
    if (id === req.user?.id) {
      return res.status(400).json({ error: "Você não pode excluir a si mesmo." });
    }

    db.prepare("DELETE FROM users WHERE id = ? AND tenant_id = ?").run(id, req.user!.tenant_id);
    res.json({ message: "Usuário excluído com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
