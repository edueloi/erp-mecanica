import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initDb } from "./src/backend/db";
import authRoutes from "./src/backend/routes/auth";
import clientRoutes from "./src/backend/routes/clients";
import vehicleRoutes from "./src/backend/routes/vehicles";
import workOrderRoutes from "./src/backend/routes/workOrders";
import dashboardRoutes from "./src/backend/routes/dashboard";
import userRoutes from "./src/backend/routes/users";
import appointmentRoutes from "./src/backend/routes/appointments";
import partsRoutes from "./src/backend/routes/parts";
import supplierRoutes from "./src/backend/routes/suppliers";
import purchaseOrderRoutes from "./src/backend/routes/purchaseOrders";
import accountsReceivableRoutes from "./src/backend/routes/accountsReceivable";
import settingsRoutes from "./src/backend/routes/settings";
import cashflowRoutes from "./src/backend/routes/cashflow";
import whatsappRoutes from "./src/backend/routes/whatsapp";
import actionPlansRoutes from "./src/backend/routes/actionPlans";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  console.log("🗄️  Initializing database...");
  try {
    initDb();
    console.log("✅ Database initialized successfully");
  } catch (error: any) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/vehicles", vehicleRoutes);
  app.use("/api/work-orders", workOrderRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/parts", partsRoutes);
  app.use("/api/suppliers", supplierRoutes);
  app.use("/api/purchase-orders", purchaseOrderRoutes);
  app.use("/api/accounts-receivable", accountsReceivableRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/cashflow", cashflowRoutes);
  app.use("/api/whatsapp", whatsappRoutes);
  app.use("/api/action-plans", actionPlansRoutes);

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("❌ Unhandled error:", err);
    console.error("Stack:", err.stack);
    res.status(500).json({ 
      error: err.message || "Internal server error", 
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MecaERP running on http://localhost:${PORT}`);
  });
}

startServer();
