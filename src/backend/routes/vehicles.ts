import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Protege todas as rotas com autenticação
router.use(authenticateToken);

// Buscar todos os veículos
router.get("/", (req: AuthRequest, res) => {
  try {
    const { client_id, q } = req.query;
    // Usamos LEFT JOIN para garantir que o veículo seja listado mesmo se o cliente for apagado
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

    const vehicles = db.prepare(query).all(...params);
    res.json(vehicles);
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET veículo específico com histórico completo (Corrigido)
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const vehicle = db.prepare(`
      SELECT v.*, c.name as client_name 
      FROM vehicles v 
      LEFT JOIN clients c ON v.client_id = c.id 
      WHERE v.id = ? AND v.tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!vehicle) {
      return res.status(404).json({ error: "Veículo não encontrado" });
    }

    // --- Unified History (The magic happens here) ---
    // Fetch unified logs
    const historyLogs = db.prepare(`
      SELECT hl.*, u.name as responsible_name
      FROM vehicle_history_logs hl
      LEFT JOIN users u ON hl.responsible_id = u.id
      WHERE hl.vehicle_id = ? AND hl.tenant_id = ?
      ORDER BY hl.created_at DESC
    `).all(vehicle.id, req.user!.tenant_id);

    // Fetch work orders separately to include details (can also be merged)
    const woTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='work_orders'").get();
    let woDetails: any[] = [];

    if (woTableExists) {
      // Find mechanic column
      const woCols = db.prepare("PRAGMA table_info('work_orders')").all() as any[];
      const validWoCols = woCols.map(c => c.name.toLowerCase());
      const mechCol = validWoCols.includes('responsible_id') ? 'responsible_id' : (validWoCols.includes('mechanic_id') ? 'mechanic_id' : null);
      const mechJoin = mechCol ? `LEFT JOIN users u ON wo.${mechCol} = u.id` : '';
      const mechSelect = mechCol ? `, u.name as mechanic_name` : '';

      woDetails = db.prepare(`
        SELECT wo.* ${mechSelect}
        FROM work_orders wo
        ${mechJoin}
        WHERE wo.vehicle_id = ?
      `).all(vehicle.id);

      // Fetch items for each WO
      const woiTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='work_order_items'").get();
      if (woiTableExists) {
        const woiCols = db.prepare("PRAGMA table_info('work_order_items')").all() as any[];
        const validWoiCols = woiCols.map(c => c.name.toLowerCase());
        const fkCol = validWoiCols.includes('work_order_id') ? 'work_order_id' : (validWoiCols.includes('os_id') ? 'os_id' : null);
        
        if (fkCol) {
          woDetails = woDetails.map(wo => ({
            ...wo,
            items: db.prepare(`SELECT * FROM work_order_items WHERE ${fkCol} = ?`).all(wo.id)
          }));
        }
      }
    }

    // Merge history: logs + work orders
    const unifiedHistory = historyLogs.map((log: any) => {
        if (log.event_type === 'MAINTENANCE' && log.new_value) {
            const wo = woDetails.find(w => w.id === log.new_value || w.number === log.new_value);
            return { ...log, workOrderDetails: wo };
        }
        return log;
    });

    // If no history logs yet (legacy), fallback to Work Orders only
    if (unifiedHistory.length === 0 && woDetails.length > 0) {
        vehicle.history = woDetails.map(wo => ({
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

    // --- Attachments ---
    vehicle.attachments = db.prepare(`
      SELECT * FROM vehicle_attachments 
      WHERE vehicle_id = ? AND tenant_id = ?
      ORDER BY created_at DESC
    `).all(vehicle.id, req.user!.tenant_id);

    res.json(vehicle);
  } catch (error: any) {
    console.error(`Error fetching vehicle ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Create new vehicle (with history log)
router.post("/", (req: AuthRequest, res) => {
  const { client_id, plate, brand, model, year, color, vin, fuel_type, km } = req.body;
  const id = uuidv4();

  try {
    db.transaction(() => {
        db.prepare(`
          INSERT INTO vehicles (id, tenant_id, client_id, plate, brand, model, year, color, vin, fuel_type, km)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, req.user!.tenant_id, client_id || null, plate, brand, model, year, color, vin, fuel_type, km || 0);

        db.prepare(`
          INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id, km)
          VALUES (?, ?, ?, 'REGISTRATION', 'Veículo cadastrado no sistema', ?, ?)
        `).run(uuidv4(), id, req.user!.tenant_id, req.user!.id, km || 0);
    })();
    
    const newVehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(id);
    res.status(201).json(newVehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar anexo ao veículo (foto ou documento)
router.post("/:id/attachments", (req: AuthRequest, res) => {
  const { type, url, name, size, mime_type } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO vehicle_attachments (id, vehicle_id, tenant_id, type, url, name, size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, req.user!.tenant_id, type, url, name, size || null, mime_type || null);
    
    // Log history
    db.prepare(`
      INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, responsible_id)
      VALUES (?, ?, ?, 'MAINTENANCE', ?, ?)
    `).run(uuidv4(), req.params.id, req.user!.tenant_id, `Anexo adicionado: ${name} (${type})`, req.user!.id);

    const attachment = db.prepare("SELECT * FROM vehicle_attachments WHERE id = ?").get(id);
    res.status(201).json(attachment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remover anexo do veículo
router.delete("/:id/attachments/:attachmentId", (req: AuthRequest, res) => {
  try {
    db.prepare(`
      DELETE FROM vehicle_attachments 
      WHERE id = ? AND vehicle_id = ? AND tenant_id = ?
    `).run(req.params.attachmentId, req.params.id, req.user!.tenant_id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Patch vehicle (with ownership history log)
router.patch("/:id", (req: AuthRequest, res) => {
  const { client_id, status, ...otherData } = req.body;
  try {
    const oldVehicle = db.prepare("SELECT client_id FROM vehicles WHERE id = ? AND tenant_id = ?").get(req.params.id, req.user!.tenant_id) as any;
    if (!oldVehicle) return res.status(404).json({ error: "Veículo não encontrado" });

    db.transaction(() => {
        const updates: string[] = [];
        const params: any[] = [];
        Object.entries(req.body).forEach(([key, val]) => {
            updates.push(`${key} = ?`);
            params.push(val);
        });

        if (updates.length > 0) {
            db.prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`).run(...params, req.params.id);
        }

        // Log ownership change
        if (client_id && client_id !== oldVehicle.client_id) {
            const oldClient = oldVehicle.client_id ? db.prepare("SELECT name FROM clients WHERE id = ?").get(oldVehicle.client_id) : null;
            const newClient = db.prepare("SELECT name FROM clients WHERE id = ?").get(client_id);
            
            db.prepare(`
              INSERT INTO vehicle_history_logs (id, vehicle_id, tenant_id, event_type, description, old_value, new_value, responsible_id)
              VALUES (?, ?, ?, 'OWNERSHIP', ?, ?, ?, ?)
            `).run(
                uuidv4(), req.params.id, req.user!.tenant_id, 
                `Propriedade alterada para ${newClient?.name}`, 
                oldClient?.name || '---', newClient?.name, req.user!.id
            );
        }
    })();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;