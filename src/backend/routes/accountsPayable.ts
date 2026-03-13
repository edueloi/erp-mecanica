import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Get all accounts payable with filters
router.get("/", async (req: AuthRequest, res) => {
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
    query += " AND ap.due_date < CURDATE() AND ap.status != 'PAID'";
  }

  if (current_month_only === "true") {
    query += ` AND DATE_FORMAT(ap.due_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`;
  }

  query += " ORDER BY ap.due_date ASC, ap.created_at DESC";

  try {
    let accounts = await db.query(query, params) as any[];

    // Auto-update overdue status
    const today = new Date().toISOString().split("T")[0];
    await Promise.all(
      accounts.map(async (account) => {
        if (
          account.status !== "PAID" &&
          account.balance > 0 &&
          account.due_date < today
        ) {
          await db.execute(
            "UPDATE accounts_payable SET status = 'OVERDUE' WHERE id = ?",
            [account.id]
          );
          account.status = "OVERDUE";
        }
        return account;
      })
    );

    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date().toISOString().slice(0, 8) + "01";

    const totalPayable = await db.queryOne(
      `SELECT COALESCE(SUM(balance), 0) as total
       FROM accounts_payable
       WHERE tenant_id = ? AND status != 'PAID'`,
      [req.user!.tenant_id]
    ) as any;

    const dueToday = await db.queryOne(
      `SELECT COALESCE(SUM(balance), 0) as total
       FROM accounts_payable
       WHERE tenant_id = ? AND due_date = ? AND status != 'PAID'`,
      [req.user!.tenant_id, today]
    ) as any;

    const overdue = await db.queryOne(
      `SELECT COALESCE(SUM(balance), 0) as total
       FROM accounts_payable
       WHERE tenant_id = ? AND due_date < ? AND status != 'PAID'`,
      [req.user!.tenant_id, today]
    ) as any;

    const paidThisMonth = await db.queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payable_payments
       WHERE tenant_id = ? AND payment_date >= ?`,
      [req.user!.tenant_id, firstDayOfMonth]
    ) as any;

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
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const account = await db.queryOne(
      `SELECT
        ap.*,
        s.name as supplier_name,
        s.phone as supplier_phone,
        po.number as purchase_order_number,
        u.name as created_by_name
       FROM accounts_payable ap
       LEFT JOIN suppliers s ON ap.supplier_id = s.id
       LEFT JOIN purchase_orders po ON ap.purchase_order_id = po.id
       LEFT JOIN users u ON ap.created_by = u.id
       WHERE ap.id = ? AND ap.tenant_id = ?`,
      [req.params.id, req.user!.tenant_id]
    );

    if (!account) return res.status(404).json({ error: "Account not found" });

    const payments = await db.query(
      `SELECT pp.*, u.name as created_by_name
       FROM payable_payments pp
       LEFT JOIN users u ON pp.created_by = u.id
       WHERE pp.account_id = ?
       ORDER BY pp.payment_date DESC`,
      [req.params.id]
    );

    res.json({ ...account, payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create manual account
router.post("/", async (req: AuthRequest, res) => {
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
    await db.execute(
      `INSERT INTO accounts_payable (
        id, tenant_id, supplier_id, description, original_amount,
        balance, due_date, payment_method, document_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user!.tenant_id,
        supplier_id,
        description,
        original_amount,
        original_amount,
        due_date,
        payment_method,
        document_number,
        notes,
        req.user!.id,
      ]
    );

    await db.execute(
      `INSERT INTO cashflow_transactions (
        id, tenant_id, date, type, amount, category, description,
        status, source_type, source_id, created_by
      ) VALUES (?, ?, ?, 'out', ?, 'Pagamento Fornecedor', ?, 'pending', 'accounts_payable', ?, ?)`,
      [uuidv4(), req.user!.tenant_id, due_date, original_amount, description, id, req.user!.id]
    );

    res.status(201).json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register payment
router.post("/:id/payment", async (req: AuthRequest, res) => {
  const {
    amount,
    payment_date,
    payment_method,
    document_number,
    notes,
    account_id: cash_account_id,
  } = req.body;

  try {
    const result = await db.transaction(async (conn) => {
      const [accRows] = await conn.execute(
        "SELECT * FROM accounts_payable WHERE id = ? AND tenant_id = ?",
        [req.params.id, req.user!.tenant_id]
      );
      const account = (accRows as any[])[0];

      if (!account) throw new Error("Account not found");
      if (amount > account.balance) throw new Error("Amount exceeds balance");

      const paymentId = uuidv4();
      await conn.execute(
        `INSERT INTO payable_payments (
          id, tenant_id, account_id, amount, payment_date,
          payment_method, document_number, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          req.user!.tenant_id,
          req.params.id,
          amount,
          payment_date,
          payment_method,
          document_number,
          notes,
          req.user!.id,
        ]
      );

      const newBalance = account.balance - amount;
      const newAmountPaid = account.amount_paid + amount;
      let newStatus = account.status;
      if (newBalance === 0) newStatus = "PAID";
      else if (newAmountPaid > 0) newStatus = "PARTIAL";

      await conn.execute(
        `UPDATE accounts_payable
         SET balance = ?, amount_paid = ?, status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          newBalance,
          newAmountPaid,
          newStatus,
          newStatus === "PAID" ? payment_date : account.paid_at,
          req.params.id,
        ]
      );

      if (cash_account_id) {
        await conn.execute(
          `INSERT INTO cashflow_transactions (
            id, tenant_id, date, type, amount, category, description,
            account_id, payment_method, status, source_type, source_id, created_by
          ) VALUES (?, ?, ?, 'out', ?, 'Pagamento Fornecedor', ?, ?, ?, 'confirmed', 'accounts_payable_payment', ?, ?)`,
          [
            uuidv4(),
            req.user!.tenant_id,
            payment_date,
            amount,
            `Pagto: ${account.description}${account.supplier_name ? ` - ${account.supplier_name}` : ''}`,
            cash_account_id,
            payment_method,
            req.params.id,
            req.user!.id,
          ]
        );

        if (newBalance === 0) {
          await conn.execute(
            "DELETE FROM cashflow_transactions WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'",
            [req.params.id]
          );
        } else {
          await conn.execute(
            "UPDATE cashflow_transactions SET amount = ? WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'",
            [newBalance, req.params.id]
          );
        }
      }

      return { paymentId };
    });

    res.json({ message: "Pagamento registrado com sucesso", id: result.paymentId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update account
router.patch("/:id", async (req: AuthRequest, res) => {
  const {
    description,
    original_amount,
    due_date,
    payment_method,
    document_number,
    notes,
  } = req.body;

  try {
    const account = await db.queryOne(
      "SELECT * FROM accounts_payable WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.user!.tenant_id]
    ) as any;

    if (!account) return res.status(404).json({ error: "Account not found" });

    let newBalance = account.balance;
    if (original_amount && original_amount !== account.original_amount) {
      const difference = original_amount - account.original_amount;
      newBalance = account.balance + difference;
    }

    await db.execute(
      `UPDATE accounts_payable
       SET description = COALESCE(?, description),
           original_amount = COALESCE(?, original_amount),
           balance = ?,
           due_date = COALESCE(?, due_date),
           payment_method = COALESCE(?, payment_method),
           document_number = COALESCE(?, document_number),
           notes = COALESCE(?, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        description,
        original_amount,
        newBalance,
        due_date,
        payment_method,
        document_number,
        notes,
        req.params.id,
      ]
    );

    await db.execute(
      `UPDATE cashflow_transactions
       SET amount = ?, description = ?, date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'`,
      [newBalance, description, due_date, req.params.id]
    );

    res.json({ message: "Account updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const account = await db.queryOne(
      "SELECT amount_paid FROM accounts_payable WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.user!.tenant_id]
    ) as any;

    if (!account) return res.status(404).json({ error: "Account not found" });
    if (account.amount_paid > 0)
      return res.status(400).json({ error: "Não é possível excluir conta com pagamentos" });

    await db.execute(
      "DELETE FROM cashflow_transactions WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'",
      [req.params.id]
    );
    await db.execute(
      "DELETE FROM accounts_payable WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
