import Database from 'better-sqlite3';

const db = new Database('mecaerp.db');

const vehicleId = 'f53cc348-3448-447f-b564-652b314bf744';
const tenantId = '031d2716-6751-4757-8794-a6210ede52ed';

try {
    console.log(`Fetching vehicle ${vehicleId} for tenant ${tenantId}...`);
    const vehicle = db.prepare(`
      SELECT v.*, c.name as client_name 
      FROM vehicles v 
      JOIN clients c ON v.client_id = c.id 
      WHERE v.id = ? AND v.tenant_id = ?
    `).get(vehicleId, tenantId) as any;

    if (!vehicle) {
      console.log("Veículo não encontrado");
      process.exit(0);
    }

    console.log("Vehicle found:", vehicle.plate);

    // Dynamic column detection for work_orders
    const woColumns = db.prepare("PRAGMA table_info('work_orders')").all() as any[];
    const validWoCols = woColumns.map(c => c.name);
    
    // Choose the best column for mechanic/responsible join
    let mechanicJoin = '';
    if (validWoCols.includes('responsible_id')) {
      mechanicJoin = 'LEFT JOIN users u ON wo.responsible_id = u.id';
    } else if (validWoCols.includes('mechanic_id')) {
      mechanicJoin = 'LEFT JOIN users u ON wo.mechanic_id = u.id';
    }

    console.log("Mechanic join:", mechanicJoin);

    // Fetch work orders history for this vehicle
    const workOrders = db.prepare(`
      SELECT wo.* ${mechanicJoin ? ', u.name as responsible_name' : ''}
      FROM work_orders wo
      ${mechanicJoin}
      WHERE wo.vehicle_id = ? AND wo.tenant_id = ?
      ORDER BY wo.created_at DESC
    `).all(vehicle.id, tenantId);

    console.log(`Found ${workOrders.length} work orders`);

    // Dynamic column detection for work_order_items
    const woiColumns = db.prepare("PRAGMA table_info('work_order_items')").all() as any[];
    const validWoiCols = woiColumns.map(c => c.name);

    // For each work order, fetch its items
    const workOrdersWithItems = workOrders.map((wo: any) => {
      const woiFields = ['woi.*'];
      if (validWoiCols.includes('type')) {
        woiFields.push("CASE WHEN woi.type = 'PART' THEN 'PART' ELSE 'SERVICE' END as item_category");
      } else if (validWoiCols.includes('category')) {
        woiFields.push("woi.category as item_category");
      }

      console.log(`Fetching items for WO ${wo.id}...`);
      const items = db.prepare(`
        SELECT ${woiFields.join(', ')}
        FROM work_order_items woi
        WHERE woi.work_order_id = ?
      `).all(wo.id);

      return {
        ...wo,
        items
      };
    });

    vehicle.workOrders = workOrdersWithItems;
    console.log("Success!");

} catch (error: any) {
    console.error("Caught error:", error);
}

db.close();
