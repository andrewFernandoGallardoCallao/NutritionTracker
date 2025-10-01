import pool from "../config/db.js";
import {
  calculateBMR,
  calculateMacronutrients,
  getActivityFactor,
} from "../services/nutritionService.js";

export const update_nutrition_requirements = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Intenta obtener userId de params, body o query
    const userId = req.params.userId || req.body.userId || req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "Se requiere userId" });
    } // Del middleware de autenticación
    const { weight, height, activity_level, objective } = req.body;

    // 1. Obtener datos personales
    const [person] = await connection.query(
      `SELECT p.person_id, p.weight_value, p.height_value, p.gender, p.birthdate, p.activity_level, p.objective
       FROM person p
       JOIN user u ON p.person_id = u.person_id
       WHERE u.person_id = ?`, // Buscar por ID de usuario, no de persona
      [userId]
    );

    // Verificar si se encontró el usuario
    if (!person || person.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 2. Calcular nuevos requerimientos
    const bmr = calculateBMR({
      weight: weight || person[0].weight_value,
      height: height || person[0].height_value,
      gender: person[0].gender,
      birthdate: person[0].birthdate,
    });

    const calories =
      bmr * getActivityFactor(activity_level || person[0].activity_level);
    const macros = calculateMacronutrients(
      calories,
      objective || person[0].objective
    );

    // 3. Guardar en la base de datos
    await connection.query(
      `INSERT INTO nutrition_requirements 
       (person_id, date, daily_calories, protein_grams, fat_grams, carbs_grams)
       VALUES (?, CURDATE(), ?, ?, ?, ?)`,
      [
        person[0].person_id, // Usar el ID de persona correcto
        macros.daily_calories,
        macros.protein_grams,
        macros.fat_grams,
        macros.carbs_grams,
      ]
    );

    res.json({
      status: "success",
      macronutrientes: macros,
    });
  } catch (error) {
    console.error("Error al actualizar los requerimientos:", error);
    res.status(500).json({
      error: "Error del servidor",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    connection.release();
  }
};
