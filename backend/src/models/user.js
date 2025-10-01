import pool from "../config/db.js";

class User {
  static async create({ person_id, username, email, password_hash }) {
    const [result] = await pool.query(
      "INSERT INTO user (person_id, username, email, password_hash) VALUES (?, ?, ?, ?)",
      [person_id, username, email, password_hash]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }
}

export default User;
