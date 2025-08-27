import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";
import { log, logErr } from "../utils/logger.js";

const signToken = (payload) => {
    if (!process.env.JWT_SECRET) {
        console.error("[AUTH] JWT_SECRET not configured");
        throw new Error("JWT_SECRET no está definido en las variables de entorno");
    }
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// REGISTRO
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "Faltan campos requeridos" });
        }

        const emailNorm = email.trim().toLowerCase();

        // Verificar si ya existe
        const existingUser = await UserModel.findUserByEmail(emailNorm);
        if (existingUser) {
            return res.status(409).json({ error: "El usuario ya existe" });
        }

        // Encriptar contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Pasar el registro a user.model
        const newUser = await UserModel.createUser(firstName, lastName, emailNorm, hashedPassword);

        const user = {
            id: newUser.id,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            email: newUser.email,
            role_id: newUser.role_id,
        };

        const token = signToken({ id: user.id, email: user.email, role_id: user.role_id });

        res.status(201).json({
            message: "Usuario registrado correctamente",
            user,
            token,
        });
    } catch (error) {

        console.error("Error en registro:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`[AUTH] login attempt email=${email}`);

        if (!email || !password) {
            return res.status(400).json({ message: "Faltan credenciales" });
        }
        const emailNorm = email.trim().toLowerCase();
        // Buscar usuario
        const row = await UserModel.findUserByEmail(emailNorm);

        if (!row) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Comparar contraseña
        const validPassword = await bcrypt.compare(password, row.password);
        if (!validPassword) return res.status(401).json({ error: "Credenciales inválidas" });

        const user = {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            role_id: row.role_id,
        };

        // Solo para probar en desarrollo
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("[AUTH] Missing JWT_SECRET env var");
            // Opcional: log estructurado
            logErr?.("auth.login.failed", { reason: "missing_jwt_secret", email });
            return res.status(500).json({ message: "Configuración de token ausente" });
        }

        const token = signToken({ id: user.id, email: user.email, role_id: user.role_id });

        log("auth.login.ok", { email, userId: row.id });

        return res.json({
            token, user
        });
    } catch (error) {
        logErr("user.login.failed", { email: req?.body?.email?.toLowerCase?.(), reason: error?.message, ip: req.ip });
        res.status(500).json({ error: "Error en el login" });
    }
};

export const me = async (req, res) => {
    try {
        const row = await UserModel.findById(req.user.id);
        if (!row) return res.status(404).json({ message: "Usuario no encontrado" });

        const user = {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            role_id: row.role_id,
        };

        return res.json({ user });
    } catch (error) {
        console.error("Error en /me:", error);
        return res.status(500).json({ message: "Error obteniendo el perfil" });
    }
};
