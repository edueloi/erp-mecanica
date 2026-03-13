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

router.get("/tenants", requireAdminOrSeller, async (req: AuthRequest, res) => {
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

    // Excluir tenants internos do sistema
    const systemTenantIds = ['superadmin-tenant-001', 'system-tenant-id'];
    const excludeClause = `t.id NOT IN (${systemTenantIds.map(() => '?').join(',')})`;

    // Se for vendedor, vê apenas os dele
    if (req.user?.role === 'VENDEDOR') {
      query += ` WHERE t.seller_id = ? AND ${excludeClause} GROUP BY t.id ORDER BY t.created_at DESC`;
      const tenants = await db.query(query, [req.user.id, ...systemTenantIds]);
      return res.json(tenants);
    } else {
      query += ` WHERE ${excludeClause} GROUP BY t.id ORDER BY t.created_at DESC`;
      const tenants = await db.query(query, [...systemTenantIds]);
      return res.json(tenants);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tenants", requireAdminOrSeller, async (req: AuthRequest, res) => {
  const { name, document, phone, address, user_limit, subscription_value, due_day, plan_id, logo_url, admin_name, admin_email, admin_password, admin_photo } = req.body;
  const tenantId = uuidv4();
  const userId = uuidv4();
  const sellerId = req.user?.role === 'VENDEDOR' ? req.user.id : null;

  try {
    const hash = await bcrypt.hash(admin_password || '123456', 10);

    await db.transaction(async (conn) => {
      // 1. Create Tenant
      await conn.execute(`
        INSERT INTO tenants (id, name, document, phone, address, user_limit, subscription_value, due_day, plan_id, logo_url, seller_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TRIAL')
      `, [tenantId, name, document || null, phone || null, address || null, user_limit || 5, subscription_value || 0, due_day || 5, plan_id || null, logo_url || null, sellerId]);

      // 2. Create Tenant Admin User
      await conn.execute(`
        INSERT INTO users (id, tenant_id, name, email, password, role, photo_url)
        VALUES (?, ?, ?, ?, ?, 'ADMIN', ?)
      `, [userId, tenantId, admin_name, admin_email, hash, admin_photo || null]);

      // 3. Log Audit (Creation)
      await conn.execute(`
        INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action_type, description, new_status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [uuidv4(), tenantId, req.user?.id, 'USER_CREATED', 'Parceiro integrado ao sistema', 'TRIAL']);
    });

    res.json({ message: "Parceiro criado com sucesso!", tenantId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/tenants/:id", requireAdminOrSeller, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, payment_date, payment_method, admin_name, admin_email, admin_password, admin_photo, ...otherFields } = req.body;

  try {
    // Vendedor só pode alterar as próprias oficinas
    const oldTenant = await db.queryOne("SELECT status, seller_id FROM tenants WHERE id = ?", [id]) as any;
    if (!oldTenant) return res.status(404).json({ error: "Parceiro não encontrado" });

    if (req.user?.role === 'VENDEDOR' && oldTenant.seller_id !== req.user.id) {
      return res.status(403).json({ error: "Sem permissão para alterar este parceiro." });
    }

    let hash: string | null = null;
    if (admin_password) {
      hash = await bcrypt.hash(admin_password, 10);
    }

    await db.transaction(async (conn) => {
      // Auditoria de Pagamento e Status
      if (status === 'ACTIVE' && oldTenant.status !== 'ACTIVE') {
        const pDate = payment_date || new Date().toISOString();
        await conn.execute(`
          INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action_type, description, payment_date, payment_method, old_status, new_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [uuidv4(), id, req.user?.id, 'PAYMENT_RECORDED', `Ativação com pagamento (${payment_method || 'PIX'})`, pDate, payment_method || 'PIX', oldTenant.status, 'ACTIVE']);
        await conn.execute("UPDATE tenants SET last_payment_date = ?, status = 'ACTIVE' WHERE id = ?", [pDate, id]);
      } else if (status && status !== oldTenant.status) {
        await conn.execute(`
          INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action_type, description, old_status, new_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [uuidv4(), id, req.user?.id, 'STATUS_CHANGED', `Alteração de status`, oldTenant.status, status]);
        await conn.execute("UPDATE tenants SET status = ? WHERE id = ?", [status, id]);
      }

      // Outros campos do Tenant
      const keys = Object.keys(otherFields);
      if (keys.length > 0) {
        const updates = keys.map(k => `${k} = ?`).join(", ");
        await conn.execute('UPDATE tenants SET ' + updates + ' WHERE id = ?', [...Object.values(otherFields), id] as any[]);
      }

      // Atualizar dados do Admin local se fornecido
      if (admin_name || admin_email || admin_password || admin_photo !== undefined) {
        const adminUser = (await conn.execute("SELECT id FROM users WHERE tenant_id = ? AND role = 'ADMIN' LIMIT 1", [id]) as any)[0][0] as any;
        if (adminUser) {
          if (admin_name) await conn.execute("UPDATE users SET name = ? WHERE id = ?", [admin_name, adminUser.id]);
          if (admin_email) await conn.execute("UPDATE users SET email = ? WHERE id = ?", [admin_email, adminUser.id]);
          if (admin_photo !== undefined) await conn.execute("UPDATE users SET photo_url = ? WHERE id = ?", [admin_photo || null, adminUser.id]);
          if (hash) await conn.execute("UPDATE users SET password = ? WHERE id = ?", [hash, adminUser.id]);
        }
      }
    });

    res.json({ message: "Parceiro atualizado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/tenants/:id", requireSuperAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await db.transaction(async (conn) => {
      // 1. WhatsApp & Communications
      await conn.execute("DELETE FROM whatsapp_automation_rules WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM whatsapp_templates WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM whatsapp_messages WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM whatsapp_conversations WHERE tenant_id = ?", [id]);

      // 2. Action Plans / Kanban
      await conn.execute("DELETE FROM action_card_links WHERE card_id IN (SELECT id FROM action_cards WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?))", [id]);
      await conn.execute("DELETE FROM action_card_history WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM action_cards WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM action_columns WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM action_boards WHERE tenant_id = ?", [id]);

      // 3. Financial & Cashflow
      await conn.execute("DELETE FROM receivable_payments WHERE account_id IN (SELECT id FROM accounts_receivable WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM accounts_receivable WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM payable_payments WHERE account_id IN (SELECT id FROM accounts_payable WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM accounts_payable WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM cash_closes WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM cashflow_transactions WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM cash_accounts WHERE tenant_id = ?", [id]);

      // 4. Work Orders & Checklists
      await conn.execute("DELETE FROM vehicle_checklist_items WHERE checklist_id IN (SELECT id FROM vehicle_checklists WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM vehicle_checklists WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM work_order_items WHERE work_order_id IN (SELECT id FROM work_orders WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM work_orders WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM vehicle_entries WHERE tenant_id = ?", [id]);

      // 5. Inventory & Suppliers
      await conn.execute("DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM purchase_orders WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM stock_movements WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM supplier_parts WHERE supplier_id IN (SELECT id FROM suppliers WHERE tenant_id = ?)", [id]);
      await conn.execute("DELETE FROM suppliers WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM parts WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM services WHERE tenant_id = ?", [id]);

      // 6. Clients & Vehicles
      await conn.execute("DELETE FROM appointments WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM vehicles WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM clients WHERE tenant_id = ?", [id]);

      // 7. Settings & Audit
      await conn.execute("DELETE FROM user_preferences WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM tenant_settings WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM tenant_audit_logs WHERE tenant_id = ?", [id]);

      // 8. Users & Tenant
      await conn.execute("DELETE FROM users WHERE tenant_id = ?", [id]);
      await conn.execute("DELETE FROM tenants WHERE id = ?", [id]);
    });
    res.json({ message: "Parceiro e todos os dados relacionados foram excluídos com sucesso" });
  } catch (error: any) {
    console.error(`Erro ao excluir parceiro ${id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/tenants/:id/logs", requireAdminOrSeller, async (req: AuthRequest, res) => {
  try {
    const logs = await db.query(`
      SELECT l.*, u.name as user_name, u.email as user_email, u.photo_url as user_photo
      FROM tenant_audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.tenant_id = ?
      ORDER BY l.created_at DESC
    `, [req.params.id]);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tenants/:id/users", requireAdminOrSeller, async (req: AuthRequest, res) => {
  try {
    const users = await db.query(`
      SELECT id, name, email, role, photo_url, created_at
      FROM users
      WHERE tenant_id = ?
      ORDER BY name ASC
    `, [req.params.id]);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// EQUIPE INTERNA (SUPER ADMIN / VENDEDOR)
// ==========================================

router.get("/team", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const team = await db.query(`
      SELECT id, name, surname, email, role, phone, cpf, profession, education, photo_url, permissions, created_at
      FROM users
      WHERE role IN ('SUPER_ADMIN', 'VENDEDOR')
        AND email != 'admin@mecaerp.com.br'
      ORDER BY created_at DESC
    `, []);

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

router.post("/team", requireSuperAdmin, async (req: AuthRequest, res) => {
  const { name, email, password, role, phone, cpf, profession, permissions, photo_url, permission_profile_id } = req.body;
  try {
    // Check if email already exists
    const existing = await db.queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: "E-mail já cadastrado na equipe." });
    }

    const hash = await bcrypt.hash(password, 10);

    let finalPermissions = permissions || {};
    if (permission_profile_id) {
      const profile = await db.queryOne("SELECT permissions FROM permission_profiles WHERE id = ?", [permission_profile_id]) as any;
      if (profile) finalPermissions = JSON.parse(profile.permissions);
    } else if (role === 'SUPER_ADMIN') {
      finalPermissions = {
        ver_dashboard: true,
        ver_parceiros: true,
        gerenciar_parceiros: true,
        ver_equipe: true,
        gerenciar_equipe: true,
        ver_planos: true,
        gerenciar_planos: true,
        ver_configuracoes: true,
        gerenciar_configuracoes: true,
        ver_relatorios: true,
        acesso_suporte: true
      };
    } else {
      finalPermissions = {
        ver_dashboard: true,
        ver_parceiros: true,
        gerenciar_parceiros: false,
        ver_equipe: false,
        ver_planos: false,
        ver_configuracoes: false,
        ver_relatorios: false
      };
    }

    const permsStr = JSON.stringify(finalPermissions);

    await db.execute(`
      INSERT INTO users (id, tenant_id, name, email, password, role, phone, cpf, profession, photo_url, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), 'system-tenant-id', name, email, hash, role, phone || null, cpf || null, profession || null, photo_url || null, permsStr]);

    res.json({ message: "Membro da equipe criado com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao criar membro da equipe:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/team/:id", requireSuperAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, email, password, role, phone, cpf, profession, permissions, photo_url, permission_profile_id } = req.body;

  try {
    const userToEdit = await db.queryOne("SELECT role, email FROM users WHERE id = ?", [id]) as any;
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
      const existing = await db.queryOne("SELECT id FROM users WHERE email = ? AND id != ?", [email, id]);
      if (existing) return res.status(400).json({ error: "E-mail já em uso." });
      updates.push("email = ?"); values.push(email);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push("password = ?"); values.push(hash);
    }
    if (role && req.user?.email === 'admin@mecaerp.com.br') { updates.push("role = ?"); values.push(role); }
    if (phone !== undefined) { updates.push("phone = ?"); values.push(phone || null); }
    if (cpf !== undefined) { updates.push("cpf = ?"); values.push(cpf || null); }
    if (profession !== undefined) { updates.push("profession = ?"); values.push(profession || null); }

    let finalPermissions = permissions;
    if (permission_profile_id) {
      const profile = await db.queryOne("SELECT permissions FROM permission_profiles WHERE id = ?", [permission_profile_id]) as any;
      if (profile) finalPermissions = JSON.parse(profile.permissions);
    }

    if (finalPermissions) {
      updates.push("permissions = ?");
      values.push(JSON.stringify(finalPermissions));
    }

    if (photo_url !== undefined) { updates.push("photo_url = ?"); values.push(photo_url || null); }

    if (updates.length > 0) {
      await db.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, [...values, id]);
    }

    res.json({ message: "Membro atualizado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/team/:id", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ error: "Você não pode excluir a si mesmo." });
    }

    const userToDelete = await db.queryOne("SELECT role, email FROM users WHERE id = ?", [id]) as any;
    if (!userToDelete) return res.status(404).json({ error: "Usuário não encontrado" });

    // Proteção Hierárquica
    if (userToDelete.email === 'admin@mecaerp.com.br') {
      return res.status(403).json({ error: "O Administrador Principal não pode ser removido." });
    }

    if (userToDelete.role === 'SUPER_ADMIN' && req.user?.email !== 'admin@mecaerp.com.br') {
      return res.status(403).json({ error: "Apenas o Administrador Principal pode remover outros Super Admins." });
    }

    await db.execute("DELETE FROM users WHERE id = ? AND role IN ('SUPER_ADMIN', 'VENDEDOR')", [id]);
    res.json({ message: "Membro removido" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PLANS
// ==========================================
router.get("/plans", requireAdminOrSeller, async (req, res) => {
  try {
    const plans = await db.query("SELECT * FROM pricing_plans WHERE active = 1", []);
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PERMISSION PROFILES (PERFIS DE ACESSO)
// ==========================================

router.get("/permission-profiles", requireSuperAdmin, async (req, res) => {
  try {
    const profiles = await db.query("SELECT * FROM permission_profiles ORDER BY name ASC", []);
    res.json(profiles.map((p: any) => ({ ...p, permissions: JSON.parse(p.permissions) })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/permission-profiles", requireSuperAdmin, async (req, res) => {
  const { name, description, permissions } = req.body;
  try {
    const id = uuidv4();
    await db.execute(`
      INSERT INTO permission_profiles (id, name, description, permissions)
      VALUES (?, ?, ?, ?)
    `, [id, name, description || null, JSON.stringify(permissions || {})]);
    res.json({ message: "Perfil de acesso criado!", id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/permission-profiles/:id", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  try {
    const profile = await db.queryOne("SELECT id FROM permission_profiles WHERE id = ?", [id]);
    if (!profile) return res.status(404).json({ error: "Perfil não encontrado" });

    if (name) await db.execute("UPDATE permission_profiles SET name = ? WHERE id = ?", [name, id]);
    if (description !== undefined) await db.execute("UPDATE permission_profiles SET description = ? WHERE id = ?", [description, id]);
    if (permissions) await db.execute("UPDATE permission_profiles SET permissions = ? WHERE id = ?", [JSON.stringify(permissions), id]);

    res.json({ message: "Perfil de acesso atualizado" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/permission-profiles/:id", requireSuperAdmin, async (req, res) => {
  try {
    await db.execute("DELETE FROM permission_profiles WHERE id = ?", [req.params.id]);
    res.json({ message: "Perfil removido" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
