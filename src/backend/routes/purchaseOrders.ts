import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

const syncPurchaseOrderToFinance = (poId: string, tenantId: string, userId: string) => {
  try {
    const po = db.prepare(`
      SELECT po.*, s.name as supplier_name 
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ? AND po.tenant_id = ?
    `).get(poId, tenantId) as any;

    if (!po) return;

    if (po.status === 'DRAFT' || po.status === 'CANCELLED') {
      return;
    }

    // Check if already exists in accounts_payable
    const existing = db.prepare(`
      SELECT id FROM accounts_payable WHERE purchase_order_id = ? AND tenant_id = ?
    `).get(poId, tenantId) as any;

    if (existing) {
      db.prepare(`
        UPDATE accounts_payable 
        SET original_amount = ?, balance = original_amount - amount_paid, 
            description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(po.total || 0, `Pedido Compra ${po.number} - ${po.supplier_name}`, existing.id);

      // Sync to Cashflow (Pending)
      db.prepare(`
        UPDATE cashflow_transactions 
        SET amount = ?, description = ?, date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE source_type = 'accounts_payable' AND source_id = ? AND status = 'pending'
      `).run(
        po.total || 0,
        `Pedido Compra ${po.number} - ${po.supplier_name}`,
        po.expected_delivery || new Date().toISOString().split('T')[0],
        existing.id
      );
    } else {
      const apId = uuidv4();
      db.prepare(`
        INSERT INTO accounts_payable (
          id, tenant_id, supplier_id, purchase_order_id, description, 
          original_amount, balance, due_date, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        apId, tenantId, po.supplier_id, poId, 
        `Pedido Compra ${po.number} - ${po.supplier_name}`,
        po.total || 0, po.total || 0,
        po.expected_delivery || new Date().toISOString().split('T')[0],
        'OPEN', userId
      );

      // Create Pending Cashflow Transaction
      db.prepare(`
        INSERT INTO cashflow_transactions (
          id, tenant_id, date, type, amount, category, description,
          status, source_type, source_id, created_by
        ) VALUES (?, ?, ?, 'out', ?, 'Compras de Peças', ?, 'pending', 'accounts_payable', ?, ?)
      `).run(
        uuidv4(), tenantId,
        po.expected_delivery || new Date().toISOString().split('T')[0],
        po.total || 0,
        `Pedido Compra ${po.number} - ${po.supplier_name}`,
        apId, userId
      );
    }
  } catch (err) {
    console.error('Error syncing PO to Finance:', err);
  }
};

// Get all purchase orders
router.get("/", (req: AuthRequest, res) => {
  const { status, supplier_id } = req.query;
  
  let query = `
    SELECT po.*, s.name as supplier_name, u.name as created_by_name
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN users u ON po.created_by = u.id
    WHERE po.tenant_id = ?
  `;
  const params: any[] = [req.user!.tenant_id];

  if (status) {
    query += " AND po.status = ?";
    params.push(status);
  }

  if (supplier_id) {
    query += " AND po.supplier_id = ?";
    params.push(supplier_id);
  }

  query += " ORDER BY po.order_date DESC";
  
  try {
    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single purchase order
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const order = db.prepare(`
      SELECT po.*, s.name as supplier_name, s.phone, s.whatsapp, u.name as created_by_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = ? AND po.tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id);

    if (!order) return res.status(404).json({ error: "Purchase order not found" });

    const items = db.prepare(`
      SELECT poi.*, p.name, p.code, p.stock_quantity
      FROM purchase_order_items poi
      JOIN parts p ON poi.part_id = p.id
      WHERE poi.purchase_order_id = ?
    `).all(req.params.id);

    res.json({ ...order, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create purchase order
router.post("/", (req: AuthRequest, res) => {
  const { supplier_id, expected_delivery, freight, discount, notes, items } = req.body;

  const id = uuidv4();
  const count = db.prepare("SELECT COUNT(*) as total FROM purchase_orders WHERE tenant_id = ?")
    .get(req.user!.tenant_id) as any;
  const number = `PC-${new Date().getFullYear()}-${(count.total + 1).toString().padStart(6, '0')}`;

  try {
    const transaction = db.transaction(() => {
      let total = 0;
      
      // Calculate total
      for (const item of items) {
        total += item.quantity * item.unit_cost;
      }
      
      total = total + (freight || 0) - (discount || 0);

      // Insert order
      db.prepare(`
        INSERT INTO purchase_orders (
          id, tenant_id, supplier_id, number, status, freight, discount, total, 
          expected_delivery, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, req.user!.tenant_id, supplier_id, number, 'DRAFT',
        freight || 0, discount || 0, total, expected_delivery, notes, req.user!.id
      );

      // Insert items
      const stmt = db.prepare(`
        INSERT INTO purchase_order_items (id, purchase_order_id, part_id, quantity, unit_cost, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const subtotal = item.quantity * item.unit_cost;
        stmt.run(uuidv4(), id, item.part_id, item.quantity, item.unit_cost, subtotal);
      }
    });

    transaction();
    
    // Sync to Finance
    syncPurchaseOrderToFinance(id, req.user!.tenant_id, req.user!.id);

    const newOrder = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(id);
    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update purchase order status
router.patch("/:id/status", (req: AuthRequest, res) => {
  const { status } = req.body;

  try {
    const db_instance = db as any;
    const transaction = db_instance.transaction(() => {
      // Get order info
      const order = db.prepare(`
        SELECT po.*, s.name as supplier_name 
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ? AND po.tenant_id = ?
      `).get(req.params.id, req.user!.tenant_id) as any;

      if (!order) throw new Error("Order not found");

      // Update status
      db.prepare(`
        UPDATE purchase_orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND tenant_id = ?
      `).run(status, req.params.id, req.user!.tenant_id);

      // If status is CONFIRMED, link parts and create pending cashflow
      if (status === 'CONFIRMED' || status === 'SENT') {
        const items = db.prepare(`
          SELECT * FROM purchase_order_items WHERE purchase_order_id = ?
        `).all(req.params.id) as any[];

        for (const item of items) {
          // Update part supplier_id if not set
          db.prepare(`
            UPDATE parts SET supplier_id = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND supplier_id IS NULL
          `).run(order.supplier_id, item.part_id);

          // Upsert supplier_parts
          const existingLink = db.prepare(`
            SELECT id FROM supplier_parts WHERE supplier_id = ? AND part_id = ?
          `).get(order.supplier_id, item.part_id);

          if (!existingLink) {
            db.prepare(`
              INSERT INTO supplier_parts (id, supplier_id, part_id, last_cost, last_purchase_date)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(uuidv4(), order.supplier_id, item.part_id, item.unit_cost);
          }
        }
      }
    });

    transaction();
    
    // Sync to Finance
    syncPurchaseOrderToFinance(req.params.id, req.user!.tenant_id, req.user!.id);
    
    console.log(`✅ PO ${req.params.id} status updated to ${status} for tenant ${req.user!.tenant_id}`);
    res.json({ message: "Status updated successfully" });
  } catch (error: any) {
    console.error(`❌ Error updating PO status: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Receive purchase order (full or partial)
router.post("/:id/receive", (req: AuthRequest, res) => {
  const { items, invoice_number } = req.body; // items: [{ item_id, received_quantity }]

  try {
    const transaction = db.transaction(() => {
      // Get order
      const order = db.prepare(`
        SELECT po.*, s.name as supplier_name
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ? AND po.tenant_id = ?
      `).get(req.params.id, req.user!.tenant_id) as any;

      if (!order) throw new Error("Order not found");

      let totalReceivedCost = 0;

      // Process each item
      for (const item of items) {
        // Get item details
        const orderItem = db.prepare(`
          SELECT poi.*, p.name as part_name 
          FROM purchase_order_items poi
          JOIN parts p ON poi.part_id = p.id
          WHERE poi.id = ? AND poi.purchase_order_id = ?
        `).get(item.item_id, req.params.id) as any;

        if (!orderItem) {
          console.warn(`⚠️ Item ${item.item_id} not found in PO ${req.params.id}`);
          continue;
        }

        // Update received quantity
        const currentReceived = Number(orderItem.received_quantity) || 0;
        const newReceived = currentReceived + Number(item.received_quantity);
        
        db.prepare(`
          UPDATE purchase_order_items 
          SET received_quantity = ? 
          WHERE id = ?
        `).run(newReceived, item.item_id);

        // Update part stock
        db.prepare(`
          UPDATE parts 
          SET stock_quantity = stock_quantity + ?, 
              cost_price = ?,
              supplier_id = ?,
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND tenant_id = ?
        `).run(
          Number(item.received_quantity) || 0, 
          Number(orderItem.unit_cost) || 0, 
          order.supplier_id, 
          orderItem.part_id,
          req.user!.tenant_id
        );
        
        console.log(`📦 Updated stock for part ${orderItem.part_id}: +${item.received_quantity}`);

        // Create stock movement
        const movementId = uuidv4();
        db.prepare(`
          INSERT INTO stock_movements (
            id, tenant_id, part_id, type, quantity, unit_cost, 
            reference_id, reference_type, invoice_number, reason, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          movementId, req.user!.tenant_id, orderItem.part_id, 'ENTRY',
          Number(item.received_quantity), Number(orderItem.unit_cost), req.params.id,
          'PURCHASE_ORDER', invoice_number || order.number,
          `Recebimento de pedido de compra ${order.number} - Peça: ${orderItem.part_name}`,
          req.user!.id
        );
        console.log(`📝 Created stock movement ${movementId}`);

        // Upsert supplier_parts (link part <-> supplier with price)
        const existingLink = db.prepare(`
          SELECT id FROM supplier_parts 
          WHERE supplier_id = ? AND part_id = ?
        `).get(order.supplier_id, orderItem.part_id);

        if (existingLink) {
          db.prepare(`
            UPDATE supplier_parts 
            SET last_cost = ?, last_purchase_date = CURRENT_TIMESTAMP 
            WHERE supplier_id = ? AND part_id = ?
          `).run(orderItem.unit_cost, order.supplier_id, orderItem.part_id);
        } else {
          db.prepare(`
            INSERT INTO supplier_parts (id, supplier_id, part_id, last_cost, last_purchase_date)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(uuidv4(), order.supplier_id, orderItem.part_id, orderItem.unit_cost);
        }

        totalReceivedCost += item.received_quantity * orderItem.unit_cost;
      }

      // Check if all items received
      const allItems = db.prepare(`
        SELECT * FROM purchase_order_items WHERE purchase_order_id = ?
      `).all(req.params.id) as any[];

      const allReceived = allItems.every((i: any) => (i.received_quantity || 0) >= i.quantity);
      const someReceived = allItems.some((i: any) => (i.received_quantity || 0) > 0);

      const newStatus = allReceived ? 'RECEIVED' : (someReceived ? 'PARTIAL' : order.status);

      db.prepare(`
        UPDATE purchase_orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND tenant_id = ?
      `).run(newStatus, req.params.id, req.user!.tenant_id);
    });

    transaction();
    
    // Sync to Finance - This ensures it's in Accounts Payable, not immediate Cash Flow
    syncPurchaseOrderToFinance(req.params.id, req.user!.tenant_id, req.user!.id);
    
    console.log(`✅ PO ${req.params.id} receiving processed successfully.`);
    res.json({ message: "Recebimento registrado com sucesso" });
  } catch (error: any) {
    console.error(`❌ Error receiving PO: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Delete purchase order
router.delete("/:id", (req: AuthRequest, res) => {
  try {
    const order = db.prepare(`
      SELECT status FROM purchase_orders WHERE id = ? AND tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === 'RECEIVED' || order.status === 'PARTIAL') {
      return res.status(400).json({ error: "Não é possível excluir pedido já recebido" });
    }

    db.prepare("DELETE FROM purchase_order_items WHERE purchase_order_id = ?").run(req.params.id);
    db.prepare("DELETE FROM purchase_orders WHERE id = ?").run(req.params.id);

    res.json({ message: "Order deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
