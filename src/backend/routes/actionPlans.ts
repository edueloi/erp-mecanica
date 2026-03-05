import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// ===== BOARDS =====

// Get all boards
router.get("/boards", (req: AuthRequest, res) => {
  const boards = db.prepare(`
    SELECT b.*, u.name as creator_name
    FROM action_boards b
    LEFT JOIN users u ON b.created_by = u.id
    WHERE b.tenant_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user!.tenant_id);
  
  res.json(boards);
});

// Get single board with columns and cards
router.get("/boards/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  
  const board = db.prepare(`
    SELECT b.*, u.name as creator_name
    FROM action_boards b
    LEFT JOIN users u ON b.created_by = u.id
    WHERE b.id = ? AND b.tenant_id = ?
  `).get(id, req.user!.tenant_id);
  
  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }
  
  const columns = db.prepare(`
    SELECT * FROM action_columns
    WHERE board_id = ?
    ORDER BY position ASC
  `).all(id);
  
  const cards = db.prepare(`
    SELECT c.*, u.name as assigned_name
    FROM action_cards c
    LEFT JOIN users u ON c.assigned_to = u.id
    WHERE c.board_id = ?
    ORDER BY c.position ASC
  `).all(id);
  
  const cardsWithLinks = cards.map((card: any) => {
    const links = db.prepare(`
      SELECT * FROM action_card_links
      WHERE card_id = ?
    `).all(card.id);
    
    return {
      ...card,
      tags: JSON.parse(card.tags || "[]"),
      links
    };
  });
  
  const columnsWithCards = columns.map((column: any) => ({
    ...column,
    cards: cardsWithLinks.filter((card: any) => card.column_id === column.id)
  }));
  
  res.json({
    ...board,
    columns: columnsWithCards
  });
});

// Create board
router.post("/boards", (req: AuthRequest, res) => {
  const { name, description, color, icon, filter_type, filter_value } = req.body;
  const id = uuidv4();
  
  try {
    db.prepare(`
      INSERT INTO action_boards (id, tenant_id, name, description, color, icon, filter_type, filter_value, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.tenant_id, name, description, color || '#10b981', icon, filter_type, filter_value, req.user!.id);
    
    // Create default columns
    const defaultColumns = [
      { name: 'A Fazer', color: '#6b7280', position: 0 },
      { name: 'Em Andamento', color: '#3b82f6', position: 1 },
      { name: 'Concluído', color: '#10b981', position: 2 }
    ];
    
    defaultColumns.forEach(col => {
      const colId = uuidv4();
      db.prepare(`
        INSERT INTO action_columns (id, board_id, name, color, position)
        VALUES (?, ?, ?, ?, ?)
      `).run(colId, id, col.name, col.color, col.position);
    });
    
    const board = db.prepare(`
      SELECT b.*, u.name as creator_name
      FROM action_boards b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.id = ?
    `).get(id);
    
    res.status(201).json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update board
router.put("/boards/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, description, color, icon, filter_type, filter_value } = req.body;
  
  try {
    db.prepare(`
      UPDATE action_boards
      SET name = ?, description = ?, color = ?, icon = ?, filter_type = ?, filter_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(name, description, color, icon, filter_type, filter_value, id, req.user!.tenant_id);
    
    const board = db.prepare(`
      SELECT b.*, u.name as creator_name
      FROM action_boards b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.id = ?
    `).get(id);
    
    res.json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete board
router.delete("/boards/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  
  try {
    db.prepare("DELETE FROM action_boards WHERE id = ? AND tenant_id = ?")
      .run(id, req.user!.tenant_id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== COLUMNS =====

// Create column
router.post("/columns", (req: AuthRequest, res) => {
  const { board_id, name, color } = req.body;
  const id = uuidv4();
  
  try {
    // Get max position
    const maxPos = db.prepare(`
      SELECT MAX(position) as max FROM action_columns WHERE board_id = ?
    `).get(board_id) as any;
    
    const position = (maxPos?.max ?? -1) + 1;
    
    db.prepare(`
      INSERT INTO action_columns (id, board_id, name, color, position)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, board_id, name, color || '#6b7280', position);
    
    const column = db.prepare("SELECT * FROM action_columns WHERE id = ?").get(id);
    res.status(201).json(column);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update column
router.put("/columns/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, color, position } = req.body;
  
  try {
    db.prepare(`
      UPDATE action_columns
      SET name = COALESCE(?, name), color = COALESCE(?, color), position = COALESCE(?, position)
      WHERE id = ?
    `).run(name, color, position, id);
    
    const column = db.prepare("SELECT * FROM action_columns WHERE id = ?").get(id);
    res.json(column);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder columns
router.put("/columns/reorder", (req: AuthRequest, res) => {
  const { columns } = req.body; // Array of {id, position}
  
  try {
    const stmt = db.prepare("UPDATE action_columns SET position = ? WHERE id = ?");
    const transaction = db.transaction((cols: any[]) => {
      for (const col of cols) {
        stmt.run(col.position, col.id);
      }
    });
    
    transaction(columns);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete column
router.delete("/columns/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  
  try {
    db.prepare("DELETE FROM action_columns WHERE id = ?").run(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CARDS =====

// Create card
router.post("/cards", (req: AuthRequest, res) => {
  const { column_id, board_id, title, description, priority, due_date, assigned_to, tags, links } = req.body;
  const id = uuidv4();
  
  try {
    // Get max position in column
    const maxPos = db.prepare(`
      SELECT MAX(position) as max FROM action_cards WHERE column_id = ?
    `).get(column_id) as any;
    
    const position = (maxPos?.max ?? -1) + 1;
    
    db.prepare(`
      INSERT INTO action_cards (id, column_id, board_id, title, description, priority, due_date, assigned_to, position, tags, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, column_id, board_id, title, description, priority || 'MEDIUM', due_date, assigned_to, position, JSON.stringify(tags || []), req.user!.id);
    
    // Add links if provided
    if (links && Array.isArray(links)) {
      const linkStmt = db.prepare(`
        INSERT INTO action_card_links (id, card_id, entity_type, entity_id)
        VALUES (?, ?, ?, ?)
      `);
      
      for (const link of links) {
        linkStmt.run(uuidv4(), id, link.entity_type, link.entity_id);
      }
    }
    
    const card = db.prepare(`
      SELECT c.*, u.name as assigned_name
      FROM action_cards c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ?
    `).get(id);
    
    const cardLinks = db.prepare("SELECT * FROM action_card_links WHERE card_id = ?").all(id);
    
    res.status(201).json({
      ...card,
      tags: JSON.parse((card as any).tags || "[]"),
      links: cardLinks
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update card
router.put("/cards/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, description, priority, due_date, assigned_to, tags } = req.body;
  
  try {
    db.prepare(`
      UPDATE action_cards
      SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        assigned_to = COALESCE(?, assigned_to),
        tags = COALESCE(?, tags),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, priority, due_date, assigned_to, tags ? JSON.stringify(tags) : null, id);
    
    const card = db.prepare(`
      SELECT c.*, u.name as assigned_name
      FROM action_cards c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ?
    `).get(id);
    
    const cardLinks = db.prepare("SELECT * FROM action_card_links WHERE card_id = ?").all(id);
    
    res.json({
      ...card,
      tags: JSON.parse((card as any).tags || "[]"),
      links: cardLinks
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Move card (change column and/or position)
router.put("/cards/:id/move", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { column_id, position } = req.body;
  
  try {
    db.prepare(`
      UPDATE action_cards
      SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(column_id, position, id);
    
    const card = db.prepare(`
      SELECT c.*, u.name as assigned_name
      FROM action_cards c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ?
    `).get(id);
    
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder cards
router.put("/cards/reorder", (req: AuthRequest, res) => {
  const { cards } = req.body; // Array of {id, column_id, position}
  
  try {
    const stmt = db.prepare("UPDATE action_cards SET column_id = ?, position = ? WHERE id = ?");
    const transaction = db.transaction((cardsList: any[]) => {
      for (const card of cardsList) {
        stmt.run(card.column_id, card.position, card.id);
      }
    });
    
    transaction(cards);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete card
router.delete("/cards/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  
  try {
    db.prepare("DELETE FROM action_cards WHERE id = ?").run(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CARD LINKS =====

// Add link to card
router.post("/cards/:id/links", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { entity_type, entity_id } = req.body;
  const linkId = uuidv4();
  
  try {
    db.prepare(`
      INSERT INTO action_card_links (id, card_id, entity_type, entity_id)
      VALUES (?, ?, ?, ?)
    `).run(linkId, id, entity_type, entity_id);
    
    const link = db.prepare("SELECT * FROM action_card_links WHERE id = ?").get(linkId);
    res.status(201).json(link);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove link from card
router.delete("/cards/:cardId/links/:linkId", (req: AuthRequest, res) => {
  const { linkId } = req.params;
  
  try {
    db.prepare("DELETE FROM action_card_links WHERE id = ?").run(linkId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get entity details for a link
router.get("/entities/:type/:id", (req: AuthRequest, res) => {
  const { type, id } = req.params;
  
  try {
    let entity = null;
    
    switch (type) {
      case 'CLIENT':
        entity = db.prepare("SELECT id, name, phone, email FROM clients WHERE id = ? AND tenant_id = ?")
          .get(id, req.user!.tenant_id);
        break;
      case 'VEHICLE':
        entity = db.prepare("SELECT id, plate, brand, model, year FROM vehicles WHERE id = ? AND tenant_id = ?")
          .get(id, req.user!.tenant_id);
        break;
      case 'WORK_ORDER':
        entity = db.prepare("SELECT id, number, status FROM work_orders WHERE id = ? AND tenant_id = ?")
          .get(id, req.user!.tenant_id);
        break;
      case 'SERVICE':
        entity = db.prepare("SELECT id, description, unit_price FROM work_order_items WHERE id = ? AND type = 'SERVICE'")
          .get(id);
        break;
      case 'PART':
        entity = db.prepare("SELECT id, name, code, sale_price FROM parts WHERE id = ? AND tenant_id = ?")
          .get(id, req.user!.tenant_id);
        break;
      case 'APPOINTMENT':
        entity = db.prepare("SELECT id, date, time, service_description, status FROM appointments WHERE id = ? AND tenant_id = ?")
          .get(id, req.user!.tenant_id);
        break;
    }
    
    if (!entity) {
      return res.status(404).json({ error: "Entity not found" });
    }
    
    res.json({ ...entity, type });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
