import app from "./src/config/app.js";
import "./src/config/db.js"; // Para probar conexión
import authRoutes from "./src/routes/auth.routes.js";

// Usar rutas
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
