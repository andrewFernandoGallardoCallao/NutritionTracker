import User from "../models/user.js";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import {
  calculateBMR,
  calculateMacronutrients,
  getActivityFactor,
} from "../services/nutritionService.js";
import { sendVerificationEmail } from "../services/sendEmailService.js";

// Almacenar códigos 2FA por usuario
const twoFACodes = new Map();

export const register = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      name,
      last_name,
      email,
      password,
      weight,
      height,
      gender,
      birthdate,
      activity_level,
      objective,
    } = req.body;

    // Validación de campos
    if (
      !name ||
      !last_name ||
      !email ||
      !password ||
      !weight ||
      !height ||
      !gender ||
      !birthdate ||
      !activity_level ||
      !objective
    ) {
      return res.status(400).json({ 
        message: "Todos los campos son requeridos" 
      });
    }

    // Iniciar transacción
    await connection.beginTransaction();

    // 1. Insertar en tabla 'person'
    const [personResult] = await connection.query(
      "INSERT INTO person (name, last_name, birthdate, gender, weight_value, height_value, activity_level, objective) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        last_name,
        birthdate,
        gender,
        weight,
        height,
        activity_level,
        objective,
      ]
    );

    const bmr = calculateBMR({ weight, height, gender, birthdate });
    const calories = bmr * getActivityFactor(activity_level);
    const macros = calculateMacronutrients(calories, objective);

    // 2. Insertar en tabla 'nutritional_requirements'
    await connection.query(
      `INSERT INTO nutritional_requirements 
       (personid, date, daily_calories, protein_grams, fat_grams, carbs_grams)
       VALUES (?, CURDATE(), ?, ?, ?, ?)`,
      [
        personResult.insertId,
        macros.daily_calories,
        macros.protein_grams,
        macros.fat_grams,
        macros.carbs_grams,
      ]
    );

    // 3. Insertar en tabla 'user' - SIN email_verified
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      "INSERT INTO user (personid, email, username, password_hash) VALUES (?, ?, ?, ?)",
      [personResult.insertId, email, email, hashedPassword]
    );

    // 4. Generar y enviar código 2FA
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 15 * 60 * 1000; // 15 minutos

    // Guardar código 2FA
    twoFACodes.set(email, {
      code: verificationCode,
      expiresAt: expirationTime,
      attempts: 0,
      userId: userResult.insertId
    });

    // 5. Enviar email con código 2FA
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log('✅ Email de verificación enviado a:', email);
    } catch (emailError) {
      console.error("❌ Error enviando email 2FA:", emailError);
    }

    // 6. Generar token TEMPORAL (solo para verificación 2FA)
    const tempToken = jwt.sign(
      { 
        userId: userResult.insertId,
        email: email,
        requires2FA: true,
        temp: true
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    await connection.commit();
    connection.release();

    // Respuesta indicando que requiere 2FA
    res.status(201).json({
      status: "requires_2fa",
      message: "Registro exitoso. Se ha enviado un código de verificación a tu email.",
      tempToken: tempToken,
      email: email,
      requires2FA: true
    });

  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      await connection.rollback();
      connection.release();
    }

    console.error("Error en registro:", error);

    // Manejar errores específicos
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    res.status(500).json({
      status: "error",
      message: "Error en el servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { email, code, tempToken } = req.body;

    console.log('📧 Verificando 2FA para:', email);
    console.log('🔢 Código recibido:', code);

    if (!email || !code) {
      return res.status(400).json({
        status: "error",
        message: "Email y código son requeridos"
      });
    }

    // Verificar token temporal
    let decodedToken;
    try {
      decodedToken = jwt.verify(tempToken, process.env.JWT_SECRET);
      console.log('✅ Token verificado. UserId:', decodedToken.userId);
    } catch (tokenError) {
      console.log('❌ Error verificando token:', tokenError.message);
      return res.status(400).json({
        status: "error", 
        message: "Token inválido o expirado"
      });
    }

    // Verificar código 2FA
    const storedData = twoFACodes.get(email);
    
    if (!storedData) {
      console.log('❌ No se encontró código para:', email);
      return res.status(400).json({
        status: "error",
        message: "Código no encontrado o expirado. Solicita un nuevo código."
      });
    }

    // Verificar expiración
    if (Date.now() > storedData.expiresAt) {
      console.log('❌ Código expirado');
      twoFACodes.delete(email);
      return res.status(400).json({
        status: "error",
        message: "El código ha expirado. Solicita un nuevo código."
      });
    }

    // Verificar intentos
    if (storedData.attempts >= 5) {
      console.log('❌ Demasiados intentos:', storedData.attempts);
      twoFACodes.delete(email);
      return res.status(400).json({
        status: "error",
        message: "Demasiados intentos fallidos. Solicita un nuevo código."
      });
    }

    // Verificar código
    if (storedData.code !== code.toString().trim()) {
      storedData.attempts += 1;
      twoFACodes.set(email, storedData);
      console.log('❌ Código incorrecto. Intentos:', storedData.attempts);
      
      return res.status(400).json({
        status: "error",
        message: `Código incorrecto. Te quedan ${5 - storedData.attempts} intentos`
      });
    }

    console.log('✅ Código correcto!');

    // Código correcto - limpiar código
    twoFACodes.delete(email);

    // OBTENER TODOS LOS DATOS DEL USUARIO PARA EL FRONTEND
    const [userRows] = await pool.query(
      `SELECT 
        p.id as person_id,
        p.name,
        p.last_name,
        p.birthdate,
        p.gender,
        p.weight_value as weight,
        p.height_value as height,
        p.activity_level,
        p.objective,
        u.email
      FROM person p
      JOIN user u ON p.id = u.personid
      WHERE u.email = ?`,
      [email]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    const userData = userRows[0];

    // Generar token FINAL de acceso
    const finalToken = jwt.sign(
      { 
        userId: userData.person_id,
        email: email,
        verified: true
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log('✅ Token final generado para usuario:', userData.person_id);
    console.log('📋 Datos del usuario a enviar:', userData);

    return res.status(200).json({
      status: "success",
      message: "Verificación exitosa. Bienvenido a NutriTrack!",
      token: finalToken,
      user: {
        id: userData.person_id,
        name: userData.name,
        last_name: userData.last_name,
        email: userData.email,
        birthdate: userData.birthdate,
        gender: userData.gender,
        weight: userData.weight,
        height: userData.height,
        activity_level: userData.activity_level,
        objective: userData.objective
      }
    });

  } catch (error) {
    console.error("🔥 Error en verificación 2FA:", error);
    return res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const resend2FACode = async (req, res) => {
  try {
    const { email, tempToken } = req.body;

    console.log('🔄 Reenviando código para:', email);

    // Verificar token temporal
    try {
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      console.log('✅ Token válido para reenvío');
    } catch (tokenError) {
      return res.status(400).json({
        status: "error",
        message: "Token inválido o expirado"
      });
    }

    // Generar nuevo código
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 15 * 60 * 1000;

    // Actualizar código
    const existingData = twoFACodes.get(email);
    twoFACodes.set(email, {
      ...existingData,
      code: newCode,
      expiresAt: expirationTime,
      attempts: 0
    });

    // Reenviar email
    await sendVerificationEmail(email, newCode);

    console.log('✅ Nuevo código enviado a:', email);

    return res.status(200).json({
      status: "success",
      message: "Nuevo código enviado a tu email",
      email: email
    });

  } catch (error) {
    console.error("Error reenviando código 2FA:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al reenviar el código",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('👤 Obteniendo perfil para userId:', userId);

    // Obtener datos de person y user
    const [userRows] = await pool.query(
      `SELECT 
        p.id as person_id,
        p.name,
        p.last_name,
        p.birthdate,
        p.gender,
        p.weight_value as weight,
        p.height_value as height,
        p.activity_level,
        p.objective,
        u.email
      FROM person p
      JOIN user u ON p.id = u.personid
      WHERE p.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    const user = userRows[0];

    console.log('✅ Perfil encontrado:', user.name);

    res.json({
      status: "success",
      user: {
        id: user.person_id,
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        birthdate: user.birthdate,
        gender: user.gender,
        weight: user.weight,
        height: user.height,
        activity_level: user.activity_level,
        objective: user.objective
      }
    });

  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({
      status: "error",
      message: "Error del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const getNutritionalRequirements = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🍎 Obteniendo requisitos nutricionales para userId:', userId);

    // Obtener requisitos nutricionales más recientes
    const [requirementsRows] = await pool.query(
      `SELECT 
        daily_calories,
        protein_grams,
        fat_grams,
        carbs_grams,
        date
      FROM nutritional_requirements 
      WHERE personid = ? 
      ORDER BY date DESC 
      LIMIT 1`,
      [userId]
    );

    if (requirementsRows.length === 0) {
      console.log('⚠️ No se encontraron requisitos nutricionales para userId:', userId);
      return res.status(404).json({
        status: "error",
        message: "No se encontraron requisitos nutricionales"
      });
    }

    const requirements = requirementsRows[0];

    console.log('✅ Requisitos encontrados:', requirements);

    res.json({
      status: "success",
      requirements: {
        daily_calories: requirements.daily_calories,
        protein_grams: requirements.protein_grams,
        fat_grams: requirements.fat_grams,
        carbs_grams: requirements.carbs_grams,
        date: requirements.date
      }
    });

  } catch (error) {
    console.error("Error obteniendo requisitos nutricionales:", error);
    res.status(500).json({
      status: "error",
      message: "Error del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const getWeightHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('⚖️ Obteniendo historial de peso para userId:', userId);

    // Obtener historial de peso (últimos 7 registros)
    const [weightRows] = await pool.query(
      `SELECT 
        date,
        weight
      FROM weight_history 
      WHERE personid = ? 
      ORDER BY date DESC 
      LIMIT 7`,
      [userId]
    );

    console.log('✅ Historial de peso encontrado:', weightRows.length, 'registros');

    res.json({
      status: "success",
      weightHistory: weightRows.map(row => ({
        date: row.date,
        weight: row.weight
      }))
    });

  } catch (error) {
    console.error("Error obteniendo historial de peso:", error);
    res.status(500).json({
      status: "error",
      message: "Error del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const getTodayConsumption = async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    console.log('🍽️ Obteniendo consumo de hoy para userId:', userId, 'fecha:', today);

    // Obtener consumo de hoy
    const [consumptionRows] = await pool.query(
      `SELECT 
        SUM(quantity_grams * m.calories / 100) as total_calories,
        SUM(quantity_grams * m.protein_grams / 100) as total_protein,
        SUM(quantity_grams * m.fat_grams / 100) as total_fat,
        SUM(quantity_grams * m.carbs_grams / 100) as total_carbs
      FROM tool_consumption tc
      JOIN meal m ON tc.barcode = m.barcode
      WHERE tc.personid = ? AND tc.date = ?`,
      [userId, today]
    );

    const consumption = consumptionRows[0];

    console.log('✅ Consumo de hoy:', consumption);

    res.json({
      status: "success",
      consumption: {
        calories: consumption.total_calories || 0,
        protein: consumption.total_protein || 0,
        fat: consumption.total_fat || 0,
        carbs: consumption.total_carbs || 0
      }
    });

  } catch (error) {
    console.error("Error obteniendo consumo de hoy:", error);
    res.status(500).json({
      status: "error",
      message: "Error del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const change_password = async (req, res) => {
  const { userId } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  try {
    // 1. Verificar usuario y contraseña
    const [userRows] = await pool.query(
      `
      SELECT 
        u.personid, 
        u.password_hash
      FROM user u
      WHERE u.personid = ?
    `,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = userRows[0];

    // 2. Verificar contraseña antigua
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash
    );
    if (!isOldPasswordValid) {
      return res.status(401).json({ error: "Contraseña antigua incorrecta" });
    }

    // 3. Hashear nueva contraseña y actualizar en la base de datos
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `
      UPDATE user u
      SET u.password_hash = ?
      WHERE u.personid = ?
    `,
      [newPasswordHash, userId]
    );

    res.json({
      status: "success",
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      error: "Error del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Limpiar códigos expirados cada hora
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [email, data] of twoFACodes.entries()) {
    if (now > data.expiresAt) {
      twoFACodes.delete(email);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Limpiados ${cleaned} códigos expirados`);
  }
}, 60 * 60 * 1000);