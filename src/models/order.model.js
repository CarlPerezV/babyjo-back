import pool from "../config/db.js";

export const OrderModel = {
    async createOrder(userId, items, paymentMethod = "cash") {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1) Crear orden pendiente con total 0
            const insertOrder = `INSERT INTO orders (user_id, total, status, payment_method) VALUES ($1, 0, 'pending', $2) RETURNING id, user_id, total, status, payment_method, created_at`;
            const { rows: orderRows } = await client.query(insertOrder, [userId ?? null, paymentMethod]);
            const order = orderRows[0];

            // 2) Por cada item: validar, bloquear stock, descontar e insertar línea (price = unitario)
            for (const it of items) {
                const productId = Number(it.productId);
                const size = String(it.size || "").trim();
                const quantity = Number(it.quantity);

                if (!productId || !size || !Number.isInteger(quantity) || quantity <= 0) {
                    throw new Error("Item inválido (productId/size/quantity)");
                }

                // Traer precio y stock con lock
                const q = `SELECT p.id, p.price, i.quantity FROM products p JOIN inventory i ON i.product_id = p.id AND i.size = $2 WHERE p.id = $1 FOR UPDATE
        `;
                const { rows } = await client.query(q, [productId, size]);
                if (!rows[0]) throw new Error(`Producto ${productId} talla ${size} no encontrado`);

                const { price, quantity: currentQuantity } = rows[0];
                if (quantity > currentQuantity) {
                    throw new Error(`Stock insuficiente para producto ${productId} talla ${size} (disp: ${currentQuantity})`);
                }

                // Descontar stock
                await client.query(
                    `UPDATE inventory SET quantity = $3 WHERE product_id = $1 AND size = $2`,
                    [productId, size, currentQuantity - quantity]
                );

                // Insertar línea: usa 'price' (precio unitario). NO 'unit_price', NO 'subtotal'
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, size, quantity, price)VALUES ($1, $2, $3, $4, $5)`,
                    [order.id, productId, size, quantity, price]
                );
            }

            // 3) Actualizar total desde la BD (SUM(quantity * price))
            const { rows: [{ sum }] } = await client.query(
                `SELECT COALESCE(SUM(quantity * price), 0) AS sum FROM order_items WHERE order_id = $1`,
                [order.id]
            );

            const { rows: updated } = await client.query(
                `UPDATE orders SET total = $2 WHERE id = $1 RETURNING *`,
                [order.id, sum]
            );

            await client.query("COMMIT");

            // 4) Devolver líneas + subtotal calculado al vuelo (no almacenado)
            const { rows: itemsRows } = await client.query(
                `SELECT product_id, size, quantity, price FROM order_items WHERE order_id = $1 ORDER BY id`,
                [order.id]
            );

            const itemsWithSubtotal = itemsRows.map((it) => ({
                ...it,
                subtotal: Number(it.quantity) * Number(it.price),
            }));

            return { order: updated[0], items: itemsWithSubtotal };
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    },

    async listByUser(userId) {
        const q = `SELECT o.id, o.created_at AS order_date, o.total, o.status, o.payment_method, COALESCE(json_agg(json_build_object('product_id', oi.product_id, 'name', p.name, 'size', oi.size, 'quantity', oi.quantity, 'unit_price', oi.price, 'line_total', (oi.quantity * oi.price))) FILTER (WHERE oi.id IS NOT NULL), '[]' ) AS items FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id LEFT JOIN products p ON p.id = oi.product_id WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`;
        const { rows } = await pool.query(q, [userId]);
        return rows;
    },
};
