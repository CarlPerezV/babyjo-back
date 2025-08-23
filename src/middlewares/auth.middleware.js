// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
    try {
        const auth = req.headers.authorization || "";
        const [scheme, token] = auth.split(" ");
        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({ message: "No autorizado" });
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
};
