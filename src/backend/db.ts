import Database from "better-sqlite3";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import bcryptLib from "bcryptjs";

const db = new Database("mecaerp.db");

export function initDb() {
  // Pricing Plans
  db.exec(`
    CREATE TABLE IF NOT EXISTS pricing_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      user_limit INTEGER NOT NULL,
      monthly_value REAL NOT NULL,
      months_duration INTEGER DEFAULT 1,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Super Admin Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS superadmin_settings (
      id TEXT PRIMARY KEY,
      power_bi_url TEXT,
      power_bi_title TEXT DEFAULT 'Painel Financeiro',
      billing_url TEXT,
      onboarding_url TEXT,
      support_url TEXT,
      default_user_limit INTEGER DEFAULT 5,
      default_due_day INTEGER DEFAULT 5,`n      last_payment_date DATETIME,
      default_subscription_value REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tenants (Oficinas)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      document TEXT,
      address TEXT,
      phone TEXT,
      user_limit INTEGER DEFAULT 5,
      subscription_value REAL DEFAULT 0,
      due_day INTEGER DEFAULT 5,`n      last_payment_date DATETIME,
      status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE', 'TRIAL', 'OVERDUE', 'BLOCKED', 'PENDING_PAYMENT')) DEFAULT 'ACTIVE',
      plan_id TEXT,
      logo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
    )
  `);

  // Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'MECHANIC', 'ATTENDANT', 'FINANCE')) NOT NULL,
      permissions TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Clients
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('PF', 'PJ')) DEFAULT 'PF',
      name TEXT NOT NULL,
      document TEXT,
      email TEXT,
      phone TEXT,
      status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')) DEFAULT 'ACTIVE',
      zip_code TEXT,
      street TEXT,
      number TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      complement TEXT,
      reference TEXT,
      birth_date TEXT,
      state_registration TEXT,
      alt_phone TEXT,
      alt_name TEXT,
      pref_contact TEXT CHECK(pref_contact IN ('WHATSAPP', 'PHONE', 'EMAIL')) DEFAULT 'WHATSAPP',
      best_time TEXT,
      internal_notes TEXT,
      tags TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Communication Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS communication_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('WHATSAPP', 'EMAIL')) NOT NULL,
      template_name TEXT,
      content TEXT NOT NULL,
      status TEXT CHECK(status IN ('SENT', 'ERROR')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Vehicles
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      plate TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      year INTEGER,
      color TEXT,
      vin TEXT,
      fuel_type TEXT,
      km INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Work Orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      responsible_id TEXT,
      number TEXT NOT NULL,
      status TEXT CHECK(status IN ('OPEN', 'DIAGNOSIS', 'WAITING_APPROVAL', 'APPROVED', 'EXECUTING', 'WAITING_PARTS', 'FINISHED', 'DELIVERED', 'CANCELLED')) NOT NULL,
      priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH')) DEFAULT 'MEDIUM',
      complaint TEXT,
      symptoms TEXT, -- JSON array of tags
      diagnosis TEXT,
      checklist TEXT, -- JSON object
      evaluation TEXT, -- JSON object
      approval_data TEXT, -- JSON object (signature, date, etc)
      payment_data TEXT, -- JSON object
      delivery_data TEXT, -- JSON object
      photos TEXT, -- JSON array of objects {url, type, legend}
      internal_notes TEXT,
      total_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      taxes REAL DEFAULT 0,
      delivery_forecast DATETIME,
      approval_required BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (responsible_id) REFERENCES users(id)
    )
  `);

  // Work Order Items (Parts and Services)
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_items (
      id TEXT PRIMARY KEY,
      work_order_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('SERVICE', 'PART')) NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      mechanic_id TEXT,
      warranty_days INTEGER DEFAULT 0,
      sku TEXT,
      status TEXT DEFAULT 'PENDING',
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (mechanic_id) REFERENCES users(id)
    )
  `);

  // Audit Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Appointments
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      service_description TEXT,
      estimated_duration INTEGER DEFAULT 60,
      status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'DELAYED')) DEFAULT 'PENDING',
      notes TEXT,
      internal_notes TEXT,
      origin TEXT,
      send_confirmation BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Parts (Peças)
  db.exec(`
    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      supplier_code TEXT,
      category TEXT,
      brand TEXT,
      supplier_id TEXT,
      cost_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      stock_quantity REAL DEFAULT 0,
      min_stock REAL DEFAULT 0,
      location TEXT,
      compatibility TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Stock Movements (Movimentações de Estoque)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('ENTRY', 'EXIT', 'OS_USED', 'ADJUSTMENT', 'LOSS')) NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL DEFAULT 0,
      reference_id TEXT,
      reference_type TEXT,
      invoice_number TEXT,
      reason TEXT,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (part_id) REFERENCES parts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Suppliers (Fornecedores)
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      trade_name TEXT,
      cnpj TEXT,
      ie TEXT,
      category TEXT,
      status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')) DEFAULT 'ACTIVE',
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      website TEXT,
      contact_name TEXT,
      sales_rep TEXT,
      sales_rep_phone TEXT,
      zip_code TEXT,
      street TEXT,
      number TEXT,
      complement TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      payment_terms TEXT,
      payment_methods TEXT,
      notes TEXT,
      is_preferred BOOLEAN DEFAULT 0,
      avg_delivery_days INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Purchase Orders (Pedidos de Compra)
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      number TEXT NOT NULL,
      status TEXT CHECK(status IN ('DRAFT', 'SENT', 'CONFIRMED', 'PARTIAL', 'RECEIVED', 'CANCELLED')) DEFAULT 'DRAFT',
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expected_delivery DATETIME,
      freight REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Purchase Order Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      purchase_order_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      subtotal REAL NOT NULL,
      received_quantity REAL DEFAULT 0,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (part_id) REFERENCES parts(id)
    )
  `);

  // Supplier Parts (vinculação peça-fornecedor)
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_parts (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      supplier_code TEXT,
      last_cost REAL DEFAULT 0,
      is_preferred BOOLEAN DEFAULT 0,
      last_purchase_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (part_id) REFERENCES parts(id),
      UNIQUE(supplier_id, part_id)
    )
  `);

  // Accounts Receivable (Contas a Receber)
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts_receivable (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      work_order_id TEXT,
      installment_number INTEGER DEFAULT 1,
      total_installments INTEGER DEFAULT 1,
      description TEXT NOT NULL,
      original_amount REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      balance REAL NOT NULL,
      due_date DATE NOT NULL,
      status TEXT CHECK(status IN ('OPEN', 'PARTIAL', 'PAID', 'OVERDUE')) DEFAULT 'OPEN',
      payment_method TEXT,
      document_number TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Receivable Payments (Histórico de Pagamentos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS receivable_payments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_method TEXT NOT NULL,
      document_number TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (account_id) REFERENCES accounts_receivable(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Add history column to work_orders if it doesn't exist
  try {
    // Check if column exists first
    const columnCheck = db.prepare(`SELECT COUNT(*) as count FROM pragma_table_info('work_orders') WHERE name='history'`).get() as any;
    
    if (columnCheck.count === 0) {
      db.exec(`ALTER TABLE work_orders ADD COLUMN history TEXT DEFAULT '[]'`);
      console.log("✅ Added history column to work_orders table");
    } else {
      console.log("✅ History column already exists in work_orders table");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding history column:", e.message);
  }

  // Add part_id column to work_order_items if it doesn't exist
  try {
    const columnCheck = db.prepare(`SELECT COUNT(*) as count FROM pragma_table_info('work_order_items') WHERE name='part_id'`).get() as any;
    
    if (columnCheck.count === 0) {
      db.exec(`ALTER TABLE work_order_items ADD COLUMN part_id TEXT`);
      console.log("✅ Added part_id column to work_order_items table");
    } else {
      console.log("✅ part_id column already exists in work_order_items table");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding part_id column:", e.message);
  }

  
  // Tenant Audit Logs (Hist�rico Completo)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT, -- Quem realizou a a��o (Super Admin ou Admin local)
      action_type TEXT NOT NULL, -- USER_CREATED, USER_DELETED, STATUS_CHANGED, PAYMENT_RECORDED
      description TEXT,
      payment_date DATETIME,
      payment_method TEXT,
      old_status TEXT,
      new_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);`n`n  // User Preferences (Configurações e Personalização)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      theme_mode TEXT CHECK(theme_mode IN ('light', 'dark', 'auto')) DEFAULT 'light',
      primary_color TEXT DEFAULT '#1e293b',
      sidebar_collapsed BOOLEAN DEFAULT 0,
      show_dashboard_cards BOOLEAN DEFAULT 1,
      default_rows_per_page INTEGER DEFAULT 20,
      filters_json TEXT DEFAULT '{}',
      table_preferences_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id)
    )
  `);

  // Tenant Settings (Configurações da Oficina)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_settings (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      
      -- Dados Básicos
      company_name TEXT,
      trade_name TEXT,
      cnpj TEXT,
      ie TEXT,
      im TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      website TEXT,
      instagram TEXT,
      
      -- Endereço
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      
      -- Identidade / Marca
      logo_url TEXT,
      primary_color TEXT DEFAULT '#1e293b',
      theme TEXT DEFAULT 'light',
      short_name TEXT,
      slogan TEXT,
      
      -- Horários de Funcionamento
      weekday_open TEXT DEFAULT '08:00',
      weekday_close TEXT DEFAULT '18:00',
      saturday_open TEXT DEFAULT '08:00',
      saturday_close TEXT DEFAULT '12:00',
      sunday_open TEXT,
      sunday_close TEXT,
      lunch_start TEXT DEFAULT '12:00',
      lunch_end TEXT DEFAULT '13:00',
      default_appointment_duration INTEGER DEFAULT 60,
      tolerance_minutes INTEGER DEFAULT 15,
      blocked_dates TEXT,
      
      -- Documentos / PDF
      show_logo_pdf BOOLEAN DEFAULT 1,
      show_company_data_pdf BOOLEAN DEFAULT 1,
      pdf_footer_address BOOLEAN DEFAULT 1,
      pdf_footer_phone BOOLEAN DEFAULT 1,
      pdf_footer_whatsapp BOOLEAN DEFAULT 1,
      pdf_footer_website BOOLEAN DEFAULT 1,
      terms_and_conditions TEXT,
      default_warranty_text TEXT,
      default_quote_text TEXT,
      receipt_text TEXT,
      os_prefix TEXT DEFAULT 'OFC',
      os_format TEXT DEFAULT 'OFC-{YEAR}-{NUMBER}',
      os_reset_yearly BOOLEAN DEFAULT 1,
      signature TEXT,
      
      -- Financeiro
      default_payment_terms TEXT,
      default_warranty_days INTEGER DEFAULT 90,
      late_fee_percentage REAL DEFAULT 0,
      fixed_penalty REAL DEFAULT 0,
      default_due_days INTEGER DEFAULT 30,
      max_installments INTEGER DEFAULT 12,
      card_fee_percentage REAL DEFAULT 0,
      pix_key TEXT,
      payment_methods TEXT DEFAULT 'pix,card,cash',
      
      -- Regras Operacionais
      allow_finish_os_without_payment BOOLEAN DEFAULT 0,
      allow_deliver_without_payment BOOLEAN DEFAULT 0,
      require_client_approval BOOLEAN DEFAULT 1,
      auto_decrease_stock BOOLEAN DEFAULT 1,
      alert_stock_low BOOLEAN DEFAULT 1,
      require_checklist BOOLEAN DEFAULT 0,
      
      -- Comunicação
      whatsapp_bot_enabled BOOLEAN DEFAULT 0,
      whatsapp_connected BOOLEAN DEFAULT 0,
      
      -- Alertas
      alert_os_stopped_days INTEGER DEFAULT 7,
      alert_overdue_clients BOOLEAN DEFAULT 1,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      UNIQUE(tenant_id)
    )
  `);

  // Cash Accounts (Contas: Caixa, Banco, Pix, Cartão)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cash_accounts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('cash', 'bank', 'digital', 'card')) DEFAULT 'cash',
      active BOOLEAN DEFAULT 1,
      initial_balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  // Cash Flow Transactions (Lançamentos: Entradas/Saídas/Transferências)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cashflow_transactions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      date DATETIME NOT NULL,
      type TEXT CHECK(type IN ('in', 'out', 'transfer')) NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      description TEXT,
      account_id TEXT NOT NULL,
      related_account_id TEXT,
      payment_method TEXT,
      status TEXT CHECK(status IN ('confirmed', 'pending')) DEFAULT 'confirmed',
      source_type TEXT,
      source_id TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (account_id) REFERENCES cash_accounts(id),
      FOREIGN KEY (related_account_id) REFERENCES cash_accounts(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Cash Close (Fechamento de Caixa Diário)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cash_closes (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      date DATE NOT NULL,
      opening_balance REAL NOT NULL,
      expected_balance REAL NOT NULL,
      counted_balance REAL,
      difference REAL,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (account_id) REFERENCES cash_accounts(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      UNIQUE(tenant_id, account_id, date)
    )
  `);

  // ========================================
  // WHATSAPP MODULE
  // ========================================

  // WhatsApp LID Mapping (cache de @lid → telefone real)
  db.exec(`
    CREATE TABLE IF NOT EXISTS wa_lid_map (
      tenant_id TEXT NOT NULL,
      lid TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tenant_id, lid)
    )
  `);

  // WhatsApp Sessions (QR Code / Connection Status)
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      session_name TEXT NOT NULL,
      status TEXT CHECK(status IN ('disconnected', 'connecting', 'connected', 'qr_ready')) DEFAULT 'disconnected',
      qr_code TEXT,
      phone_number TEXT,
      is_active INTEGER DEFAULT 1,
      last_connected_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      UNIQUE(tenant_id, session_name)
    )
  `);

  // WhatsApp Conversations (Inbox)
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_conversations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT,
      phone TEXT NOT NULL,
      contact_name TEXT,
      last_message_at DATETIME,
      last_message_preview TEXT,
      unread_count INTEGER DEFAULT 0,
      assigned_to_user_id TEXT,
      bot_enabled INTEGER DEFAULT 1,
      bot_topic TEXT CHECK(bot_topic IN ('agendamento', 'orcamento', 'status_os', 'cobranca', 'localizacao', 'garantia', 'duvidas')) DEFAULT NULL,
      bot_state TEXT, -- JSON state machine
      status TEXT CHECK(status IN ('open', 'waiting_approval', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
      tags TEXT, -- JSON array: ["os", "cobranca", "urgente"]
      vehicle_plate TEXT,
      work_order_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
    )
  `);

  // WhatsApp Messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      direction TEXT CHECK(direction IN ('in', 'out')) NOT NULL,
      type TEXT CHECK(type IN ('text', 'image', 'pdf', 'audio', 'video', 'document')) DEFAULT 'text',
      body TEXT,
      media_url TEXT,
      media_filename TEXT,
      sent_status TEXT CHECK(sent_status IN ('sending', 'sent', 'delivered', 'read', 'error')) DEFAULT 'sent',
      origin TEXT CHECK(origin IN ('human', 'bot', 'system', 'automation')) DEFAULT 'human',
      related_type TEXT, -- 'work_order', 'receivable', 'appointment', 'quote'
      related_id TEXT,
      template_id TEXT,
      wpp_message_id TEXT, -- ID retornado pelo WhatsApp
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id),
      FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id)
    )
  `);

  // WhatsApp Templates (Mensagens Reutilizáveis)
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_templates (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT CHECK(category IN ('agendamento', 'os', 'orcamento', 'cobranca', 'geral')) NOT NULL,
      body TEXT NOT NULL,
      variables_json TEXT, -- ["nome", "data", "hora", "placa", "valor", "os"]
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      UNIQUE(tenant_id, name)
    )
  `);

  // WhatsApp Automation Rules
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      trigger_event TEXT CHECK(trigger_event IN (
        'os_created', 
        'os_status_changed', 
        'os_finished', 
        'appointment_created',
        'appointment_reminder',
        'receivable_overdue',
        'quote_created'
      )) NOT NULL,
      template_id TEXT NOT NULL,
      conditions_json TEXT, -- Condições adicionais (ex: status='aguardando_aprovacao')
      delay_minutes INTEGER DEFAULT 0, -- Delay antes de enviar (ex: 30 min antes do agendamento)
      enabled INTEGER DEFAULT 1,
      business_hours_only INTEGER DEFAULT 1, -- Enviar apenas em horário comercial
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id)
    )
  `);

  // WhatsApp Automation Logs (Auditoria)
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_automation_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      message_id TEXT,
      trigger_event TEXT NOT NULL,
      related_type TEXT,
      related_id TEXT,
      status TEXT CHECK(status IN ('sent', 'failed', 'skipped')) NOT NULL,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (rule_id) REFERENCES whatsapp_automation_rules(id),
      FOREIGN KEY (message_id) REFERENCES whatsapp_messages(id)
    )
  `);

  // Create default WhatsApp templates for each tenant
  try {
    const tenants = db.prepare("SELECT id FROM tenants").all() as any[];

    for (const tenant of tenants) {
      const templateCount = db
        .prepare("SELECT COUNT(*) as count FROM whatsapp_templates WHERE tenant_id = ?")
        .get(tenant.id) as any;

      if (templateCount.count === 0) {
        const defaultTemplates = [
          {
            name: "Confirmação de Agendamento",
            category: "agendamento",
            body: "Olá {{nome}}! ✅ Seu agendamento está confirmado para *{{data}}* às *{{hora}}*.\n\n📍 Endereço: {{endereco}}\n\nQualquer dúvida, estou à disposição!",
            variables: ["nome", "data", "hora", "endereco"],
          },
          {
            name: "OS Aberta",
            category: "os",
            body: "Olá {{nome}}! 🔧\n\nRecebemos seu veículo *{{placa}}* e abrimos a OS *#{{os}}*.\n\nVamos iniciar o diagnóstico e retorno em breve com o orçamento.",
            variables: ["nome", "placa", "os"],
          },
          {
            name: "Aguardando Aprovação",
            category: "orcamento",
            body: "Olá {{nome}}! 📋\n\nFinalizamos o diagnóstico da OS *#{{os}}*.\n\n💰 Orçamento: *R$ {{valor}}*\n📝 Serviços: {{servicos}}\n\nPosso seguir com o serviço? Por favor, confirme.",
            variables: ["nome", "os", "valor", "servicos"],
          },
          {
            name: "Veículo Pronto",
            category: "os",
            body: "✅ Boa notícia, {{nome}}!\n\nSeu veículo *{{placa}}* está pronto!\n\n💰 Valor total: *R$ {{valor}}*\n🕒 Pode retirar em nosso horário: {{horario}}\n\nAguardo você!",
            variables: ["nome", "placa", "valor", "horario"],
          },
          {
            name: "Lembrete de Pagamento",
            category: "cobranca",
            body: "Olá {{nome}}! 😊\n\nPassando para lembrar que a parcela *#{{parcela}}* venceu em *{{vencimento}}*.\n\n💰 Valor: R$ {{valor}}\n\nPosso te ajudar com o pagamento? Temos PIX disponível!",
            variables: ["nome", "parcela", "vencimento", "valor"],
          },
          {
            name: "Lembrete de Agendamento",
            category: "agendamento",
            body: "🔔 Lembrete, {{nome}}!\n\nSeu agendamento é *amanhã* às *{{hora}}*.\n\n📍 {{endereco}}\n\nNos vemos lá! 👋",
            variables: ["nome", "hora", "endereco"],
          },
        ];

        for (const template of defaultTemplates) {
          db.prepare(
            `INSERT INTO whatsapp_templates (id, tenant_id, name, category, body, variables_json, enabled)
             VALUES (?, ?, ?, ?, ?, ?, 1)`
          ).run(
            uuidv4(),
            tenant.id,
            template.name,
            template.category,
            template.body,
            JSON.stringify(template.variables)
          );
        }

        console.log(`✅ Created default WhatsApp templates for tenant ${tenant.id}`);
      }
    }
  } catch (e: any) {
    console.error("⚠️  Error creating default WhatsApp templates:", e.message);
  }

  // Create default cash accounts for tenants without accounts
  try {
    const tenants = db.prepare("SELECT id FROM tenants").all() as any[];
    
    for (const tenant of tenants) {
      const accountCount = db
        .prepare("SELECT COUNT(*) as count FROM cash_accounts WHERE tenant_id = ?")
        .get(tenant.id) as any;

      if (accountCount.count === 0) {
        // Create default accounts: Caixa, Banco, PIX
        const defaultAccounts = [
          { name: "Caixa", type: "cash" },
          { name: "Banco", type: "bank" },
          { name: "PIX", type: "digital" },
        ];

        for (const account of defaultAccounts) {
          db.prepare(
            `INSERT INTO cash_accounts (id, tenant_id, name, type, initial_balance) 
             VALUES (?, ?, ?, ?, 0)`
          ).run(uuidv4(), tenant.id, account.name, account.type);
        }

        console.log(`✅ Created default cash accounts for tenant ${tenant.id}`);
      }
    }
  } catch (e: any) {
    console.error("⚠️  Error creating default cash accounts:", e.message);
  }

  // ========================================
  // MIGRATIONS - WhatsApp CRM Integration
  // ========================================
  
  // Migration: Add phone_e164 to whatsapp_conversations
  try {
    const checkPhoneE164 = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('whatsapp_conversations') 
      WHERE name='phone_e164'
    `).get() as any;

    if (checkPhoneE164.count === 0) {
      db.exec(`ALTER TABLE whatsapp_conversations ADD COLUMN phone_e164 TEXT`);
      console.log("✅ Added phone_e164 column to whatsapp_conversations");
      
      // Criar índice para melhor performance
      db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_phone_e164 ON whatsapp_conversations(phone_e164)`);
    }
  } catch (e: any) {
    console.error("⚠️  Error adding phone_e164:", e.message);
  }

  // Migration: Add vehicle_id to whatsapp_conversations  
  try {
    const checkVehicleId = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('whatsapp_conversations') 
      WHERE name='vehicle_id'
    `).get() as any;

    if (checkVehicleId.count === 0) {
      db.exec(`ALTER TABLE whatsapp_conversations ADD COLUMN vehicle_id TEXT REFERENCES vehicles(id)`);
      console.log("✅ Added vehicle_id column to whatsapp_conversations");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding vehicle_id:", e.message);
  }

  // Migration: Add display_name to whatsapp_conversations (nome do WhatsApp original)
  try {
    const checkDisplayName = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('whatsapp_conversations') 
      WHERE name='display_name'
    `).get() as any;

    if (checkDisplayName.count === 0) {
      db.exec(`ALTER TABLE whatsapp_conversations ADD COLUMN display_name TEXT`);
      console.log("✅ Added display_name column to whatsapp_conversations");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding display_name:", e.message);
  }

  // Migration: Add phone_e164 to clients
  try {
    const checkClientPhoneE164 = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('clients') 
      WHERE name='phone_e164'
    `).get() as any;

    if (checkClientPhoneE164.count === 0) {
      db.exec(`ALTER TABLE clients ADD COLUMN phone_e164 TEXT`);
      console.log("✅ Added phone_e164 column to clients");
      
      // Criar índice único para garantir um telefone por cliente
      db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_phone_e164 ON clients(phone_e164)`);
    }
  } catch (e: any) {
    console.error("⚠️  Error adding phone_e164 to clients:", e.message);
  }

  // Action Plan Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS action_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#64748b',
      icon TEXT,
      type TEXT CHECK(type IN ('MECANICA', 'ELETRICA', 'SERVICOS_GERAIS', 'OUTROS')) DEFAULT 'OUTROS',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Populate categories if table is empty
  const categoryCount = db.prepare("SELECT COUNT(*) as count FROM action_categories").get() as any;
  if (categoryCount.count === 0) {
    const categories = [
      // Atendimento ao Cliente
      { name: 'Fazer Orçamento', color: '#3b82f6', type: 'OUTROS' },
      { name: 'Criar Ordem de Serviço', color: '#2563eb', type: 'OUTROS' },
      { name: 'Contato com Cliente', color: '#06b6d4', type: 'OUTROS' },
      { name: 'Atendimento WhatsApp', color: '#10b981', type: 'OUTROS' },
      { name: 'Retorno ao Cliente', color: '#14b8a6', type: 'OUTROS' },
      { name: 'Aprovação de Serviço', color: '#6366f1', type: 'OUTROS' },
      
      // Compras e Fornecedores
      { name: 'Compra de Peças', color: '#f59e0b', type: 'SERVICOS_GERAIS' },
      { name: 'Contato com Fornecedor', color: '#d97706', type: 'SERVICOS_GERAIS' },
      { name: 'Solicitar Cotação', color: '#ea580c', type: 'SERVICOS_GERAIS' },
      { name: 'Pedido de Compra', color: '#f97316', type: 'SERVICOS_GERAIS' },
      { name: 'Recebimento de Mercadoria', color: '#fb923c', type: 'SERVICOS_GERAIS' },
      
      // Serviços Técnicos
      { name: 'Mecânica Geral', color: '#ef4444', type: 'MECANICA' },
      { name: 'Manutenção Preventiva', color: '#22c55e', type: 'MECANICA' },
      { name: 'Diagnóstico Técnico', color: '#8b5cf6', type: 'MECANICA' },
      { name: 'Reparo Elétrico', color: '#eab308', type: 'ELETRICA' },
      { name: 'Funilaria e Pintura', color: '#ec4899', type: 'SERVICOS_GERAIS' },
      
      // Administrativo e Financeiro
      { name: 'Pagamento a Fornecedor', color: '#dc2626', type: 'OUTROS' },
      { name: 'Cobrança', color: '#e11d48', type: 'OUTROS' },
      { name: 'Faturamento', color: '#059669', type: 'OUTROS' },
      { name: 'Documentação', color: '#64748b', type: 'OUTROS' },
      
      // Serviços Gerais
      { name: 'Limpeza e Organização', color: '#0891b2', type: 'SERVICOS_GERAIS' },
      { name: 'Manutenção de Equipamentos', color: '#0ea5e9', type: 'SERVICOS_GERAIS' },
      { name: 'Entrega de Veículo', color: '#a855f7', type: 'SERVICOS_GERAIS' },
      { name: 'Reunião de Equipe', color: '#7c3aed', type: 'OUTROS' },
      { name: 'Treinamento', color: '#4f46e5', type: 'OUTROS' }
    ];

    const stmt = db.prepare(`
      INSERT INTO action_categories (id, name, color, type)
      VALUES (?, ?, ?, ?)
    `);

    for (const cat of categories) {
      stmt.run(uuidv4(), cat.name, cat.color, cat.type);
    }
    console.log("✅ Populated action_categories with default categories");
  }

  // Action Plans (Plano de Ação / Kanban)
  db.exec(`
    CREATE TABLE IF NOT EXISTS action_boards (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#10b981',
      icon TEXT,
      filter_type TEXT,
      filter_value TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS action_columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6b7280',
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES action_boards(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS action_cards (
      id TEXT PRIMARY KEY,
      column_id TEXT NOT NULL,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
      due_date DATETIME,
      assigned_to TEXT,
      position INTEGER NOT NULL,
      tags TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (column_id) REFERENCES action_columns(id) ON DELETE CASCADE,
      FOREIGN KEY (board_id) REFERENCES action_boards(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS action_card_links (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      entity_type TEXT CHECK(entity_type IN ('CLIENT', 'VEHICLE', 'WORK_ORDER', 'SERVICE', 'PART', 'APPOINTMENT')) NOT NULL,
      entity_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES action_cards(id) ON DELETE CASCADE
    )
  `);

  // Action Card History (Histórico de Movimentações)
  db.exec(`
    CREATE TABLE IF NOT EXISTS action_card_history (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      board_id TEXT NOT NULL,
      action TEXT CHECK(action IN ('CREATED', 'MOVED', 'UPDATED', 'DELETED', 'ASSIGNED', 'PRIORITY_CHANGED', 'DUE_DATE_CHANGED')) NOT NULL,
      from_column_id TEXT,
      to_column_id TEXT,
      from_column_name TEXT,
      to_column_name TEXT,
      changed_by TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES action_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (board_id) REFERENCES action_boards(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    )
  `);

  // Migration: Add client_id and work_order_id to action_cards
  try {
    const checkClientId = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('action_cards') 
      WHERE name='client_id'
    `).get() as any;

    if (checkClientId.count === 0) {
      db.exec(`ALTER TABLE action_cards ADD COLUMN client_id TEXT REFERENCES clients(id)`);
      console.log("✅ Added client_id column to action_cards");
    }

    const checkWorkOrderId = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('action_cards') 
      WHERE name='work_order_id'
    `).get() as any;

    if (checkWorkOrderId.count === 0) {
      db.exec(`ALTER TABLE action_cards ADD COLUMN work_order_id TEXT REFERENCES work_orders(id)`);
      console.log("✅ Added work_order_id column to action_cards");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding columns to action_cards:", e.message);
  }

  // Migration: Add category_id to action_boards
  try {
    const checkCategoryId = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('action_boards') 
      WHERE name='category_id'
    `).get() as any;

    if (checkCategoryId.count === 0) {
      db.exec(`ALTER TABLE action_boards ADD COLUMN category_id TEXT REFERENCES action_categories(id)`);
      console.log("✅ Added category_id column to action_boards");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding category_id to action_boards:", e.message);
  }

  // Vehicle Checklists
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_checklists (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      work_order_id TEXT,
      km INTEGER DEFAULT 0,
      inspector_name TEXT,
      status TEXT CHECK(status IN ('DRAFT','COMPLETED')) DEFAULT 'DRAFT',
      general_notes TEXT,
      public_token TEXT,
      token_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
    )
  `);

  // Vehicle Entries (Initial Checklist) -- MUST be created BEFORE vehicle_checklist_items
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_entries (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT,
      vehicle_id TEXT,
      responsible_name TEXT,
      entry_date TEXT,
      entry_time TEXT,
      arrived_by_tow_truck BOOLEAN DEFAULT 0,
      fuel_level TEXT, -- EMPTY, RESERVE, 1/4, 1/2, 3/4, FULL
      
      -- Customer fields (captured if new or for record)
      customer_name TEXT,
      customer_document TEXT,
      customer_phone TEXT,
      customer_zip_code TEXT,
      customer_state TEXT,
      customer_city TEXT,
      customer_neighborhood TEXT,
      customer_street TEXT,
      customer_number TEXT,
      
      -- Vehicle fields (captured if new or for record)
      vehicle_plate TEXT,
      vehicle_chassis TEXT,
      vehicle_brand TEXT,
      vehicle_model TEXT,
      vehicle_year TEXT,
      vehicle_color TEXT,
      vehicle_fuel_type TEXT,
      vehicle_gearbox TEXT,
      
      -- Checks
      doc_in_vehicle BOOLEAN DEFAULT 0,
      doors_count INTEGER,
      dashboard_light_on BOOLEAN DEFAULT 0,
      
      -- Confirmation & Auth
      photos_confirmed BOOLEAN DEFAULT 0,
      image_auth BOOLEAN DEFAULT 0,
      
      -- Service Info
      requested_service TEXT,
      last_revision_km INTEGER,
      last_revision_date TEXT,
      
      status TEXT CHECK(status IN ('DRAFT', 'COMPLETED')) DEFAULT 'DRAFT',
      public_token TEXT,
      token_expires_at DATETIME,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_checklist_items (
      id TEXT PRIMARY KEY,
      checklist_id TEXT,
      entry_id TEXT,
      category TEXT NOT NULL,
      item TEXT NOT NULL,
      status TEXT CHECK(status IN ('OK','ATTENTION','CRITICAL','NA')) DEFAULT 'NA',
      notes TEXT,
      image_url TEXT,
      external_link TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (checklist_id) REFERENCES vehicle_checklists(id) ON DELETE CASCADE,
      FOREIGN KEY (entry_id) REFERENCES vehicle_entries(id) ON DELETE CASCADE
    )
  `);

  // Migration: Checklist Columns
  const migrations = [
    { table: 'vehicle_checklists', col: 'public_token', type: 'TEXT' },
    { table: 'vehicle_checklists', col: 'token_expires_at', type: 'DATETIME' },
    { table: 'vehicle_checklist_items', col: 'image_url', type: 'TEXT' },
    { table: 'vehicle_checklist_items', col: 'external_link', type: 'TEXT' },
    { table: 'vehicle_checklist_items', col: 'entry_id', type: 'TEXT' },
  ];

  for (const m of migrations) {
    try {
      const check = db.prepare(`SELECT COUNT(*) as count FROM pragma_table_info('${m.table}') WHERE name='${m.col}'`).get() as any;
      if (check.count === 0) {
        db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.col} ${m.type}`);
        console.log(`✅ Added ${m.col} to ${m.table}`);
      }
    } catch (e) {}
  }

  // Migration: Ensure vehicle_entries table exists (fix for old DBs where creation order was wrong)
  try {
    const tableExists = db.prepare(`
      SELECT COUNT(*) as count FROM sqlite_master 
      WHERE type='table' AND name='vehicle_entries'
    `).get() as any;

    if (tableExists.count === 0) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS vehicle_entries (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          client_id TEXT,
          vehicle_id TEXT,
          responsible_name TEXT,
          entry_date TEXT,
          entry_time TEXT,
          arrived_by_tow_truck BOOLEAN DEFAULT 0,
          fuel_level TEXT,
          customer_name TEXT,
          customer_document TEXT,
          customer_phone TEXT,
          customer_zip_code TEXT,
          customer_state TEXT,
          customer_city TEXT,
          customer_neighborhood TEXT,
          customer_street TEXT,
          customer_number TEXT,
          vehicle_plate TEXT,
          vehicle_chassis TEXT,
          vehicle_brand TEXT,
          vehicle_model TEXT,
          vehicle_year TEXT,
          vehicle_color TEXT,
          vehicle_fuel_type TEXT,
          vehicle_gearbox TEXT,
          doc_in_vehicle BOOLEAN DEFAULT 0,
          doors_count INTEGER,
          dashboard_light_on BOOLEAN DEFAULT 0,
          photos_confirmed BOOLEAN DEFAULT 0,
          image_auth BOOLEAN DEFAULT 0,
          requested_service TEXT,
          last_revision_km INTEGER,
          last_revision_date TEXT,
          status TEXT CHECK(status IN ('DRAFT', 'COMPLETED')) DEFAULT 'DRAFT',
          public_token TEXT,
          token_expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id),
          FOREIGN KEY (client_id) REFERENCES clients(id),
          FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        )
      `);
      console.log("✅ Created vehicle_entries table via migration");
    }
  } catch (e: any) {
    console.error("⚠️  Error creating vehicle_entries table:", e.message);
  }

  // Migration: Fix vehicle_checklist_items - remove NOT NULL from checklist_id
  // (needed because entry items use entry_id, not checklist_id)
  try {
    const col = db.prepare(`
      SELECT notnull FROM pragma_table_info('vehicle_checklist_items') WHERE name='checklist_id'
    `).get() as any;

    if (col && col.notnull === 1) {
      console.log("🔧 Migrating vehicle_checklist_items to remove NOT NULL from checklist_id...");
      db.exec(`
        BEGIN TRANSACTION;

        CREATE TABLE vehicle_checklist_items_new (
          id TEXT PRIMARY KEY,
          checklist_id TEXT,
          entry_id TEXT,
          category TEXT NOT NULL,
          item TEXT NOT NULL,
          status TEXT CHECK(status IN ('OK','ATTENTION','CRITICAL','NA')) DEFAULT 'NA',
          notes TEXT,
          image_url TEXT,
          external_link TEXT,
          sort_order INTEGER DEFAULT 0,
          FOREIGN KEY (checklist_id) REFERENCES vehicle_checklists(id) ON DELETE CASCADE,
          FOREIGN KEY (entry_id) REFERENCES vehicle_entries(id) ON DELETE CASCADE
        );

        INSERT INTO vehicle_checklist_items_new 
          SELECT id, checklist_id, entry_id, category, item, status, notes, image_url, external_link, sort_order
          FROM vehicle_checklist_items;

        DROP TABLE vehicle_checklist_items;

        ALTER TABLE vehicle_checklist_items_new RENAME TO vehicle_checklist_items;

        COMMIT;
      `);
      console.log("✅ vehicle_checklist_items migrated successfully");
    }
  } catch (e: any) {
    console.error("⚠️  Error migrating vehicle_checklist_items:", e.message);
    try { db.exec("ROLLBACK;"); } catch {}
  }

  // Migration: Add vehicle_km to vehicle_entries if missing
  try {
    const checkVehicleKm = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('vehicle_entries') WHERE name='vehicle_km'
    `).get() as any;
    if (checkVehicleKm.count === 0) {
      db.exec(`ALTER TABLE vehicle_entries ADD COLUMN vehicle_km INTEGER`);
      console.log("✅ Added vehicle_km to vehicle_entries");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding vehicle_km:", e.message);
  }

  // Migration: Add tow_truck_driver_name to vehicle_entries if missing
  try {
    const checkTowDriver = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('vehicle_entries') WHERE name='tow_truck_driver_name'
    `).get() as any;
    if (checkTowDriver.count === 0) {
      db.exec(`ALTER TABLE vehicle_entries ADD COLUMN tow_truck_driver_name TEXT`);
      console.log("✅ Added tow_truck_driver_name to vehicle_entries");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding tow_truck_driver_name:", e.message);
  }

  // Migration: Add diagnostic_requested to vehicle_entries if missing
  try {
    const checkDiag = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('vehicle_entries') WHERE name='diagnostic_requested'
    `).get() as any;
    if (checkDiag.count === 0) {
      db.exec(`ALTER TABLE vehicle_entries ADD COLUMN diagnostic_requested BOOLEAN DEFAULT 0`);
      console.log("✅ Added diagnostic_requested to vehicle_entries");
    }
  } catch (e: any) {
    console.error("⚠️  Error adding diagnostic_requested:", e.message);
  }

  // SUPER ADMIN SEEDING
  try {
    const superAdminEmail = "admin@mecaerp.com.br";
    const superAdminPassword = "Mec@123";
    
    const existingSuperAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(superAdminEmail);
    
    if (!existingSuperAdmin) {
      console.log("🚀 Seeding Super Admin...");
      
      const systemTenantId = "system-tenant-id";
      const tenantExists = db.prepare("SELECT id FROM tenants WHERE id = ?").get(systemTenantId);
      
      if (!tenantExists) {
        db.prepare("INSERT INTO tenants (id, name, user_limit) VALUES (?, ?, ?)")
          .run(systemTenantId, "Meca ERP System", 999999);
      }
      
      const hashedPassword = bcryptLib.hashSync(superAdminPassword, 10);
      db.prepare("INSERT INTO users (id, tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)")
        .run(uuidv4(), systemTenantId, "Super Admin", superAdminEmail, hashedPassword, "SUPER_ADMIN");
        
      console.log("✅ Super Admin created successfully!");
    } else {
      console.log("ℹ️ Super Admin already exists.");
    }
  } catch (e: any) {
    console.error("⚠️ Error seeding Super Admin:", e.message);
  }

  // Migration: Add user_limit to tenants if missing
  try {
    const checkUserLimit = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('tenants') WHERE name='user_limit'
    `).get() as any;
    if (checkUserLimit.count === 0) {
      db.exec(`ALTER TABLE tenants ADD COLUMN user_limit INTEGER DEFAULT 5`);
      console.log("✅ Added user_limit to tenants");
    }
  } catch (e: any) {
    console.error("⚠️ Error adding user_limit to tenants:", e.message);
  }

  // Migration: Add superadmin tenant fields if missing
  const tenantColumnMigrations = [
    { name: 'subscription_value', sql: "ALTER TABLE tenants ADD COLUMN subscription_value REAL DEFAULT 0" },
    { name: 'due_day', sql: "ALTER TABLE tenants ADD COLUMN due_day INTEGER DEFAULT 5" },
    { name: 'status', sql: "ALTER TABLE tenants ADD COLUMN status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'TRIAL', 'OVERDUE', 'BLOCKED', 'PENDING_PAYMENT'))" },
    { name: 'plan_id', sql: "ALTER TABLE tenants ADD COLUMN plan_id TEXT REFERENCES pricing_plans(id)" },
    { name: 'logo_url', sql: "ALTER TABLE tenants ADD COLUMN logo_url TEXT" },
  ];

  for (const migration of tenantColumnMigrations) {
    try {
      const checkColumn = db.prepare(`
        SELECT COUNT(*) as count FROM pragma_table_info('tenants') WHERE name = ?
      `).get(migration.name) as any;

      if (checkColumn.count === 0) {
        db.exec(migration.sql);
        console.log(`? Added ${migration.name} to tenants`);
      }
    } catch (e: any) {
      console.error(`?? Error adding ${migration.name} to tenants:`, e.message);
    }
  }

  // Seed superadmin settings row
  try {
    const existingSettings = db.prepare("SELECT id FROM superadmin_settings LIMIT 1").get() as any;
    if (!existingSettings) {
      db.prepare(`
        INSERT INTO superadmin_settings (id, power_bi_title, default_user_limit, default_due_day, default_subscription_value)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Painel Financeiro', 5, 5, 0);
      console.log("? Superadmin settings initialized");
    }
  } catch (e: any) {
    console.error("?? Error initializing superadmin settings:", e.message);
  }

  // Migration: Add permissions to users if missing
  try {
    const checkPermissions = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name='permissions'
    `).get() as any;
    if (checkPermissions.count === 0) {
      db.exec(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}'`);
      console.log("✅ Added permissions to users");
    }
  } catch (e: any) {
    console.error("⚠️ Error adding permissions to users:", e.message);
  }

  console.log("Database initialized successfully.");
}


export default db;


