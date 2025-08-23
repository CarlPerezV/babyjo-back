import format from "pg-format";
import pool from "../config/db.js";

export const UserModel = {
    async createUser(firstName, lastName, email, hashedPassword, roleId = 2) {
        const query = format("INSERT INTO users (first_name, last_name, email, password, role_id) VALUES (%L) RETURNING id, first_name, last_name, email, role_id", [firstName, lastName, email, hashedPassword, roleId]);
        const result = await pool.query(query);
        return result.rows[0];
    },

    async findUserByEmail(email) {
        const query = format("SELECT * FROM users WHERE email = %L", [email]);
        const result = await pool.query(query);
        return result.rows[0];
    },

    async findById(id) {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return result.rows[0];
    },

};
