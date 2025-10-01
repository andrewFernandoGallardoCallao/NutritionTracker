import pool from "../config/db.js";

export const register_food = async (req, res) => {
  const connection = await pool.getConnection();
  try {
  } catch (error) {
    console.log(`Error l registrar el alimento: ${error.message}`);
    await connection.rollback();
    connection.release();
    return res.status(500).json({
      status: "error",
      message: "Error al registrar el alimento",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
