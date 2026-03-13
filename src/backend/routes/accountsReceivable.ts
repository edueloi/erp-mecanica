import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Get all accounts receivable with filters
router.get("/", async (req: AuthRequest, res) => {
  const {
    q,
    status,
    payment_method,
    date_from,
    date_to,
    client_id,
    work_order_id,
    overdue_only,
    current_month_only,
  } = req.query;

  let query = `
    SELECT
      ar.*,
      c.name as client_name,
      c.phone as client_phone,
      wo.number as work_order_number,
      u.name as created_by_name
    FROM accounts_receivable ar
    JOIN clients c ON ar.client_id = c.id
    LEFT JOIN work_orders wo ON ar.work_order_id = wo.id
    LEFT JOIN users u ON ar.created_by = u.id
    WHERE ar.tenant_id = ?
  `;
  const params: any[] = [req.user!.tenant_id];

  if (q) {
    query += ` AND (c.name LIKE ? OR wo.number LIKE ? OR ar.document_number LIKE ?)`;
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (status) {
    query += " AND ar.status = ?";
    params.push(status);
  }

  if (payment_method) {
    query += " AND ar.payment_method = ?";
    params.push(payment_method);
  }

  if (date_from) {
    query += " AND ar.due_date >= ?";
    params.push(date_from);
  }

  if (date_to) {
    query += " AND ar.due_date <= ?";
    params.push(date_to);
  }

  if (client_id) {
    query += " AND ar.client_id = ?";
    params.push(client_id);
  }

  if (work_order_id) {
    query += " AND ar.work_order_id = ?";
    params.push(work_order_id);
  }

  if (overdue_only === "true") {
    query += " AND ar.due_date < CURDATE() AND ar.status != 'PAID'";
  }

  if (current_month_only === "true") {
    query += ` AND DATE_FORMAT(ar.due_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`;
  }

  query += " ORDER BY ar.due_date ASC, ar.created_at DESC";

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
            "UPDATE accounts_receivable SET status = 'OVERDUE' WHERE id = ?",
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

// Get stats for dashboard cards
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date().toISOString().slice(0, 8) + "01";

    const totalReceivable = await db.queryOne(
      `SELECT COALESCE(SUM(balance), 0) as total
       FROM accounts_receivable
       WHERE tenant_id = ? AND status != 'PAID'`,
      [req.user!.tenant_id]
    ) as any;

    const duingToday = await db.queryOne(
      `SELECT COALESCE(SUM(balance), 0) as total
       FROM accounts_receivable
       WHERE tenant_id = ? AND due_date = ? AND status != 'PAID'`,
      [req.user!.tenant_id, today]
    ) as any;

    const overdue = await db.queryOne(
      `SELECT COALESCE(SUM(balance), 0) as total
       FROM accounts_receivable
       WHERE tenant_id = ? AND due_date < ? AND status != 'PAID'`,
      [req.user!.tenant_id, today]
    ) as any;

    const receivedThisMonth = await db.queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM receivable_payments
       WHERE tenant_id = ? AND payment_date >= ?`,
      [req.user!.tenant_id, firstDayOfMonth]
    ) as any;

    res.json({
      total_receivable: totalReceivable.total,
      due_today: duingToday.total,
      overdue: overdue.total,
      received_this_month: receivedThisMonth.total,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single account with payment history
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const account = await db.queryOne(
      `SELECT
        ar.*,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        wo.number as work_order_number,
        u.name as created_by_name
       FROM accounts_receivable ar
       JOIN clients c ON ar.client_id = c.id
       LEFT JOIN work_orders wo ON ar.work_order_id = wo.id
       LEFT JOIN users u ON ar.created_by = u.id
       WHERE ar.id = ? AND ar.tenant_id = ?`,
      [req.params.id, req.user!.tenant_id]
    );

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const payments = await db.query(
      `SELECT rp.*, u.name as created_by_name
       FROM receivable_payments rp
       LEFT JOIN users u ON rp.created_by = u.id
       WHERE rp.account_id = ?
       ORDER BY rp.payment_date DESC`,
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
    client_id,
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
      `INSERT INTO accounts_receivable (
        id, tenant_id, client_id, description, original_amount,
        balance, due_date, payment_method, document_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user!.tenant_id,
        client_id,
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
      ) VALUES (?, ?, ?, 'in', ?, 'Serviços', ?, 'pending', 'accounts_receivable', ?, ?)`,
      [uuidv4(), req.user!.tenant_id, due_date, original_amount, description, id, req.user!.id]
    );

    const newAccount = await db.queryOne(
      "SELECT * FROM accounts_receivable WHERE id = ?",
      [id]
    );
    res.status(201).json(newAccount);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create accounts from work order (with installments)
router.post("/from-work-order", async (req: AuthRequest, res) => {
  const {
    work_order_id,
    client_id,
    total_amount,
    payment_method,
    installments = 1,
    first_due_date,
    description,
  } = req.body;

  try {
    const accounts = await db.transaction(async (conn) => {
      const installmentAmount = total_amount / installments;
      const created: any[] = [];

      for (let i = 1; i <= installments; i++) {
        const id = uuidv4();

        const dueDate = new Date(first_due_date);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        const dueDateStr = dueDate.toISOString().split("T")[0];

        const desc =
          installments > 1
            ? `${description} - Parcela ${i}/${installments}`
            : description;

        await conn.execute(
          `INSERT INTO accounts_receivable (
            id, tenant_id, client_id, work_order_id, installment_number,
            total_installments, description, original_amount, balance,
            due_date, payment_method, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            req.user!.tenant_id,
            client_id,
            work_order_id,
            i,
            installments,
            desc,
            installmentAmount,
            installmentAmount,
            dueDateStr,
            payment_method,
            req.user!.id,
          ]
        );

        await conn.execute(
          `INSERT INTO cashflow_transactions (
            id, tenant_id, date, type, amount, category, description,
            status, source_type, source_id, created_by
          ) VALUES (?, ?, ?, 'in', ?, 'Serviços', ?, 'pending', 'accounts_receivable', ?, ?)`,
          [uuidv4(), req.user!.tenant_id, dueDateStr, installmentAmount, desc, id, req.user!.id]
        );

        const [rows] = await conn.execute(
          "SELECT * FROM accounts_receivable WHERE id = ?",
          [id]
        );
        created.push((rows as any[])[0]);
      }

      return created;
    });

    res.status(201).json(accounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register payment
router.post("/:id/payment", async (req: AuthRequest, res) => {
  const { amount, payment_date, payment_method, document_number, notes } =
    req.body;

  try {
    const result = await db.transaction(async (conn) => {
      const [accRows] = await conn.execute(
        "SELECT * FROM accounts_receivable WHERE id = ? AND tenant_id = ?",
        [req.params.id, req.user!.tenant_id]
      );
      const account = (accRows as any[])[0];

      if (!account) throw new Error("Account not found");
      if (account.status === "PAID") throw new Error("Account already paid");
      if (amount > account.balance) throw new Error("Amount exceeds balance");

      const paymentId = uuidv4();
      await conn.execute(
        `INSERT INTO receivable_payments (
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

      if (newBalance === 0) {
        newStatus = "PAID";
      } else if (newAmountPaid > 0 && newBalance > 0) {
        newStatus = "PARTIAL";
      }

      await conn.execute(
        `UPDATE accounts_receivable
         SET balance = ?, amount_paid = ?, status = ?,
             paid_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          newBalance,
          newAmountPaid,
          newStatus,
          newStatus === "PAID" ? new Date().toISOString() : account.paid_at,
          req.params.id,
        ]
      );

      await conn.execute(
        `INSERT INTO cashflow_transactions (
          id, tenant_id, date, type, amount, category, description,
          payment_method, status, source_type, source_id, created_by
        ) VALUES (?, ?, ?, 'in', ?, 'Serviços', ?, ?, 'confirmed', 'accounts_receivable_payment', ?, ?)`,
        [
          uuidv4(),
          req.user!.tenant_id,
          payment_date,
          amount,
          `Receb: ${account.description}`,
          payment_method,
          req.params.id,
          req.user!.id,
        ]
      );

      if (newBalance === 0) {
        await conn.execute(
          "DELETE FROM cashflow_transactions WHERE source_type = 'accounts_receivable' AND source_id = ? AND status = 'pending'",
          [req.params.id]
        );
      } else {
        await conn.execute(
          "UPDATE cashflow_transactions SET amount = ? WHERE source_type = 'accounts_receivable' AND source_id = ? AND status = 'pending'",
          [newBalance, req.params.id]
        );
      }

      return { account, payment: { id: paymentId, amount, payment_date } };
    });

    res.json({
      message: "Pagamento registrado com sucesso",
      payment: result.payment,
    });
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
      "SELECT * FROM accounts_receivable WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.user!.tenant_id]
    ) as any;

    if (!account) return res.status(404).json({ error: "Account not found" });

    let newBalance = account.balance;
    if (original_amount && original_amount !== account.original_amount) {
      const difference = original_amount - account.original_amount;
      newBalance = account.balance + difference;
    }

    await db.execute(
      `UPDATE accounts_receivable
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
       WHERE source_type = 'accounts_receivable' AND source_id = ? AND status = 'pending'`,
      [newBalance, description, due_date, req.params.id]
    );

    res.json({ message: "Account updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const account = await db.queryOne(
      "SELECT * FROM accounts_receivable WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.user!.tenant_id]
    ) as any;

    if (!account) return res.status(404).json({ error: "Account not found" });

    if (account.amount_paid > 0) {
      return res.status(400).json({
        error: "Não é possível excluir conta com pagamentos registrados",
      });
    }

    await db.execute(
      "DELETE FROM cashflow_transactions WHERE source_type = 'accounts_receivable' AND source_id = ? AND status = 'pending'",
      [req.params.id]
    );
    await db.execute(
      "DELETE FROM accounts_receivable WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get overdue clients (for alerts)
router.get("/clients/overdue", async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const overdueClients = await db.query(
      `SELECT
        c.id,
        c.name,
        c.phone,
        COUNT(ar.id) as overdue_count,
        SUM(ar.balance) as overdue_total
       FROM clients c
       JOIN accounts_receivable ar ON c.id = ar.client_id
       WHERE ar.tenant_id = ?
         AND ar.due_date < ?
         AND ar.status != 'PAID'
       GROUP BY c.id, c.name, c.phone
       ORDER BY overdue_total DESC`,
      [req.user!.tenant_id, today]
    );

    res.json(overdueClients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
