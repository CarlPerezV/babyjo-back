
import { OrderModel } from "../models/order.model.js";
// import { log, logErr } from "../utils/logger.js";

export const checkout = async (req, res) => {
    try {

        if (!req.user?.id) {
            return res.status(401).json({ message: "No autorizado" });
        }
        const userId = req.user?.id ?? null; // ID del usuario autenticado
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        const paymentMethod = req.body.paymentMethod || "pending";

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Items vacíos" });
        }

        const result = await OrderModel.createOrder(userId, items, paymentMethod);


        return res.status(201).json(result);
    } catch (e) {
        console.error("Checkout error:", e);

        const msg = e.message || "Error en checkout";
        // Si es por stock insuficiente u otra validación → 400
        if (/Stock insuficiente|no encontrado|inválido/i.test(msg)) {
            return res.status(400).json({ message: msg });
        }
        return res.status(500).json({ message: "Error interno" });
    }
};

export const myOrders = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
    }

    try {
        const orders = await OrderModel.listByUser(userId);
        return res.json({ orders });
    } catch (e) {
        console.error("myOrders error:", e);
        return res.status(500).json({ message: "Error obteniendo tus compras" });
    }
};