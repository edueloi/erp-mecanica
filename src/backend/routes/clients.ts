import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res) => {
  const { q, status } = req.query;
  let query = `
    SELECT
      c.*,
      (SELECT COUNT(*) FROM vehicles v WHERE v.client_id = c.id AND v.tenant_id = c.tenant_id) as vehicles_count,
      (SELECT COUNT(*) FROM work_orders wo WHERE wo.client_id = c.id AND wo.tenant_id = c.tenant_id) as os_count,
      (SELECT COUNT(*) FROM accounts_receivable ar WHERE ar.client_id = c.id AND ar.tenant_id = c.tenant_id AND ar.status = 'PENDING') as pendencies_count
    FROM clients c
    WHERE c.tenant_id = ?
  `;
  const params: any[] = [req.user!.tenant_id];

  if (q) {
    query += " AND (c.name LIKE ? OR c.document LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (status) {
    query += " AND c.status = ?";
    params.push(status);
  }

  query += " ORDER BY c.name ASC";
  try {
    const clients = await db.query(query, params);
    res.json(clients.map((c: any) => ({ ...c, tags: JSON.parse(c.tags || "[]") })));
  } catch (err: any) {
    console.error("Error fetching clients:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  const {
    type, name, document, email, phone, status, zip_code, street, number,
    neighborhood, city, state, complement, reference, birth_date,
    state_registration, alt_phone, alt_name, pref_contact, best_time,
    internal_notes, tags
  } = req.body;
  const id = uuidv4();

  try {
    await db.execute(`
      INSERT INTO clients (
        id, tenant_id, type, name, document, email, phone, status, zip_code,
        street, number, neighborhood, city, state, complement, reference,
        birth_date, state_registration, alt_phone, alt_name, pref_contact,
        best_time, internal_notes, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, req.user!.tenant_id, type || 'PF', name, document, email, phone,
      status || 'ACTIVE', zip_code, street, number, neighborhood, city, state,
      complement, reference, birth_date, state_registration, alt_phone,
      alt_name, pref_contact || 'WHATSAPP', best_time, internal_notes,
      JSON.stringify(tags || [])
    ]);
    const newClient = await db.queryOne("SELECT * FROM clients WHERE id = ?", [id]);
    res.status(201).json(newClient);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  const client = await db.queryOne(
    "SELECT * FROM clients WHERE id = ? AND tenant_id = ?",
    [req.params.id, req.user!.tenant_id]
  ) as any;

  if (!client) return res.status(404).json({ error: "Client not found" });

  client.tags = JSON.parse(client.tags || "[]");

  const vehicles = await db.query("SELECT * FROM vehicles WHERE client_id = ?", [req.params.id]);
  const workOrders = await db.query(`
    SELECT wo.*, v.plate, v.model, v.brand
    FROM work_orders wo
    JOIN vehicles v ON wo.vehicle_id = v.id
    WHERE wo.client_id = ?
    ORDER BY wo.created_at DESC
  `, [req.params.id]);

  const workOrdersWithItems = await Promise.all(workOrders.map(async (wo: any) => {
    const items = await db.query(`
      SELECT woi.*, u.name as mechanic_name
      FROM work_order_items woi
      LEFT JOIN users u ON woi.mechanic_id = u.id
      WHERE woi.work_order_id = ?
    `, [wo.id]);
    return { ...wo, items };
  }));

  res.json({ ...client, vehicles, workOrders: workOrdersWithItems });
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const fields = Object.keys(req.body).filter(k => k !== 'id' && k !== 'tenant_id');
  if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const params = fields.map(f => {
    const val = req.body[f];
    return (f === 'tags') ? JSON.stringify(val) : val;
  });
  params.push(req.params.id, req.user!.tenant_id);

  try {
    await db.execute(`UPDATE clients SET ${setClause} WHERE id = ? AND tenant_id = ?`, params);
    res.json({ message: "Client updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import endpoint
router.post("/bulk", async (req: AuthRequest, res) => {
  const clients = req.body;

  if (!Array.isArray(clients)) {
    return res.status(400).json({ error: "Request body must be an array" });
  }

  const results = {
    success: 0,
    errors: [] as any[],
    inserted: [] as any[]
  };

  for (let index = 0; index < clients.length; index++) {
    const clientData = clients[index];
    try {
      const {
        type, name, document, email, phone, status,
        cep, street, number, neighborhood, city, state, complement,
        zip_code,
        tags
      } = clientData;

      if (!name) {
        results.errors.push({ index, data: clientData, error: "Nome é obrigatório" });
        continue;
      }

      const id = uuidv4();
      const finalZipCode = zip_code || cep;

      await db.execute(`
        INSERT INTO clients (
          id, tenant_id, type, name, document, email, phone, status,
          zip_code, street, number, neighborhood, city, state, complement,
          tags, pref_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, req.user!.tenant_id, type || 'PF', name, document || '', email || '',
        phone || '', status || 'ACTIVE', finalZipCode || '', street || '', number || '',
        neighborhood || '', city || '', state || '', complement || '',
        JSON.stringify(tags || []), 'WHATSAPP'
      ]);

      const newClient = await db.queryOne("SELECT * FROM clients WHERE id = ?", [id]);
      results.success++;
      results.inserted.push(newClient);
    } catch (error: any) {
      results.errors.push({ index, data: clientData, error: error.message });
    }
  }

  res.json(results);
});

export default router;
