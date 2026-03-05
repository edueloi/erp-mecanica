import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();
router.use(authenticateToken);

// Default checklist template items
const DEFAULT_CHECKLIST_ITEMS = [
  // Documentação
  { category: 'Documentação', item: 'CRLV / Licenciamento em dia', sort_order: 1 },
  { category: 'Documentação', item: 'CNH do proprietário', sort_order: 2 },
  { category: 'Documentação', item: 'Seguro obrigatório (DPVAT)', sort_order: 3 },

  // Motor
  { category: 'Motor', item: 'Nível de óleo do motor', sort_order: 10 },
  { category: 'Motor', item: 'Nível do líquido de arrefecimento', sort_order: 11 },
  { category: 'Motor', item: 'Correias / Tensores', sort_order: 12 },
  { category: 'Motor', item: 'Vazamentos (óleo, água, combustível)', sort_order: 13 },
  { category: 'Motor', item: 'Filtro de ar', sort_order: 14 },
  { category: 'Motor', item: 'Velas de ignição', sort_order: 15 },
  { category: 'Motor', item: 'Tampa de óleo / Junta', sort_order: 16 },
  { category: 'Motor', item: 'Radiador (estado geral)', sort_order: 17 },

  // Transmissão
  { category: 'Transmissão', item: 'Nível do óleo do câmbio', sort_order: 20 },
  { category: 'Transmissão', item: 'Embreagem (folga e desgaste)', sort_order: 21 },
  { category: 'Transmissão', item: 'Semiarvoredas / Homocinéticas', sort_order: 22 },
  { category: 'Transmissão', item: 'Caixa de direção', sort_order: 23 },

  // Freios
  { category: 'Freios', item: 'Pastilhas dianteiras', sort_order: 30 },
  { category: 'Freios', item: 'Pastilhas traseiras / Lonas', sort_order: 31 },
  { category: 'Freios', item: 'Discos / Tambores', sort_order: 32 },
  { category: 'Freios', item: 'Nível do fluido de freio', sort_order: 33 },
  { category: 'Freios', item: 'Freio de mão / Estacionamento', sort_order: 34 },
  { category: 'Freios', item: 'Mangueiras e tubulações', sort_order: 35 },

  // Suspensão e Direção
  { category: 'Suspensão e Direção', item: 'Amortecedores dianteiros', sort_order: 40 },
  { category: 'Suspensão e Direção', item: 'Amortecedores traseiros', sort_order: 41 },
  { category: 'Suspensão e Direção', item: 'Molas', sort_order: 42 },
  { category: 'Suspensão e Direção', item: 'Buchas da bandeja', sort_order: 43 },
  { category: 'Suspensão e Direção', item: 'Pivôs / Terminais de direção', sort_order: 44 },
  { category: 'Suspensão e Direção', item: 'Caixa de direção (vazamento)', sort_order: 45 },
  { category: 'Suspensão e Direção', item: 'Alinhamento e balanceamento', sort_order: 46 },

  // Pneus e Rodas
  { category: 'Pneus e Rodas', item: 'Pneu dianteiro direito', sort_order: 50 },
  { category: 'Pneus e Rodas', item: 'Pneu dianteiro esquerdo', sort_order: 51 },
  { category: 'Pneus e Rodas', item: 'Pneu traseiro direito', sort_order: 52 },
  { category: 'Pneus e Rodas', item: 'Pneu traseiro esquerdo', sort_order: 53 },
  { category: 'Pneus e Rodas', item: 'Estepe', sort_order: 54 },
  { category: 'Pneus e Rodas', item: 'Calibragem geral', sort_order: 55 },
  { category: 'Pneus e Rodas', item: 'Parafusos das rodas', sort_order: 56 },

  // Elétrico
  { category: 'Elétrico', item: 'Bateria (carga e fixação)', sort_order: 60 },
  { category: 'Elétrico', item: 'Alternador', sort_order: 61 },
  { category: 'Elétrico', item: 'Motor de partida', sort_order: 62 },
  { category: 'Elétrico', item: 'Iluminação dianteira (faróis / DRLs)', sort_order: 63 },
  { category: 'Elétrico', item: 'Iluminação traseira (lanternas / stop)', sort_order: 64 },
  { category: 'Elétrico', item: 'Setas / Pisca-alerta', sort_order: 65 },
  { category: 'Elétrico', item: 'Luz de ré', sort_order: 66 },
  { category: 'Elétrico', item: 'Buzina', sort_order: 67 },
  { category: 'Elétrico', item: 'Sensor de estacionamento', sort_order: 68 },

  // Ar-condicionado
  { category: 'Ar-condicionado', item: 'Funcionamento geral do A/C', sort_order: 70 },
  { category: 'Ar-condicionado', item: 'Filtro de cabine / Ar interno', sort_order: 71 },
  { category: 'Ar-condicionado', item: 'Compressor de A/C', sort_order: 72 },
  { category: 'Ar-condicionado', item: 'Nível de gás refrigerante', sort_order: 73 },

  // Carroceria e Lataria
  { category: 'Carroceria e Lataria', item: 'Estado geral da lataria', sort_order: 80 },
  { category: 'Carroceria e Lataria', item: 'Para-choque dianteiro', sort_order: 81 },
  { category: 'Carroceria e Lataria', item: 'Para-choque traseiro', sort_order: 82 },
  { category: 'Carroceria e Lataria', item: 'Vidros e Parabrisa', sort_order: 83 },
  { category: 'Carroceria e Lataria', item: 'Limpadores de para-brisa', sort_order: 84 },
  { category: 'Carroceria e Lataria', item: 'Fechaduras e maçanetas', sort_order: 85 },
  { category: 'Carroceria e Lataria', item: 'Espelhos retrovisores', sort_order: 86 },

  // Interior / Habitáculo
  { category: 'Interior', item: 'Painel de instrumentos (luzes de aviso)', sort_order: 90 },
  { category: 'Interior', item: 'Cinto de segurança (todos os bancos)', sort_order: 91 },
  { category: 'Interior', item: 'Airbags (luz de indicação)', sort_order: 92 },
  { category: 'Interior', item: 'Volante e coluna', sort_order: 93 },
  { category: 'Interior', item: 'Pedais (freio, acelerador, embreagem)', sort_order: 94 },
];

// GET all checklists for a vehicle
router.get("/vehicle/:vehicleId", (req: AuthRequest, res) => {
  try {
    const checklists = db.prepare(`
      SELECT cl.*, u.name as inspector_name,
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
    `).all(req.params.vehicleId, req.user!.tenant_id);
    res.json(checklists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single checklist with items
router.get("/:id", (req: AuthRequest, res) => {
  try {
    const checklist = db.prepare(`
      SELECT * FROM vehicle_checklists WHERE id = ? AND tenant_id = ?
    `).get(req.params.id, req.user!.tenant_id) as any;

    if (!checklist) return res.status(404).json({ error: "Checklist not found" });

    const items = db.prepare(`
      SELECT * FROM vehicle_checklist_items 
      WHERE checklist_id = ?
      ORDER BY sort_order ASC
    `).all(req.params.id);

    res.json({ ...checklist, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create a new checklist
router.post("/", (req: AuthRequest, res) => {
  const { vehicle_id, work_order_id, km, inspector_name, general_notes } = req.body;

  const id = uuidv4();

  try {
    const txn = db.transaction(() => {
      db.prepare(`
        INSERT INTO vehicle_checklists (id, tenant_id, vehicle_id, work_order_id, km, inspector_name, general_notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT')
      `).run(id, req.user!.tenant_id, vehicle_id, work_order_id || null, km || 0, inspector_name || null, general_notes || null);

      // Insert default items
      const stmt = db.prepare(`
        INSERT INTO vehicle_checklist_items (id, checklist_id, category, item, status, sort_order)
        VALUES (?, ?, ?, ?, 'NA', ?)
      `);

      for (const item of DEFAULT_CHECKLIST_ITEMS) {
        stmt.run(uuidv4(), id, item.category, item.item, item.sort_order);
      }
    });

    txn();

    const checklist = db.prepare("SELECT * FROM vehicle_checklists WHERE id = ?").get(id);
    const items = db.prepare("SELECT * FROM vehicle_checklist_items WHERE checklist_id = ? ORDER BY sort_order ASC").all(id);

    res.status(201).json({ ...checklist, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update checklist header
router.patch("/:id", (req: AuthRequest, res) => {
  const { km, inspector_name, general_notes, status } = req.body;

  try {
    db.prepare(`
      UPDATE vehicle_checklists
      SET km = COALESCE(?, km),
          inspector_name = COALESCE(?, inspector_name),
          general_notes = COALESCE(?, general_notes),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(km, inspector_name, general_notes, status, req.params.id, req.user!.tenant_id);

    const checklist = db.prepare("SELECT * FROM vehicle_checklists WHERE id = ?").get(req.params.id);
    const items = db.prepare("SELECT * FROM vehicle_checklist_items WHERE checklist_id = ? ORDER BY sort_order ASC").all(req.params.id);

    res.json({ ...checklist, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update an individual checklist item
router.patch("/:id/items/:itemId", (req: AuthRequest, res) => {
  const { status, notes } = req.body;

  try {
    db.prepare(`
      UPDATE vehicle_checklist_items
      SET status = COALESCE(?, status),
          notes = COALESCE(?, notes)
      WHERE id = ? AND checklist_id = ?
    `).run(status, notes, req.params.itemId, req.params.id);

    // Update checklist updated_at
    db.prepare(`
      UPDATE vehicle_checklists SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?
    `).run(req.params.id, req.user!.tenant_id);

    const item = db.prepare("SELECT * FROM vehicle_checklist_items WHERE id = ?").get(req.params.itemId);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE checklist
router.delete("/:id", (req: AuthRequest, res) => {
  try {
    db.prepare("DELETE FROM vehicle_checklist_items WHERE checklist_id = ?").run(req.params.id);
    db.prepare("DELETE FROM vehicle_checklists WHERE id = ? AND tenant_id = ?").run(req.params.id, req.user!.tenant_id);
    res.json({ message: "Checklist excluído com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
