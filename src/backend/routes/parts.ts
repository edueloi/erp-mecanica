import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Get all parts with filters
router.get("/", (req: AuthRequest, res) => {
  const { q, category, brand, status } = req.query;
  
  let query = `
    SELECT * FROM parts 
    WHERE tenant_id = ?
  `;
  const params: any[] = [req.user!.tenant_id];

  if (q) {
    query += " AND (name LIKE ? OR code LIKE ? OR supplier_code LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  if (brand) {
    query += " AND brand = ?";
    params.push(brand);
  }

  if (status === 'low') {
    query += " AND stock_quantity <= min_stock AND stock_quantity > 0";
  } else if (status === 'zero') {
    query += " AND stock_quantity = 0";
  }

  query += " ORDER BY name ASC";
  
  try {
    const parts = db.prepare(query).all(...params);
    res.json(parts);
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
        SUM(CASE WHEN stock_quantity <= min_stock AND stock_quantity > 0 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as zero_stock,
        SUM(stock_quantity * cost_price) as total_value
      FROM parts 
      WHERE tenant_id = ?
    `).get(req.user!.tenant_id);
    
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
      FROM parts 
      WHERE tenant_id = ? AND category IS NOT NULL 
      ORDER BY category
    `).all(req.user!.tenant_id);
    
    res.json(categories.map((c: any) => c.category));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get brands
router.get("/brands", (req: AuthRequest, res) => {
  try {
    const brands = db.prepare(`
      SELECT DISTINCT brand 
      FROM parts 
      WHERE tenant_id = ? AND brand IS NOT NULL 
      ORDER BY brand
    `).all(req.user!.tenant_id);
    
    res.json(brands.map((b: any) => b.brand));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single part
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const part = db.prepare(`
      SELECT * FROM parts 
      WHERE id = ? AND tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id);

    if (!part) return res.status(404).json({ error: "Part not found" });

    res.json(part);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock movements for a part
router.get("/:id/movements", (req: AuthRequest, res) => {
  try {
    const movements = db.prepare(`
      SELECT sm.*, u.name as user_name, p.name as part_name
      FROM stock_movements sm
      LEFT JOIN users u ON sm.user_id = u.id
      JOIN parts p ON sm.part_id = p.id
      WHERE sm.part_id = ? AND sm.tenant_id = ?
      ORDER BY sm.created_at DESC
      LIMIT 100
    `).all(req.params.id, req.user!.tenant_id);

    res.json(movements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create part
router.post("/", (req: AuthRequest, res) => {
  const { 
    name, code, supplier_code, category, brand, supplier_id,
    cost_price, sale_price, stock_quantity, min_stock, 
    location, compatibility, notes 
  } = req.body;

  const id = uuidv4();

  try {
    db.prepare(`
      INSERT INTO parts (
        id, tenant_id, name, code, supplier_code, category, brand, supplier_id,
        cost_price, sale_price, stock_quantity, min_stock, location, compatibility, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.tenant_id, name, code, supplier_code, category, brand, supplier_id,
      cost_price || 0, sale_price || 0, stock_quantity || 0, min_stock || 0,
      location, compatibility, notes
    );

    // Register initial stock movement if stock > 0
    if (stock_quantity && stock_quantity > 0) {
      db.prepare(`
        INSERT INTO stock_movements (
          id, tenant_id, part_id, type, quantity, unit_cost, user_id, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), req.user!.tenant_id, id, 'ENTRY', stock_quantity, cost_price || 0,
        req.user!.id, 'Estoque inicial'
      );
    }

    const newPart = db.prepare("SELECT * FROM parts WHERE id = ?").get(id);
    res.status(201).json(newPart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update part
router.patch("/:id", (req: AuthRequest, res) => {
  const { 
    name, code, supplier_code, category, brand, supplier_id,
    cost_price, sale_price, min_stock, location, compatibility, notes 
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
    addField("code", code);
    addField("supplier_code", supplier_code);
    addField("category", category);
    addField("brand", brand);
    addField("supplier_id", supplier_id);
    addField("cost_price", cost_price);
    addField("sale_price", sale_price);
    addField("min_stock", min_stock);
    addField("location", location);
    addField("compatibility", compatibility);
    addField("notes", notes);

    if (fields.length > 1) {
      params.push(req.params.id, req.user!.tenant_id);
      db.prepare(`
        UPDATE parts SET ${fields.join(", ")} 
        WHERE id = ? AND tenant_id = ?
      `).run(...params);
    }

    res.json({ message: "Part updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete part
router.delete("/:id", (req: AuthRequest, res) => {
  try {
    db.prepare("DELETE FROM stock_movements WHERE part_id = ? AND tenant_id = ?")
      .run(req.params.id, req.user!.tenant_id);
    
    db.prepare("DELETE FROM parts WHERE id = ? AND tenant_id = ?")
      .run(req.params.id, req.user!.tenant_id);

    res.json({ message: "Part deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stock entry
router.post("/:id/entry", (req: AuthRequest, res) => {
  const { quantity, unit_cost, invoice_number, reason } = req.body;

  try {
    const part = db.prepare(`
      SELECT * FROM parts WHERE id = ? AND tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!part) return res.status(404).json({ error: "Part not found" });

    // Update stock
    const newStock = part.stock_quantity + quantity;
    db.prepare(`
      UPDATE parts SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newStock, req.params.id);

    // Register movement
    db.prepare(`
      INSERT INTO stock_movements (
        id, tenant_id, part_id, type, quantity, unit_cost, invoice_number, reason, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), req.user!.tenant_id, req.params.id, 'ENTRY', quantity,
      unit_cost || part.cost_price, invoice_number, reason, req.user!.id
    );

    res.json({ message: "Stock entry registered successfully", new_stock: newStock });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stock exit
router.post("/:id/exit", (req: AuthRequest, res) => {
  const { quantity, reason } = req.body;

  try {
    const part = db.prepare(`
      SELECT * FROM parts WHERE id = ? AND tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!part) return res.status(404).json({ error: "Part not found" });

    if (part.stock_quantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    // Update stock
    const newStock = part.stock_quantity - quantity;
    db.prepare(`
      UPDATE parts SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newStock, req.params.id);

    // Register movement
    db.prepare(`
      INSERT INTO stock_movements (
        id, tenant_id, part_id, type, quantity, unit_cost, reason, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), req.user!.tenant_id, req.params.id, 'EXIT', quantity,
      part.cost_price, reason, req.user!.id
    );

    res.json({ message: "Stock exit registered successfully", new_stock: newStock });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
