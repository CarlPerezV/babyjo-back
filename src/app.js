
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Rutas reales
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Ruta de salud
app.get("/", (_req, res) => {
    res.json({ message: "Backend OK" });
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

export default app;
