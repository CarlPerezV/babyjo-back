// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No autorizado" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    } catch {
        return res.status(401).json({ message: "Token inválido" });
    }
};

export function adminOnly(req, res, next) {
    if (Number(req.user?.role) === 1) return next(); // role 1 = admin
    return res.status(403).json({ message: "Requiere rol administrador" });
}