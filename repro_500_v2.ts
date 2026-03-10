import Database from 'better-sqlite3';

const db = new Database('mecaerp.db');

const tenantId = '031d2716-6751-4757-8794-a6210ede52ed';

try {
    console.log(`Checking ALL work orders for tenant ${tenantId}...`);
    
    // Dynamic column detection for work_orders
    const woColumns = db.prepare("PRAGMA table_info('work_orders')").all() as any[];
    const validWoCols = woColumns.map(c => c.name);
    
    let mechanicJoin = '';
    if (validWoCols.includes('responsible_id')) {
      mechanicJoin = 'LEFT JOIN users u ON wo.responsible_id = u.id';
    } else if (validWoCols.includes('mechanic_id')) {
      mechanicJoin = 'LEFT JOIN users u ON wo.mechanic_id = u.id';
    }

    const workOrders = db.prepare(`
      SELECT wo.* ${mechanicJoin ? ', u.name as responsible_name' : ''}
      FROM work_orders wo
      ${mechanicJoin}
      WHERE wo.tenant_id = ?
      ORDER BY wo.created_at DESC
    `).all(tenantId);

    console.log(`Found ${workOrders.length} work orders in total for this tenant`);

    const woiColumns = db.prepare("PRAGMA table_info('work_order_items')").all() as any[];
    const validWoiCols = woiColumns.map(c => c.name);

    workOrders.forEach((wo: any) => {
      try {
        const woiFields = ['woi.*'];
        if (validWoiCols.includes('type')) {
          woiFields.push("CASE WHEN woi.type = 'PART' THEN 'PART' ELSE 'SERVICE' END as item_category");
        } else if (validWoiCols.includes('category')) {
          woiFields.push("woi.category as item_category");
        }

        console.log(`Fetching items for WO ${wo.id} (Vehicle ${wo.vehicle_id})...`);
        const items = db.prepare(`
          SELECT ${woiFields.join(', ')}
          FROM work_order_items woi
          WHERE woi.work_order_id = ?
        `).all(wo.id);
        console.log(`  Items found: ${items.length}`);
      } catch (e: any) {
        console.error(`  Error in WO ${wo.id}:`, e.message);
      }
    });

    console.log("Finished checking all work orders.");

} catch (error: any) {
    console.error("Caught error:", error);
}

db.close();
