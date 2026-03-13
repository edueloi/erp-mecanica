import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../db";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "mecaerp-secret-key";

router.post("/register", async (req, res) => {
  const { tenantName, userName, email, password } = req.body;
  try {
    const tenantId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute("INSERT INTO tenants (id, name) VALUES (?, ?)", [tenantId, tenantName]);
    await db.execute(
      "INSERT INTO users (id, tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, tenantId, userName, email, hashedPassword, 'ADMIN']
    );
    res.status(201).json({ message: "Tenant and admin user created successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.queryOne("SELECT * FROM users WHERE email = ?", [email]) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const tenant = await db.queryOne("SELECT * FROM tenants WHERE id = ?", [user.tenant_id]) as any;
    const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    const token = jwt.sign(
      {
        id: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
        name: user.name,
        tenant_name: tenant.name,
        permissions: perms,
        profession: user.profession
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname || "",
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: tenant.name,
        photo_url: user.photo_url,
        profession: user.profession || "",
        biography: user.biography || "",
        education: user.education || "",
        phone: user.phone || "",
        cpf: user.cpf || "",
        permissions: perms
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
