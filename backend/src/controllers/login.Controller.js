import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

      
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Email y contraseña son requeridos",
    });
  }

  try {
    // 1. Buscar usuario en la DB (incluyendo datos de 'person')
    const [userRows] = await pool.query(
      `
      SELECT 
        p.id AS id,
        u.email, 
        u.password_hash,
        u.personid,
        p.name,
        p.last_name
      FROM user u
      JOIN person p ON u.personid = p.id
      WHERE u.email = ?
    `,
      [email]
    );

    if (userRows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas", // Mensaje genérico por seguridad
      });
    }

    const user = userRows[0];

    // 2. Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas",
      });
    }

    // 3. Generar token JWT (con más datos útiles si los necesitas)
    const token = jwt.sign(
      {
        userId: user.id,
        personId: user.person_id, // ← Útil si accedes a 'person' después
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Respuesta exitosa (omite datos sensibles como password_hash)
    res.status(200).json({
      status: "success",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        last_name: user.last_name,
        person_id: user.person_id, // ← Para futuras consultas
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
