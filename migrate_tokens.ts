import db from './src/backend/db';

try {
  db.exec("ALTER TABLE vehicle_checklists ADD COLUMN public_token TEXT");
  db.exec("ALTER TABLE vehicle_checklists ADD COLUMN token_expires_at DATETIME");
  console.log("Migration successful: Added public_token and token_expires_at");
} catch (e) {
  console.log("Migration skipped: Columns already exist or error occurred.");
}
process.exit(0);
