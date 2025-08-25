import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js"; // tu app principal

// Test de smoke: comprobar que el servidor responde
describe("Smoke test", () => {
    it("GET / debería responder con 200", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(200);
    });
});
