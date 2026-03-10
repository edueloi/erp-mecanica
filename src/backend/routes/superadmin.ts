import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

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
          if (admin_photo !== undefined) db.prepare("UPDATE users SET photo_url = ? WHERE id = ?").run(admin_photo || null, adminUser.id);
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
      // 1. WhatsApp & Communications
      db.prepare("DELETE FROM whatsapp_automation_rules WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM whatsapp_templates WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM whatsapp_messages WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM whatsapp_conversations WHERE tenant_id = ?").run(id);

      // 2. Action Plans / Kanban
      // These tables don't always have tenant_id directly, need to delete by board link if needed, 
      // but most implementation here uses tenant_id in main entities.
      db.prepare("DELETE FROM action_card_links WHERE card_id IN (SELECT id FROM action_cards WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?))").run(id);
      db.prepare("DELETE FROM action_card_history WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)").run(id);
      db.prepare("DELETE FROM action_cards WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)").run(id);
      db.prepare("DELETE FROM action_columns WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)").run(id);
      db.prepare("DELETE FROM action_boards WHERE tenant_id = ?").run(id);

      // 3. Financial & Cashflow
      db.prepare("DELETE FROM receivable_payments WHERE receivable_id IN (SELECT id FROM accounts_receivable WHERE tenant_id = ?)").run(id);
      db.prepare("DELETE FROM accounts_receivable WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM cash_closes WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM cashflow_transactions WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM cash_accounts WHERE tenant_id = ?").run(id);

      // 4. Work Orders & Checklists
      db.prepare("DELETE FROM vehicle_checklist_items WHERE checklist_id IN (SELECT id FROM vehicle_checklists WHERE tenant_id = ?)").run(id);
      db.prepare("DELETE FROM vehicle_checklists WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM work_order_items WHERE work_order_id IN (SELECT id FROM work_orders WHERE tenant_id = ?)").run(id);
      db.prepare("DELETE FROM work_orders WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM vehicle_entries WHERE tenant_id = ?").run(id);

      // 5. Inventory & Suppliers
      db.prepare("DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE tenant_id = ?)").run(id);
      db.prepare("DELETE FROM purchase_orders WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM stock_movements WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM supplier_parts WHERE supplier_id IN (SELECT id FROM suppliers WHERE tenant_id = ?)").run(id);
      db.prepare("DELETE FROM suppliers WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM parts WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM services WHERE tenant_id = ?").run(id);

      // 6. Clients & Vehicles
      db.prepare("DELETE FROM appointments WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM vehicles WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM clients WHERE tenant_id = ?").run(id);

      // 7. Settings & Audit
      db.prepare("DELETE FROM user_preferences WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM tenant_settings WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM tenant_audit_logs WHERE tenant_id = ?").run(id);

      // 8. Users & Tenant
      db.prepare("DELETE FROM users WHERE tenant_id = ?").run(id);
      db.prepare("DELETE FROM tenants WHERE id = ?").run(id);
    });
    transaction();
    res.json({ message: "Parceiro e todos os dados relacionados foram excluídos com sucesso" });
  } catch (error: any) {
    console.error(`Erro ao excluir parceiro ${id}:`, error);
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

router.get("/tenants/:id/users", requireAdminOrSeller, (req: AuthRequest, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, photo_url, created_at 
      FROM users 
      WHERE tenant_id = ? 
      ORDER BY name ASC
    `).all(req.params.id);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// EQUIPE INTERNA (SUPER ADMIN / VENDEDOR)
// ==========================================

router.get("/team", requireSuperAdmin, (req: AuthRequest, res) => {
  try {
    const team = db.prepare(`
      SELECT id, name, surname, email, role, phone, cpf, profession, photo_url, permissions, created_at 
      FROM users 
      WHERE role IN ('SUPER_ADMIN', 'VENDEDOR')
      ORDER BY created_at DESC
    `).all();
    
    // Parse permissions for each user
    const formattedTeam = team.map((u: any) => ({
        ...u,
        permissions: u.permissions ? JSON.parse(u.permissions) : {}
    }));

    res.json(formattedTeam);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/team", requireSuperAdmin, (req: AuthRequest, res) => {
  const { name, email, password, role, phone, cpf, profession, permissions, photo_url } = req.body;
  try {
    // Check if email already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
        return res.status(400).json({ error: "E-mail já cadastrado na equipe." });
    }

    const hash = bcrypt.hashSync(password, 10);
    const permsStr = permissions ? JSON.stringify(permissions) : '{}';
    
    db.prepare(`
      INSERT INTO users (id, tenant_id, name, email, password, role, phone, cpf, profession, photo_url, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'system-tenant-id', name, email, hash, role, phone || null, cpf || null, profession || null, photo_url || null, permsStr);
    
    res.json({ message: "Membro da equipe criado com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao criar membro da equipe:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/team/:id", requireSuperAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, email, password, role, phone, cpf, profession, permissions, photo_url } = req.body;
  
  try {
    const userToEdit = db.prepare("SELECT role, email FROM users WHERE id = ?").get(id) as any;
    if (!userToEdit) return res.status(404).json({ error: "Usuário não encontrado" });

    // Proteção Hierárquica
    if (userToEdit.email === 'admin@mecaerp.com.br' && req.user?.email !== 'admin@mecaerp.com.br') {
        return res.status(403).json({ error: "Apenas o Administrador Principal pode alterar seu próprio perfil." });
    }

    if (userToEdit.role === 'SUPER_ADMIN' && userToEdit.email !== req.user?.email && req.user?.email !== 'admin@mecaerp.com.br') {
        return res.status(403).json({ error: "Você não tem permissão para editar outro Super Admin." });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push("name = ?"); values.push(name); }
    if (email) { 
        // Verificar se e-mail já existe em outro usuário
        const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, id);
        if (existing) return res.status(400).json({ error: "E-mail já em uso." });
        updates.push("email = ?"); values.push(email); 
    }
    if (password) { 
        const hash = bcrypt.hashSync(password, 10);
        updates.push("password = ?"); values.push(hash); 
    }
    if (role && req.user?.email === 'admin@mecaerp.com.br') { updates.push("role = ?"); values.push(role); }
    if (phone !== undefined) { updates.push("phone = ?"); values.push(phone || null); }
    if (cpf !== undefined) { updates.push("cpf = ?"); values.push(cpf || null); }
    if (profession !== undefined) { updates.push("profession = ?"); values.push(profession || null); }
    if (permissions) { updates.push("permissions = ?"); values.push(JSON.stringify(permissions)); }
    if (photo_url !== undefined) { updates.push("photo_url = ?"); values.push(photo_url || null); }

    if (updates.length > 0) {
        db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values, id);
    }

    res.json({ message: "Membro atualizado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

    // Proteção Hierárquica
    if (userToDelete.email === 'admin@mecaerp.com.br') {
        return res.status(403).json({ error: "O Administrador Principal não pode ser removido." });
    }

    if (userToDelete.role === 'SUPER_ADMIN' && req.user?.email !== 'admin@mecaerp.com.br') {
        return res.status(403).json({ error: "Apenas o Administrador Principal pode remover outros Super Admins." });
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
