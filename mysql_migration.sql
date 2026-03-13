-- ============================================================
-- MECA ERP - MIGRAÇÃO COMPLETA SQLite → MySQL
-- Usuário: root | Senha: Edu@06051992
-- Gerado em: 2026-03-12
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- ============================================================
-- CRIAÇÃO DO BANCO DE DADOS
-- ============================================================
CREATE DATABASE IF NOT EXISTS mecaerp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mecaerp;

-- Desabilita verificação de FK durante a criação
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. PLANOS DE PREÇO
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_plans (
  id           VARCHAR(36)    NOT NULL,
  name         VARCHAR(255)   NOT NULL,
  description  TEXT,
  user_limit   INT            NOT NULL,
  monthly_value DECIMAL(10,2) NOT NULL,
  months_duration INT         DEFAULT 1,
  active       TINYINT(1)     DEFAULT 1,
  created_at   DATETIME       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TENANTS (MULTI-TENANT)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id                 VARCHAR(36)   NOT NULL,
  name               VARCHAR(255)  NOT NULL,
  document           VARCHAR(100),
  address            TEXT,
  phone              VARCHAR(50),
  user_limit         INT           DEFAULT 5,
  subscription_value DECIMAL(10,2) DEFAULT 0,
  due_day            INT           DEFAULT 5,
  last_payment_date  DATETIME,
  status             VARCHAR(50)   DEFAULT 'ACTIVE',
  plan_id            VARCHAR(36),
  seller_id          VARCHAR(36),
  logo_url           TEXT,
  created_at         DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. USUÁRIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36)   NOT NULL,
  tenant_id   VARCHAR(36)   NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  NOT NULL,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('SUPER_ADMIN','ADMIN','MECHANIC','ATTENDANT','FINANCE','VENDEDOR') NOT NULL,
  cpf         VARCHAR(20),
  phone       VARCHAR(50),
  profession  VARCHAR(100),
  photo_url   TEXT,
  surname     VARCHAR(255),
  biography   TEXT,
  education   TEXT,
  permissions LONGTEXT,
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_users_tenant (tenant_id),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id                 VARCHAR(36)   NOT NULL,
  tenant_id          VARCHAR(36)   NOT NULL,
  type               VARCHAR(10)   DEFAULT 'PF',
  name               VARCHAR(255)  NOT NULL,
  document           VARCHAR(50),
  email              VARCHAR(255),
  phone              VARCHAR(50),
  status             VARCHAR(50)   DEFAULT 'ACTIVE',
  zip_code           VARCHAR(20),
  street             VARCHAR(255),
  number             VARCHAR(20),
  neighborhood       VARCHAR(255),
  city               VARCHAR(100),
  state              VARCHAR(50),
  complement         VARCHAR(255),
  reference          TEXT,
  birth_date         DATE,
  state_registration VARCHAR(50),
  alt_phone          VARCHAR(50),
  alt_name           VARCHAR(255),
  pref_contact       VARCHAR(50)   DEFAULT 'WHATSAPP',
  best_time          VARCHAR(100),
  internal_notes     TEXT,
  tags               LONGTEXT,
  created_at         DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_clients_tenant (tenant_id),
  KEY idx_clients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. VEÍCULOS
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id         VARCHAR(36)   NOT NULL,
  tenant_id  VARCHAR(36)   NOT NULL,
  client_id  VARCHAR(36),
  plate      VARCHAR(20),
  brand      VARCHAR(100),
  model      VARCHAR(100),
  year       VARCHAR(10),
  color      VARCHAR(50),
  vin        VARCHAR(50),
  fuel_type  VARCHAR(50),
  km         INT           DEFAULT 0,
  created_at DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vehicles_tenant (tenant_id),
  KEY idx_vehicles_client (client_id),
  KEY idx_vehicles_plate (plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. ORDENS DE SERVIÇO
-- ============================================================
CREATE TABLE IF NOT EXISTS work_orders (
  id               VARCHAR(36)    NOT NULL,
  tenant_id        VARCHAR(36)    NOT NULL,
  client_id        VARCHAR(36)    NOT NULL,
  vehicle_id       VARCHAR(36)    NOT NULL,
  number           VARCHAR(50)    NOT NULL,
  status           VARCHAR(50)    DEFAULT 'DRAFT',
  complaint        TEXT,
  priority         VARCHAR(20)    DEFAULT 'MEDIUM',
  responsible_id   VARCHAR(36),
  delivery_forecast DATE,
  start_date       DATETIME,
  finish_date      DATETIME,
  guarantee        TEXT,
  technical_report TEXT,
  defect           TEXT,
  internal_notes   TEXT,
  diagnosis        TEXT,
  symptoms         LONGTEXT,
  history          LONGTEXT,
  photos           LONGTEXT,
  taxes            DECIMAL(10,2)  DEFAULT 0,
  discount         DECIMAL(10,2)  DEFAULT 0,
  total_amount     DECIMAL(10,2)  DEFAULT 0,
  checklist        LONGTEXT,
  evaluation       LONGTEXT,
  approval_data    LONGTEXT,
  payment_data     LONGTEXT,
  delivery_data    LONGTEXT,
  approval_required TINYINT(1)    DEFAULT 0,
  km               INT            DEFAULT 0,
  created_at       DATETIME       DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wo_tenant (tenant_id),
  KEY idx_wo_client (client_id),
  KEY idx_wo_vehicle (vehicle_id),
  KEY idx_wo_status (status),
  KEY idx_wo_number (number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. ITENS DA ORDEM DE SERVIÇO
-- ============================================================
CREATE TABLE IF NOT EXISTS work_order_items (
  id               VARCHAR(36)    NOT NULL,
  work_order_id    VARCHAR(36)    NOT NULL,
  type             VARCHAR(50),
  description      TEXT,
  quantity         DECIMAL(10,3)  DEFAULT 1,
  unit_price       DECIMAL(10,2)  DEFAULT 0,
  total_price      DECIMAL(10,2)  DEFAULT 0,
  long_description TEXT,
  cost_price       DECIMAL(10,2)  DEFAULT 0,
  mechanic_id      VARCHAR(36),
  warranty_days    INT            DEFAULT 0,
  sku              VARCHAR(100),
  status           VARCHAR(50)    DEFAULT 'PENDING',
  part_id          VARCHAR(36),
  created_at       DATETIME       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_woi_work_order (work_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. FORNECEDORES
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id              VARCHAR(36)   NOT NULL,
  tenant_id       VARCHAR(36)   NOT NULL,
  name            VARCHAR(255)  NOT NULL,
  trade_name      VARCHAR(255),
  cnpj            VARCHAR(30),
  ie              VARCHAR(50),
  category        VARCHAR(100),
  status          VARCHAR(50)   DEFAULT 'ACTIVE',
  phone           VARCHAR(50),
  whatsapp        VARCHAR(50),
  email           VARCHAR(255),
  website         VARCHAR(255),
  contact_name    VARCHAR(255),
  sales_rep       VARCHAR(255),
  sales_rep_phone VARCHAR(50),
  zip_code        VARCHAR(20),
  street          VARCHAR(255),
  number          VARCHAR(20),
  complement      VARCHAR(255),
  neighborhood    VARCHAR(255),
  city            VARCHAR(100),
  state           VARCHAR(50),
  payment_terms   TEXT,
  payment_methods TEXT,
  notes           TEXT,
  is_preferred    TINYINT(1)    DEFAULT 0,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_suppliers_tenant (tenant_id),
  KEY idx_suppliers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. PEÇAS / ESTOQUE
-- ============================================================
CREATE TABLE IF NOT EXISTS parts (
  id             VARCHAR(36)    NOT NULL,
  tenant_id      VARCHAR(36)    NOT NULL,
  name           VARCHAR(255)   NOT NULL,
  code           VARCHAR(100),
  supplier_code  VARCHAR(100),
  category       VARCHAR(100),
  brand          VARCHAR(100),
  supplier_id    VARCHAR(36),
  cost_price     DECIMAL(10,2)  DEFAULT 0,
  sale_price     DECIMAL(10,2)  DEFAULT 0,
  stock_quantity DECIMAL(10,3)  DEFAULT 0,
  min_stock      DECIMAL(10,3)  DEFAULT 0,
  location       VARCHAR(100),
  compatibility  TEXT,
  notes          TEXT,
  created_at     DATETIME       DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_parts_tenant (tenant_id),
  KEY idx_parts_supplier (supplier_id),
  KEY idx_parts_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. RELACIONAMENTO FORNECEDOR x PEÇA
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_parts (
  id                VARCHAR(36)   NOT NULL,
  supplier_id       VARCHAR(36)   NOT NULL,
  part_id           VARCHAR(36)   NOT NULL,
  supplier_code     VARCHAR(100),
  last_cost         DECIMAL(10,2) DEFAULT 0,
  is_preferred      TINYINT(1)    DEFAULT 0,
  last_purchase_date DATETIME,
  PRIMARY KEY (id),
  KEY idx_sp_supplier (supplier_id),
  KEY idx_sp_part (part_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. CATÁLOGO DE SERVIÇOS
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id                   VARCHAR(36)   NOT NULL,
  tenant_id            VARCHAR(36)   NOT NULL,
  name                 VARCHAR(255)  NOT NULL,
  code                 VARCHAR(100),
  category             VARCHAR(100),
  description          TEXT,
  estimated_time       VARCHAR(50),
  default_price        DECIMAL(10,2) DEFAULT 0,
  estimated_cost       DECIMAL(10,2) DEFAULT 0,
  status               VARCHAR(50)   DEFAULT 'ACTIVE',
  type                 VARCHAR(50)   DEFAULT 'LABOR',
  warranty_days        INT           DEFAULT 90,
  allow_discount       TINYINT(1)    DEFAULT 1,
  requires_diagnosis   TINYINT(1)    DEFAULT 0,
  compatible_vehicles  TEXT,
  charging_type        VARCHAR(50)   DEFAULT 'FIXED',
  created_at           DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_services_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. PEÇAS VINCULADAS AO SERVIÇO (KITS)
-- ============================================================
CREATE TABLE IF NOT EXISTS service_parts (
  id         VARCHAR(36)    NOT NULL,
  tenant_id  VARCHAR(36)    NOT NULL,
  service_id VARCHAR(36)    NOT NULL,
  part_id    VARCHAR(36)    NOT NULL,
  quantity   DECIMAL(10,3)  DEFAULT 1,
  created_at DATETIME       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_service_parts_service (service_id),
  CONSTRAINT fk_service_parts_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. AGENDAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id                  VARCHAR(36)   NOT NULL,
  tenant_id           VARCHAR(36)   NOT NULL,
  client_id           VARCHAR(36),
  vehicle_id          VARCHAR(36),
  user_id             VARCHAR(36),
  date                DATE,
  time                VARCHAR(10),
  service_description TEXT,
  estimated_duration  INT           DEFAULT 60,
  status              VARCHAR(50)   DEFAULT 'PENDING',
  notes               TEXT,
  internal_notes      TEXT,
  origin              VARCHAR(100),
  send_confirmation   TINYINT(1)    DEFAULT 0,
  type                VARCHAR(50)   DEFAULT 'CLIENT',
  title               VARCHAR(255),
  color               VARCHAR(50),
  created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointments_tenant (tenant_id),
  KEY idx_appointments_date (date),
  KEY idx_appointments_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. LOGS DE AUDITORIA DE TENANT
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_audit_logs (
  id             VARCHAR(36)  NOT NULL,
  tenant_id      VARCHAR(36)  NOT NULL,
  user_id        VARCHAR(36),
  action_type    VARCHAR(100) NOT NULL,
  description    TEXT,
  payment_date   DATETIME,
  payment_method VARCHAR(100),
  old_status     VARCHAR(50),
  new_status     VARCHAR(50),
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. PERFIS DE PERMISSÃO
-- ============================================================
CREATE TABLE IF NOT EXISTS permission_profiles (
  id          VARCHAR(36)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  permissions LONGTEXT     NOT NULL,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. PREFERÊNCIAS DO USUÁRIO
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id                     VARCHAR(36)  NOT NULL,
  tenant_id              VARCHAR(36)  NOT NULL,
  user_id                VARCHAR(36)  NOT NULL,
  theme_mode             VARCHAR(20)  DEFAULT 'light',
  primary_color          VARCHAR(20)  DEFAULT '#1e293b',
  secondary_color        VARCHAR(20)  DEFAULT '#64748b',
  sidebar_color          VARCHAR(20)  DEFAULT '#0f172a',
  sidebar_text_color     VARCHAR(20)  DEFAULT '#94a3b8',
  header_color           VARCHAR(20)  DEFAULT '#ffffff',
  sidebar_collapsed      TINYINT(1)   DEFAULT 0,
  show_dashboard_cards   TINYINT(1)   DEFAULT 1,
  default_rows_per_page  INT          DEFAULT 20,
  filters_json           LONGTEXT,
  table_preferences_json LONGTEXT,
  created_at             DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_up_user (user_id),
  UNIQUE KEY uq_up_user_tenant (user_id, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. HISTÓRICO UNIFICADO DO VEÍCULO
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_history_logs (
  id             VARCHAR(36)  NOT NULL,
  vehicle_id     VARCHAR(36)  NOT NULL,
  tenant_id      VARCHAR(36)  NOT NULL,
  event_type     ENUM('REGISTRATION','OWNERSHIP','ENTRY','EXIT','MAINTENANCE','RECALL','RE-ENTRY') NOT NULL,
  description    TEXT,
  old_value      TEXT,
  new_value      TEXT,
  responsible_id VARCHAR(36),
  km             INT,
  value          DECIMAL(10,2),
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vhl_vehicle (vehicle_id),
  KEY idx_vhl_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. ANEXOS DO VEÍCULO (FOTOS E DOCUMENTOS)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_attachments (
  id         VARCHAR(36)  NOT NULL,
  vehicle_id VARCHAR(36)  NOT NULL,
  tenant_id  VARCHAR(36)  NOT NULL,
  type       ENUM('PHOTO','DOCUMENT') NOT NULL,
  url        TEXT         NOT NULL,
  name       VARCHAR(255) NOT NULL,
  size       BIGINT,
  mime_type  VARCHAR(100),
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_va_vehicle (vehicle_id),
  KEY idx_va_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. ENTRADA DE VEÍCULO NA OFICINA
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_entries (
  id              VARCHAR(36)  NOT NULL,
  tenant_id       VARCHAR(36)  NOT NULL,
  client_id       VARCHAR(36),
  vehicle_id      VARCHAR(36),
  status          VARCHAR(50)  DEFAULT 'DRAFT',
  public_token    VARCHAR(100),
  token_expires_at DATETIME,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ve_tenant (tenant_id),
  KEY idx_ve_vehicle (vehicle_id),
  KEY idx_ve_token (public_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. CHECKLISTS DO VEÍCULO
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_checklists (
  id              VARCHAR(36)  NOT NULL,
  tenant_id       VARCHAR(36)  NOT NULL,
  vehicle_id      VARCHAR(36)  NOT NULL,
  work_order_id   VARCHAR(36),
  km              INT          DEFAULT 0,
  inspector_name  VARCHAR(255),
  general_notes   TEXT,
  status          VARCHAR(50)  DEFAULT 'DRAFT',
  public_token    VARCHAR(100),
  token_expires_at DATETIME,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vc_vehicle (vehicle_id),
  KEY idx_vc_tenant (tenant_id),
  KEY idx_vc_token (public_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. ITENS DO CHECKLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_checklist_items (
  id           VARCHAR(36)  NOT NULL,
  checklist_id VARCHAR(36),
  entry_id     VARCHAR(36),
  category     VARCHAR(100),
  item         VARCHAR(255),
  status       VARCHAR(50)  DEFAULT 'NA',
  notes        TEXT,
  sort_order   INT          DEFAULT 0,
  image_url    TEXT,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vci_checklist (checklist_id),
  KEY idx_vci_entry (entry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. MODELOS DE GARANTIA
-- ============================================================
CREATE TABLE IF NOT EXISTS warranty_templates (
  id            VARCHAR(36)  NOT NULL,
  tenant_id     VARCHAR(36)  NOT NULL,
  title         VARCHAR(255) NOT NULL,
  content       LONGTEXT     NOT NULL,
  days_duration INT          DEFAULT 90,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wt_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. TERMOS DE GARANTIA EMITIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS warranty_terms (
  id             VARCHAR(36)  NOT NULL,
  tenant_id      VARCHAR(36)  NOT NULL,
  vehicle_id     VARCHAR(36),
  client_id      VARCHAR(36),
  work_order_id  VARCHAR(36),
  template_id    VARCHAR(36),
  title          VARCHAR(255) NOT NULL,
  content        LONGTEXT     NOT NULL,
  issued_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  expires_at     DATETIME,
  status         VARCHAR(50)  DEFAULT 'ACTIVE',
  responsible_id VARCHAR(36),
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wterm_tenant (tenant_id),
  KEY idx_wterm_vehicle (vehicle_id),
  KEY idx_wterm_client (client_id),
  KEY idx_wterm_work_order (work_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. CONTAS FINANCEIRAS (CAIXA / BANCO)
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_accounts (
  id              VARCHAR(36)   NOT NULL,
  tenant_id       VARCHAR(36)   NOT NULL,
  name            VARCHAR(255)  NOT NULL,
  type            VARCHAR(50)   DEFAULT 'cash',
  active          TINYINT(1)    DEFAULT 1,
  initial_balance DECIMAL(10,2) DEFAULT 0,
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ca_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. LANÇAMENTOS DE FLUXO DE CAIXA
-- ============================================================
CREATE TABLE IF NOT EXISTS cashflow_transactions (
  id               VARCHAR(36)   NOT NULL,
  tenant_id        VARCHAR(36)   NOT NULL,
  date             VARCHAR(20)   NOT NULL,
  type             ENUM('in','out') NOT NULL,
  amount           DECIMAL(10,2) NOT NULL,
  category         VARCHAR(100),
  description      TEXT,
  account_id       VARCHAR(36),
  related_account_id VARCHAR(36),
  payment_method   VARCHAR(100),
  status           VARCHAR(50)   DEFAULT 'confirmed',
  source_type      VARCHAR(50)   DEFAULT 'manual',
  source_id        VARCHAR(36),
  attachment_url   TEXT,
  created_by       VARCHAR(36),
  created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ct_tenant (tenant_id),
  KEY idx_ct_account (account_id),
  KEY idx_ct_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 26. CONTAS A RECEBER
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id                  VARCHAR(36)   NOT NULL,
  tenant_id           VARCHAR(36)   NOT NULL,
  client_id           VARCHAR(36)   NOT NULL,
  work_order_id       VARCHAR(36),
  installment_number  INT           DEFAULT 1,
  total_installments  INT           DEFAULT 1,
  description         TEXT,
  original_amount     DECIMAL(10,2) DEFAULT 0,
  amount_paid         DECIMAL(10,2) DEFAULT 0,
  balance             DECIMAL(10,2) DEFAULT 0,
  due_date            VARCHAR(20)   NOT NULL,
  paid_at             VARCHAR(20),
  status              VARCHAR(50)   DEFAULT 'OPEN',
  payment_method      VARCHAR(100),
  document_number     VARCHAR(100),
  notes               TEXT,
  created_by          VARCHAR(36),
  created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ar_tenant (tenant_id),
  KEY idx_ar_client (client_id),
  KEY idx_ar_work_order (work_order_id),
  KEY idx_ar_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 27. PAGAMENTOS DE CONTAS A RECEBER
-- ============================================================
CREATE TABLE IF NOT EXISTS receivable_payments (
  id             VARCHAR(36)   NOT NULL,
  tenant_id      VARCHAR(36)   NOT NULL,
  account_id     VARCHAR(36)   NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  payment_date   VARCHAR(20)   NOT NULL,
  payment_method VARCHAR(100),
  document_number VARCHAR(100),
  notes          TEXT,
  created_by     VARCHAR(36),
  created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rp_tenant (tenant_id),
  KEY idx_rp_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 28. CONTAS A PAGAR
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts_payable (
  id                  VARCHAR(36)   NOT NULL,
  tenant_id           VARCHAR(36)   NOT NULL,
  supplier_id         VARCHAR(36)   NOT NULL,
  purchase_order_id   VARCHAR(36),
  installment_number  INT           DEFAULT 1,
  total_installments  INT           DEFAULT 1,
  description         TEXT,
  original_amount     DECIMAL(10,2) DEFAULT 0,
  amount_paid         DECIMAL(10,2) DEFAULT 0,
  balance             DECIMAL(10,2) DEFAULT 0,
  due_date            VARCHAR(20)   NOT NULL,
  paid_at             VARCHAR(20),
  status              VARCHAR(50)   DEFAULT 'OPEN',
  payment_method      VARCHAR(100),
  document_number     VARCHAR(100),
  notes               TEXT,
  created_by          VARCHAR(36),
  created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ap_tenant (tenant_id),
  KEY idx_ap_supplier (supplier_id),
  KEY idx_ap_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 29. PAGAMENTOS DE CONTAS A PAGAR
-- ============================================================
CREATE TABLE IF NOT EXISTS payable_payments (
  id              VARCHAR(36)   NOT NULL,
  tenant_id       VARCHAR(36)   NOT NULL,
  account_id      VARCHAR(36)   NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  payment_date    VARCHAR(20)   NOT NULL,
  payment_method  VARCHAR(100),
  document_number VARCHAR(100),
  notes           TEXT,
  created_by      VARCHAR(36),
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pp_tenant (tenant_id),
  KEY idx_pp_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 30. FECHAMENTOS DE CAIXA
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_closes (
  id               VARCHAR(36)   NOT NULL,
  tenant_id        VARCHAR(36)   NOT NULL,
  account_id       VARCHAR(36)   NOT NULL,
  date             VARCHAR(20)   NOT NULL,
  opening_balance  DECIMAL(10,2) DEFAULT 0,
  expected_balance DECIMAL(10,2) DEFAULT 0,
  counted_balance  DECIMAL(10,2) DEFAULT 0,
  difference       DECIMAL(10,2) DEFAULT 0,
  notes            TEXT,
  created_by       VARCHAR(36),
  created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cc_tenant (tenant_id),
  KEY idx_cc_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 31. ORDENS DE COMPRA
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                VARCHAR(36)   NOT NULL,
  tenant_id         VARCHAR(36)   NOT NULL,
  supplier_id       VARCHAR(36)   NOT NULL,
  number            VARCHAR(50)   NOT NULL,
  order_date        VARCHAR(50)   DEFAULT NULL,
  expected_delivery VARCHAR(20),
  status            VARCHAR(50)   DEFAULT 'DRAFT',
  freight           DECIMAL(10,2) DEFAULT 0,
  discount          DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2) DEFAULT 0,
  notes             TEXT,
  created_by        VARCHAR(36),
  created_at        DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_po_tenant (tenant_id),
  KEY idx_po_supplier (supplier_id),
  KEY idx_po_number (number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 32. ITENS DA ORDEM DE COMPRA
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                VARCHAR(36)   NOT NULL,
  purchase_order_id VARCHAR(36)   NOT NULL,
  part_id           VARCHAR(36)   NOT NULL,
  quantity          DECIMAL(10,3) NOT NULL,
  unit_cost         DECIMAL(10,2) NOT NULL,
  subtotal          DECIMAL(10,2) NOT NULL,
  received_quantity DECIMAL(10,3) DEFAULT 0,
  created_at        DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_poi_order (purchase_order_id),
  KEY idx_poi_part (part_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 33. MOVIMENTAÇÕES DE ESTOQUE
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id               VARCHAR(36)   NOT NULL,
  tenant_id        VARCHAR(36)   NOT NULL,
  part_id          VARCHAR(36)   NOT NULL,
  type             ENUM('ENTRY','EXIT','ADJUSTMENT','OS_USED','PURCHASE_ORDER') NOT NULL,
  quantity         DECIMAL(10,3) NOT NULL,
  unit_cost        DECIMAL(10,2),
  unit_price       DECIMAL(10,2),
  reference_id     VARCHAR(36),
  reference_type   VARCHAR(100),
  invoice_number   VARCHAR(100),
  reason           TEXT,
  user_id          VARCHAR(36),
  created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sm_tenant (tenant_id),
  KEY idx_sm_part (part_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 34. SESSÕES WHATSAPP
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id                VARCHAR(36)  NOT NULL,
  tenant_id         VARCHAR(36)  NOT NULL,
  session_name      VARCHAR(100) DEFAULT 'default',
  status            VARCHAR(50)  DEFAULT 'disconnected',
  phone_number      VARCHAR(50),
  qr_code           TEXT,
  is_active         TINYINT(1)   DEFAULT 1,
  last_connected_at DATETIME,
  created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ws_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 35. CONVERSAS WHATSAPP
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id                   VARCHAR(36)  NOT NULL,
  tenant_id            VARCHAR(36)  NOT NULL,
  phone                VARCHAR(50),
  phone_e164           VARCHAR(50),
  display_name         VARCHAR(255),
  contact_name         VARCHAR(255),
  client_id            VARCHAR(36),
  vehicle_plate        VARCHAR(20),
  work_order_id        VARCHAR(36),
  assigned_to_user_id  VARCHAR(36),
  status               VARCHAR(50)  DEFAULT 'open',
  tags                 TEXT,
  unread_count         INT          DEFAULT 0,
  last_message_at      DATETIME,
  last_message_preview TEXT,
  bot_enabled          TINYINT(1)   DEFAULT 0,
  bot_topic            VARCHAR(255),
  bot_state            TEXT,
  created_at           DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wc_tenant (tenant_id),
  KEY idx_wc_phone (phone),
  KEY idx_wc_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 36. MENSAGENS WHATSAPP
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id              VARCHAR(36)  NOT NULL,
  tenant_id       VARCHAR(36)  NOT NULL,
  conversation_id VARCHAR(36)  NOT NULL,
  direction       ENUM('in','out') NOT NULL,
  type            VARCHAR(50)  DEFAULT 'text',
  body            LONGTEXT,
  media_url       TEXT,
  sent_status     VARCHAR(50)  DEFAULT 'pending',
  origin          VARCHAR(50)  DEFAULT 'human',
  related_type    VARCHAR(100),
  related_id      VARCHAR(36),
  template_id     VARCHAR(36),
  wpp_message_id  VARCHAR(255),
  error_message   TEXT,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wm_tenant (tenant_id),
  KEY idx_wm_conversation (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 37. TEMPLATES WHATSAPP
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id             VARCHAR(36)  NOT NULL,
  tenant_id      VARCHAR(36)  NOT NULL,
  name           VARCHAR(255) NOT NULL,
  category       VARCHAR(100),
  body           LONGTEXT     NOT NULL,
  variables_json TEXT,
  enabled        TINYINT(1)   DEFAULT 1,
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wt2_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 38. REGRAS DE AUTOMAÇÃO WHATSAPP
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
  id                  VARCHAR(36)  NOT NULL,
  tenant_id           VARCHAR(36)  NOT NULL,
  name                VARCHAR(255) NOT NULL,
  trigger_event       VARCHAR(100) NOT NULL,
  template_id         VARCHAR(36),
  conditions_json     TEXT,
  delay_minutes       INT          DEFAULT 0,
  business_hours_only TINYINT(1)   DEFAULT 1,
  enabled             TINYINT(1)   DEFAULT 1,
  created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_war_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 39. LOGS DE AUTOMAÇÃO WHATSAPP
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_automation_logs (
  id         VARCHAR(36)  NOT NULL,
  tenant_id  VARCHAR(36)  NOT NULL,
  rule_id    VARCHAR(36),
  message_id VARCHAR(36),
  phone      VARCHAR(50),
  status     VARCHAR(50),
  error      TEXT,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wal_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 40. MAPEAMENTO LID → TELEFONE WHATSAPP
-- ============================================================
CREATE TABLE IF NOT EXISTS wa_lid_map (
  tenant_id VARCHAR(36)  NOT NULL,
  lid       VARCHAR(100) NOT NULL,
  phone     VARCHAR(50)  NOT NULL,
  PRIMARY KEY (tenant_id, lid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 41. CATEGORIAS DO PLANO DE AÇÃO (KANBAN)
-- ============================================================
CREATE TABLE IF NOT EXISTS action_categories (
  id    VARCHAR(36)  NOT NULL,
  name  VARCHAR(255) NOT NULL,
  type  VARCHAR(100),
  color VARCHAR(50),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 42. QUADROS DO PLANO DE AÇÃO (KANBAN)
-- ============================================================
CREATE TABLE IF NOT EXISTS action_boards (
  id           VARCHAR(36)  NOT NULL,
  tenant_id    VARCHAR(36)  NOT NULL,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  color        VARCHAR(50)  DEFAULT '#10b981',
  icon         VARCHAR(100),
  filter_type  VARCHAR(100),
  filter_value VARCHAR(255),
  category_id  VARCHAR(36),
  created_by   VARCHAR(36),
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ab_tenant (tenant_id),
  KEY idx_ab_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 43. COLUNAS DO QUADRO KANBAN
-- ============================================================
CREATE TABLE IF NOT EXISTS action_columns (
  id       VARCHAR(36)  NOT NULL,
  board_id VARCHAR(36)  NOT NULL,
  name     VARCHAR(255) NOT NULL,
  color    VARCHAR(50)  DEFAULT '#6b7280',
  position INT          DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_acol_board (board_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 44. CARDS DO KANBAN
-- ============================================================
CREATE TABLE IF NOT EXISTS action_cards (
  id             VARCHAR(36)  NOT NULL,
  board_id       VARCHAR(36)  NOT NULL,
  column_id      VARCHAR(36)  NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  priority       VARCHAR(20)  DEFAULT 'MEDIUM',
  due_date       DATETIME,
  assigned_to    VARCHAR(36),
  client_id      VARCHAR(36),
  work_order_id  VARCHAR(36),
  position       INT          DEFAULT 0,
  tags           TEXT,
  created_by     VARCHAR(36),
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_acard_board (board_id),
  KEY idx_acard_column (column_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 45. LINKS DOS CARDS (RELACIONAMENTOS)
-- ============================================================
CREATE TABLE IF NOT EXISTS action_card_links (
  id          VARCHAR(36)  NOT NULL,
  card_id     VARCHAR(36)  NOT NULL,
  entity_type VARCHAR(100),
  entity_id   VARCHAR(36),
  PRIMARY KEY (id),
  KEY idx_acl_card (card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 46. HISTÓRICO DOS CARDS KANBAN
-- ============================================================
CREATE TABLE IF NOT EXISTS action_card_history (
  id             VARCHAR(36)  NOT NULL,
  card_id        VARCHAR(36)  NOT NULL,
  board_id       VARCHAR(36),
  action         VARCHAR(100),
  to_column_id   VARCHAR(36),
  to_column_name VARCHAR(255),
  changed_by     VARCHAR(36),
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ach_card (card_id),
  KEY idx_ach_board (board_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SUPER ADMIN PADRÃO
-- Senha: Mec@123 (bcrypt hash)
-- ============================================================
INSERT IGNORE INTO tenants (id, name, status)
VALUES ('system-tenant-id', 'MecaERP Cloud', 'ACTIVE');

INSERT IGNORE INTO users (id, tenant_id, name, email, password, role)
VALUES (
  UUID(),
  'system-tenant-id',
  'Super Admin',
  'admin@mecaerp.com.br',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'SUPER_ADMIN'
);

-- Reabilita verificação de FK
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- FIM DA MIGRAÇÃO
-- Total de tabelas: 46
-- ============================================================
