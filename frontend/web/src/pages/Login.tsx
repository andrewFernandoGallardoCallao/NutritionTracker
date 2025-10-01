import React, { useState } from "react";
import { authService } from "../services/api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(email, password);
      console.log("Login exitoso:", response);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-green-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green-900">Iniciar Sesión</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Botones de registro social */}

        {/* Separador */}

        {/* Formulario de login tradicional */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
              placeholder="Correo electrónico"
              required
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
              placeholder="Contraseña"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-800 text-white py-3 px-4 rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 font-medium transition-colors shadow-md"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-green-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-green-600">O</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            className="flex items-center justify-center w-full bg-white border border-green-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-green-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            onClick={() => (window.location.href = "/auth/google")}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 mr-3"
            />
            Continuar con Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={() => (window.location.href = "/auth/apple")}
          >
            <img
              src="/apple-svgrepo-com.svg"
              alt="Apple"
              className="w-5 h-5 mr-2"
            />
            Continuar con Apple
          </button>
        </div>
        <div className="relative mb-6 mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-green-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-green-600">O</span>
          </div>
        </div>
        <p className="mt-6 text-center text-green-600">
          ¿No tienes cuenta?{" "}
          <a
            href="/register"
            className="text-green-800 hover:underline font-semibold"
          >
            Regístrate aquí
          </a>
        </p>

        {/* Enlace de recuperación de contraseña */}
        <div className="mt-4 text-center">
          <a
            href="/forgot-password"
            className="text-green-700 hover:text-green-800 text-sm"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
