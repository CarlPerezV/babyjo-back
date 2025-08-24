import pool from "../config/db.js";

export const ProductModel = {

    async createProduct({ name, description, price, image_url, rating = 0, sizes = [] }) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const insertProduct = `INSERT INTO products (name, description, price, image_url, rating) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, price, image_url, rating`;
            const values = [name, description, price, image_url, Number(rating) || 0];
            const { rows } = await client.query(insertProduct, values);
            const product = rows[0];

            // Normaliza tallas → [{ size, quantity }]
            const sizesValues = Array.isArray(sizes)
                ? sizes
                    .map((item) => ({
                        size: String(item?.size || "").trim(),
                        quantity: Number(item?.stock ?? item?.quantity ?? 0),
                    }))
                    .filter((s) => s.size && Number.isInteger(s.quantity) && s.quantity >= 0)
                : [];

            if (sizesValues.length > 0) {
                const sizeArr = sizesValues.map((s) => s.size);
                const quantityArr = sizesValues.map((s) => Math.trunc(s.quantity));
                await client.query(
                    `INSERT INTO inventory (product_id, size, quantity) SELECT $1, UNNEST($2::text[]), UNNEST($3::int[]) ON CONFLICT (product_id, size) DO UPDATE SET quantity = EXCLUDED.quantity`,
                    [product.id, sizeArr, quantityArr]
                );
            }

            await client.query("COMMIT");
            return this.findById(product.id);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    },

    // LISTA productos con sizes + stock (json array)
    async findAll({ limit = 10, offset = 0 } = {}) {
        const query = `SELECT p.id, p.name, p.description, p.price, p.image_url, p.rating, COALESCE(json_agg(json_build_object('size', i.size, 'stock', i.quantity) ORDER BY i.size) FILTER (WHERE i.size IS NOT NULL), '[]' ) AS sizes FROM products p LEFT JOIN inventory i ON i.product_id = p.id GROUP BY p.id ORDER BY p.id DESC LIMIT $1 OFFSET $2`;
        const result = await pool.query(query, [limit, offset]);
        return result.rows;
    },

    // DETALLE con sizes + stock (json array)
    async findById(id) {
        const query = `SELECT p.id, p.name, p.description, p.price, p.image_url, p.rating, COALESCE(json_agg(json_build_object('size', i.size, 'stock', i.quantity)) FILTER (WHERE i.size IS NOT NULL), '[]' ) AS sizes FROM products p LEFT JOIN inventory i ON i.product_id = p.id WHERE p.id = $1 GROUP BY p.id`;

        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },
};
