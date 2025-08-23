import pool from "../config/db.js";

export const ProductModel = {
    async createProduct({ name, description, price, image_url, rating = 4.0, sizes = [] }) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const insertProduct = `INSERT INTO products (name, description, price, image_url, rating) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, price, image_url, rating`;
            const { rows } = await client.query(insertProduct, [
                name,
                description,
                price,
                image_url,
                rating,
            ]);
            const product = rows[0];

            let sizesValues = [];
            if (Array.isArray(sizes) && sizes.length > 0) {
                sizesValues = sizes
                    .map((item) => {
                        if (item && typeof item === "object" && "size" in item) {
                            return {
                                size: String(item.size ?? "").trim(),
                                stock: Number(item.stock),
                            };
                        }
                        // Si viene como string/number, stock por defecto 0
                        return {
                            size: String(item ?? "").trim(),
                            stock: 0,
                        };
                    })
                    .filter((s) => s.size && Number.isFinite(s.stock) && s.stock >= 0);
            }

            if (sizesValues.length > 0) {
                const sizeArr = sizesValues.map((s) => s.size);
                const stockArr = sizesValues.map((s) => Math.trunc(s.stock)); // asegurar int

                await client.query(
                    `INSERT INTO product_sizes (product_id, size, stock) SELECT $1, UNNEST($2::text[]), UNNEST($3::int[]) ON CONFLICT (product_id, size) DO UPDATE SET stock = EXCLUDED.stock`,
                    [product.id, sizeArr, stockArr]
                );
            }

            const selectOne = `SELECT p.id, p.name, p.description, p.price, p.image_url, COALESCE(json_agg(json_build_object('size', ps.size, 'stock', ps.stock)) FILTER (WHERE ps.size IS NOT NULL), '[]') AS sizes FROM products p LEFT JOIN product_sizes ps ON ps.product_id = p.id WHERE p.id = $1 GROUP BY p.id`;
            const { rows: finalRows } = await client.query(selectOne, [product.id]);

            await client.query("COMMIT");
            return finalRows[0];
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    },

    async findAll({ limit = 10, offset = 0 } = {}) {
        const query = `SELECT p.id, p.name, p.description, p.price, p.image_url, p.rating, COALESCE(json_agg(json_build_object('size', ps.size, 'stock', ps.stock)) FILTER (WHERE ps.size IS NOT NULL), '[]' ) AS sizes FROM products p LEFT JOIN product_sizes ps ON ps.product_id = p.id GROUP BY p.id ORDER BY p.id DESC LIMIT $1 OFFSET $2`;
        const { rows } = await pool.query(query, [limit, offset]);
        return rows;
    },

    async findById(id) {
        const q = `SELECT p.id, p.name, p.description, p.price, p.image_url, p.rating, COALESCE(json_agg(json_build_object('size', ps.size, 'stock', ps.stock)) FILTER (WHERE ps.size IS NOT NULL), '[]' ) AS sizes FROM products p LEFT JOIN product_sizes ps ON ps.product_id = p.id WHERE p.id = $1 GROUP BY p.id`;
        const { rows } = await pool.query(q, [id]);
        return rows[0];
    },
};
