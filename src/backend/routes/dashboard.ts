import express from "express";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/stats", (req: AuthRequest, res) => {
  const tenantId = req.user!.tenant_id;
  const { period = '30' } = req.query;
  const periodDays = parseInt(period as string) || 30;

  try {
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients WHERE tenant_id = ?").get(tenantId) as any;
    const totalVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE tenant_id = ?").get(tenantId) as any;
    const openWorkOrders = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE tenant_id = ? AND status NOT IN ('FINISHED', 'DELIVERED', 'CANCELLED')").get(tenantId) as any;
    const monthlyRevenue = db.prepare(`
      SELECT SUM(total_amount) as total 
      FROM work_orders 
      WHERE tenant_id = ? 
      AND status IN ('FINISHED', 'DELIVERED')
      AND created_at >= date('now', '-' || ? || ' days')
    `).get(tenantId, periodDays) as any;

    const newClientsThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM clients
      WHERE tenant_id = ? 
      AND created_at >= date('now', '-' || ? || ' days')
    `).get(tenantId, periodDays) as any;

    const todayAppointments = db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE tenant_id = ? AND date = date('now') AND status != 'CANCELLED'
    `).get(tenantId) as any;

    const vehiclesToDeliver = db.prepare(`
      SELECT COUNT(*) as count FROM work_orders 
      WHERE tenant_id = ? AND status = 'FINISHED'
    `).get(tenantId) as any;

    const lowStockParts = db.prepare(`
      SELECT COUNT(*) as count FROM parts
      WHERE tenant_id = ? AND stock_quantity <= min_stock AND min_stock > 0
    `).get(tenantId) as any;

    // Revenue history in the selected period
    const revenueHistory = db.prepare(`
      SELECT date(created_at) as date, SUM(total_amount) as total
      FROM work_orders
      WHERE tenant_id = ? 
      AND status IN ('FINISHED', 'DELIVERED')
      AND created_at >= date('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all(tenantId, periodDays);

    // OS Status distribution in the selected period
    const statusDistribution = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM work_orders
      WHERE tenant_id = ?
      AND created_at >= date('now', '-' || ? || ' days')
      GROUP BY status
    `).all(tenantId, periodDays);

    // Average Ticket
    const averageTicket = db.prepare(`
      SELECT AVG(total_amount) as average
      FROM work_orders
      WHERE tenant_id = ?
      AND status IN ('FINISHED', 'DELIVERED')
    `).get(tenantId) as any;

    const topServices = db.prepare(`
      SELECT description, COUNT(*) as count, SUM(total_price) as total
      FROM work_order_items i
      JOIN work_orders wo ON i.work_order_id = wo.id
      WHERE wo.tenant_id = ? AND i.type = 'SERVICE'
      AND wo.created_at >= date('now', '-' || ? || ' days')
      GROUP BY description
      ORDER BY total DESC
      LIMIT 5
    `).all(tenantId, periodDays);

    const todayAppointmentsList = db.prepare(`
      SELECT a.*, c.name as client_name, v.plate, v.brand, v.model
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.tenant_id = ? AND a.date = date('now') AND a.status != 'CANCELLED'
      ORDER BY a.time ASC
    `).all(tenantId);

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
        monthlyRevenue: monthlyRevenue.total || 0,
        todayAppointments: todayAppointments?.count || 0,
        vehiclesToDeliver: vehiclesToDeliver?.count || 0,
        newClientsThisMonth: newClientsThisMonth?.count || 0,
        lowStockParts: lowStockParts?.count || 0,
        averageTicket: averageTicket?.average || 0
      },
      revenueHistory,
      statusDistribution,
      topServices,
      recentWorkOrders,
      todayAppointments: todayAppointmentsList
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
