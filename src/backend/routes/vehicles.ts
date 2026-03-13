import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

// Buscar todos os veículos
router.get("/", async (req: AuthRequest, res) => {
  try {
    const { client_id, q } = req.query;
    let query = "SELECT v.*, c.name as client_name FROM vehicles v LEFT JOIN clients c ON v.client_id = c.id WHERE v.tenant_id = ?";
    const params: any[] = [req.user!.tenant_id];

    if (client_id) {
      query += " AND v.client_id = ?";
      params.push(client_id);
    }

    if (q) {
      query += " AND (v.plate LIKE ? OR v.model LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }

    const vehicles = await db.query(query, params);
    res.json(vehicles);
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET veículo específico com histórico completo
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const vehicle = await db.queryOne(`
      SELECT v.*, c.name as client_name
      FROM vehicles v
      LEFT JOIN clients c ON v.client_id = c.id
      WHERE v.id = ? AND v.tenant_id = ?
    `, [req.params.id, req.user!.tenant_id]) as any;

    if (!vehicle) {
      return res.status(404).json({ error: "Veículo não encontrado" });
    }

    // Fetch unified history logs
    const historyLogs = await db.query(`
      SELECT hl.*, u.name as responsible_name
      FROM vehicle_history_logs hl
      LEFT JOIN users u ON hl.responsible_id = u.id
      WHERE hl.vehicle_id = ? AND hl.tenant_id = ?
      ORDER BY hl.created_at DESC
    `, [vehicle.id, req.user!.tenant_id]);

    // Fetch work orders with mechanic name
    let woDetails: any[] = await db.query(`
      SELECT wo.*, u.name as mechanic_name
      FROM work_orders wo
      LEFT JOIN users u ON wo.responsible_id = u.id
      WHERE wo.vehicle_id = ?
    `, [vehicle.id]);

    // Fetch items for each WO
    woDetails = await Promise.all(woDetails.map(async (wo: any) => ({
      ...wo,
      items: await db.query("SELECT * FROM work_order_items WHERE work_order_id = ?", [wo.id])
    })));

    // Merge history: logs + work orders
    const unifiedHistory = historyLogs.map((log: any) => {
      if (log.event_type === 'MAINTENANCE' && log.new_value) {
        const wo = woDetails.find((w: any) => w.id === log.new_value || w.number === log.new_value);
        return { ...log, workOrderDetails: wo };
      }
      return log;
    });

    if (unifiedHistory.length === 0 && woDetails.length > 0) {
      vehicle.history = woDetails.map((wo: any) => ({
        id: uuidv4(),
        event_type: 'MAINTENANCE',
        description: `Ordem de Serviço ${wo.number}`,
        created_at: wo.created_at,
        km: wo.km,
        value: wo.total_amount,
        workOrderDetails: wo
      }));
    } else {
      vehicle.history = unifiedHistory;
    }

    // Attachments
    vehicle.attachments = await db.query(`
      SELECT * FROM vehicle_attachments
      WHERE vehicle_id = ? AND tenant_id = ?
      ORDER BY created_at DESC
    `, [vehicle.id, req.user!.tenant_id]);

    res.json(vehicle);
  } catch (error: any) {
    console.error(`Error fetching vehicle ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Create new vehicle (with history log)
router.post("/", async (req: AuthRequest, res) => {
  const { client_id, plate, brand, model, year, color, vin, fuel_type, km } = req.body;
  const id = uuidv4();

  try {
    await db.transaction(async (conn) => {
      await conn.execute(`
        INSERT INTO vehicles (id, tenant_id, client_id, plate, brand, model, year, color, vin, fuel_type, km)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, req.user!.tenant_id, client_id || null, plate, brand, model, year, color, vin, fuel_type, km || 0]);

      await conn.execute(`
        INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id, km)
        VALUES (?, ?, ?, 'REGISTRATION', 'Veículo cadastrado no sistema', ?, ?)
      `, [uuidv4(), id, req.user!.tenant_id, req.user!.id, km || 0]);
    });

    const newVehicle = await db.queryOne("SELECT * FROM vehicles WHERE id = ?", [id]);
    res.status(201).json(newVehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar anexo ao veículo
router.post("/:id/attachments", async (req: AuthRequest, res) => {
  const { type, url, name, size, mime_type } = req.body;
  const id = uuidv4();
  try {
    await db.execute(`
      INSERT INTO vehicle_attachments (id, vehicle_id, tenant_id, type, url, name, size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, req.params.id, req.user!.tenant_id, type, url, name, size || null, mime_type || null]);

    await db.execute(`
      INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id)
      VALUES (?, ?, ?, 'MAINTENANCE', ?, ?)
    `, [uuidv4(), req.params.id, req.user!.tenant_id, `Anexo adicionado: ${name} (${type})`, req.user!.id]);

    const attachment = await db.queryOne("SELECT * FROM vehicle_attachments WHERE id = ?", [id]);
    res.status(201).json(attachment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remover anexo do veículo
router.delete("/:id/attachments/:attachmentId", async (req: AuthRequest, res) => {
  try {
    await db.execute(`
      DELETE FROM vehicle_attachments
      WHERE id = ? AND vehicle_id = ? AND tenant_id = ?
    `, [req.params.attachmentId, req.params.id, req.user!.tenant_id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Patch vehicle (with ownership history log)
router.patch("/:id", async (req: AuthRequest, res) => {
  const { client_id } = req.body;
  try {
    const oldVehicle = await db.queryOne(
      "SELECT client_id FROM vehicles WHERE id = ? AND tenant_id = ?",
      [req.params.id, req.user!.tenant_id]
    ) as any;
    if (!oldVehicle) return res.status(404).json({ error: "Veículo não encontrado" });

    await db.transaction(async (conn) => {
      const allowedFields = ['client_id', 'plate', 'brand', 'model', 'year', 'color', 'vin', 'fuel_type', 'km'];
      const updates: string[] = [];
      const params: any[] = [];
      
      Object.entries(req.body).forEach(([key, val]) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          params.push(val);
        }
      });

      if (updates.length > 0) {
        await conn.execute(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`, [...params, req.params.id]);
      }

      if (client_id && client_id !== oldVehicle.client_id) {
        const [oldClientRows] = oldVehicle.client_id
          ? await conn.execute("SELECT name FROM clients WHERE id = ?", [oldVehicle.client_id])
          : [[]];
        const [newClientRows] = await conn.execute("SELECT name FROM clients WHERE id = ?", [client_id]);
        const oldClient = (oldClientRows as any[])[0];
        const newClient = (newClientRows as any[])[0];

        await conn.execute(`
          INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, old_value, new_value, responsible_id)
          VALUES (?, ?, ?, 'OWNERSHIP', ?, ?, ?, ?)
        `, [
          uuidv4(), req.params.id, req.user!.tenant_id,
          `Propriedade alterada para ${newClient?.name}`,
          oldClient?.name || '---', newClient?.name, req.user!.id
        ]);
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import
router.post("/bulk", async (req: AuthRequest, res) => {
  const vehicles = req.body;
  if (!Array.isArray(vehicles)) return res.status(400).json({ error: "Request body must be an array" });

  const results = { success: 0, errors: [] as any[], inserted: [] as any[] };

  for (let index = 0; index < vehicles.length; index++) {
    const v = vehicles[index];
    try {
      const { plate, brand, model, year, color, vin, fuel_type, km, client_id } = v;
      if (!plate && !brand && !model) {
        results.errors.push({ index, data: v, error: "Placa, marca ou modelo são obrigatórios" });
        continue;
      }
      const id = uuidv4();
      await db.execute(`
        INSERT INTO vehicles (id, tenant_id, client_id, plate, brand, model, year, color, vin, fuel_type, km)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, req.user!.tenant_id, client_id || null, plate || '', brand || '', model || '', year || null, color || '', vin || '', fuel_type || '', km || 0]);
      const inserted = await db.queryOne("SELECT * FROM vehicles WHERE id = ?", [id]);
      results.success++;
      results.inserted.push(inserted);
    } catch (error: any) {
      results.errors.push({ index, data: v, error: error.message });
    }
  }

  res.json(results);
});

export default router;
