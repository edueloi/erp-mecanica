import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Get all accounts receivable with filters
router.get("/", (req: AuthRequest, res) => {
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
    query += " AND ar.due_date < DATE('now') AND ar.status != 'PAID'";
  }

  if (current_month_only === "true") {
    query += ` AND strftime('%Y-%m', ar.due_date) = strftime('%Y-%m', 'now')`;
  }

  query += " ORDER BY ar.due_date ASC, ar.created_at DESC";

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
        // Update status to OVERDUE
        db.prepare(
          "UPDATE accounts_receivable SET status = 'OVERDUE' WHERE id = ?"
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

// Get stats for dashboard cards
router.get("/stats", (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const firstDayOfMonth = new Date().toISOString().slice(0, 8) + "01";

    // Total a receber (não pago)
    const totalReceivable = db
      .prepare(
        `
      SELECT COALESCE(SUM(balance), 0) as total
      FROM accounts_receivable
      WHERE tenant_id = ? AND status != 'PAID'
    `
      )
      .get(req.user!.tenant_id) as any;

    // Vencendo hoje
    const duingToday = db
      .prepare(
        `
      SELECT COALESCE(SUM(balance), 0) as total
      FROM accounts_receivable
      WHERE tenant_id = ? AND due_date = ? AND status != 'PAID'
    `
      )
      .get(req.user!.tenant_id, today) as any;

    // Em atraso
    const overdue = db
      .prepare(
        `
      SELECT COALESCE(SUM(balance), 0) as total
      FROM accounts_receivable
      WHERE tenant_id = ? AND due_date < ? AND status != 'PAID'
    `
      )
      .get(req.user!.tenant_id, today) as any;

    // Recebido no mês
    const receivedThisMonth = db
      .prepare(
        `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM receivable_payments
      WHERE tenant_id = ? AND payment_date >= ?
    `
      )
      .get(req.user!.tenant_id, firstDayOfMonth) as any;

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
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const account = db
      .prepare(
        `
      SELECT 
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
      WHERE ar.id = ? AND ar.tenant_id = ?
    `
      )
      .get(req.params.id, req.user!.tenant_id);

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Get payment history
    const payments = db
      .prepare(
        `
      SELECT rp.*, u.name as created_by_name
      FROM receivable_payments rp
      LEFT JOIN users u ON rp.created_by = u.id
      WHERE rp.account_id = ?
      ORDER BY rp.payment_date DESC
    `
      )
      .all(req.params.id);

    res.json({ ...account, payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create manual account
router.post("/", (req: AuthRequest, res) => {
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
    db.prepare(
      `
      INSERT INTO accounts_receivable (
        id, tenant_id, client_id, description, original_amount, 
        balance, due_date, payment_method, document_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      req.user!.tenant_id,
      client_id,
      description,
      original_amount,
      original_amount, // balance = original_amount initially
      due_date,
      payment_method,
      document_number,
      notes,
      req.user!.id
    );

    db.prepare(`
      INSERT INTO cashflow_transactions (
        id, tenant_id, date, type, amount, category, description,
        status, source_type, source_id, created_by
      ) VALUES (?, ?, ?, 'in', ?, 'Serviços', ?, 'pending', 'accounts_receivable', ?, ?)
    `).run(
      uuidv4(), req.user!.tenant_id, due_date, original_amount,
      description, id, req.user!.id
    );

    const newAccount = db
      .prepare("SELECT * FROM accounts_receivable WHERE id = ?")
      .get(id);
    res.status(201).json(newAccount);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create accounts from work order (with installments)
router.post("/from-work-order", (req: AuthRequest, res) => {
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
    const transaction = db.transaction(() => {
      const installmentAmount = total_amount / installments;
      const accounts = [];

      for (let i = 1; i <= installments; i++) {
        const id = uuidv4();

        // Calculate due date (add months for each installment)
        const dueDate = new Date(first_due_date);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        const dueDateStr = dueDate.toISOString().split("T")[0];

        const desc =
          installments > 1
            ? `${description} - Parcela ${i}/${installments}`
            : description;

        db.prepare(
          `
          INSERT INTO accounts_receivable (
            id, tenant_id, client_id, work_order_id, installment_number, 
            total_installments, description, original_amount, balance, 
            due_date, payment_method, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
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
          req.user!.id
        );

        db.prepare(`
          INSERT INTO cashflow_transactions (
            id, tenant_id, date, type, amount, category, description,
            status, source_type, source_id, created_by
          ) VALUES (?, ?, ?, 'in', ?, 'Serviços', ?, 'pending', 'accounts_receivable', ?, ?)
        `).run(
          uuidv4(), req.user!.tenant_id, dueDateStr, installmentAmount,
          desc, id, req.user!.id
        );

        accounts.push(
          db.prepare("SELECT * FROM accounts_receivable WHERE id = ?").get(id)
        );
      }

      return accounts;
    });

    const accounts = transaction();
    res.status(201).json(accounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register payment
router.post("/:id/payment", (req: AuthRequest, res) => {
  const { amount, payment_date, payment_method, document_number, notes } =
    req.body;

  try {
    const transaction = db.transaction(() => {
      // Get current account
      const account = db
        .prepare(
          `
        SELECT * FROM accounts_receivable 
        WHERE id = ? AND tenant_id = ?
      `
        )
        .get(req.params.id, req.user!.tenant_id) as any;

      if (!account) throw new Error("Account not found");
      if (account.status === "PAID")
        throw new Error("Account already paid");
      if (amount > account.balance)
        throw new Error("Amount exceeds balance");

      // Create payment record
      const paymentId = uuidv4();
      db.prepare(
        `
        INSERT INTO receivable_payments (
          id, tenant_id, account_id, amount, payment_date, 
          payment_method, document_number, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        paymentId,
        req.user!.tenant_id,
        req.params.id,
        amount,
        payment_date,
        payment_method,
        document_number,
        notes,
        req.user!.id
      );

      // Update account
      const newBalance = account.balance - amount;
      const newAmountPaid = account.amount_paid + amount;
      let newStatus = account.status;

      if (newBalance === 0) {
        newStatus = "PAID";
      } else if (newAmountPaid > 0 && newBalance > 0) {
        newStatus = "PARTIAL";
      }

      db.prepare(
        `
        UPDATE accounts_receivable 
        SET balance = ?, amount_paid = ?, status = ?, 
            paid_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(
        newBalance,
        newAmountPaid,
        newStatus,
        newStatus === "PAID" ? new Date().toISOString() : account.paid_at,
        req.params.id
      );

      // Register in cashflow
      // 1. Create a confirmed entry for the actual payment
      db.prepare(`
        INSERT INTO cashflow_transactions (
          id, tenant_id, date, type, amount, category, description,
          payment_method, status, source_type, source_id, created_by
        ) VALUES (?, ?, ?, 'in', ?, 'Serviços', ?, ?, 'confirmed', 'accounts_receivable_payment', ?, ?)
      `).run(
        uuidv4(), req.user!.tenant_id, payment_date, amount,
        `Receb: ${account.description}`,
        payment_method, req.params.id, req.user!.id
      );

      // 2. Update/Delete pending entry
      if (newBalance === 0) {
        db.prepare("DELETE FROM cashflow_transactions WHERE source_type = 'accounts_receivable' AND source_id = ? AND status = 'pending'").run(req.params.id);
      } else {
        db.prepare("UPDATE cashflow_transactions SET amount = ? WHERE source_type = 'accounts_receivable' AND source_id = ? AND status = 'pending'").run(newBalance, req.params.id);
      }

      return { account, payment: { id: paymentId, amount, payment_date } };
    });

    const result = transaction();
    res.json({
      message: "Pagamento registrado com sucesso",
      payment: result.payment,
    });
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
      .prepare(
        `
      SELECT * FROM accounts_receivable 
      WHERE id = ? AND tenant_id = ?
    `
      )
      .get(req.params.id, req.user!.tenant_id) as any;

    if (!account) return res.status(404).json({ error: "Account not found" });

    // Recalculate balance if original_amount changed
    let newBalance = account.balance;
    if (original_amount && original_amount !== account.original_amount) {
      const difference = original_amount - account.original_amount;
      newBalance = account.balance + difference;
    }

    db.prepare(
      `
      UPDATE accounts_receivable 
      SET description = COALESCE(?, description),
          original_amount = COALESCE(?, original_amount),
          balance = ?,
          due_date = COALESCE(?, due_date),
          payment_method = COALESCE(?, payment_method),
          document_number = COALESCE(?, document_number),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(
      description,
      original_amount,
      newBalance,
      due_date,
      payment_method,
      document_number,
      notes,
      req.params.id
    );

    // Sync to Cashflow (Pending)
    db.prepare(`
      UPDATE cashflow_transactions 
      SET amount = ?, description = ?, date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE source_type = 'accounts_receivable' AND source_id = ? AND status = 'pending'
    `).run(newBalance, description, due_date, req.params.id);

    res.json({ message: "Account updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete("/:id", (req: AuthRequest, res) => {
  try {
    const account = db
      .prepare(
        `
      SELECT * FROM accounts_receivable 
      WHERE id = ? AND tenant_id = ?
    `
      )
      .get(req.params.id, req.user!.tenant_id) as any;

    if (!account) return res.status(404).json({ error: "Account not found" });

    if (account.amount_paid > 0) {
      return res.status(400).json({
        error: "Não é possível excluir conta com pagamentos registrados",
      });
    }

    db.prepare("DELETE FROM cashflow_transactions WHERE source_type = 'accounts_receivable' AND source_id = ? AND status = 'pending'").run(req.params.id);
    db.prepare("DELETE FROM accounts_receivable WHERE id = ?").run(
      req.params.id
    );

    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get overdue clients (for alerts)
router.get("/clients/overdue", (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const overdueClients = db
      .prepare(
        `
      SELECT 
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
      ORDER BY overdue_total DESC
    `
      )
      .all(req.user!.tenant_id, today);

    res.json(overdueClients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
