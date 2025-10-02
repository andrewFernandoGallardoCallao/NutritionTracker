import express from "express";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000',                    // Desarrollo local
    'https://nutritiontracker-frontend.onrender.com',  // Producción
    'http://localhost:5173'                    // Vite dev server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware de logging personalizado (reemplazo simple para Morgan)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
export default app;
