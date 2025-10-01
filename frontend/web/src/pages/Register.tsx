import React, { useState } from 'react';
import { authService } from '../services/api';
import VerificationCode from './VerificationCode';

const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationData, setVerificationData] = useState<{
    email: string;
    tempToken: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    password: '',
    weight: '',
    height: '',
    gender: 'M',
    birthdate: '',
    activity_level: '2',
    objective: 'lose_weight'
  });

  const steps = [
    { number: 1, title: 'Información Personal' },
    { number: 2, title: 'Medidas Físicas' },
    { number: 3, title: 'Objetivos' }
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userData = {
        ...formData,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        activity_level: parseInt(formData.activity_level)
      };

      const response = await authService.register(userData);
      
      if (response.status === "requires_2fa") {
        // Mostrar pantalla de verificación
        setVerificationData({
          email: response.email,
          tempToken: response.tempToken
        });
      } else {
        setError('Error inesperado en el registro');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (token: string, user: any) => {
    // Guardar token y redirigir al dashboard
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.location.href = '/dashboard';
  };

  const handleResendCode = () => {
    // Opcional: Mostrar mensaje de éxito
    console.log('Código reenviado');
  };

  // Si estamos en verificación, mostrar componente de verificación
  if (verificationData) {
    return (
      <VerificationCode
        email={verificationData.email}
        tempToken={verificationData.tempToken}
        onVerificationSuccess={handleVerificationSuccess}
        onResendCode={handleResendCode}
      />
    );
  }

  // Paso 1: Información Personal
  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Información Personal</h3>
      <p className="text-gray-600">Comencemos con tus datos básicos</p>
      
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
          placeholder="Nombre"
          required
        />
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
          placeholder="Apellido"
          required
        />
      </div>

      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
        placeholder="Correo electrónico"
        required
      />

      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
        placeholder="Contraseña"
        required
      />
    </div>
  );

  // Paso 2: Medidas Físicas
  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Medidas Físicas</h3>
      <p className="text-gray-600">Ayúdanos a conocer tus medidas</p>
      
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          name="weight"
          value={formData.weight}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
          placeholder="Peso (kg)"
          required
        />
        <input
          type="number"
          name="height"
          value={formData.height}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
          placeholder="Altura (cm)"
          required
        />
      </div>

      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 transition-colors"
      >
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
        <option value="O">Otro</option>
      </select>

      <input
        type="date"
        name="birthdate"
        value={formData.birthdate}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 transition-colors"
        required
      />
    </div>
  );

  // Paso 3: Objetivos
  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Tus Objetivos</h3>
      <p className="text-gray-600">Personalicemos tu experiencia</p>
      
      <select
        name="activity_level"
        value={formData.activity_level}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 transition-colors"
      >
        <option value="1">Sedentario (poco o ningún ejercicio)</option>
        <option value="2">Ligero (ejercicio 1-3 días/semana)</option>
        <option value="3">Moderado (ejercicio 3-5 días/semana)</option>
        <option value="4">Activo (ejercicio 6-7 días/semana)</option>
        <option value="5">Muy activo (atleta profesional)</option>
      </select>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Objetivo Principal</p>
        <div className="space-y-3">
          <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="objective"
              value="lose_weight"
              checked={formData.objective === 'lose_weight'}
              onChange={handleChange}
              className="mr-3 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">Perder peso</span>
          </label>
          <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="objective"
              value="maintain_path_muscle"
              checked={formData.objective === 'maintain_path_muscle'}
              onChange={handleChange}
              className="mr-3 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">Mantener peso / Ganar músculo</span>
          </label>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-green-50 p-4 rounded-lg mt-6 border border-green-200">
        <h4 className="font-semibold text-green-800 mb-2">Resumen de tu perfil:</h4>
        <p className="text-sm text-green-700">
          {formData.name} {formData.last_name} • {formData.weight}kg • {formData.height}cm
        </p>
        <p className="text-sm text-green-700">
          {formData.gender === 'M' ? 'Hombre' : formData.gender === 'F' ? 'Mujer' : 'Otro'} • {formData.birthdate}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg border border-green-100">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto border-2 ${
                  currentStep >= step.number 
                    ? 'bg-green-800 border-green-800 text-white' 
                    : 'bg-white border-green-300 text-green-300'
                }`}>
                  {step.number}
                </div>
                <span className={`text-xs mt-1 font-medium ${
                  currentStep >= step.number ? 'text-green-800' : 'text-green-400'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-green-100 rounded-full h-3">
            <div 
              className="bg-green-800 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-green-900">Crear Cuenta</h2>
          <p className="text-green-600 mt-2">
            Paso {currentStep} de {steps.length} - {steps[currentStep - 1]?.title}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
          {/* Renderizar paso actual */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Botones de navegación */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              ← Anterior
            </button>

            {currentStep < steps.length ? (
              <button
                type="submit"
                className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium transition-colors shadow-md"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-800 text-white rounded-lg hover:bg-green-900 font-medium transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? 'Creando cuenta...' : 'Completar Registro'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-green-600">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-green-800 hover:underline font-semibold">
            Inicia Sesión
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;