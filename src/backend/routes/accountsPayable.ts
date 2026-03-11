import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Get all accounts payable with filters
router.get("/", (req: AuthRequest, res) => {
  const {
    q,
    status,
    payment_method,
    date_from,
    date_to,
    supplier_id,
    purchase_order_id,
    overdue_only,
    current_month_only,
  } = req.query;

  let query = `
    SELECT 
      ap.*,
      s.name as supplier_name,
      s.phone as supplier_phone,
      po.number as purchase_order_number,
      u.name as created_by_name
    FROM accounts_payable ap
    LEFT JOIN suppliers s ON ap.supplier_id = s.id
    LEFT JOIN purchase_orders po ON ap.purchase_order_id = po.id
    LEFT JOIN users u ON ap.created_by = u.id
    WHERE ap.tenant_id = ?
  `;
  const params: any[] = [req.user!.tenant_id];

  if (q) {
    query += ` AND (s.name LIKE ? OR po.number LIKE ? OR ap.document_number LIKE ? OR ap.description LIKE ?)`;
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (status) {
    query += " AND ap.status = ?";
    params.push(status);
  }

  if (payment_method) {
    query += " AND ap.payment_method = ?";
    params.push(payment_method);
  }

  if (date_from) {
    query += " AND ap.due_date >= ?";
    params.push(date_from);
  }

  if (date_to) {
    query += " AND ap.due_date <= ?";
    params.push(date_to);
  }

  if (supplier_id) {
    query += " AND ap.supplier_id = ?";
    params.push(supplier_id);
  }

  if (purchase_order_id) {
    query += " AND ap.purchase_order_id = ?";
    params.push(purchase_order_id);
  }

  if (overdue_only === "true") {
    query += " AND ap.due_date < DATE('now') AND ap.status != 'PAID'";
  }

  if (current_month_only === "true") {
    query += ` AND strftime('%Y-%m', ap.due_date) = strftime('%Y-%m', 'now')`;
  }

  query += " ORDER BY ap.due_date ASC, ap.created_at DESC";

  try {
    let accounts = db.prepare(query).all(...params) as any[];

    // Auto-update overdue status
    const today = new Date().toISOString().split("T")[0];
    accounts = accounts.map((account) => {
      if (
        account.status !== "PAID" &&
        account.balance > 0 &&
        account.due_date < today
      ) {
        db.prepare(
          "UPDATE accounts_payable SET status = 'OVERDUE' WHERE id = ?"
        ).run(account.id);
        account.status = "OVERDUE";
      }
      return account;
    });

    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
router.get("/stats", (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date().toISOString().slice(0, 8) + "01";

    const totalPayable = db.prepare(`
      SELECT COALESCE(SUM(balance), 0) as total
      FROM accounts_payable
      WHERE tenant_id = ? AND status != 'PAID'
    `).get(req.user!.tenant_id) as any;

    const dueToday = db.prepare(`
      SELECT COALESCE(SUM(balance), 0) as total
      FROM accounts_payable
      WHERE tenant_id = ? AND due_date = ? AND status != 'PAID'
    `).get(req.user!.tenant_id, today) as any;

    const overdue = db.prepare(`
      SELECT COALESCE(SUM(balance), 0) as total
      FROM accounts_payable
      WHERE tenant_id = ? AND due_date < ? AND status != 'PAID'
    `).get(req.user!.tenant_id, today) as any;

    const paidThisMonth = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payable_payments
      WHERE tenant_id = ? AND payment_date >= ?
    `).get(req.user!.tenant_id, firstDayOfMonth) as any;

    res.json({
      total_payable: totalPayable.total,
      due_today: dueToday.total,
      overdue: overdue.total,
      paid_this_month: paidThisMonth.total,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single account
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const account = db.prepare(`
      SELECT 
        ap.*,
        s.name as supplier_name,
        s.phone as supplier_phone,
        po.number as purchase_order_number,
        u.name as created_by_name
      FROM accounts_payable ap
      LEFT JOIN suppliers s ON ap.supplier_id = s.id
      LEFT JOIN purchase_orders po ON ap.purchase_order_id = po.id
      LEFT JOIN users u ON ap.created_by = u.id
      WHERE ap.id = ? AND ap.tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id);

    if (!account) return res.status(404).json({ error: "Account not found" });

    const payments = db.prepare(`
      SELECT pp.*, u.name as created_by_name
      FROM payable_payments pp
      LEFT JOIN users u ON pp.created_by = u.id
      WHERE pp.account_id = ?
      ORDER BY pp.payment_date DESC
    `).all(req.params.id);

    res.json({ ...account, payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create manual account
router.post("/", (req: AuthRequest, res) => {
  const {
    supplier_id,
    description,
    original_amount,
    due_date,
    payment_method,
    document_number,
    notes,
  } = req.body;

  const id = uuidv4();

  try {
    db.prepare(`
      INSERT INTO accounts_payable (
        id, tenant_id, supplier_id, description, original_amount, 
        balance, due_date, payment_method, document_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.tenant_id, supplier_id, description, original_amount,
      original_amount, due_date, payment_method, document_number, notes, req.user!.id
    );

    db.prepare(`
      INSERT INTO cashflow_transactions (
        id, tenant_id, date, type, amount, category, description,
        status, source_type, source_id, created_by
      ) VALUES (?, ?, ?, 'out', ?, 'Pagamento Fornecedor', ?, 'pending', 'accounts_payable', ?, ?)
    `).run(
      uuidv4(), req.user!.tenant_id, due_date, original_amount,
      description, id, req.user!.id
    );

    res.status(201).json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register payment
router.post("/:id/payment", (req: AuthRequest, res) => {
  const { amount, payment_date, payment_method, document_number, notes, account_id: cash_account_id } = req.body;

  try {
    const transaction = db.transaction(() => {
      const account = db.prepare("SELECT * FROM accounts_payable WHERE id = ? AND tenant_id = ?").get(req.params.id, req.user!.tenant_id) as any;
      if (!account) throw new Error("Account not found");
      if (amount > account.balance) throw new Error("Amount exceeds balance");

      const paymentId = uuidv4();
      db.prepare(`
        INSERT INTO payable_payments (
          id, tenant_id, account_id, amount, payment_date, 
          payment_method, document_number, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId, req.user!.tenant_id, req.params.id, amount, payment_date,
        payment_method, document_number, notes, req.user!.id
      );

      const newBalance = account.balance - amount;
      const newAmountPaid = account.amount_paid + amount;
      let newStatus = account.status;
      if (newBalance === 0) newStatus = "PAID";
      else if (newAmountPaid > 0) newStatus = "PARTIAL";

      db.prepare(`
        UPDATE accounts_payable 
        SET balance = ?, amount_paid = ?, status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newBalance, newAmountPaid, newStatus, newStatus === "PAID" ? payment_date : account.paid_at, req.params.id);

      // Register in cashflow
      if (cash_account_id) {
          // 1. Create confirmed payment entry
          db.prepare(`
            INSERT INTO cashflow_transactions (
                id, tenant_id, date, type, amount, category, description,
                account_id, payment_method, status, source_type, source_id, created_by
            ) VALUES (?, ?, ?, 'out', ?, 'Pagamento Fornecedor', ?, ?, ?, 'confirmed', 'accounts_payable_payment', ?, ?)
          `).run(
              uuidv4(), req.user!.tenant_id, payment_date, amount,
              `Pagto: ${account.description}${account.supplier_name ? ` - ${account.supplier_name}` : ''}`,
              cash_account_id, payment_method, req.params.id, req.user!.id
          );

          // 2. Update/Delete pending entry
          if (newBalance === 0) {
            db.prepare("DELETE FROM cashflow_transactions WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'").run(req.params.id);
          } else {
            db.prepare("UPDATE cashflow_transactions SET amount = ? WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'").run(newBalance, req.params.id);
          }
      }

      return { paymentId };
    });

    const result = transaction();
    res.json({ message: "Pagamento registrado com sucesso", id: result.paymentId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update account
router.patch("/:id", (req: AuthRequest, res) => {
  const {
    description,
    original_amount,
    due_date,
    payment_method,
    document_number,
    notes,
  } = req.body;

  try {
    const account = db
      .prepare("SELECT * FROM accounts_payable WHERE id = ? AND tenant_id = ?")
      .get(req.params.id, req.user!.tenant_id) as any;

    if (!account) return res.status(404).json({ error: "Account not found" });

    // Recalculate balance if original_amount changed
    let newBalance = account.balance;
    if (original_amount && original_amount !== account.original_amount) {
      const difference = original_amount - account.original_amount;
      newBalance = account.balance + difference;
    }

    db.prepare(`
      UPDATE accounts_payable 
      SET description = COALESCE(?, description),
          original_amount = COALESCE(?, original_amount),
          balance = ?,
          due_date = COALESCE(?, due_date),
          payment_method = COALESCE(?, payment_method),
          document_number = COALESCE(?, document_number),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      description, original_amount, newBalance, due_date, 
      payment_method, document_number, notes, req.params.id
    );

    // Sync to Cashflow (Pending)
    db.prepare(`
      UPDATE cashflow_transactions 
      SET amount = ?, description = ?, date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'
    `).run(newBalance, description, due_date, req.params.id);

    res.json({ message: "Account updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete("/:id", (req: AuthRequest, res) => {
  try {
    const account = db.prepare("SELECT amount_paid FROM accounts_payable WHERE id = ? AND tenant_id = ?").get(req.params.id, req.user!.tenant_id) as any;
    if (!account) return res.status(404).json({ error: "Account not found" });
    if (account.amount_paid > 0) return res.status(400).json({ error: "Não é possível excluir conta com pagamentos" });

    db.prepare("DELETE FROM cashflow_transactions WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'").run(req.params.id);
    db.prepare("DELETE FROM accounts_payable WHERE id = ?").run(req.params.id);
    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
