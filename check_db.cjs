const Database = require("better-sqlite3");
const db = new Database("database.sqlite");

console.log("Checking tables...");
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Existing tables:", tables.map(t => t.name).join(", "));
  
  const tablesToCheck = ['warranty_templates', 'warranty_terms'];
  for (const table of tablesToCheck) {
      const exists = tables.find(t => t.name === table);
      console.log(`${table}: ${exists ? "EXISTS" : "NOT FOUND"}`);
      if (exists) {
          const info = db.prepare(`PRAGMA table_info(${table})`).all();
          console.log(`- Columns for ${table}:`, info.map(c => `${c.name} (${c.type})`).join(", "));
      }
  }
} catch (error) {
  console.error("Error checking tables:", error);
} finally {
  db.close();
}
