import { ProductModel } from "../models/product.model.js";

export const addProduct = async (req, res) => {
    try {
        const { name, description, price, rating, sizes = [], image_url = null } = req.body;

        const nameTrim = String(name).trim();
        if (!nameTrim) return res.status(400).json({ message: "El nombre es obligatorio" });

        const priceNum = Number(price);
        if (!Number.isFinite(priceNum) || priceNum < 0) {
            return res.status(400).json({ message: "Precio inválido" });
        }

        const ratingNum = rating === undefined || rating === null ? NaN : Number(rating);
        const ratingVal = Number.isFinite(ratingNum)
            ? Math.min(5, Math.max(0, Number(ratingNum.toFixed(1))))
            : Number((Math.random() * 1.5 + 3.5).toFixed(1));

        if (!Array.isArray(sizes)) {
            return res.status(400).json({ message: "sizes debe ser un arreglo" });
        }

        const product = await ProductModel.createProduct({
            name: nameTrim,
            description: String(description ?? ""),
            price: priceNum,
            rating: ratingVal,
            image_url: image_url || null,
            sizes,
        });

        return res.status(201).json({ product });

    } catch (err) {
        if (err.code === "23502") {
            console.log(err)
            return res.status(400).json({ message: "Falta un campo requerido (revisa price, name, etc.)" });
        }
        console.log(err)
        res.status(500).json({ error: "Error interno del servidor" });
    }
};


export const listProducts = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 10;
        const offset = Number(req.query.offset) || 0;
        const products = await ProductModel.findAll({ limit, offset });
        return res.json({ products });
    } catch (e) {
        console.error("Error listando productos:", e);
        return res.status(500).json({ message: "Error listando productos" });
    }
};

export const getProductById = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "ID inválido" });
    }
    const product = await ProductModel.findById(id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    return res.json({ product });
};