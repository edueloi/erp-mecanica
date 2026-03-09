import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Get user preferences
router.get("/preferences", (req: any, res) => {
  try {
    let preferences = db
      .prepare(
        `SELECT * FROM user_preferences 
         WHERE user_id = ? AND tenant_id = ?`
      )
      .get(req.user.id, req.user.tenant_id);

    // Create default preferences if not exists
    if (!preferences) {
      const id = uuidv4();
      db.prepare(
        `INSERT INTO user_preferences (id, tenant_id, user_id)
         VALUES (?, ?, ?)`
      ).run(id, req.user.tenant_id, req.user.id);

      preferences = db
        .prepare("SELECT * FROM user_preferences WHERE id = ?")
        .get(id);
    }

    res.json(preferences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user preferences
router.patch("/preferences", (req: any, res) => {
  const {
    theme_mode,
    primary_color,
    sidebar_collapsed,
    show_dashboard_cards,
    default_rows_per_page,
    filters_json,
    table_preferences_json,
  } = req.body;

  try {
    // Ensure preference exists
    let preferences = db
      .prepare("SELECT id FROM user_preferences WHERE user_id = ?")
      .get(req.user.id) as any;

    if (!preferences) {
      const id = uuidv4();
      db.prepare(
        `INSERT INTO user_preferences (id, tenant_id, user_id)
         VALUES (?, ?, ?)`
      ).run(id, req.user.tenant_id, req.user.id);
    }

    db.prepare(
      `UPDATE user_preferences 
       SET theme_mode = COALESCE(?, theme_mode),
           primary_color = COALESCE(?, primary_color),
           sidebar_collapsed = COALESCE(?, sidebar_collapsed),
           show_dashboard_cards = COALESCE(?, show_dashboard_cards),
           default_rows_per_page = COALESCE(?, default_rows_per_page),
           filters_json = COALESCE(?, filters_json),
           table_preferences_json = COALESCE(?, table_preferences_json),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).run(
      theme_mode,
      primary_color,
      sidebar_collapsed,
      show_dashboard_cards,
      default_rows_per_page,
      filters_json,
      table_preferences_json,
      req.user.id
    );

    const updated = db
      .prepare("SELECT * FROM user_preferences WHERE user_id = ?")
      .get(req.user.id);
    
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get tenant settings
router.get("/tenant", (req: any, res) => {
  try {
    let settings = db
      .prepare(
        `SELECT ts.*, t.user_limit 
         FROM tenant_settings ts
         JOIN tenants t ON t.id = ts.tenant_id
         WHERE ts.tenant_id = ?`
      )
      .get(req.user.tenant_id);

    // Create default settings if not exists
    if (!settings) {
      const id = uuidv4();
      db.prepare(
        `INSERT INTO tenant_settings (id, tenant_id)
         VALUES (?, ?)`
      ).run(id, req.user.tenant_id);

      settings = db
        .prepare(`
          SELECT ts.*, t.user_limit 
          FROM tenant_settings ts
          JOIN tenants t ON t.id = ts.tenant_id
          WHERE ts.id = ?
        `)
        .get(id);
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update tenant settings (requires ADMIN role)
router.patch("/tenant", (req: any, res) => {
  // Check if user is admin
  const user = db
    .prepare("SELECT role FROM users WHERE id = ?")
    .get(req.user.id) as any;

  if (user.role !== "ADMIN") {
    return res.status(403).json({ error: "Apenas administradores podem alterar configurações da oficina" });
  }

  const settingsData = req.body;

  try {
    // Ensure settings exists
    let settings = db
      .prepare("SELECT id FROM tenant_settings WHERE tenant_id = ?")
      .get(req.user.tenant_id) as any;

    if (!settings) {
      const id = uuidv4();
      db.prepare(
        `INSERT INTO tenant_settings (id, tenant_id)
         VALUES (?, ?)`
      ).run(id, req.user.tenant_id);
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
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.user.tenant_id);

      const query = `UPDATE tenant_settings SET ${updates.join(', ')} WHERE tenant_id = ?`;
      db.prepare(query).run(...values);
    }

    const updated = db
      .prepare("SELECT * FROM tenant_settings WHERE tenant_id = ?")
      .get(req.user.tenant_id);
    
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating tenant settings:", error);
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post("/change-password", (req: any, res) => {
  const { current_password, new_password } = req.body;

  try {
    const user = db
      .prepare("SELECT password FROM users WHERE id = ?")
      .get(req.user.id) as any;

    // In production, use bcrypt to compare
    if (user.password !== current_password) {
      return res.status(400).json({ error: "Senha atual incorreta" });
    }

    // In production, hash the password with bcrypt
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
      new_password,
      req.user.id
    );

    res.json({ message: "Senha alterada com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
