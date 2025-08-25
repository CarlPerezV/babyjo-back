
import { OrderModel } from "../models/order.model.js";
// import { log, logErr } from "../utils/logger.js";

export const checkout = async (req, res) => {
    try {

        if (!req.user?.id) {
            return res.status(401).json({ message: "No autorizado" });
        }
        const userId = req.user?.id ?? null; // requiere verifyToken si quieres forzar login
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        const paymentMethod = req.body.paymentMethod || "pending";

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Items vacíos" });
        }

        const result = await OrderModel.createOrder(userId, items, paymentMethod);

        // mensaje de registro en consola
        // log("order.created", {
        //     userId, items, paymentMethod, items: items.map(i => ({
        //         name: i.name,
        //         productId: i.productId,
        //         size: i.size,
        //         quantity: i.quantity,
        //     })),
        // });

        return res.status(201).json(result);
    } catch (e) {
        console.error("Checkout error:", e);
        // logErr("order.created.failed", {
        //     user_id: req?.user?.id,
        //     reason: e?.message,
        //     ip: req.ip,
        // });
        const msg = e.message || "Error en checkout";
        // Si es por stock insuficiente u otra validación → 400
        if (/Stock insuficiente|no encontrado|inválido/i.test(msg)) {
            return res.status(400).json({ message: msg });
        }
        return res.status(500).json({ message: "Error interno" });
    }
};

export const salesSummary = async (_req, res) => {
    try {
        const sum = await OrderModel.summary();
        return res.json(sum);
    } catch (e) {
        console.error("Sales summary error:", e);
        return res.status(500).json({ message: "Error interno" });
    }
};
