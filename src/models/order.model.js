import pool from "../config/db.js";
import { log, logErr } from "../utils/logger.js";


export const OrderModel = {

    async createOrder(userId, items, paymentMethod = "pending") {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const insertOrder = `INSERT INTO orders (user_id, total, status, payment_method) VALUES ($1, 0, 'pending', $2) RETURNING id, user_id, total, status, payment_method, created_at`;
            const { rows: orderRows } = await client.query(insertOrder, [userId ?? null, paymentMethod]);
            const order = orderRows[0];

            let total = 0;

            // 2) Por cada item: control de stock, descuento e inserción de línea
            for (const it of items) {
                const productId = Number(it.productId);
                const size = String(it.size || "").trim();
                const quantity = Number(it.quantity);

                if (!productId || !size || !Number.isInteger(quantity) || quantity <= 0) {
                    throw new Error("Item inválido (productId/size/quantity)");
                }

                // Trae precio y stock con lock
                const query = `SELECT p.id, p.price, i.quantity FROM products p JOIN inventory i ON i.product_id = p.id AND i.size = $2 WHERE p.id = $1 FOR UPDATE`;
                const { rows } = await client.query(query, [productId, size]);

                if (!rows[0]) {
                    throw new Error(`Producto ${productId} talla ${size} no encontrado`);
                }

                const { price, quantity: currentQuantity } = rows[0];

                if (quantity > currentQuantity) {
                    throw new Error(`Stock insuficiente para producto ${productId} talla ${size} (disp: ${currentQuantity})`);
                }

                // Descuenta stock
                const newQuantity = currentQuantity - quantity;
                await client.query(
                    `UPDATE inventory SET quantity = $3 WHERE product_id = $1 AND size = $2`,
                    [productId, size, newQuantity]
                );

                const subtotal = price * quantity;
                total += subtotal;

                // Inserta detalle
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, size, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [order.id, productId, size, quantity, price, subtotal]
                );
            }

            // 3) Actualiza total
            const { rows: updated } = await client.query(
                `UPDATE orders SET total = $2 WHERE id = $1 RETURNING *`,
                [order.id, total]
            );

            await client.query("COMMIT");

            // 4) Devuelve orden y líneas
            const { rows: itemsRows } = await pool.query(`SELECT product_id, size, quantity, unit_price, subtotal FROM order_items WHERE order_id = $1 ORDER BY id`, [order.id]);

            return { order: updated[0], items: itemsRows };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    },

    async summary() {
        const { rows } = await pool.query(`SELECT COUNT(*)::int AS orders_count, COALESCE(SUM(total),0)::int AS total FROM orders WHERE status = 'pending'`);
        return rows[0];
    },
};
