
import express from "express";
import { checkout, myOrders } from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Requiere login: si quieres permitir invitado, quita verifyToken y pasa userId = null
router.post("/checkout", requireAuth, checkout);

// lista SOLO las compras del usuario logueado
router.get("/my", requireAuth, myOrders);

export default router;
