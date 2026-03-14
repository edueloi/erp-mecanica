import express from "express";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/stats", async (req: AuthRequest, res) => {
  const tenantId = req.user!.tenant_id;
  const { period = '30' } = req.query;
  const periodDays = parseInt(period as string) || 30;

  try {
    const periodDate = new Date(Date.now() - periodDays * 86400000).toISOString().split('T')[0];

    const totalClients = await db.queryOne(
      "SELECT COUNT(*) as count FROM clients WHERE tenant_id = ?",
      [tenantId]
    ) as any;

    const totalVehicles = await db.queryOne(
      "SELECT COUNT(*) as count FROM vehicles WHERE tenant_id = ?",
      [tenantId]
    ) as any;

    const openWorkOrders = await db.queryOne(
      "SELECT COUNT(*) as count FROM work_orders WHERE tenant_id = ? AND status NOT IN ('FINISHED', 'DELIVERED', 'CANCELLED')",
      [tenantId]
    ) as any;

    const monthlyRevenue = await db.queryOne(
      `SELECT SUM(total_amount) as total
       FROM work_orders
       WHERE tenant_id = ?
       AND status IN ('FINISHED', 'DELIVERED')
       AND created_at >= ?`,
      [tenantId, periodDate]
    ) as any;

    const newClientsThisMonth = await db.queryOne(
      `SELECT COUNT(*) as count FROM clients
       WHERE tenant_id = ?
       AND created_at >= ?`,
      [tenantId, periodDate]
    ) as any;

    const todayAppointments = await db.queryOne(
      `SELECT COUNT(*) as count FROM appointments
       WHERE tenant_id = ? AND date = CURDATE() AND status != 'CANCELLED'`,
      [tenantId]
    ) as any;

    const vehiclesToDeliver = await db.queryOne(
      `SELECT COUNT(*) as count FROM work_orders
       WHERE tenant_id = ? AND status = 'FINISHED'`,
      [tenantId]
    ) as any;

    const lowStockParts = await db.queryOne(
      `SELECT COUNT(*) as count FROM parts
       WHERE tenant_id = ? AND stock_quantity <= min_stock AND min_stock > 0`,
      [tenantId]
    ) as any;

    const revenueHistory = await db.query(
      `SELECT DATE(created_at) as date, SUM(total_amount) as total
       FROM work_orders
       WHERE tenant_id = ?
       AND status IN ('FINISHED', 'DELIVERED')
       AND created_at >= ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [tenantId, periodDate]
    );

    const statusDistribution = await db.query(
      `SELECT status, COUNT(*) as count
       FROM work_orders
       WHERE tenant_id = ?
       AND created_at >= ?
       GROUP BY status`,
      [tenantId, periodDate]
    );

    const averageTicket = await db.queryOne(
      `SELECT AVG(total_amount) as average
       FROM work_orders
       WHERE tenant_id = ?
       AND status IN ('FINISHED', 'DELIVERED')`,
      [tenantId]
    ) as any;

    const topServices = await db.query(
      `SELECT description, COUNT(*) as count, SUM(total_price) as total
       FROM work_order_items i
       JOIN work_orders wo ON i.work_order_id = wo.id
       WHERE wo.tenant_id = ? AND i.type = 'SERVICE'
       AND wo.created_at >= ?
       GROUP BY description
       ORDER BY total DESC
       LIMIT 5`,
      [tenantId, periodDate]
    );

    const todayAppointmentsList = await db.query(
      `SELECT a.*, c.name as client_name, v.plate, v.brand, v.model
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       LEFT JOIN vehicles v ON a.vehicle_id = v.id
       WHERE a.tenant_id = ? AND a.date = CURDATE() AND a.status != 'CANCELLED'
       ORDER BY a.time ASC`,
      [tenantId]
    );

    const recentWorkOrders = await db.query(
      `SELECT wo.*, c.name as client_name, v.plate
       FROM work_orders wo
       JOIN clients c ON wo.client_id = c.id
       JOIN vehicles v ON wo.vehicle_id = v.id
       WHERE wo.tenant_id = ?
       ORDER BY wo.created_at DESC
       LIMIT 5`,
      [tenantId]
    );

    // Clients with birthday this month (by month/day, ignoring year)
    const birthdaysThisMonth = await db.query(
      `SELECT id, name, phone, birth_date,
              MONTH(birth_date) as birth_month,
              DAY(birth_date) as birth_day
       FROM clients
       WHERE tenant_id = ?
         AND birth_date IS NOT NULL
         AND MONTH(birth_date) = MONTH(CURDATE())
       ORDER BY DAY(birth_date) ASC`,
      [tenantId]
    );

    res.json({
      summary: {
        clients: totalClients?.count || 0,
        vehicles: totalVehicles?.count || 0,
        openWorkOrders: openWorkOrders?.count || 0,
        monthlyRevenue: monthlyRevenue?.total || 0,
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
      todayAppointments: todayAppointmentsList,
      birthdaysThisMonth
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
