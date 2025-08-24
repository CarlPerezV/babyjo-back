import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Rutas 
import authRoutes from "./src/routes/auth.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import orderRoutes from "./src/routes/order.routes.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
    res.json({ message: "✅ Backend conectado correctamente" });
});

// Rutas
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});