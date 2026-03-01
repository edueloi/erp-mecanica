import express from "express";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/stats", (req: AuthRequest, res) => {
  const tenantId = req.user!.tenant_id;

  try {
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients WHERE tenant_id = ?").get(tenantId) as any;
    const totalVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE tenant_id = ?").get(tenantId) as any;
    const openWorkOrders = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE tenant_id = ? AND status NOT IN ('FINISHED', 'DELIVERED', 'CANCELLED')").get(tenantId) as any;
    const monthlyRevenue = db.prepare(`
      SELECT SUM(total_amount) as total 
      FROM work_orders 
      WHERE tenant_id = ? 
      AND status IN ('FINISHED', 'DELIVERED')
      AND strftime('%m', created_at) = strftime('%m', 'now')
    `).get(tenantId) as any;

    const recentWorkOrders = db.prepare(`
      SELECT wo.*, c.name as client_name, v.plate 
      FROM work_orders wo
      JOIN clients c ON wo.client_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.tenant_id = ?
      ORDER BY wo.created_at DESC
      LIMIT 5
    `).all(tenantId);

    res.json({
      summary: {
        clients: totalClients.count,
        vehicles: totalVehicles.count,
        openWorkOrders: openWorkOrders.count,
        monthlyRevenue: monthlyRevenue.total || 0
      },
      recentWorkOrders
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
