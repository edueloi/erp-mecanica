import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken } from "../middleware/auth";

const router = Router();
router.use(authenticateToken);

// ========================================
// CASH ACCOUNTS (Contas)
// ========================================

// Get all accounts
router.get("/accounts", (req: any, res) => {
  try {
    const accounts = db
      .prepare(
        `SELECT * FROM cash_accounts 
         WHERE tenant_id = ? 
         ORDER BY 
           CASE type 
             WHEN 'cash' THEN 1 
             WHEN 'bank' THEN 2 
             WHEN 'digital' THEN 3 
             WHEN 'card' THEN 4 
           END, 
           name`
      )
      .all(req.user.tenant_id);

    // Calculate balance for each account
    const accountsWithBalance = accounts.map((account: any) => {
      const balance = db
        .prepare(
          `SELECT 
             COALESCE(SUM(CASE WHEN type = 'in' AND status = 'confirmed' THEN amount ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN type = 'out' AND status = 'confirmed' THEN amount ELSE 0 END), 0) as balance
           FROM cashflow_transactions 
           WHERE tenant_id = ? AND account_id = ?`
        )
        .get(req.user.tenant_id, account.id) as any;

      return {
        ...account,
        balance: (account.initial_balance || 0) + (balance?.balance || 0),
      };
    });

    res.json(accountsWithBalance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create account
router.post("/accounts", (req: any, res) => {
  try {
    const { name, type, initial_balance } = req.body;

    const id = uuidv4();
    const stmt = db.prepare(
      `INSERT INTO cash_accounts (id, tenant_id, name, type, initial_balance) 
       VALUES (?, ?, ?, ?, ?)`
    );

    stmt.run(id, req.user.tenant_id, name, type || "cash", initial_balance || 0);

    const account = db
      .prepare("SELECT * FROM cash_accounts WHERE id = ?")
      .get(id);

    res.status(201).json(account);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update account
router.patch("/accounts/:id", (req: any, res) => {
  try {
    const { name, type, active } = req.body;

    const stmt = db.prepare(
      `UPDATE cash_accounts 
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           active = COALESCE(?, active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`
    );

    stmt.run(name, type, active, req.params.id, req.user.tenant_id);

    const account = db
      .prepare("SELECT * FROM cash_accounts WHERE id = ? AND tenant_id = ?")
      .get(req.params.id, req.user.tenant_id);

    res.json(account);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete account
router.delete("/accounts/:id", (req: any, res) => {
  try {
    // Check if has transactions
    const check = db
      .prepare(
        `SELECT COUNT(*) as count FROM cashflow_transactions 
         WHERE tenant_id = ? AND account_id = ?`
      )
      .get(req.user.tenant_id, req.params.id) as any;

    if (check.count > 0) {
      return res.status(400).json({
        message: "Não é possível excluir conta com transações. Desative-a.",
      });
    }

    db.prepare("DELETE FROM cash_accounts WHERE id = ? AND tenant_id = ?").run(
      req.params.id,
      req.user.tenant_id
    );

    res.json({ message: "Conta excluída com sucesso" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// TRANSACTIONS (Lançamentos)
// ========================================

// Get transactions with filters
router.get("/transactions", (req: any, res) => {
  try {
    const {
      start_date,
      end_date,
      type,
      account_id,
      category,
      status,
      source_type,
      search,
    } = req.query;

    let query = `
      SELECT 
        t.*,
        a.name as account_name,
        a.type as account_type,
        ra.name as related_account_name,
        u.name as created_by_name
      FROM cashflow_transactions t
      LEFT JOIN cash_accounts a ON t.account_id = a.id
      LEFT JOIN cash_accounts ra ON t.related_account_id = ra.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.tenant_id = ?
    `;

    const params: any[] = [req.user.tenant_id];

    if (start_date) {
      query += " AND DATE(t.date) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(t.date) <= ?";
      params.push(end_date);
    }

    if (type && type !== "all") {
      query += " AND t.type = ?";
      params.push(type);
    }

    if (account_id && account_id !== "all") {
      query += " AND (t.account_id = ? OR t.related_account_id = ?)";
      params.push(account_id, account_id);
    }

    if (category && category !== "all") {
      query += " AND t.category = ?";
      params.push(category);
    }

    if (status && status !== "all") {
      query += " AND t.status = ?";
      params.push(status);
    }

    if (source_type && source_type !== "all") {
      query += " AND t.source_type = ?";
      params.push(source_type);
    }

    if (search) {
      query += " AND (t.description LIKE ? OR CAST(t.amount AS TEXT) LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY t.date DESC, t.created_at DESC";

    const transactions = db.prepare(query).all(...params);

    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create transaction
router.post("/transactions", (req: any, res) => {
  try {
    const {
      date,
      type,
      amount,
      category,
      description,
      account_id,
      payment_method,
      status,
      source_type,
      source_id,
    } = req.body;

    const id = uuidv4();
    const stmt = db.prepare(
      `INSERT INTO cashflow_transactions 
       (id, tenant_id, date, type, amount, category, description, 
        account_id, payment_method, status, source_type, source_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    stmt.run(
      id,
      req.user.tenant_id,
      date,
      type,
      amount,
      category,
      description,
      account_id,
      payment_method,
      status || "confirmed",
      source_type || "manual",
      source_id,
      req.user.id
    );

    const transaction = db
      .prepare(
        `SELECT t.*, a.name as account_name 
         FROM cashflow_transactions t
         LEFT JOIN cash_accounts a ON t.account_id = a.id
         WHERE t.id = ?`
      )
      .get(id);

    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create transfer between accounts
router.post("/transactions/transfer", (req: any, res) => {
  try {
    const { date, amount, from_account_id, to_account_id, description } =
      req.body;

    if (from_account_id === to_account_id) {
      return res
        .status(400)
        .json({ message: "Contas de origem e destino devem ser diferentes" });
    }

    const db_instance = db as any;
    const transaction = db_instance.transaction(() => {
      // Create OUT transaction (from)
      const outId = uuidv4();
      db.prepare(
        `INSERT INTO cashflow_transactions 
         (id, tenant_id, date, type, amount, category, description, 
          account_id, related_account_id, status, source_type, created_by) 
         VALUES (?, ?, ?, 'out', ?, 'Transferência', ?, ?, ?, 'confirmed', 'transfer', ?)`
      ).run(
        outId,
        req.user.tenant_id,
        date,
        amount,
        description || "Transferência entre contas",
        from_account_id,
        to_account_id,
        req.user.id
      );

      // Create IN transaction (to)
      const inId = uuidv4();
      db.prepare(
        `INSERT INTO cashflow_transactions 
         (id, tenant_id, date, type, amount, category, description, 
          account_id, related_account_id, status, source_type, created_by) 
         VALUES (?, ?, ?, 'in', ?, 'Transferência', ?, ?, ?, 'confirmed', 'transfer', ?)`
      ).run(
        inId,
        req.user.tenant_id,
        date,
        amount,
        description || "Transferência entre contas",
        to_account_id,
        from_account_id,
        req.user.id
      );

      return { outId, inId };
    });

    const result = transaction();

    res.status(201).json({
      message: "Transferência realizada com sucesso",
      transaction_ids: result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction
router.patch("/transactions/:id", (req: any, res) => {
  try {
    const {
      date,
      amount,
      category,
      description,
      account_id,
      payment_method,
      status,
    } = req.body;

    // Check if manual transaction
    const check = db
      .prepare(
        "SELECT source_type FROM cashflow_transactions WHERE id = ? AND tenant_id = ?"
      )
      .get(req.params.id, req.user.tenant_id) as any;

    if (!check) {
      return res.status(404).json({ message: "Transação não encontrada" });
    }

    if (check.source_type !== "manual") {
      return res
        .status(400)
        .json({ message: "Só é possível editar lançamentos manuais" });
    }

    const stmt = db.prepare(
      `UPDATE cashflow_transactions 
       SET date = COALESCE(?, date),
           amount = COALESCE(?, amount),
           category = COALESCE(?, category),
           description = COALESCE(?, description),
           account_id = COALESCE(?, account_id),
           payment_method = COALESCE(?, payment_method),
           status = COALESCE(?, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`
    );

    stmt.run(
      date,
      amount,
      category,
      description,
      account_id,
      payment_method,
      status,
      req.params.id,
      req.user.tenant_id
    );

    const transaction = db
      .prepare(
        `SELECT t.*, a.name as account_name 
         FROM cashflow_transactions t
         LEFT JOIN cash_accounts a ON t.account_id = a.id
         WHERE t.id = ? AND t.tenant_id = ?`
      )
      .get(req.params.id, req.user.tenant_id);

    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm pending transaction
router.patch("/transactions/:id/confirm", (req: any, res) => {
  try {
    db.prepare(
      `UPDATE cashflow_transactions 
       SET status = 'confirmed', 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`
    ).run(req.params.id, req.user.tenant_id);

    const transaction = db
      .prepare(
        `SELECT t.*, a.name as account_name 
         FROM cashflow_transactions t
         LEFT JOIN cash_accounts a ON t.account_id = a.id
         WHERE t.id = ? AND t.tenant_id = ?`
      )
      .get(req.params.id, req.user.tenant_id);

    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete/Reverse transaction
router.delete("/transactions/:id", (req: any, res) => {
  try {
    // Check if manual transaction
    const check = db
      .prepare(
        "SELECT source_type, type, amount, account_id, date, category, description FROM cashflow_transactions WHERE id = ? AND tenant_id = ?"
      )
      .get(req.params.id, req.user.tenant_id) as any;

    if (!check) {
      return res.status(404).json({ message: "Transação não encontrada" });
    }

    // If manual, can delete
    if (check.source_type === "manual") {
      db.prepare(
        "DELETE FROM cashflow_transactions WHERE id = ? AND tenant_id = ?"
      ).run(req.params.id, req.user.tenant_id);

      return res.json({ message: "Lançamento excluído com sucesso" });
    }

    // If not manual, create reverse transaction (estorno)
    const reverseType = check.type === "in" ? "out" : "in";
    const reverseId = uuidv4();

    db.prepare(
      `INSERT INTO cashflow_transactions 
       (id, tenant_id, date, type, amount, category, description, 
        account_id, status, source_type, created_by) 
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 'confirmed', 'reversal', ?)`
    ).run(
      reverseId,
      req.user.tenant_id,
      reverseType,
      check.amount,
      check.category,
      `ESTORNO: ${check.description}`,
      check.account_id,
      req.user.id
    );

    res.json({
      message: "Estorno criado com sucesso",
      reversal_id: reverseId,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// CASH CLOSE (Fechamento de Caixa)
// ========================================

// Close cash
router.post("/close", (req: any, res) => {
  try {
    const { account_id, date, counted_balance, notes } = req.body;

    // Check if already closed
    const existing = db
      .prepare(
        "SELECT id FROM cash_closes WHERE tenant_id = ? AND account_id = ? AND date = ?"
      )
      .get(req.user.tenant_id, account_id, date);

    if (existing) {
      return res.status(400).json({
        message: "Caixa já fechado para esta data",
      });
    }

    // Get account
    const account = db
      .prepare("SELECT initial_balance FROM cash_accounts WHERE id = ? AND tenant_id = ?")
      .get(account_id, req.user.tenant_id) as any;

    if (!account) {
      return res.status(404).json({ message: "Conta não encontrada" });
    }

    // Calculate opening balance (last close or initial)
    const lastClose = db
      .prepare(
        `SELECT expected_balance FROM cash_closes 
         WHERE tenant_id = ? AND account_id = ? AND date < ?
         ORDER BY date DESC LIMIT 1`
      )
      .get(req.user.tenant_id, account_id, date) as any;

    const opening_balance = lastClose?.expected_balance || account.initial_balance || 0;

    // Calculate expected balance (opening + in - out for the day)
    const dayMovement = db
      .prepare(
        `SELECT 
           COALESCE(SUM(CASE WHEN type = 'in' AND status = 'confirmed' THEN amount ELSE 0 END), 0) as total_in,
           COALESCE(SUM(CASE WHEN type = 'out' AND status = 'confirmed' THEN amount ELSE 0 END), 0) as total_out
         FROM cashflow_transactions 
         WHERE tenant_id = ? AND account_id = ? AND DATE(date) = ?`
      )
      .get(req.user.tenant_id, account_id, date) as any;

    const expected_balance =
      opening_balance + (dayMovement?.total_in || 0) - (dayMovement?.total_out || 0);

    const difference = (counted_balance || expected_balance) - expected_balance;

    const id = uuidv4();
    db.prepare(
      `INSERT INTO cash_closes 
       (id, tenant_id, account_id, date, opening_balance, expected_balance, 
        counted_balance, difference, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      req.user.tenant_id,
      account_id,
      date,
      opening_balance,
      expected_balance,
      counted_balance || expected_balance,
      difference,
      notes,
      req.user.id
    );

    const close = db
      .prepare(
        `SELECT c.*, a.name as account_name, u.name as created_by_name
         FROM cash_closes c
         LEFT JOIN cash_accounts a ON c.account_id = a.id
         LEFT JOIN users u ON c.created_by = u.id
         WHERE c.id = ?`
      )
      .get(id);

    res.status(201).json(close);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get cash closes
router.get("/closes", (req: any, res) => {
  try {
    const { start_date, end_date, account_id } = req.query;

    let query = `
      SELECT c.*, a.name as account_name, u.name as created_by_name
      FROM cash_closes c
      LEFT JOIN cash_accounts a ON c.account_id = a.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.tenant_id = ?
    `;

    const params: any[] = [req.user.tenant_id];

    if (start_date) {
      query += " AND c.date >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND c.date <= ?";
      params.push(end_date);
    }

    if (account_id && account_id !== "all") {
      query += " AND c.account_id = ?";
      params.push(account_id);
    }

    query += " ORDER BY c.date DESC, c.created_at DESC";

    const closes = db.prepare(query).all(...params);

    res.json(closes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get close detail
router.get("/closes/:id", (req: any, res) => {
  try {
    const close = db
      .prepare(
        `SELECT c.*, a.name as account_name, u.name as created_by_name
         FROM cash_closes c
         LEFT JOIN cash_accounts a ON c.account_id = a.id
         LEFT JOIN users u ON c.created_by = u.id
         WHERE c.id = ? AND c.tenant_id = ?`
      )
      .get(req.params.id, req.user.tenant_id);

    if (!close) {
      return res.status(404).json({ message: "Fechamento não encontrado" });
    }

    res.json(close);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// REPORTS & SUMMARY
// ========================================

// Get summary
router.get("/summary", (req: any, res) => {
  try {
    const { start_date, end_date, account_id } = req.query;

    let query = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'in' AND status = 'confirmed' THEN amount ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN type = 'out' AND status = 'confirmed' THEN amount ELSE 0 END), 0) as total_out,
        COALESCE(SUM(CASE WHEN type = 'in' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_in,
        COALESCE(SUM(CASE WHEN type = 'out' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_out
      FROM cashflow_transactions 
      WHERE tenant_id = ?
    `;

    const params: any[] = [req.user.tenant_id];

    if (start_date) {
      query += " AND DATE(date) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(date) <= ?";
      params.push(end_date);
    }

    if (account_id && account_id !== "all") {
      query += " AND account_id = ?";
      params.push(account_id);
    }

    const summary = db.prepare(query).get(...params) as any;

    // Get total balance (all accounts)
    const balances = db
      .prepare(
        `SELECT 
           a.id,
           a.name,
           a.type,
           a.initial_balance,
           COALESCE(SUM(CASE WHEN t.type = 'in' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_in,
           COALESCE(SUM(CASE WHEN t.type = 'out' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_out
         FROM cash_accounts a
         LEFT JOIN cashflow_transactions t ON a.id = t.account_id AND t.tenant_id = a.tenant_id
         WHERE a.tenant_id = ? AND a.active = 1
         GROUP BY a.id`
      )
      .all(req.user.tenant_id) as any[];

    const accountBalances = balances.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      balance: (acc.initial_balance || 0) + acc.total_in - acc.total_out,
    }));

    const total_balance = accountBalances.reduce(
      (sum: number, acc: any) => sum + acc.balance,
      0
    );

    res.json({
      total_in: summary.total_in,
      total_out: summary.total_out,
      result: summary.total_in - summary.total_out,
      pending_in: summary.pending_in,
      pending_out: summary.pending_out,
      forecast: summary.total_in + summary.pending_in - (summary.total_out + summary.pending_out),
      total_balance,
      account_balances: accountBalances,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get categories
router.get("/categories", (req: any, res) => {
  const categories = {
    in: [
      "Serviços",
      "Peças",
      "Taxas/Outros",
      "Sinal/Entrada Cliente",
      "Devolução",
    ],
    out: [
      "Compras de Peças",
      "Pagamento Fornecedor",
      "Aluguel",
      "Energia/Água/Internet",
      "Salários",
      "Impostos",
      "Ferramentas/Equipamentos",
      "Marketing",
      "Outras Despesas",
    ],
  };

  res.json(categories);
});

export default router;
