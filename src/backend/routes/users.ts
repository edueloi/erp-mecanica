import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// List users for the current tenant
router.get("/", async (req: AuthRequest, res) => {
  try {
    const users = await db.query(`
      SELECT id, name, email, role, photo_url, permissions, created_at
      FROM users
      WHERE tenant_id = ?
      ORDER BY name ASC
    `, [req.user!.tenant_id]);
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
    const tenant = await db.queryOne("SELECT user_limit FROM tenants WHERE id = ?", [tenant_id]) as any;
    const userCountRow = await db.queryOne("SELECT COUNT(*) as count FROM users WHERE tenant_id = ?", [tenant_id]) as any;

    if (userCountRow.count >= tenant.user_limit && req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: `Limite de usuários atingido (${tenant.user_limit}). Entre em contato com o suporte.`
      });
    }

    const existing = await db.queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(`
      INSERT INTO users (id, tenant_id, name, email, password, role, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, tenant_id, name, email, hashedPassword, role, JSON.stringify(permissions || {})]);

    res.status(201).json({ message: "Usuário criado com sucesso.", id: userId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user or own profile
router.patch("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const isUpdatingSelf = req.user?.id === id;

  if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPER_ADMIN" && !isUpdatingSelf) {
    return res.status(403).json({ error: "Access denied." });
  }

  const { name, email, role, password, permissions, photo_url, surname, biography, education, profession, phone, cpf } = req.body;

  try {
    const fieldsToUpdate: any = { name, email, photo_url, surname, biography, education, profession, phone, cpf };

    if (role && (req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN")) {
      fieldsToUpdate.role = role;
    }
    if (permissions && (req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN")) {
      fieldsToUpdate.permissions = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
    }
    if (password) {
      fieldsToUpdate.password = await bcrypt.hash(password, 10);
    }

    Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

    const keys = Object.keys(fieldsToUpdate);
    if (keys.length === 0) return res.json({ message: "Nada para atualizar." });

    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const values = Object.values(fieldsToUpdate);

    if (req.user?.role === "SUPER_ADMIN") {
      await db.execute(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
    } else {
      await db.execute(`UPDATE users SET ${setClause} WHERE id = ? AND tenant_id = ?`, [...values, id, req.user!.tenant_id]);
    }

    res.json({ message: "Usuário atualizado com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete("/:id", async (req: AuthRequest, res) => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const { id } = req.params;

  try {
    if (id === req.user?.id) {
      return res.status(400).json({ error: "Você não pode excluir a si mesmo." });
    }

    await db.execute("DELETE FROM users WHERE id = ? AND tenant_id = ?", [id, req.user!.tenant_id]);
    res.json({ message: "Usuário excluído com sucesso." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
