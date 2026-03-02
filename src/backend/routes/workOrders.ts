import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", (req: AuthRequest, res) => {
  const { status, q } = req.query;
  let query = `
    SELECT wo.*, c.name as client_name, v.plate, v.model, u.name as responsible_name
    FROM work_orders wo
    JOIN clients c ON wo.client_id = c.id
    JOIN vehicles v ON wo.vehicle_id = v.id
    LEFT JOIN users u ON wo.responsible_id = u.id
    WHERE wo.tenant_id = ?
  `;
  const params: any[] = [req.user!.tenant_id];

  if (status) {
    query += " AND wo.status = ?";
    params.push(status);
  }

  if (q) {
    query += " AND (c.name LIKE ? OR v.plate LIKE ? OR wo.number LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  query += " ORDER BY wo.created_at DESC";
  const workOrders = db.prepare(query).all(...params);
  res.json(workOrders);
});

router.get("/stats", (req: AuthRequest, res) => {
  const tenant_id = req.user!.tenant_id;
  const today = new Date().toISOString().split('T')[0];

  try {
    const stats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'DIAGNOSIS' THEN 1 ELSE 0 END) as diagnosis,
        SUM(CASE WHEN status = 'WAITING_APPROVAL' THEN 1 ELSE 0 END) as waiting_approval,
        SUM(CASE WHEN status = 'EXECUTING' THEN 1 ELSE 0 END) as executing,
        SUM(CASE WHEN status = 'FINISHED' AND date(updated_at) = date(?) THEN 1 ELSE 0 END) as finished_today,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
      FROM work_orders 
      WHERE tenant_id = ?
    `).get(today, tenant_id);
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", (req: AuthRequest, res) => {
  const { client_id, vehicle_id, complaint, symptoms, priority, responsible_id, delivery_forecast } = req.body;
  const id = uuidv4();
  
  // Generate a simple sequential number for the tenant
  const count = db.prepare("SELECT COUNT(*) as total FROM work_orders WHERE tenant_id = ?").get(req.user!.tenant_id) as any;
  const number = `OFC-${new Date().getFullYear()}-${(count.total + 1).toString().padStart(6, '0')}`;

  try {
    db.prepare(`
      INSERT INTO work_orders (id, tenant_id, client_id, vehicle_id, number, status, complaint, symptoms, priority, responsible_id, delivery_forecast)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      req.user!.tenant_id, 
      client_id, 
      vehicle_id, 
      number, 
      'OPEN', 
      complaint, 
      JSON.stringify(symptoms || []), 
      priority || 'MEDIUM', 
      responsible_id, 
      delivery_forecast
    );

    const newWO = db.prepare("SELECT * FROM work_orders WHERE id = ?").get(id);
    res.status(201).json(newWO);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", (req: AuthRequest, res) => {
  try {
    console.log(`[GET /:id] Fetching work order: ${req.params.id}`);
    
    const wo = db.prepare(`
      SELECT wo.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.document as client_document,
             v.plate, v.brand, v.model, v.year, v.color, v.km, v.vin, v.fuel_type,
             u.name as responsible_name
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      LEFT JOIN users u ON wo.responsible_id = u.id
      WHERE wo.id = ? AND wo.tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!wo) {
      console.log(`[GET /:id] Work order not found: ${req.params.id}`);
      return res.status(404).json({ error: "Work Order not found" });
    }

    console.log(`[GET /:id] Work order found, fetching items...`);
    const items = db.prepare(`
      SELECT woi.*, u.name as mechanic_name 
      FROM work_order_items woi 
      LEFT JOIN users u ON woi.mechanic_id = u.id 
      WHERE woi.work_order_id = ?
    `).all(req.params.id);
    
    console.log(`[GET /:id] Found ${items.length} items`);
    wo.items = items;
    
    console.log(`[GET /:id] Parsing JSON fields...`);
    // Safely parse JSON fields with null check
    try { wo.checklist = wo.checklist ? JSON.parse(wo.checklist) : {}; } catch (e) { console.error('[GET /:id] Error parsing checklist:', e); wo.checklist = {}; }
    try { wo.symptoms = wo.symptoms ? JSON.parse(wo.symptoms) : []; } catch (e) { console.error('[GET /:id] Error parsing symptoms:', e); wo.symptoms = []; }
    try { wo.evaluation = wo.evaluation ? JSON.parse(wo.evaluation) : {}; } catch (e) { console.error('[GET /:id] Error parsing evaluation:', e); wo.evaluation = {}; }
    try { wo.approval_data = wo.approval_data ? JSON.parse(wo.approval_data) : {}; } catch (e) { console.error('[GET /:id] Error parsing approval_data:', e); wo.approval_data = {}; }
    try { wo.payment_data = wo.payment_data ? JSON.parse(wo.payment_data) : {}; } catch (e) { console.error('[GET /:id] Error parsing payment_data:', e); wo.payment_data = {}; }
    try { wo.delivery_data = wo.delivery_data ? JSON.parse(wo.delivery_data) : {}; } catch (e) { console.error('[GET /:id] Error parsing delivery_data:', e); wo.delivery_data = {}; }
    try { wo.photos = wo.photos ? JSON.parse(wo.photos) : []; } catch (e) { console.error('[GET /:id] Error parsing photos:', e); wo.photos = []; }
    
    // History column might not exist yet, so check if it exists
    if (wo.history !== undefined && wo.history !== null) {
      try { wo.history = JSON.parse(wo.history); } catch (e) { console.error('[GET /:id] Error parsing history:', e); wo.history = []; }
    } else {
      wo.history = [];
    }

    console.log(`[GET /:id] Successfully processed work order ${req.params.id}`);
    res.json(wo);
  } catch (error: any) {
    console.error(`[GET /:id] Error fetching work order ${req.params.id}:`, error);
    console.error(`[GET /:id] Stack trace:`, error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

router.patch("/:id", (req: AuthRequest, res) => {
  const { 
    status, priority, responsible_id, complaint, symptoms, diagnosis, 
    checklist, evaluation, approval_data, payment_data, delivery_data,
    items, discount, taxes, delivery_forecast, approval_required,
    internal_notes, photos, history
  } = req.body;
  
  try {
    // Check if history column exists
    const tableInfo = db.prepare(`SELECT COUNT(*) as count FROM pragma_table_info('work_orders') WHERE name='history'`).get() as any;
    const hasHistoryColumn = tableInfo.count > 0;

    const transaction = db.transaction(() => {
      const fields: string[] = ["updated_at = CURRENT_TIMESTAMP"];
      const params: any[] = [];

      const addField = (name: string, value: any, isJson = false) => {
        if (value !== undefined) {
          // Skip history if column doesn't exist
          if (name === 'history' && !hasHistoryColumn) return;
          fields.push(`${name} = ?`);
          params.push(isJson ? JSON.stringify(value) : value);
        }
      };

      addField("status", status);
      addField("priority", priority);
      addField("responsible_id", responsible_id);
      addField("complaint", complaint);
      addField("symptoms", symptoms, true);
      addField("diagnosis", diagnosis);
      addField("checklist", checklist, true);
      addField("evaluation", evaluation, true);
      addField("approval_data", approval_data, true);
      addField("payment_data", payment_data, true);
      addField("delivery_data", delivery_data, true);
      addField("photos", photos, true);
      addField("history", history, true);
      addField("internal_notes", internal_notes);
      addField("discount", discount);
      addField("taxes", taxes);
      addField("delivery_forecast", delivery_forecast);
      addField("approval_required", approval_required ? 1 : 0);

      if (fields.length > 1) {
        const query = `UPDATE work_orders SET ${fields.join(", ")} WHERE id = ? AND tenant_id = ?`;
        params.push(req.params.id, req.user!.tenant_id);
        db.prepare(query).run(...params);
      }

      if (items) {
        db.prepare("DELETE FROM work_order_items WHERE work_order_id = ?").run(req.params.id);
        
        const stmt = db.prepare(`
          INSERT INTO work_order_items (id, work_order_id, type, description, quantity, unit_price, total_price, cost_price, mechanic_id, warranty_days, sku, status, part_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        let total = 0;
        for (const item of items) {
          const itemTotal = item.quantity * item.unit_price;
          total += itemTotal;
          stmt.run(
            uuidv4(), 
            req.params.id, 
            item.type, 
            item.description, 
            item.quantity, 
            item.unit_price, 
            itemTotal,
            item.cost_price || 0,
            item.mechanic_id,
            item.warranty_days || 0,
            item.sku,
            item.status || 'PENDING',
            item.part_id || null
          );
        }
        
        db.prepare("UPDATE work_orders SET total_amount = ? WHERE id = ?").run(total, req.params.id);
      }
    });

    transaction();
    res.json({ message: "Work Order updated successfully" });
  } catch (error: any) {
    console.error("Error updating work order:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Add item to Work Order
router.post("/:id/items", (req: AuthRequest, res) => {
  const { type, description, quantity, unit_price, cost_price, mechanic_id, warranty_days, sku, part_id } = req.body;
  const itemId = uuidv4();

  try {
    const transaction = db.transaction(() => {
      // Insert item
      const itemTotal = quantity * unit_price;
      db.prepare(`
        INSERT INTO work_order_items (
          id, work_order_id, type, description, quantity, unit_price, 
          total_price, cost_price, mechanic_id, warranty_days, sku, status, part_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemId,
        req.params.id,
        type,
        description,
        quantity,
        unit_price,
        itemTotal,
        cost_price || 0,
        mechanic_id,
        warranty_days || 0,
        sku,
        'PENDING',
        part_id
      );

      // Update total
      const total = db.prepare(`
        SELECT SUM(total_price) as total FROM work_order_items WHERE work_order_id = ?
      `).get(req.params.id) as any;
      db.prepare("UPDATE work_orders SET total_amount = ? WHERE id = ?").run(total.total || 0, req.params.id);

      // If it's a part, deduct from stock and register movement
      if (type === 'PART' && part_id) {
        const part = db.prepare("SELECT * FROM parts WHERE id = ? AND tenant_id = ?")
          .get(part_id, req.user!.tenant_id) as any;
        
        if (part) {
          if (part.stock_quantity < quantity) {
            throw new Error(`Estoque insuficiente para ${part.name}. Disponível: ${part.stock_quantity}`);
          }

          // Deduct stock
          const newStock = part.stock_quantity - quantity;
          db.prepare("UPDATE parts SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(newStock, part_id);

          // Register stock movement
          db.prepare(`
            INSERT INTO stock_movements (
              id, tenant_id, part_id, type, quantity, unit_cost, 
              reference_id, reference_type, reason, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            req.user!.tenant_id,
            part_id,
            'OS_USED',
            quantity,
            cost_price || part.cost_price,
            req.params.id,
            'WORK_ORDER',
            `Usado na OS`,
            req.user!.id
          );
        }
      }
    });

    transaction();
    
    const newItem = db.prepare("SELECT * FROM work_order_items WHERE id = ?").get(itemId);
    res.status(201).json(newItem);
  } catch (error: any) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete item from Work Order
router.delete("/:id/items/:itemId", (req: AuthRequest, res) => {
  try {
    const transaction = db.transaction(() => {
      // Get item details before deleting
      const item = db.prepare(`
        SELECT * FROM work_order_items WHERE id = ? AND work_order_id = ?
      `).get(req.params.itemId, req.params.id) as any;

      if (!item) {
        throw new Error("Item not found");
      }

      // If it's a part, return to stock
      if (item.type === 'PART' && item.part_id) {
        const part = db.prepare("SELECT * FROM parts WHERE id = ? AND tenant_id = ?")
          .get(item.part_id, req.user!.tenant_id) as any;
        
        if (part) {
          // Return stock
          const newStock = part.stock_quantity + item.quantity;
          db.prepare("UPDATE parts SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(newStock, item.part_id);

          // Register stock movement (return)
          db.prepare(`
            INSERT INTO stock_movements (
              id, tenant_id, part_id, type, quantity, unit_cost, 
              reference_id, reference_type, reason, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            req.user!.tenant_id,
            item.part_id,
            'ENTRY',
            item.quantity,
            item.cost_price,
            req.params.id,
            'WORK_ORDER',
            'Devolvido - item removido da OS',
            req.user!.id
          );
        }
      }

      // Delete item
      db.prepare("DELETE FROM work_order_items WHERE id = ?").run(req.params.itemId);

      // Update total
      const total = db.prepare(`
        SELECT SUM(total_price) as total FROM work_order_items WHERE work_order_id = ?
      `).get(req.params.id) as any;
      db.prepare("UPDATE work_orders SET total_amount = ? WHERE id = ?").run(total.total || 0, req.params.id);
    });

    transaction();
    res.json({ message: "Item deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
