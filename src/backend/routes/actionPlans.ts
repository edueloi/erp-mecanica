import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// ===== CATEGORIES =====

router.get("/categories", async (req: AuthRequest, res) => {
  const categories = await db.query(`SELECT * FROM action_categories ORDER BY type, name`);
  res.json(categories);
});

// ===== STATISTICS =====

router.get("/statistics", async (req: AuthRequest, res) => {
  const tenantId = req.user!.tenant_id;

  const totalBoards = await db.queryOne(`SELECT COUNT(*) as count FROM action_boards WHERE tenant_id = ?`, [tenantId]) as any;
  const totalCards = await db.queryOne(`SELECT COUNT(*) as count FROM action_cards WHERE board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)`, [tenantId]) as any;
  const cardsByStatus = await db.query(`
    SELECT col.name as status, COUNT(c.id) as count
    FROM action_columns col
    LEFT JOIN action_cards c ON c.column_id = col.id
    WHERE col.board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)
    GROUP BY col.id, col.name
    ORDER BY col.name
  `, [tenantId]);
  const cardsByCategory = await db.query(`
    SELECT cat.name as category, cat.color, COUNT(c.id) as count
    FROM action_categories cat
    LEFT JOIN action_boards b ON b.category_id = cat.id AND b.tenant_id = ?
    LEFT JOIN action_cards c ON c.board_id = b.id
    GROUP BY cat.id, cat.name, cat.color
    HAVING COUNT(c.id) > 0
    ORDER BY count DESC
  `, [tenantId]);
  const cardsByPriority = await db.query(`
    SELECT c.priority, COUNT(c.id) as count
    FROM action_cards c
    WHERE c.board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)
    GROUP BY c.priority
  `, [tenantId]);
  const overdueCards = await db.queryOne(`
    SELECT COUNT(*) as count
    FROM action_cards c
    WHERE c.board_id IN (SELECT id FROM action_boards WHERE tenant_id = ?)
      AND c.due_date IS NOT NULL
      AND c.due_date < NOW()
  `, [tenantId]) as any;

  res.json({
    totalBoards: totalBoards.count,
    totalCards: totalCards.count,
    cardsByStatus,
    cardsByCategory,
    cardsByPriority,
    overdueCards: overdueCards.count
  });
});

// ===== BOARDS =====

router.get("/boards", async (req: AuthRequest, res) => {
  const boards = await db.query(`
    SELECT b.*, u.name as creator_name, c.name as category_name, c.color as category_color
    FROM action_boards b
    LEFT JOIN users u ON b.created_by = u.id
    LEFT JOIN action_categories c ON b.category_id = c.id
    WHERE b.tenant_id = ?
    ORDER BY b.created_at DESC
  `, [req.user!.tenant_id]);
  res.json(boards);
});

router.get("/boards/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const board = await db.queryOne(`
    SELECT b.*, u.name as creator_name, c.name as category_name, c.color as category_color
    FROM action_boards b
    LEFT JOIN users u ON b.created_by = u.id
    LEFT JOIN action_categories c ON b.category_id = c.id
    WHERE b.id = ? AND b.tenant_id = ?
  `, [id, req.user!.tenant_id]);

  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  const columns = await db.query(`SELECT * FROM action_columns WHERE board_id = ? ORDER BY position ASC`, [id]);
  const cards = await db.query(`
    SELECT c.*, u.name as assigned_name, cl.name as client_name, wo.number as work_order_number
    FROM action_cards c
    LEFT JOIN users u ON c.assigned_to = u.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN work_orders wo ON c.work_order_id = wo.id
    WHERE c.board_id = ?
    ORDER BY c.position ASC
  `, [id]);

  const cardsWithLinks = await Promise.all(cards.map(async (card: any) => {
    const links = await db.query(`SELECT * FROM action_card_links WHERE card_id = ?`, [card.id]);
    return { ...card, tags: JSON.parse(card.tags || "[]"), links };
  }));

  const columnsWithCards = columns.map((column: any) => ({
    ...column,
    cards: cardsWithLinks.filter((card: any) => card.column_id === column.id)
  }));

  res.json({ ...board, columns: columnsWithCards });
});

router.get("/boards/:id/statistics", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const board = await db.queryOne(`SELECT id FROM action_boards WHERE id = ? AND tenant_id = ?`, [id, req.user!.tenant_id]);
  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  const cardsByColumn = await db.query(`
    SELECT col.id, col.name, col.color, COUNT(c.id) as count
    FROM action_columns col
    LEFT JOIN action_cards c ON c.column_id = col.id
    WHERE col.board_id = ?
    GROUP BY col.id, col.name, col.color
    ORDER BY col.position
  `, [id]);
  const totalCards = await db.queryOne(`SELECT COUNT(*) as count FROM action_cards WHERE board_id = ?`, [id]) as any;
  const overdueCards = await db.queryOne(`
    SELECT COUNT(*) as count
    FROM action_cards
    WHERE board_id = ? AND due_date IS NOT NULL AND due_date < NOW()
  `, [id]) as any;
  const cardsByPriority = await db.query(`
    SELECT priority, COUNT(*) as count FROM action_cards WHERE board_id = ? GROUP BY priority
  `, [id]);

  res.json({ totalCards: totalCards.count, overdueCards: overdueCards.count, cardsByColumn, cardsByPriority });
});

router.post("/boards", async (req: AuthRequest, res) => {
  const { name, description, color, icon, filter_type, filter_value, category_id } = req.body;
  const id = uuidv4();

  try {
    await db.execute(`
      INSERT INTO action_boards (id, tenant_id, name, description, color, icon, filter_type, filter_value, category_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, req.user!.tenant_id, name, description, color || '#10b981', icon, filter_type, filter_value, category_id, req.user!.id]);

    const defaultColumns = [
      { name: 'A Fazer', color: '#6b7280', position: 0 },
      { name: 'Em Andamento', color: '#3b82f6', position: 1 },
      { name: 'Concluído', color: '#10b981', position: 2 }
    ];

    for (const col of defaultColumns) {
      await db.execute(`
        INSERT INTO action_columns (id, board_id, name, color, position) VALUES (?, ?, ?, ?, ?)
      `, [uuidv4(), id, col.name, col.color, col.position]);
    }

    const board = await db.queryOne(`
      SELECT b.*, u.name as creator_name, c.name as category_name, c.color as category_color
      FROM action_boards b
      LEFT JOIN users u ON b.created_by = u.id
      LEFT JOIN action_categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [id]);

    res.status(201).json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/boards/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, description, color, icon, filter_type, filter_value, category_id } = req.body;

  try {
    await db.execute(`
      UPDATE action_boards
      SET name = ?, description = ?, color = ?, icon = ?, filter_type = ?, filter_value = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [name, description, color, icon, filter_type, filter_value, category_id, id, req.user!.tenant_id]);

    const board = await db.queryOne(`
      SELECT b.*, u.name as creator_name, c.name as category_name, c.color as category_color
      FROM action_boards b
      LEFT JOIN users u ON b.created_by = u.id
      LEFT JOIN action_categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [id]);

    res.json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/boards/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM action_boards WHERE id = ? AND tenant_id = ?", [id, req.user!.tenant_id]);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== COLUMNS =====

router.post("/columns", async (req: AuthRequest, res) => {
  const { board_id, name, color } = req.body;
  const id = uuidv4();

  try {
    const maxPos = await db.queryOne(`SELECT MAX(position) as max FROM action_columns WHERE board_id = ?`, [board_id]) as any;
    const position = (maxPos?.max ?? -1) + 1;

    await db.execute(`
      INSERT INTO action_columns (id, board_id, name, color, position) VALUES (?, ?, ?, ?, ?)
    `, [id, board_id, name, color || '#6b7280', position]);

    const column = await db.queryOne("SELECT * FROM action_columns WHERE id = ?", [id]);
    res.status(201).json(column);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/columns/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, color, position } = req.body;

  try {
    await db.execute(`
      UPDATE action_columns
      SET name = COALESCE(?, name), color = COALESCE(?, color), position = COALESCE(?, position)
      WHERE id = ?
    `, [name, color, position, id]);

    const column = await db.queryOne("SELECT * FROM action_columns WHERE id = ?", [id]);
    res.json(column);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/columns/reorder", async (req: AuthRequest, res) => {
  const { columns } = req.body;

  try {
    await db.transaction(async (conn) => {
      for (const col of columns) {
        await conn.execute("UPDATE action_columns SET position = ? WHERE id = ?", [col.position, col.id]);
      }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/columns/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM action_columns WHERE id = ?", [id]);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CARDS =====

router.post("/cards", async (req: AuthRequest, res) => {
  const { column_id, board_id, title, description, priority, due_date, assigned_to, tags, links, client_id, work_order_id } = req.body;
  const id = uuidv4();

  try {
    const maxPos = await db.queryOne(`SELECT MAX(position) as max FROM action_cards WHERE column_id = ?`, [column_id]) as any;
    const position = (maxPos?.max ?? -1) + 1;

    await db.execute(`
      INSERT INTO action_cards (id, column_id, board_id, title, description, priority, due_date, assigned_to, position, tags, client_id, work_order_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, column_id, board_id, title, description, priority || 'MEDIUM', due_date, assigned_to, position, JSON.stringify(tags || []), client_id, work_order_id, req.user!.id]);

    const column = await db.queryOne("SELECT name FROM action_columns WHERE id = ?", [column_id]) as any;
    await db.execute(`
      INSERT INTO action_card_history (id, card_id, board_id, action, to_column_id, to_column_name, changed_by)
      VALUES (?, ?, ?, 'CREATED', ?, ?, ?)
    `, [uuidv4(), id, board_id, column_id, column?.name, req.user!.id]);

    if (links && Array.isArray(links)) {
      for (const link of links) {
        await db.execute(`
          INSERT INTO action_card_links (id, card_id, entity_type, entity_id) VALUES (?, ?, ?, ?)
        `, [uuidv4(), id, link.entity_type, link.entity_id]);
      }
    }

    const card = await db.queryOne(`
      SELECT c.*, u.name as assigned_name, cl.name as client_name, wo.number as work_order_number
      FROM action_cards c
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN work_orders wo ON c.work_order_id = wo.id
      WHERE c.id = ?
    `, [id]) as any;

    const cardLinks = await db.query("SELECT * FROM action_card_links WHERE card_id = ?", [id]);

    res.status(201).json({ ...card, tags: JSON.parse(card.tags || "[]"), links: cardLinks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/cards/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, description, priority, due_date, assigned_to, tags, client_id, work_order_id } = req.body;

  try {
    await db.execute(`
      UPDATE action_cards
      SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        assigned_to = COALESCE(?, assigned_to),
        tags = COALESCE(?, tags),
        client_id = COALESCE(?, client_id),
        work_order_id = COALESCE(?, work_order_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, description, priority, due_date, assigned_to, tags ? JSON.stringify(tags) : null, client_id, work_order_id, id]);

    const card = await db.queryOne(`
      SELECT c.*, u.name as assigned_name, cl.name as client_name, wo.number as work_order_number
      FROM action_cards c
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN work_orders wo ON c.work_order_id = wo.id
      WHERE c.id = ?
    `, [id]) as any;

    const cardLinks = await db.query("SELECT * FROM action_card_links WHERE card_id = ?", [id]);

    res.json({ ...card, tags: JSON.parse(card.tags || "[]"), links: cardLinks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/cards/:id/move", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { column_id, position } = req.body;

  try {
    const currentCard = await db.queryOne("SELECT column_id, board_id FROM action_cards WHERE id = ?", [id]) as any;
    if (!currentCard) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (currentCard.column_id !== column_id) {
      const fromColumn = await db.queryOne("SELECT name FROM action_columns WHERE id = ?", [currentCard.column_id]) as any;
      const toColumn = await db.queryOne("SELECT name FROM action_columns WHERE id = ?", [column_id]) as any;

      await db.execute(`
        INSERT INTO action_card_history (id, card_id, board_id, action, from_column_id, to_column_id, from_column_name, to_column_name, changed_by)
        VALUES (?, ?, ?, 'MOVED', ?, ?, ?, ?, ?)
      `, [uuidv4(), id, currentCard.board_id, currentCard.column_id, column_id, fromColumn?.name, toColumn?.name, req.user!.id]);
    }

    await db.execute(`
      UPDATE action_cards SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [column_id, position, id]);

    const card = await db.queryOne(`
      SELECT c.*, u.name as assigned_name FROM action_cards c LEFT JOIN users u ON c.assigned_to = u.id WHERE c.id = ?
    `, [id]);

    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/cards/reorder", async (req: AuthRequest, res) => {
  const { cards } = req.body;

  try {
    await db.transaction(async (conn) => {
      for (const card of cards) {
        await conn.execute("UPDATE action_cards SET column_id = ?, position = ? WHERE id = ?", [card.column_id, card.position, card.id]);
      }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/cards/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM action_cards WHERE id = ?", [id]);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CARD LINKS =====

router.post("/cards/:id/links", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { entity_type, entity_id } = req.body;
  const linkId = uuidv4();

  try {
    await db.execute(`
      INSERT INTO action_card_links (id, card_id, entity_type, entity_id) VALUES (?, ?, ?, ?)
    `, [linkId, id, entity_type, entity_id]);

    const link = await db.queryOne("SELECT * FROM action_card_links WHERE id = ?", [linkId]);
    res.status(201).json(link);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/cards/:cardId/links/:linkId", async (req: AuthRequest, res) => {
  const { linkId } = req.params;
  try {
    await db.execute("DELETE FROM action_card_links WHERE id = ?", [linkId]);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CARD HISTORY =====

router.get("/cards/:id/history", async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const history = await db.query(`
      SELECT h.*, u.name as changed_by_name
      FROM action_card_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.card_id = ?
      ORDER BY h.created_at DESC
    `, [id]);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/entities/:type/:id", async (req: AuthRequest, res) => {
  const { type, id } = req.params;

  try {
    let entity = null;

    switch (type) {
      case 'CLIENT':
        entity = await db.queryOne("SELECT id, name, phone, email FROM clients WHERE id = ? AND tenant_id = ?", [id, req.user!.tenant_id]);
        break;
      case 'VEHICLE':
        entity = await db.queryOne("SELECT id, plate, brand, model, year FROM vehicles WHERE id = ? AND tenant_id = ?", [id, req.user!.tenant_id]);
        break;
      case 'WORK_ORDER':
        entity = await db.queryOne("SELECT id, number, status FROM work_orders WHERE id = ? AND tenant_id = ?", [id, req.user!.tenant_id]);
        break;
      case 'SERVICE':
        entity = await db.queryOne("SELECT id, description, unit_price FROM work_order_items WHERE id = ? AND type = 'SERVICE'", [id]);
        break;
      case 'PART':
        entity = await db.queryOne("SELECT id, name, code, sale_price FROM parts WHERE id = ? AND tenant_id = ?", [id, req.user!.tenant_id]);
        break;
      case 'APPOINTMENT':
        entity = await db.queryOne("SELECT id, date, time, service_description, status FROM appointments WHERE id = ? AND tenant_id = ?", [id, req.user!.tenant_id]);
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
