import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Get all suppliers with filters
router.get("/", (req: AuthRequest, res) => {
  const { q, category, status, city, state, has_open_orders, is_preferred } = req.query;
  
  let query = `
    SELECT s.*, 
      (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id AND po.status IN ('DRAFT', 'SENT', 'CONFIRMED')) as open_orders,
      (SELECT MAX(order_date) FROM purchase_orders po WHERE po.supplier_id = s.id) as last_order_date
    FROM suppliers s 
    WHERE s.tenant_id = ?
  `;
  const params: any[] = [req.user!.tenant_id];

  if (q) {
    query += " AND (s.name LIKE ? OR s.trade_name LIKE ? OR s.cnpj LIKE ? OR s.contact_name LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (category) {
    query += " AND s.category = ?";
    params.push(category);
  }

  if (status) {
    query += " AND s.status = ?";
    params.push(status);
  }

  if (city) {
    query += " AND s.city = ?";
    params.push(city);
  }

  if (state) {
    query += " AND s.state = ?";
    params.push(state);
  }

  if (is_preferred === 'true') {
    query += " AND s.is_preferred = 1";
  }

  query += " ORDER BY s.is_preferred DESC, s.name ASC";
  
  try {
    let suppliers = db.prepare(query).all(...params);
    
    // Filter by open orders if requested
    if (has_open_orders === 'true') {
      suppliers = (suppliers as any[]).filter((s: any) => s.open_orders > 0);
    }
    
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
router.get("/stats", (req: AuthRequest, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_preferred = 1 THEN 1 ELSE 0 END) as preferred,
        (SELECT COUNT(*) FROM purchase_orders WHERE tenant_id = ? AND status IN ('DRAFT', 'SENT', 'CONFIRMED')) as open_orders
      FROM suppliers 
      WHERE tenant_id = ?
    `).get(req.user!.tenant_id, req.user!.tenant_id);
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories
router.get("/categories", (req: AuthRequest, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category 
      FROM suppliers 
      WHERE tenant_id = ? AND category IS NOT NULL 
      ORDER BY category
    `).all(req.user!.tenant_id);
    
    res.json(categories.map((c: any) => c.category));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get cities
router.get("/cities", (req: AuthRequest, res) => {
  try {
    const cities = db.prepare(`
      SELECT DISTINCT city 
      FROM suppliers 
      WHERE tenant_id = ? AND city IS NOT NULL 
      ORDER BY city
    `).all(req.user!.tenant_id);
    
    res.json(cities.map((c: any) => c.city));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single supplier
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const supplier = db.prepare(`
      SELECT * FROM suppliers 
      WHERE id = ? AND tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id);

    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    res.json(supplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get supplier parts
router.get("/:id/parts", (req: AuthRequest, res) => {
  try {
    const parts = db.prepare(`
      SELECT sp.*, p.name, p.code, p.stock_quantity, p.min_stock
      FROM supplier_parts sp
      JOIN parts p ON sp.part_id = p.id
      WHERE sp.supplier_id = ?
      ORDER BY sp.is_preferred DESC, p.name ASC
    `).all(req.params.id);

    res.json(parts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get supplier purchase orders
router.get("/:id/orders", (req: AuthRequest, res) => {
  try {
    const orders = db.prepare(`
      SELECT po.*, u.name as created_by_name
      FROM purchase_orders po
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.supplier_id = ? AND po.tenant_id = ?
      ORDER BY po.order_date DESC
    `).all(req.params.id, req.user!.tenant_id);

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create supplier
router.post("/", (req: AuthRequest, res) => {
  const { 
    name, trade_name, cnpj, ie, category, status, phone, whatsapp, email, website,
    contact_name, sales_rep, sales_rep_phone, zip_code, street, number, complement,
    neighborhood, city, state, payment_terms, payment_methods, notes, is_preferred 
  } = req.body;

  const id = uuidv4();

  try {
    db.prepare(`
      INSERT INTO suppliers (
        id, tenant_id, name, trade_name, cnpj, ie, category, status, phone, whatsapp, 
        email, website, contact_name, sales_rep, sales_rep_phone, zip_code, street, 
        number, complement, neighborhood, city, state, payment_terms, payment_methods, 
        notes, is_preferred
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.tenant_id, name, trade_name, cnpj, ie, category, status || 'ACTIVE',
      phone, whatsapp, email, website, contact_name, sales_rep, sales_rep_phone,
      zip_code, street, number, complement, neighborhood, city, state,
      payment_terms, payment_methods, notes, is_preferred ? 1 : 0
    );

    const newSupplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
    res.status(201).json(newSupplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update supplier
router.patch("/:id", (req: AuthRequest, res) => {
  const { 
    name, trade_name, cnpj, ie, category, status, phone, whatsapp, email, website,
    contact_name, sales_rep, sales_rep_phone, zip_code, street, number, complement,
    neighborhood, city, state, payment_terms, payment_methods, notes, is_preferred 
  } = req.body;

  try {
    const fields: string[] = ["updated_at = CURRENT_TIMESTAMP"];
    const params: any[] = [];

    const addField = (field: string, value: any) => {
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        params.push(value);
      }
    };

    addField("name", name);
    addField("trade_name", trade_name);
    addField("cnpj", cnpj);
    addField("ie", ie);
    addField("category", category);
    addField("status", status);
    addField("phone", phone);
    addField("whatsapp", whatsapp);
    addField("email", email);
    addField("website", website);
    addField("contact_name", contact_name);
    addField("sales_rep", sales_rep);
    addField("sales_rep_phone", sales_rep_phone);
    addField("zip_code", zip_code);
    addField("street", street);
    addField("number", number);
    addField("complement", complement);
    addField("neighborhood", neighborhood);
    addField("city", city);
    addField("state", state);
    addField("payment_terms", payment_terms);
    addField("payment_methods", payment_methods);
    addField("notes", notes);
    if (is_preferred !== undefined) addField("is_preferred", is_preferred ? 1 : 0);

    if (fields.length > 1) {
      params.push(req.params.id, req.user!.tenant_id);
      db.prepare(`
        UPDATE suppliers SET ${fields.join(", ")} 
        WHERE id = ? AND tenant_id = ?
      `).run(...params);
    }

    res.json({ message: "Supplier updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete supplier
router.delete("/:id", (req: AuthRequest, res) => {
  try {
    // Check if has orders
    const hasOrders = db.prepare(`
      SELECT COUNT(*) as count FROM purchase_orders 
      WHERE supplier_id = ?
    `).get(req.params.id) as any;

    if (hasOrders.count > 0) {
      return res.status(400).json({ error: "Não é possível excluir fornecedor com pedidos vinculados" });
    }

    db.prepare("DELETE FROM supplier_parts WHERE supplier_id = ?").run(req.params.id);
    db.prepare("DELETE FROM suppliers WHERE id = ? AND tenant_id = ?")
      .run(req.params.id, req.user!.tenant_id);

    res.json({ message: "Supplier deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Link part to supplier
router.post("/:id/parts", (req: AuthRequest, res) => {
  const { part_id, supplier_code, last_cost, is_preferred } = req.body;
  const id = uuidv4();

  try {
    db.prepare(`
      INSERT INTO supplier_parts (id, supplier_id, part_id, supplier_code, last_cost, is_preferred)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, part_id, supplier_code, last_cost || 0, is_preferred ? 1 : 0);

    res.status(201).json({ message: "Part linked successfully" });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: "Peça já vinculada a este fornecedor" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Generate purchase order for low stock
router.post("/generate-order-low-stock", (req: AuthRequest, res) => {
  try {
    // Get parts with low stock
    const lowStockParts = db.prepare(`
      SELECT p.*, sp.supplier_id, sp.last_cost, s.name as supplier_name
      FROM parts p
      JOIN supplier_parts sp ON p.id = sp.part_id
      JOIN suppliers s ON sp.supplier_id = s.id
      WHERE p.tenant_id = ? 
        AND p.stock_quantity <= p.min_stock
        AND s.status = 'ACTIVE'
        AND sp.is_preferred = 1
      ORDER BY s.is_preferred DESC, s.name ASC
    `).all(req.user!.tenant_id);

    // Group by supplier
    const grouped = (lowStockParts as any[]).reduce((acc: any, part: any) => {
      if (!acc[part.supplier_id]) {
        acc[part.supplier_id] = {
          supplier_id: part.supplier_id,
          supplier_name: part.supplier_name,
          parts: []
        };
      }
      acc[part.supplier_id].parts.push({
        part_id: part.id,
        name: part.name,
        code: part.code,
        stock_quantity: part.stock_quantity,
        min_stock: part.min_stock,
        suggested_quantity: part.min_stock - part.stock_quantity + 5,
        last_cost: part.last_cost
      });
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
