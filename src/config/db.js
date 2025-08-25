import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;
const isTest = process.env.NODE_ENV === "test";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: Number(process.env.DB_PORT)
});

export async function testDB() {
    const { rows } = await pool.query("SELECT NOW()");
    return rows[0];
}

export default pool;
