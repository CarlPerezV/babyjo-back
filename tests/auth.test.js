import request from "supertest";
import { beforeAll, afterEach, describe, it, expect, vi } from "vitest";

// Seteamos el secreto ANTES de importar nada que lo use
beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
});

// Mock del modelo de usuario para NO tocar la BD
vi.mock("../src/models/user.model.js", () => {
    return {
        UserModel: {
            // reemplazaremos implementaciones caso a caso
            createUser: vi.fn(),
            findUserByEmail: vi.fn(),
            findById: vi.fn(),
        },
    };
});

// Mock de bcrypt para controlar comparación de contraseñas
vi.mock("bcryptjs", () => {
    return {
        default: {
            compare: vi.fn(),       // usado en login
            genSaltSync: vi.fn(() => "salt"),
            hashSync: vi.fn(() => "hashed"),
        },
    };
});

import app from "../src/app.js";
import { UserModel } from "../src/models/user.model.js";
import bcrypt from "bcryptjs";

// Limpia mocks entre tests
afterEach(() => {
    vi.clearAllMocks();
});

describe("Auth: /api/auth", () => {
    // ---------- REGISTER ----------
    describe("POST /api/auth/register", () => {
        it("400 si faltan campos", async () => {
            const res = await request(app).post("/api/auth/register").send({ email: "a@a.cl" });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty("message");
        });

        it("409 si el usuario ya existe", async () => {
            UserModel.findUserByEmail.mockResolvedValueOnce({ id: 1, email: "a@a.cl" });

            const res = await request(app)
                .post("/api/auth/register")
                .send({ firstName: "A", lastName: "B", email: "a@a.cl", password: "123" });

            expect(res.statusCode).toBe(409);
        });

        it("201 si registro exitoso entrega token y user", async () => {
            UserModel.findUserByEmail.mockResolvedValueOnce(null);
            UserModel.createUser.mockResolvedValueOnce({
                id: 10, first_name: "A", last_name: "B", email: "a@a.cl", role_id: 2,
            });

            const res = await request(app)
                .post("/api/auth/register")
                .send({ firstName: "A", lastName: "B", email: "a@a.cl", password: "123" });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("token");
            expect(res.body).toHaveProperty("user");
            expect(res.body.user).toMatchObject({ email: "a@a.cl", role_id: 2 });
        });
    });

    // ---------- LOGIN ----------
    describe("POST /api/auth/login", () => {
        it("400 si faltan credenciales", async () => {
            const res = await request(app).post("/api/auth/login").send({ email: "a@a.cl" });
            expect(res.statusCode).toBe(400);
        });

        it("401 si el usuario no existe", async () => {
            UserModel.findUserByEmail.mockResolvedValueOnce(null);

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "a@a.cl", password: "123" });

            expect(res.statusCode).toBe(401);
        });

        it("401 si la contraseña es inválida", async () => {
            UserModel.findUserByEmail.mockResolvedValueOnce({ id: 1, email: "a@a.cl", password: "hashed" });
            bcrypt.compare.mockResolvedValueOnce(false);

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "a@a.cl", password: "mala" });

            expect(res.statusCode).toBe(401);
        });

        it("200 si login exitoso entrega token y user", async () => {
            UserModel.findUserByEmail.mockResolvedValueOnce({
                id: 2, first_name: "A", last_name: "B", email: "a@a.cl", password: "hashed", role_id: 2,
            });
            bcrypt.compare.mockResolvedValueOnce(true);

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "a@a.cl", password: "123" });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("token");
            expect(res.body).toHaveProperty("user");
            expect(res.body.user).toMatchObject({ email: "a@a.cl", role_id: 2 });
        });
    });

    // ---------- ME (requiere token) ----------
    describe("GET /api/auth/me", () => {
        it("401 si no envía Bearer token", async () => {
            const res = await request(app).get("/api/auth/me");
            expect(res.statusCode).toBe(401);
        });

        it("200 devuelve el perfil si el token es válido", async () => {
            // Simula que el usuario existe en la BD
            UserModel.findById.mockResolvedValueOnce({
                id: 5, first_name: "N", last_name: "U", email: "n@u.cl", role_id: 2,
            });

            // Creamos un token real con el secret de test
            const jwt = await import("jsonwebtoken");
            const token = jwt.default.sign({ id: 5, email: "n@u.cl", role_id: 2 }, process.env.JWT_SECRET, { expiresIn: "1h" });

            const res = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("user");
            expect(res.body.user).toMatchObject({ email: "n@u.cl", role_id: 2 });
        });
    });
});
