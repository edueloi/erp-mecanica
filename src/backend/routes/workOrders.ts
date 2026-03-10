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
        SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft,
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
  const { 
    client_id, vehicle_id, complaint, symptoms, priority, 
    responsible_id, delivery_forecast, start_date, defect, status 
  } = req.body;
  const id = uuidv4();
  
  // Generate OS number: YYMMDD-XXXX
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const todayPrefix = `${yy}${mm}${dd}`;

  try {
    console.log('--- START OS CREATION ---');
    console.log('Generating number with prefix:', todayPrefix);
    
    // Auto-fix for legacy SQLite triggers (deep clean if users_old or _old exists)
    try {
      const legacyTriggers = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND (sql LIKE '%_old%' OR sql LIKE '%users_old%')").all() as any[];
      for (const lt of legacyTriggers) {
        db.exec(`DROP TRIGGER IF EXISTS "${lt.name}"`);
        console.log(`🧹 Found and removed legacy trigger: ${lt.name}`);
      }
    } catch (e) {}

    // Check if work_orders table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='work_orders'").get();
    if (!tableCheck) {
      throw new Error("Tabela 'work_orders' não encontrada no banco de dados.");
    }

    const countToday = db.prepare("SELECT COUNT(*) as total FROM work_orders WHERE tenant_id = ? AND number LIKE ?")
      .get(req.user!.tenant_id, `${todayPrefix}-%`) as any;
    const number = `${todayPrefix}-${(countToday.total + 1).toString().padStart(4, '0')}`;
    console.log('Generated OS Number:', number);

    const transaction = db.transaction(() => {
      console.log('In transaction...');
      const woColumns = db.prepare(`PRAGMA table_info('work_orders')`).all() as any[];
      const validWoCols = woColumns.map(c => c.name);
      console.log('Valid Columns in work_orders:', validWoCols.join(', '));

      const fields: string[] = [];
      const values: any[] = [];

      const addField = (name: string, value: any, isJson = false) => {
        if (value !== undefined && value !== null && validWoCols.includes(name)) {
          fields.push(name);
          values.push((isJson && value !== null) ? JSON.stringify(value) : value);
        }
      };

      // Add base fields only if they exist in schema
      addField('id', id);
      addField('tenant_id', req.user!.tenant_id);
      addField('client_id', client_id);
      addField('vehicle_id', vehicle_id);
      addField('number', number);
      addField('status', status || 'DRAFT');

      // Add optional fields
      addField('complaint', complaint);
      addField('priority', priority || 'MEDIUM');
      addField('responsible_id', responsible_id === "" ? null : responsible_id);
      addField('delivery_forecast', delivery_forecast);
      addField('start_date', start_date || new Date().toISOString());
      addField('finish_date', req.body.finish_date);
      addField('guarantee', req.body.guarantee);
      addField('technical_report', req.body.technical_report);
      addField('defect', defect);
      addField('internal_notes', req.body.internal_notes);
      addField('diagnosis', req.body.diagnosis);
      addField('symptoms', symptoms, true);
      addField('history', req.body.history || [], true);
      addField('photos', req.body.photos || [], true);
      addField('taxes', req.body.taxes || 0);
      addField('discount', req.body.discount || 0);
      addField('total_amount', req.body.total_amount || 0);

      if (fields.length === 0) throw new Error("Nenhum campo válido para inserção na OS.");

      const placeholders = values.map(() => '?').join(', ');
      const query = `INSERT INTO work_orders (${fields.join(', ')}) VALUES (${placeholders})`;
      console.log('Running Query:', query);
      db.prepare(query).run(...values);
      console.log('OS inserted successfully');

      if (req.body.items && req.body.items.length > 0) {
        console.log('Saving items...');
        const itemColumns = db.prepare(`PRAGMA table_info('work_order_items')`).all() as any[];
        const validItemCols = itemColumns.map(c => c.name);
        console.log('Valid Columns in work_order_items:', validItemCols.join(', '));

        let total = 0;
        for (const item of req.body.items) {
          const itemTotal = (item.quantity || 1) * (item.unit_price || 0);
          total += itemTotal;
          
          const iFields: string[] = [];
          const iValues: any[] = [];
          
          const addItemField = (name: string, value: any) => {
            if (value !== undefined && validItemCols.includes(name)) {
              iFields.push(name);
              iValues.push(value);
            }
          };

          addItemField('id', uuidv4());
          addItemField('work_order_id', id);
          addItemField('type', item.type);
          addItemField('description', item.description);
          addItemField('quantity', item.quantity || 1);
          addItemField('unit_price', item.unit_price || 0);
          addItemField('total_price', itemTotal);
          addItemField('long_description', item.long_description || null);
          addItemField('cost_price', item.cost_price || 0);
          addItemField('mechanic_id', item.mechanic_id || null);
          addItemField('warranty_days', item.warranty_days || 0);
          addItemField('sku', item.sku || null);
          addItemField('status', item.status || 'PENDING');
          addItemField('part_id', item.part_id || null);

          const iPlaceholders = iValues.map(() => '?').join(', ');
          const iQuery = `INSERT INTO work_order_items (${iFields.join(', ')}) VALUES (${iPlaceholders})`;
          db.prepare(iQuery).run(...iValues);
        }
        
        if (!req.body.total_amount && total > 0 && validWoCols.includes('total_amount')) {
          db.prepare("UPDATE work_orders SET total_amount = ? WHERE id = ?").run(total, id);
        }
      }
    });

    transaction();
    console.log('Transaction committed successfully');

    // Log in vehicle history
    try {
        const vehicle = db.prepare("SELECT km FROM vehicles WHERE id = ?").get(vehicle_id) as any;
        db.prepare(`
          INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id, km, new_value)
          VALUES (?, ?, ?, 'MAINTENANCE', ?, ?, ?, ?)
        `).run(uuidv4(), vehicle_id, req.user!.tenant_id, `Nova Ordem de Serviço: ${number}`, req.user!.id, req.body.km || vehicle?.km || 0, id);
    } catch (e) {
        console.error("Error logging OS creation to history:", e);
    }

    const newWO = db.prepare("SELECT * FROM work_orders WHERE id = ?").get(id);
    res.status(201).json(newWO);
  } catch (error: any) {
    console.error("❌ CRITICAL ERROR SAVING WORK ORDER:", error);
    res.status(500).json({ 
      error: error.message, 
      details: "Erro na criação da Ordem de Serviço na transação",
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined 
    });
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
    internal_notes, photos, history,
    start_date, finish_date, guarantee, technical_report, defect
  } = req.body;
  
  try {
    const woColumns = db.prepare(`PRAGMA table_info('work_orders')`).all() as any[];
    const validWoCols = woColumns.map(c => c.name);

    const transaction = db.transaction(() => {
      const fields: string[] = ["updated_at = CURRENT_TIMESTAMP"];
      const params: any[] = [];

      const addField = (name: string, value: any, isJson = false) => {
        if (value !== undefined && validWoCols.includes(name)) {
          fields.push(`${name} = ?`);
          params.push((isJson && value !== null) ? JSON.stringify(value) : value);
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
      addField("start_date", start_date);
      addField("finish_date", finish_date);
      addField("guarantee", guarantee);
      addField("technical_report", technical_report);
      addField("defect", defect);

      if (fields.length > 1) {
        const query = `UPDATE work_orders SET ${fields.join(", ")} WHERE id = ? AND tenant_id = ?`;
        params.push(req.params.id, req.user!.tenant_id);
        db.prepare(query).run(...params);
      }

      if (items) {
        // Get old items to return parts to stock
        const oldItems = db.prepare("SELECT * FROM work_order_items WHERE work_order_id = ?").all(req.params.id);
        
        for (const oldItem of oldItems as any[]) {
          if (oldItem.type === 'PART' && oldItem.part_id) {
            const part = db.prepare("SELECT * FROM parts WHERE id = ? AND tenant_id = ?").get(oldItem.part_id, req.user!.tenant_id) as any;
            if (part) {
              const newStock = part.stock_quantity + oldItem.quantity;
              db.prepare("UPDATE parts SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newStock, oldItem.part_id);
              
              db.prepare(`
                INSERT INTO stock_movements (id, tenant_id, part_id, type, quantity, unit_cost, reference_id, reference_type, reason, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(uuidv4(), req.user!.tenant_id, oldItem.part_id, 'ENTRY', oldItem.quantity, oldItem.cost_price, req.params.id, 'WORK_ORDER', 'Devolvido (atualização OS)', req.user!.id);
            }
          }
        }
        
        // Delete and Insert new items
        db.prepare("DELETE FROM work_order_items WHERE work_order_id = ?").run(req.params.id);
        
        const itemColumns = db.prepare(`PRAGMA table_info('work_order_items')`).all() as any[];
        const validItemCols = itemColumns.map(c => c.name);

        const baseItemFields = ['id', 'work_order_id', 'type', 'description', 'quantity', 'unit_price', 'total_price'];
        const optionalItemCols = ['long_description', 'cost_price', 'mechanic_id', 'warranty_days', 'sku', 'status', 'part_id'];
        const actualOptionalItemCols = optionalItemCols.filter(col => validItemCols.includes(col));
        
        const placeholders = Array(baseItemFields.length + actualOptionalItemCols.length).fill('?').join(', ');
        const itemQuery = `INSERT INTO work_order_items (${[...baseItemFields, ...actualOptionalItemCols].join(', ')}) VALUES (${placeholders})`;
        const itemStmt = db.prepare(itemQuery);
        
        let total = 0;
        for (const item of items) {
          if (item.type === 'PART' && item.part_id) {
            const part = db.prepare("SELECT * FROM parts WHERE id = ? AND tenant_id = ?").get(item.part_id, req.user!.tenant_id) as any;
            if (part) {
              if (part.stock_quantity < item.quantity) {
                 throw new Error(`Estoque insuficiente para ${part.name}`);
              }
              const newStock = part.stock_quantity - item.quantity;
              db.prepare("UPDATE parts SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newStock, item.part_id);
              db.prepare(`
                INSERT INTO stock_movements (id, tenant_id, part_id, type, quantity, unit_cost, reference_id, reference_type, reason, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(uuidv4(), req.user!.tenant_id, item.part_id, 'OS_USED', item.quantity, item.cost_price || part.cost_price, req.params.id, 'WORK_ORDER', 'Usado na OS (atualização)', req.user!.id);
            }
          }
          
          const itemTotal = item.quantity * item.unit_price;
          total += itemTotal;
          
          const itemValues = [uuidv4(), req.params.id, item.type, item.description, item.quantity, item.unit_price, itemTotal];
          if (validItemCols.includes('long_description')) itemValues.push(item.long_description || null);
          if (validItemCols.includes('cost_price')) itemValues.push(item.cost_price || 0);
          if (validItemCols.includes('mechanic_id')) itemValues.push(item.mechanic_id || null);
          if (validItemCols.includes('warranty_days')) itemValues.push(item.warranty_days || 0);
          if (validItemCols.includes('sku')) itemValues.push(item.sku || null);
          if (validItemCols.includes('status')) itemValues.push(item.status || 'PENDING');
          if (validItemCols.includes('part_id')) itemValues.push(item.part_id || null);
          
          itemStmt.run(...itemValues);
        }
        
        if (validWoCols.includes('total_amount')) {
          db.prepare("UPDATE work_orders SET total_amount = ? WHERE id = ?").run(total, req.params.id);
        }
      }
    });

    transaction();
    
    // Log in history if status changed to FINISHED
    if (status === 'FINISHED') {
        try {
            const wo = db.prepare("SELECT * FROM work_orders WHERE id = ?").get(req.params.id) as any;
            db.prepare(`
              INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id, km, value, new_value)
              VALUES (?, ?, ?, 'MAINTENANCE', ?, ?, ?, ?, ?)
            `).run(uuidv4(), wo.vehicle_id, req.user!.tenant_id, `Manutenção Finalizada: ${wo.number}`, req.user!.id, wo.km || 0, wo.total_amount || 0, req.params.id);
        } catch (e) {
            console.error("Error logging OS finish to history:", e);
        }
    }

    res.json({ message: "Work Order updated successfully" });
  } catch (error: any) {
    console.error("❌ ERROR UPDATING WORK ORDER:", error);
    res.status(500).json({ error: error.message });
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
