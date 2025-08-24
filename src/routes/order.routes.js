
import express from "express";
import { checkout, salesSummary } from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Requiere login: si quieres permitir invitado, quita verifyToken y pasa userId = null
router.post("/checkout", requireAuth, checkout);

// Resumen simple (puedes protegerlo por rol admin si quieres)
router.get("/summary", salesSummary);

export default router;
