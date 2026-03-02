import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import db from "../db";
import wppConnectService from "../whatsapp/wppconnect-service";
import { v4 as uuidv4 } from "uuid";

const router = Router();
router.use(authenticateToken);

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * GET /api/whatsapp/session/status
 * Obtém status da sessão WhatsApp (conectado, QR code, etc)
 */
router.get("/session/status", async (req: any, res: any) => {
  try {
    const status = wppConnectService.getSessionStatus(req.user.tenant_id);
    res.json(status);
  } catch (error: any) {
    console.error("Error getting session status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/session/start
 * Inicia sessão WhatsApp e gera QR Code
 */
router.post("/session/start", async (req: any, res: any) => {
  try {
    const result = await wppConnectService.startSession(req.user.tenant_id);
    
    if (result.success) {
      res.json({ message: "Sessão iniciada com sucesso", qrCode: result.qrCode });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/session/disconnect
 * Desconecta sessão WhatsApp
 */
router.post("/session/disconnect", async (req: any, res: any) => {
  try {
    const result = await wppConnectService.disconnectSession(req.user.tenant_id);
    
    if (result.success) {
      res.json({ message: "Sessão desconectada com sucesso" });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Error disconnecting session:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// CONVERSATIONS (INBOX)
// ========================================

/**
 * GET /api/whatsapp/conversations
 * Lista conversas (inbox)
 * Filtros: status, unread, assigned_to, search, tags
 */
router.get("/conversations", (req: any, res: any) => {
  try {
    const { status, unread, assigned_to, search, tags, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        c.*,
        cl.name as client_name,
        cl.id as client_id,
        u.name as assigned_to_name,
        wo.id as work_order_id,
        wo.status as work_order_status
      FROM whatsapp_conversations c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.assigned_to_user_id = u.id
      LEFT JOIN work_orders wo ON c.work_order_id = wo.id
      WHERE c.tenant_id = ?
    `;

    const params: any[] = [req.user.tenant_id];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (unread === 'true') {
      query += ` AND c.unread_count > 0`;
    }

    if (assigned_to) {
      query += ` AND c.assigned_to_user_id = ?`;
      params.push(assigned_to);
    }

    if (search) {
      query += ` AND (c.contact_name LIKE ? OR c.phone LIKE ? OR c.vehicle_plate LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (tags) {
      query += ` AND c.tags LIKE ?`;
      params.push(`%${tags}%`);
    }

    query += ` ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const conversations = db.prepare(query).all(...params);

    res.json(conversations);
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/conversations/:id
 * Obtém detalhes de uma conversa + últimas mensagens
 */
router.get("/conversations/:id", (req: any, res: any) => {
  try {
    const conversation = db
      .prepare(
        `SELECT 
          c.*,
          cl.name as client_name,
          cl.phone as client_phone,
          cl.email as client_email,
          v.plate as vehicle_plate,
          v.model as vehicle_model,
          wo.id as work_order_id,
          wo.status as work_order_status,
          wo.total_amount as work_order_amount
        FROM whatsapp_conversations c
        LEFT JOIN clients cl ON c.client_id = cl.id
        LEFT JOIN vehicles v ON c.vehicle_plate = v.plate
        LEFT JOIN work_orders wo ON c.work_order_id = wo.id
        WHERE c.id = ? AND c.tenant_id = ?`
      )
      .get(req.params.id, req.user.tenant_id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversa não encontrada" });
    }

    res.json(conversation);
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/whatsapp/conversations/:id
 * Atualiza conversa (marcar como lida, atribuir atendente, alterar status, etc)
 */
router.patch("/conversations/:id", (req: any, res: any) => {
  try {
    const { unread_count, assigned_to_user_id, status, bot_enabled, bot_topic, tags, client_id, work_order_id } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (unread_count !== undefined) {
      updates.push("unread_count = ?");
      params.push(unread_count);
    }

    if (assigned_to_user_id !== undefined) {
      updates.push("assigned_to_user_id = ?");
      params.push(assigned_to_user_id);
    }

    if (status) {
      updates.push("status = ?");
      params.push(status);
    }

    if (bot_enabled !== undefined) {
      updates.push("bot_enabled = ?");
      params.push(bot_enabled ? 1 : 0);
    }

    if (bot_topic !== undefined) {
      updates.push("bot_topic = ?");
      params.push(bot_topic);
    }

    if (tags !== undefined) {
      updates.push("tags = ?");
      params.push(JSON.stringify(tags));
    }

    if (client_id !== undefined) {
      updates.push("client_id = ?");
      params.push(client_id);
    }

    if (work_order_id !== undefined) {
      updates.push("work_order_id = ?");
      params.push(work_order_id);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    params.push(req.params.id, req.user.tenant_id);

    db.prepare(
      `UPDATE whatsapp_conversations 
       SET ${updates.join(", ")} 
       WHERE id = ? AND tenant_id = ?`
    ).run(...params);

    const updated = db
      .prepare("SELECT * FROM whatsapp_conversations WHERE id = ?")
      .get(req.params.id);

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating conversation:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// MESSAGES
// ========================================

/**
 * GET /api/whatsapp/conversations/:id/messages
 * Obtém mensagens de uma conversa (paginado)
 */
router.get("/conversations/:id/messages", (req: any, res: any) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const messages = db
      .prepare(
        `SELECT m.*, u.name as sender_name
         FROM whatsapp_messages m
         LEFT JOIN users u ON m.origin = 'human' AND m.direction = 'out'
         WHERE m.conversation_id = ? AND m.tenant_id = ?
         ORDER BY m.created_at ASC
         LIMIT ? OFFSET ?`
      )
      .all(req.params.id, req.user.tenant_id, parseInt(limit), parseInt(offset));

    res.json(messages);
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/conversations/:id/messages
 * Envia mensagem em uma conversa
 */
router.post("/conversations/:id/messages", async (req: any, res: any) => {
  try {
    const { body, template_id } = req.body;

    if (!body) {
      return res.status(400).json({ error: "Corpo da mensagem é obrigatório" });
    }

    // Buscar conversa
    const conversation = db
      .prepare("SELECT * FROM whatsapp_conversations WHERE id = ? AND tenant_id = ?")
      .get(req.params.id, req.user.tenant_id) as any;

    if (!conversation) {
      return res.status(404).json({ error: "Conversa não encontrada" });
    }

    // Enviar mensagem
    const result = await wppConnectService.sendMessage(
      req.user.tenant_id,
      conversation.phone,
      body,
      {
        conversationId: conversation.id,
        origin: 'human',
        templateId: template_id,
      }
    );

    if (result.success) {
      // Marcar conversa como lida (atendente respondeu)
      db.prepare(
        `UPDATE whatsapp_conversations 
         SET unread_count = 0 
         WHERE id = ?`
      ).run(conversation.id);

      const message = db
        .prepare("SELECT * FROM whatsapp_messages WHERE id = ?")
        .get(result.messageId);

      res.json(message);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// TEMPLATES
// ========================================

/**
 * GET /api/whatsapp/templates
 * Lista templates disponíveis
 */
router.get("/templates", (req: any, res: any) => {
  try {
    const { category, enabled } = req.query;

    let query = "SELECT * FROM whatsapp_templates WHERE tenant_id = ?";
    const params: any[] = [req.user.tenant_id];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    if (enabled !== undefined) {
      query += " AND enabled = ?";
      params.push(enabled === 'true' ? 1 : 0);
    }

    query += " ORDER BY category, name";

    const templates = db.prepare(query).all(...params);

    res.json(templates);
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/templates
 * Cria novo template
 */
router.post("/templates", (req: any, res: any) => {
  try {
    const { name, category, body, variables } = req.body;

    if (!name || !category || !body) {
      return res.status(400).json({ error: "Nome, categoria e corpo são obrigatórios" });
    }

    const id = uuidv4();

    db.prepare(
      `INSERT INTO whatsapp_templates 
       (id, tenant_id, name, category, body, variables_json, enabled)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    ).run(id, req.user.tenant_id, name, category, body, JSON.stringify(variables || []));

    const template = db
      .prepare("SELECT * FROM whatsapp_templates WHERE id = ?")
      .get(id);

    res.json(template);
  } catch (error: any) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/whatsapp/templates/:id
 * Atualiza template
 */
router.patch("/templates/:id", (req: any, res: any) => {
  try {
    const { name, category, body, variables, enabled } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push("name = ?");
      params.push(name);
    }

    if (category) {
      updates.push("category = ?");
      params.push(category);
    }

    if (body) {
      updates.push("body = ?");
      params.push(body);
    }

    if (variables !== undefined) {
      updates.push("variables_json = ?");
      params.push(JSON.stringify(variables));
    }

    if (enabled !== undefined) {
      updates.push("enabled = ?");
      params.push(enabled ? 1 : 0);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    params.push(req.params.id, req.user.tenant_id);

    db.prepare(
      `UPDATE whatsapp_templates 
       SET ${updates.join(", ")} 
       WHERE id = ? AND tenant_id = ?`
    ).run(...params);

    const template = db
      .prepare("SELECT * FROM whatsapp_templates WHERE id = ?")
      .get(req.params.id);

    res.json(template);
  } catch (error: any) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/templates/:id
 * Remove template
 */
router.delete("/templates/:id", (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM whatsapp_templates WHERE id = ? AND tenant_id = ?")
      .run(req.params.id, req.user.tenant_id);

    res.json({ message: "Template removido com sucesso" });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/templates/:id/render
 * Renderiza template com variáveis
 */
router.post("/templates/:id/render", (req: any, res: any) => {
  try {
    const template = db
      .prepare("SELECT * FROM whatsapp_templates WHERE id = ? AND tenant_id = ?")
      .get(req.params.id, req.user.tenant_id) as any;

    if (!template) {
      return res.status(404).json({ error: "Template não encontrado" });
    }

    const { variables } = req.body;

    let rendered = template.body;

    // Substituir variáveis {{nome}} pelo valor fornecido
    if (variables) {
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, variables[key]);
      });
    }

    res.json({ rendered });
  } catch (error: any) {
    console.error("Error rendering template:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// AUTOMATION RULES
// ========================================

/**
 * GET /api/whatsapp/automation-rules
 * Lista regras de automação
 */
router.get("/automation-rules", (req: any, res: any) => {
  try {
    const rules = db
      .prepare(
        `SELECT ar.*, t.name as template_name
         FROM whatsapp_automation_rules ar
         LEFT JOIN whatsapp_templates t ON ar.template_id = t.id
         WHERE ar.tenant_id = ?
         ORDER BY ar.trigger_event, ar.name`
      )
      .all(req.user.tenant_id);

    res.json(rules);
  } catch (error: any) {
    console.error("Error fetching automation rules:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/automation-rules
 * Cria regra de automação
 */
router.post("/automation-rules", (req: any, res: any) => {
  try {
    const { name, trigger_event, template_id, conditions, delay_minutes, business_hours_only } = req.body;

    if (!name || !trigger_event || !template_id) {
      return res.status(400).json({ error: "Nome, evento e template são obrigatórios" });
    }

    const id = uuidv4();

    db.prepare(
      `INSERT INTO whatsapp_automation_rules 
       (id, tenant_id, name, trigger_event, template_id, conditions_json, delay_minutes, business_hours_only, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(
      id,
      req.user.tenant_id,
      name,
      trigger_event,
      template_id,
      JSON.stringify(conditions || {}),
      delay_minutes || 0,
      business_hours_only !== false ? 1 : 0
    );

    const rule = db
      .prepare("SELECT * FROM whatsapp_automation_rules WHERE id = ?")
      .get(id);

    res.json(rule);
  } catch (error: any) {
    console.error("Error creating automation rule:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/whatsapp/automation-rules/:id
 * Atualiza regra de automação
 */
router.patch("/automation-rules/:id", (req: any, res: any) => {
  try {
    const { name, template_id, conditions, delay_minutes, business_hours_only, enabled } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push("name = ?");
      params.push(name);
    }

    if (template_id) {
      updates.push("template_id = ?");
      params.push(template_id);
    }

    if (conditions !== undefined) {
      updates.push("conditions_json = ?");
      params.push(JSON.stringify(conditions));
    }

    if (delay_minutes !== undefined) {
      updates.push("delay_minutes = ?");
      params.push(delay_minutes);
    }

    if (business_hours_only !== undefined) {
      updates.push("business_hours_only = ?");
      params.push(business_hours_only ? 1 : 0);
    }

    if (enabled !== undefined) {
      updates.push("enabled = ?");
      params.push(enabled ? 1 : 0);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    params.push(req.params.id, req.user.tenant_id);

    db.prepare(
      `UPDATE whatsapp_automation_rules 
       SET ${updates.join(", ")} 
       WHERE id = ? AND tenant_id = ?`
    ).run(...params);

    const rule = db
      .prepare("SELECT * FROM whatsapp_automation_rules WHERE id = ?")
      .get(req.params.id);

    res.json(rule);
  } catch (error: any) {
    console.error("Error updating automation rule:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/automation-rules/:id
 * Remove regra de automação
 */
router.delete("/automation-rules/:id", (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM whatsapp_automation_rules WHERE id = ? AND tenant_id = ?")
      .run(req.params.id, req.user.tenant_id);

    res.json({ message: "Regra removida com sucesso" });
  } catch (error: any) {
    console.error("Error deleting automation rule:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/automation-logs
 * Logs de automação (auditoria)
 */
router.get("/automation-logs", (req: any, res: any) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const logs = db
      .prepare(
        `SELECT 
          l.*,
          r.name as rule_name,
          m.body as message_body
         FROM whatsapp_automation_logs l
         LEFT JOIN whatsapp_automation_rules r ON l.rule_id = r.id
         LEFT JOIN whatsapp_messages m ON l.message_id = m.id
         WHERE l.tenant_id = ?
         ORDER BY l.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(req.user.tenant_id, parseInt(limit), parseInt(offset));

    res.json(logs);
  } catch (error: any) {
    console.error("Error fetching automation logs:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// QUICK ACTIONS
// ========================================

/**
 * POST /api/whatsapp/send-template
 * Envia template para um cliente (ação rápida)
 */
router.post("/send-template", async (req: any, res: any) => {
  try {
    const { phone, template_id, variables, related_type, related_id } = req.body;

    if (!phone || !template_id) {
      return res.status(400).json({ error: "Telefone e template são obrigatórios" });
    }

    // Buscar template
    const template = db
      .prepare("SELECT * FROM whatsapp_templates WHERE id = ? AND tenant_id = ?")
      .get(template_id, req.user.tenant_id) as any;

    if (!template) {
      return res.status(404).json({ error: "Template não encontrado" });
    }

    // Renderizar template
    let message = template.body;
    if (variables) {
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        message = message.replace(regex, variables[key]);
      });
    }

    // Enviar mensagem
    const result = await wppConnectService.sendMessage(
      req.user.tenant_id,
      phone,
      message,
      {
        origin: 'automation',
        templateId: template_id,
        relatedType: related_type,
        relatedId: related_id,
      }
    );

    if (result.success) {
      res.json({ message: "Template enviado com sucesso", messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error("Error sending template:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
