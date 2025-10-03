import express from "express";
import cors from "cors";

const app = express();

// ✅ CONFIGURACIÓN CORS CORREGIDA
app.use(cors({
  origin: [
    'http://localhost:3000',                    
    'https://nutritiontracker-frontend.onrender.com',  
    'http://localhost:5173'                    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// ✅ MANEJO EXPLÍCITO DE PREFLIGHT REQUESTS
app.options('*', cors()); // Esto es crucial

app.use(express.json());

// Middleware de logging personalizado
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

export default app;