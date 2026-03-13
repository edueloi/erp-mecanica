import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// GET single checklist publicly using TOKEN
router.get("/public/:token", async (req, res) => {
  try {
    const checklist = await db.queryOne(`
      SELECT cl.*, v.brand as vehicle_brand, v.model as vehicle_model, v.plate as vehicle_plate
      FROM vehicle_checklists cl
      JOIN vehicles v ON cl.vehicle_id = v.id
      WHERE cl.public_token = ? AND cl.token_expires_at > CURRENT_TIMESTAMP
    `, [req.params.token]) as any;

    if (!checklist) return res.status(404).json({ error: "Link expirado ou inválido" });

    const items = await db.query(`
      SELECT * FROM vehicle_checklist_items
      WHERE checklist_id = ?
      ORDER BY sort_order ASC
    `, [checklist.id]);

    res.json({ ...checklist, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH item publicly using TOKEN
router.patch("/public/:token/items/:itemId", async (req, res) => {
  const { image_url } = req.body;
  try {
    const checklist = await db.queryOne(`
      SELECT id FROM vehicle_checklists
      WHERE public_token = ? AND token_expires_at > CURRENT_TIMESTAMP
    `, [req.params.token]) as any;

    if (!checklist) return res.status(404).json({ error: "Link expirado" });

    const result = await db.execute(`
      UPDATE vehicle_checklist_items
      SET image_url = ?, status = CASE WHEN status = 'NA' THEN 'OK' ELSE status END
      WHERE id = ? AND checklist_id = ?
    `, [image_url, req.params.itemId, checklist.id]);

    if ((result as any).affectedRows === 0) return res.status(404).json({ error: "Item not found" });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.use(authenticateToken);

// Default checklist template items
const DEFAULT_CHECKLIST_ITEMS = [
  // Fotos Obrigatórias
  { category: 'Fotos do Veículo', item: 'Frente do Veículo', sort_order: -5 },
  { category: 'Fotos do Veículo', item: 'Traseira do Veículo', sort_order: -4 },
  { category: 'Fotos do Veículo', item: 'Lateral Esquerda', sort_order: -3 },
  { category: 'Fotos do Veículo', item: 'Lateral Direita', sort_order: -2 },
  { category: 'Fotos do Veículo', item: 'Painel (KM e Luzes)', sort_order: -1 },

  // Documentação e Conferência
  { category: 'Documentação', item: 'CRLV / Licenciamento em dia', sort_order: 1 },
  { category: 'Documentação', item: 'CNH do proprietário / Condutor', sort_order: 2 },
  { category: 'Documentação', item: 'Manual do Proprietário / Chave reserva', sort_order: 3 },
  { category: 'Documentação', item: 'Seguro obrigatório (DPVAT)', sort_order: 4 },

  // Equipamentos de Segurança
  { category: 'Equipamentos', item: 'Triângulo de sinalização', sort_order: 5 },
  { category: 'Equipamentos', item: 'Luzes do painel / Avisos sonoros', sort_order: 6 },
  { category: 'Equipamentos', item: 'Cintos de segurança (engates e recuo)', sort_order: 7 },
  { category: 'Equipamentos', item: 'Extintor de incêndio (validade)', sort_order: 8 },
  { category: 'Equipamentos', item: 'Macaco / Chave de roda', sort_order: 9 },

  // Motor e Fluidos
  { category: 'Motor e Fluidos', item: 'Nível de óleo do motor', sort_order: 10 },
  { category: 'Motor e Fluidos', item: 'Nível do líquido de arrefecimento (estado)', sort_order: 11 },
  { category: 'Motor e Fluidos', item: 'Nível de fluido de freio', sort_order: 12 },
  { category: 'Motor e Fluidos', item: 'Nível de fluido da direção hidráulica', sort_order: 13 },
  { category: 'Motor e Fluidos', item: 'Nível de fluido do limpador de para-brisa', sort_order: 14 },
  { category: 'Motor e Fluidos', item: 'Vazamentos visíveis (óleo, água, combustível)', sort_order: 15 },
  { category: 'Motor e Fluidos', item: 'Estado das correias / Tensores', sort_order: 16 },
  { category: 'Motor e Fluidos', item: 'Filtro de ar / Filtro de combustível', sort_order: 17 },
  { category: 'Motor e Fluidos', item: 'Estado do radiador / Mangueiras', sort_order: 18 },
  { category: 'Motor e Fluidos', item: 'Coxins do motor e câmbio', sort_order: 19 },

  // Transmissão
  { category: 'Transmissão', item: 'Nível do óleo do câmbio (se aplicável)', sort_order: 20 },
  { category: 'Transmissão', item: 'Embreagem (pedal, folga e desgaste)', sort_order: 21 },
  { category: 'Transmissão', item: 'Coifas de semieixo / Homocinéticas', sort_order: 22 },
  { category: 'Transmissão', item: 'Engates das marchas / Alavanca', sort_order: 23 },

  // Freios
  { category: 'Freios', item: 'Pastilhas dianteiras', sort_order: 30 },
  { category: 'Freios', item: 'Pastilhas traseiras / Lonas / Tambores', sort_order: 31 },
  { category: 'Freios', item: 'Estado dos discos de freio', sort_order: 32 },
  { category: 'Freios', item: 'Mangueiras e tubulações (vazamentos)', sort_order: 33 },
  { category: 'Freios', item: 'Freio de mão / Estacionamento', sort_order: 34 },
  { category: 'Freios', item: 'Pedal de freio (pressão e retorno)', sort_order: 35 },

  // Suspensão e Direção
  { category: 'Suspensão e Direção', item: 'Amortecedores (vazamentos e ruídos)', sort_order: 40 },
  { category: 'Suspensão e Direção', item: 'Buchas de bandeja / Balança', sort_order: 41 },
  { category: 'Suspensão e Direção', item: 'Pivôs / Terminais de direção', sort_order: 42 },
  { category: 'Suspensão e Direção', item: 'Barra estabilizadora / Bieletas', sort_order: 43 },
  { category: 'Suspensão e Direção', item: 'Caixa de direção (vazamento / folga)', sort_order: 44 },
  { category: 'Suspensão e Direção', item: 'Molas / Batentes', sort_order: 45 },

  // Pneus e Rodas
  { category: 'Pneus e Rodas', item: 'Pneu dianteiro direito (desgaste TWI)', sort_order: 50 },
  { category: 'Pneus e Rodas', item: 'Pneu dianteiro esquerdo (desgaste TWI)', sort_order: 51 },
  { category: 'Pneus e Rodas', item: 'Pneu traseiro direito (desgaste TWI)', sort_order: 52 },
  { category: 'Pneus e Rodas', item: 'Pneu traseiro esquerdo (desgaste TWI)', sort_order: 53 },
  { category: 'Pneus e Rodas', item: 'Estepe (estado e calibragem)', sort_order: 54 },
  { category: 'Pneus e Rodas', item: 'Calibragem geral (incluindo estepe)', sort_order: 55 },
  { category: 'Pneus e Rodas', item: 'Estado das rodas / Parafusos', sort_order: 56 },

  // Elétrico
  { category: 'Elétrico', item: 'Bateria (voltagem e fixação)', sort_order: 60 },
  { category: 'Elétrico', item: 'Funcionamento do alternador', sort_order: 61 },
  { category: 'Elétrico', item: 'Luzes de farol (alto e baixo)', sort_order: 62 },
  { category: 'Elétrico', item: 'Lanternas traseiras / Placa', sort_order: 63 },
  { category: 'Elétrico', item: 'Setas / Pisca-alerta / Luz de ré', sort_order: 64 },
  { category: 'Elétrico', item: 'Luz de freio (incluindo brake-light)', sort_order: 65 },
  { category: 'Elétrico', item: 'Buzina', sort_order: 66 },
  { category: 'Elétrico', item: 'Painel (relógios e luzes espia)', sort_order: 67 },
  { category: 'Elétrico', item: 'Vidros elétricos / Travas', sort_order: 68 },

  // Ar-condicionado e Ventilação
  { category: 'Ar-condicionado', item: 'Eficiência de resfriamento', sort_order: 70 },
  { category: 'Ar-condicionado', item: 'Filtro de cabine (higienização)', sort_order: 71 },
  { category: 'Ar-condicionado', item: 'Ruídos no compressor / Polia', sort_order: 72 },
  { category: 'Ar-condicionado', item: 'Direcionadores de ar / Desembaçador', sort_order: 73 },

  // Carroceria e Vidros
  { category: 'Carroceria', item: 'Estado geral da pintura e lataria', sort_order: 80 },
  { category: 'Carroceria', item: 'Para-choques dianteiro e traseiro', sort_order: 81 },
  { category: 'Carroceria', item: 'Parabrisa (trincas e transparência)', sort_order: 82 },
  { category: 'Carroceria', item: 'Limpadores / Palhetas (estado)', sort_order: 83 },
  { category: 'Carroceria', item: 'Retrovisores (ajuste e integridade)', sort_order: 84 },
  { category: 'Carroceria', item: 'Escapamento (ruído e fixação)', sort_order: 85 },

  // Interior
  { category: 'Interior', item: 'Estado dos bancos / Estofamento', sort_order: 90 },
  { category: 'Interior', item: 'Tapetes / Carpetes', sort_order: 91 },
  { category: 'Interior', item: 'Forros de porta / Teto', sort_order: 92 },
  { category: 'Interior', item: 'Higienização interna', sort_order: 93 },

  // Teste de Rodagem
  { category: 'Teste de Rodagem', item: 'Comportamento na partida', sort_order: 100 },
  { category: 'Teste de Rodagem', item: 'Barulhos internos / Grilos', sort_order: 101 },
  { category: 'Teste de Rodagem', item: 'Estabilidade em linha reta', sort_order: 102 },
  { category: 'Teste de Rodagem', item: 'Freios em operação (vibração)', sort_order: 103 },
];

// GET all checklists for a vehicle
router.get("/vehicle/:vehicleId", async (req: AuthRequest, res) => {
  try {
    // Check if vehicle_checklists table exists (MySQL compatible)
    const tableCheck = await db.queryOne(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'vehicle_checklists'",
      []
    );
    if (!tableCheck) {
      return res.json([]);
    }

    const checklists = await db.query(`
      SELECT cl.id, cl.tenant_id, cl.vehicle_id, cl.work_order_id, cl.km,
             cl.inspector_name, cl.general_notes, cl.status, cl.created_at, cl.updated_at,
             u.name as inspector_name_display,
             COUNT(ci.id) as total_items,
             SUM(CASE WHEN ci.status = 'OK' THEN 1 ELSE 0 END) as ok_count,
             SUM(CASE WHEN ci.status = 'ATTENTION' THEN 1 ELSE 0 END) as attention_count,
             SUM(CASE WHEN ci.status = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count
      FROM vehicle_checklists cl
      LEFT JOIN users u ON cl.inspector_name = u.id
      LEFT JOIN vehicle_checklist_items ci ON ci.checklist_id = cl.id
      WHERE cl.vehicle_id = ? AND cl.tenant_id = ?
      GROUP BY cl.id
      ORDER BY cl.created_at DESC
    `, [req.params.vehicleId, req.user!.tenant_id]);

    // Map inspector_name_display to inspector_name if needed by frontend
    const mapped = checklists.map((cl: any) => ({
      ...cl,
      inspector_name: cl.inspector_name_display || cl.inspector_name // Fallback if join failed
    }));

    res.json(mapped);
  } catch (error: any) {
    console.error(`Error fetching checklists for vehicle ${req.params.vehicleId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// POST Generate/Refresh Public Token
router.post("/:id/token", async (req: AuthRequest, res) => {
  console.log('Generating token for checklist:', req.params.id);
  try {
    const token = uuidv4();
    // 60 minutes from now
    const expiresAt = new Date(Date.now() + 60 * 60000).toISOString().replace('T', ' ').replace('Z', '');

    const result = await db.execute(`
      UPDATE vehicle_checklists
      SET public_token = ?, token_expires_at = ?
      WHERE id = ? AND tenant_id = ?
    `, [token, expiresAt, req.params.id, req.user!.tenant_id]);

    if ((result as any).affectedRows === 0) {
      console.warn('Checklist not found or unauthorized:', req.params.id);
      return res.status(404).json({ error: "Checklist não encontrado" });
    }

    res.json({ token, expiresAt });
  } catch (error: any) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single checklist with items
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const checklist = await db.queryOne(`
      SELECT * FROM vehicle_checklists WHERE id = ? AND tenant_id = ?
    `, [req.params.id, req.user!.tenant_id]) as any;

    if (!checklist) return res.status(404).json({ error: "Checklist not found" });

    const items = await db.query(`
      SELECT * FROM vehicle_checklist_items
      WHERE checklist_id = ?
      ORDER BY sort_order ASC
    `, [req.params.id]);

    res.json({ ...checklist, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create a new checklist
router.post("/", async (req: AuthRequest, res) => {
  const { vehicle_id, work_order_id, km, inspector_name, general_notes } = req.body;

  if (!vehicle_id || vehicle_id === 'undefined') {
    return res.status(400).json({ error: "ID do veículo é obrigatório e deve ser válido" });
  }

  const id = uuidv4();

  try {
    await db.transaction(async (conn) => {
      await conn.execute(`
        INSERT INTO vehicle_checklists (id, tenant_id, vehicle_id, work_order_id, km, inspector_name, general_notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT')
      `, [id, req.user!.tenant_id, vehicle_id, work_order_id || null, km || 0, inspector_name || null, general_notes || null]);

      // Insert default items
      for (const item of DEFAULT_CHECKLIST_ITEMS) {
        await conn.execute(`
          INSERT INTO vehicle_checklist_items (id, checklist_id, category, item, status, sort_order)
          VALUES (?, ?, ?, ?, 'NA', ?)
        `, [uuidv4(), id, item.category, item.item, item.sort_order]);
      }
    });

    const checklist = await db.queryOne("SELECT * FROM vehicle_checklists WHERE id = ?", [id]);
    const items = await db.query("SELECT * FROM vehicle_checklist_items WHERE checklist_id = ? ORDER BY sort_order ASC", [id]);

    res.status(201).json({ ...checklist, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update checklist header
router.patch("/:id", async (req: AuthRequest, res) => {
  const { km, inspector_name, general_notes, status } = req.body;

  try {
    await db.execute(`
      UPDATE vehicle_checklists
      SET km = COALESCE(?, km),
          inspector_name = COALESCE(?, inspector_name),
          general_notes = COALESCE(?, general_notes),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [km, inspector_name, general_notes, status, req.params.id, req.user!.tenant_id]);

    const checklist = await db.queryOne("SELECT * FROM vehicle_checklists WHERE id = ?", [req.params.id]);
    const items = await db.query("SELECT * FROM vehicle_checklist_items WHERE checklist_id = ? ORDER BY sort_order ASC", [req.params.id]);

    res.json({ ...checklist, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update an individual checklist item
router.patch("/:id/items/:itemId", async (req: AuthRequest, res) => {
  const { status, notes } = req.body;

  try {
    await db.execute(`
      UPDATE vehicle_checklist_items
      SET status = COALESCE(?, status),
          notes = COALESCE(?, notes)
      WHERE id = ? AND checklist_id = ?
    `, [status, notes, req.params.itemId, req.params.id]);

    // Update checklist updated_at
    await db.execute(`
      UPDATE vehicle_checklists SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?
    `, [req.params.id, req.user!.tenant_id]);

    const item = await db.queryOne("SELECT * FROM vehicle_checklist_items WHERE id = ?", [req.params.itemId]);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE checklist
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await db.execute("DELETE FROM vehicle_checklist_items WHERE checklist_id = ?", [req.params.id]);
    await db.execute("DELETE FROM vehicle_checklists WHERE id = ? AND tenant_id = ?", [req.params.id, req.user!.tenant_id]);
    res.json({ message: "Checklist excluído com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
