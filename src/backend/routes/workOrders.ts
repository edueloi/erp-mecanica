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
  const wo = db.prepare(`
    SELECT wo.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.document as client_document, c.address as client_address,
           v.plate, v.brand, v.model, v.year, v.color, v.km, v.vin, v.fuel_type,
           u.name as responsible_name
    FROM work_orders wo
    JOIN clients c ON wo.client_id = c.id
    JOIN vehicles v ON wo.vehicle_id = v.id
    LEFT JOIN users u ON wo.responsible_id = u.id
    WHERE wo.id = ? AND wo.tenant_id = ?
  `).get(req.params.id, req.user!.tenant_id) as any;

  if (!wo) return res.status(404).json({ error: "Work Order not found" });

  const items = db.prepare(`
    SELECT woi.*, u.name as mechanic_name 
    FROM work_order_items woi 
    LEFT JOIN users u ON woi.mechanic_id = u.id 
    WHERE woi.work_order_id = ?
  `).all(req.params.id);
  
  wo.items = items;
  wo.checklist = JSON.parse(wo.checklist || "{}");
  wo.symptoms = JSON.parse(wo.symptoms || "[]");
  wo.evaluation = JSON.parse(wo.evaluation || "{}");
  wo.approval_data = JSON.parse(wo.approval_data || "{}");
  wo.payment_data = JSON.parse(wo.payment_data || "{}");
  wo.delivery_data = JSON.parse(wo.delivery_data || "{}");
  wo.photos = JSON.parse(wo.photos || "[]");

  res.json(wo);
});

router.patch("/:id", (req: AuthRequest, res) => {
  const { 
    status, priority, responsible_id, complaint, symptoms, diagnosis, 
    checklist, evaluation, approval_data, payment_data, delivery_data,
    items, discount, taxes, delivery_forecast, approval_required,
    internal_notes, photos
  } = req.body;
  
  try {
    const transaction = db.transaction(() => {
      const fields: string[] = ["updated_at = CURRENT_TIMESTAMP"];
      const params: any[] = [];

      const addField = (name: string, value: any, isJson = false) => {
        if (value !== undefined) {
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
          INSERT INTO work_order_items (id, work_order_id, type, description, quantity, unit_price, total_price, cost_price, mechanic_id, warranty_days, sku, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            item.status || 'PENDING'
          );
        }
        
        db.prepare("UPDATE work_orders SET total_amount = ? WHERE id = ?").run(total, req.params.id);
      }
    });

    transaction();
    res.json({ message: "Work Order updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
