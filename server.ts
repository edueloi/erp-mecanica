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

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initDb();

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
