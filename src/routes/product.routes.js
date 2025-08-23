import express from "express";
import { addProduct, listProducts, getProductById } from "../controllers/product.controller.js";

const router = express.Router();

// POST /api/products
router.post("/", addProduct);

// GET /api/products
router.get("/", listProducts);
router.get("/:id", getProductById);

export default router;
