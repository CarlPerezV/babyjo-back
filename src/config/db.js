import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;
const { DB_URL } = process.env;
const isProd = process.env.NODE_ENV === "production";

const config = {
    connectionString: process.env.DB_URL,
    ssl: isProd ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);
console.log(config)

// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASS,
//     port: Number(process.env.DB_PORT)
// });

export async function testDB() {
    const { rows } = await pool.query("SELECT NOW()");
    return rows[0];
}

export default pool;
