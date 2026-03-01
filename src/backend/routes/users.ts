import express from "express";
import db from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", (req: AuthRequest, res) => {
  const users = db.prepare("SELECT id, name, role FROM users WHERE tenant_id = ? ORDER BY name ASC")
    .all(req.user!.tenant_id);
  res.json(users);
});

export default router;
