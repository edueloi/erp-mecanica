import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Get user preferences
router.get("/preferences", async (req: any, res) => {
  try {
    let preferences = await db.queryOne(
      `SELECT * FROM user_preferences
       WHERE user_id = ? AND tenant_id = ?`,
      [req.user.id, req.user.tenant_id]
    );

    // Create default preferences if not exists
    if (!preferences) {
      const id = uuidv4();
      await db.execute(
        `INSERT INTO user_preferences (id, tenant_id, user_id)
         VALUES (?, ?, ?)`,
        [id, req.user.tenant_id, req.user.id]
      );

      preferences = await db.queryOne("SELECT * FROM user_preferences WHERE id = ?", [id]);
    }

    res.json(preferences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user preferences
router.patch("/preferences", async (req: any, res) => {
  const {
    theme_mode,
    primary_color,
    secondary_color,
    sidebar_color,
    sidebar_text_color,
    header_color,
    sidebar_collapsed,
    show_dashboard_cards,
    default_rows_per_page,
    filters_json,
    table_preferences_json,
    sidebar_display,
  } = req.body;

  try {
    // Ensure preference exists
    let preferences = await db.queryOne("SELECT id FROM user_preferences WHERE user_id = ?", [req.user.id]) as any;

    if (!preferences) {
      const id = uuidv4();
      await db.execute(
        `INSERT INTO user_preferences (id, tenant_id, user_id)
         VALUES (?, ?, ?)`,
        [id, req.user.tenant_id, req.user.id]
      );
    }

    await db.execute(
      `UPDATE user_preferences
       SET theme_mode = COALESCE(?, theme_mode),
           primary_color = COALESCE(?, primary_color),
           secondary_color = COALESCE(?, secondary_color),
           sidebar_color = COALESCE(?, sidebar_color),
           sidebar_text_color = COALESCE(?, sidebar_text_color),
           header_color = COALESCE(?, header_color),
           sidebar_collapsed = COALESCE(?, sidebar_collapsed),
           show_dashboard_cards = COALESCE(?, show_dashboard_cards),
           default_rows_per_page = COALESCE(?, default_rows_per_page),
           filters_json = COALESCE(?, filters_json),
           table_preferences_json = COALESCE(?, table_preferences_json),
           sidebar_display = COALESCE(?, sidebar_display),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        theme_mode ?? null,
        primary_color ?? null,
        secondary_color ?? null,
        sidebar_color ?? null,
        sidebar_text_color ?? null,
        header_color ?? null,
        sidebar_collapsed !== undefined ? (sidebar_collapsed ? 1 : 0) : null,
        show_dashboard_cards !== undefined ? (show_dashboard_cards ? 1 : 0) : null,
        default_rows_per_page ?? null,
        filters_json ?? null,
        table_preferences_json ?? null,
        sidebar_display ?? null,
        req.user.id
      ]
    );

    const updated = await db.queryOne("SELECT * FROM user_preferences WHERE user_id = ?", [req.user.id]);

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get tenant settings
router.get("/tenant", async (req: any, res) => {
  try {
    let settings = await db.queryOne(
      `SELECT ts.*, t.user_limit
       FROM tenant_settings ts
       JOIN tenants t ON t.id = ts.tenant_id
       WHERE ts.tenant_id = ?`,
      [req.user.tenant_id]
    );

    // Create default settings if not exists
    if (!settings) {
      const id = uuidv4();
      await db.execute(
        `INSERT INTO tenant_settings (id, tenant_id)
         VALUES (?, ?)`,
        [id, req.user.tenant_id]
      );

      settings = await db.queryOne(
        `SELECT ts.*, t.user_limit
          FROM tenant_settings ts
          JOIN tenants t ON t.id = ts.tenant_id
          WHERE ts.id = ?`,
        [id]
      );
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update tenant settings (requires ADMIN role)
router.patch("/tenant", async (req: any, res) => {
  // Check if user is admin
  const user = await db.queryOne("SELECT role FROM users WHERE id = ?", [req.user.id]) as any;

  if (user.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas administradores podem alterar configurações da oficina" });
  }

  const settingsData = req.body;

  try {
    // Ensure settings exists
    let settings = await db.queryOne("SELECT id FROM tenant_settings WHERE tenant_id = ?", [req.user.tenant_id]) as any;

    if (!settings) {
      const id = uuidv4();
      await db.execute(
        `INSERT INTO tenant_settings (id, tenant_id)
         VALUES (?, ?)`,
        [id, req.user.tenant_id]
      );
    }

    // Build dynamic UPDATE query based on provided fields
    const allowedFields = [
      'company_name', 'trade_name', 'cnpj', 'ie', 'im', 'phone', 'whatsapp', 'email',
      'website', 'instagram', 'address', 'city', 'state', 'zip_code',
      'logo_url', 'primary_color', 'theme', 'short_name', 'slogan',
      'weekday_open', 'weekday_close', 'saturday_open', 'saturday_close',
      'sunday_open', 'sunday_close', 'lunch_start', 'lunch_end',
      'default_appointment_duration', 'tolerance_minutes', 'blocked_dates',
      'show_logo_pdf', 'show_company_data_pdf', 'pdf_footer_address',
      'pdf_footer_phone', 'pdf_footer_whatsapp', 'pdf_footer_website',
      'terms_and_conditions', 'default_warranty_text', 'default_quote_text',
      'receipt_text', 'os_prefix', 'os_format', 'os_reset_yearly', 'signature',
      'default_payment_terms', 'default_warranty_days', 'late_fee_percentage',
      'fixed_penalty', 'default_due_days', 'max_installments', 'card_fee_percentage',
      'pix_key', 'payment_methods',
      'allow_finish_os_without_payment', 'allow_deliver_without_payment',
      'require_client_approval', 'auto_decrease_stock', 'alert_stock_low',
      'require_checklist', 'whatsapp_bot_enabled', 'whatsapp_connected',
      'alert_os_stopped_days', 'alert_overdue_clients'
    ];

    const updates: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (settingsData.hasOwnProperty(field)) {
        updates.push(`${field} = ?`);
        values.push(settingsData[field]);
      }
    }

    if (updates.length > 0) {
      const tenantId = req.user.tenant_id;
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(tenantId);

      const query = `UPDATE tenant_settings SET ${updates.join(', ')} WHERE tenant_id = ?`;
      await db.execute(query, values);

      // Sincronizar campos compartilhados com a tabela principal 'tenants'
      const syncUpdates: string[] = [];
      const syncValues: any[] = [];

      if (settingsData.hasOwnProperty('trade_name')) { syncUpdates.push("name = ?"); syncValues.push(settingsData.trade_name); }
      else if (settingsData.hasOwnProperty('company_name')) { syncUpdates.push("name = ?"); syncValues.push(settingsData.company_name); }

      if (settingsData.hasOwnProperty('cnpj')) { syncUpdates.push("document = ?"); syncValues.push(settingsData.cnpj); }
      if (settingsData.hasOwnProperty('phone')) { syncUpdates.push("phone = ?"); syncValues.push(settingsData.phone); }
      if (settingsData.hasOwnProperty('address')) { syncUpdates.push("address = ?"); syncValues.push(settingsData.address); }
      if (settingsData.hasOwnProperty('logo_url')) { syncUpdates.push("logo_url = ?"); syncValues.push(settingsData.logo_url); }

      if (syncUpdates.length > 0) {
        syncValues.push(tenantId);
        await db.execute(`UPDATE tenants SET ${syncUpdates.join(', ')} WHERE id = ?`, syncValues);
      }
    }

    const updated = await db.queryOne("SELECT * FROM tenant_settings WHERE tenant_id = ?", [req.user.tenant_id]);

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating tenant settings:", error);
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post("/change-password", async (req: any, res) => {
  const { current_password, new_password } = req.body;

  try {
    const user = await db.queryOne("SELECT password FROM users WHERE id = ?", [req.user.id]) as any;

    // In production, use bcrypt to compare
    if (user.password !== current_password) {
      return res.status(400).json({ error: "Senha atual incorreta" });
    }

    // In production, hash the password with bcrypt
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [new_password, req.user.id]);

    res.json({ message: "Senha alterada com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
