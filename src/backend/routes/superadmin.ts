import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Middleware to ensure user is Super Admin or Vendedor
const requireAdminOrSeller = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'VENDEDOR') {
    return res.status(403).json({ error: "Acesso negado." });
  }
  next();
};

// Middleware to ensure user is ONLY Super Admin
const requireSuperAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: "Acesso restrito ao Super Admin." });
  }
  next();
};

// ==========================================
// TENANTS (PARCEIROS)
// ==========================================

router.get("/tenants", requireAdminOrSeller, (req: AuthRequest, res) => {
  try {
    let query = `
      SELECT t.*, 
             p.name as plan_name,
             p.months_duration as plan_duration,
             (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count,
             u.name as admin_name,
             u.email as admin_email,
             u.photo_url as admin_photo
      FROM tenants t
      LEFT JOIN pricing_plans p ON t.plan_id = p.id
      LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'ADMIN'
    `;
    
    // Se for vendedor, vê apenas os dele
    if (req.user?.role === 'VENDEDOR') {
      query += ` WHERE t.seller_id = ? GROUP BY t.id ORDER BY t.created_at DESC`;
      const tenants = db.prepare(query).all(req.user.id);
      return res.json(tenants);
    } else {
      query += ` GROUP BY t.id ORDER BY t.created_at DESC`;
      const tenants = db.prepare(query).all();
      return res.json(tenants);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tenants", requireAdminOrSeller, (req: AuthRequest, res) => {
  const { name, document, phone, address, user_limit, subscription_value, due_day, plan_id, logo_url, admin_name, admin_email, admin_password, admin_photo } = req.body;
  const tenantId = uuidv4();
  const userId = uuidv4();
  const sellerId = req.user?.role === 'VENDEDOR' ? req.user.id : null;

  try {
    const transaction = db.transaction(() => {
      // 1. Create Tenant
      db.prepare(`
        INSERT INTO tenants (id, name, document, phone, address, user_limit, subscription_value, due_day, plan_id, logo_url, seller_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TRIAL')
      `).run(tenantId, name, document || null, phone || null, address || null, user_limit || 5, subscription_value || 0, due_day || 5, plan_id || null, logo_url || null, sellerId);

      // 2. Create Tenant Admin User
      const hash = bcrypt.hashSync(admin_password || '123456', 10);
      db.prepare(`
        INSERT INTO users (id, tenant_id, name, email, password, role, photo_url)
        VALUES (?, ?, ?, ?, ?, 'ADMIN', ?)
      `).run(userId, tenantId, admin_name, admin_email, hash, admin_photo || null);

      // 3. Log Audit (Creation)
      db.prepare(`
        INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action_type, description, new_status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), tenantId, req.user?.id, 'USER_CREATED', 'Parceiro integrado ao sistema', 'TRIAL');
    });

    transaction();
    res.json({ message: "Parceiro criado com sucesso!", tenantId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/tenants/:id", requireAdminOrSeller, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, payment_date, payment_method, admin_name, admin_email, admin_password, admin_photo, ...otherFields } = req.body;

  try {
    // Vendedor só pode alterar as próprias oficinas
    const oldTenant = db.prepare("SELECT status, seller_id FROM tenants WHERE id = ?").get(id) as any;
    if (!oldTenant) return res.status(404).json({ error: "Parceiro não encontrado" });
    
    if (req.user?.role === 'VENDEDOR' && oldTenant.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Sem permissão para alterar este parceiro." });
    }

    const transaction = db.transaction(() => {
      // Auditoria de Pagamento e Status
      if (status === 'ACTIVE' && oldTenant.status !== 'ACTIVE') {
        const pDate = payment_date || new Date().toISOString();
        db.prepare(`
          INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action_type, description, payment_date, payment_method, old_status, new_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), id, req.user?.id, 'PAYMENT_RECORDED', `Ativação com pagamento (${payment_method || 'PIX'})`, pDate, payment_method || 'PIX', oldTenant.status, 'ACTIVE');
        db.prepare("UPDATE tenants SET last_payment_date = ?, status = 'ACTIVE' WHERE id = ?").run(pDate, id);
      } else if (status && status !== oldTenant.status) {
        db.prepare(`
          INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action_type, description, old_status, new_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), id, req.user?.id, 'STATUS_CHANGED', `Alteração de status`, oldTenant.status, status);
        db.prepare("UPDATE tenants SET status = ? WHERE id = ?").run(status, id);
      }

      // Outros campos do Tenant
      const updates = Object.keys(otherFields).map(k => `${k} = ?`).join(", ");
      if (updates) {
        db.prepare(`UPDATE tenants SET ${updates} WHERE id = ?`).run(...Object.values(otherFields), id);
      }

      // Atualizar dados do Admin local se fornecido
      if (admin_name || admin_email || admin_password || admin_photo !== undefined) {
        const adminUser = db.prepare("SELECT id FROM users WHERE tenant_id = ? AND role = 'ADMIN' LIMIT 1").get(id) as any;
        if (adminUser) {
          if (admin_name) db.prepare("UPDATE users SET name = ? WHERE id = ?").run(admin_name, adminUser.id);
          if (admin_email) db.prepare("UPDATE users SET email = ? WHERE id = ?").run(admin_email, adminUser.id);
          if (admin_photo !== undefined) db.prepare("UPDATE users SET photo_url = ? WHERE id = ?").run(admin_photo, adminUser.id);
          if (admin_password) {
            const hash = bcrypt.hashSync(admin_password, 10);
            db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hash, adminUser.id);
          }
        }
      }
    });

    transaction();
    res.json({ message: "Parceiro atualizado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/tenants/:id", requireSuperAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM tenant_audit_logs WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM users WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM tenants WHERE id = ?").run(id);
    });
    transaction();
    res.json({ message: "Excluído com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tenants/:id/logs", requireAdminOrSeller, (req: AuthRequest, res) => {
  try {
    const logs = db.prepare(`
      SELECT l.*, u.name as user_name, u.email as user_email, u.photo_url as user_photo
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

// ==========================================
// EQUIPE INTERNA (SUPER ADMIN / VENDEDOR)
// ==========================================

router.get("/team", requireSuperAdmin, (req: AuthRequest, res) => {
  try {
    // Retorna apenas usuários que não pertencem a nenhum tenant (Sistema central) ou que tenham role VENDEDOR/SUPER_ADMIN
    const team = db.prepare(`
      SELECT id, name, email, role, phone, cpf, profession, created_at 
      FROM users 
      WHERE role IN ('SUPER_ADMIN', 'VENDEDOR')
      ORDER BY created_at DESC
    `).all();
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/team", requireSuperAdmin, (req: AuthRequest, res) => {
  const { name, email, password, role, phone, cpf, profession } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    // Usamos tenant_id = null para equipe do sistema global (para evitar Foreign Key falha, ou um tenant raiz fictício. O sqlite null é aceito)
    // No entanto, se o BD exige tenant_id NOT NULL, precisamos usar um ID global ou desabilitar NOT NULL.
    // Presumindo que o banco aceita tenant_id ou usamos um hardcoded. 
    // Para simplificar, vou tentar null ou ignorar.
    db.prepare(`
      INSERT INTO users (id, name, email, password, role, phone, cpf, profession)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), name, email, hash, role, phone || null, cpf || null, profession || null);
    res.json({ message: "Membro da equipe criado com sucesso!" });
  } catch (error: any) {
    // Caso de erro de constraint de tenant_id, vamos inserir um tenant_id fake ou o do super admin atual
    try {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare(`
        INSERT INTO users (id, tenant_id, name, email, password, role, phone, cpf, profession)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), req.user?.tenant_id, name, email, hash, role, phone || null, cpf || null, profession || null);
      res.json({ message: "Membro da equipe criado." });
    } catch (e: any) {
       res.status(500).json({ error: e.message });
    }
  }
});

router.delete("/team/:id", requireSuperAdmin, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ error: "Você não pode excluir a si mesmo." });
    }

    const userToDelete = db.prepare("SELECT role, email FROM users WHERE id = ?").get(id) as any;
    if (!userToDelete) return res.status(404).json({ error: "Usuário não encontrado" });

    // Se o usuário a ser deletado for SUPER_ADMIN, apenas admin@mecaerp.com.br pode deletar
    if (userToDelete.role === 'SUPER_ADMIN') {
      if (req.user?.email !== 'admin@mecaerp.com.br') {
        return res.status(403).json({ error: "Apenas o Administrador Principal pode remover outros Super Admins." });
      }
    }

    db.prepare("DELETE FROM users WHERE id = ? AND role IN ('SUPER_ADMIN', 'VENDEDOR')").run(id);
    res.json({ message: "Membro removido" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PLANS
// ==========================================
router.get("/plans", requireAdminOrSeller, (req, res) => {
  try {
    const plans = db.prepare("SELECT * FROM pricing_plans WHERE active = 1").all();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PERMISSION PROFILES (PERFIS DE ACESSO)
// ==========================================

router.get("/permission-profiles", requireSuperAdmin, (req, res) => {
  try {
    const profiles = db.prepare("SELECT * FROM permission_profiles ORDER BY name ASC").all();
    res.json(profiles.map((p: any) => ({ ...p, permissions: JSON.parse(p.permissions) })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/permission-profiles", requireSuperAdmin, (req, res) => {
  const { name, description, permissions } = req.body;
  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO permission_profiles (id, name, description, permissions)
      VALUES (?, ?, ?, ?)
    `).run(id, name, description || null, JSON.stringify(permissions || {}));
    res.json({ message: "Perfil de acesso criado!", id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/permission-profiles/:id", requireSuperAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  try {
    const profile = db.prepare("SELECT id FROM permission_profiles WHERE id = ?").get(id);
    if (!profile) return res.status(404).json({ error: "Perfil não encontrado" });

    if (name) db.prepare("UPDATE permission_profiles SET name = ? WHERE id = ?").run(name, id);
    if (description !== undefined) db.prepare("UPDATE permission_profiles SET description = ? WHERE id = ?").run(description, id);
    if (permissions) db.prepare("UPDATE permission_profiles SET permissions = ? WHERE id = ?").run(JSON.stringify(permissions), id);

    res.json({ message: "Perfil de acesso atualizado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/permission-profiles/:id", requireSuperAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM permission_profiles WHERE id = ?").run(req.params.id);
    res.json({ message: "Perfil removido" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
