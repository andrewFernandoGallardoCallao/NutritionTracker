import React, { useState, useEffect } from 'react';

interface UserData {
  id: number;
  name: string;
  last_name: string;
  email: string;
  weight: number;
  height: number;
  gender: string;
  birthdate: string;
  activity_level: number;
  objective: string;
}

interface NutritionalRequirements {
  daily_calories: number;
  protein_grams: number;
  fat_grams: number;
  carbs_grams: number;
  date: string;
}

interface WeightHistory {
  date: string;
  weight: number;
}

interface TodayConsumption {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [nutritionalRequirements, setNutritionalRequirements] = useState<NutritionalRequirements | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [todayConsumption, setTodayConsumption] = useState<TodayConsumption>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!storedUser.id) {
        throw new Error('No se encontró información del usuario');
      }

      // Cargar perfil completo
      const profileResponse = await fetch(`https://nutritiontracker-1-c7sh.onrender.com/api/auth/profile/${storedUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!profileResponse.ok) {
        throw new Error('Error cargando perfil');
      }
      
      const profileData = await profileResponse.json();
      setUser(profileData.user);

      // Cargar requisitos nutricionales
      const nutritionResponse = await fetch(`https://nutritiontracker-1-c7sh.onrender.com/api/auth/nutritional-requirements/${storedUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (nutritionResponse.ok) {
        const nutritionData = await nutritionResponse.json();
        setNutritionalRequirements(nutritionData.requirements);
      }

      // Cargar historial de peso
      const weightResponse = await fetch(`https://nutritiontracker-1-c7sh.onrender.com/api/auth/weight-history/${storedUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (weightResponse.ok) {
        const weightData = await weightResponse.json();
        setWeightHistory(weightData.weightHistory);
      }

      // Cargar consumo de hoy
      const consumptionResponse = await fetch(`https://nutritiontracker-1-c7sh.onrender.com/api/auth/today-consumption/${storedUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (consumptionResponse.ok) {
        const consumptionData = await consumptionResponse.json();
        setTodayConsumption(consumptionData.consumption);
      }

    } catch (err: any) {
      console.error('Error cargando datos del dashboard:', err);
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdate: string) => {
    try {
      const today = new Date();
      const birthDate = new Date(birthdate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 0;
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    try {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    } catch (error) {
      return '0.0';
    }
  };

  const getBMICategory = (bmi: number) => {
    if (isNaN(bmi)) return 'No calculable';
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
  };

  const getActivityLevelText = (level: number) => {
    const levels: { [key: number]: string } = {
      1: 'Sedentario',
      2: 'Ligero', 
      3: 'Moderado',
      4: 'Activo',
      5: 'Muy activo'
    };
    return levels[level] || 'No especificado';
  };

  const getObjectiveText = (objective: string) => {
    const objectives: { [key: string]: string } = {
      'lose_weight': 'Perder peso',
      'maintain_path_muscle': 'Mantener peso / Ganar músculo'
    };
    return objectives[objective] || objective;
  };

  const calculateProgress = (consumed: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.min((consumed / total) * 100, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto"></div>
          <p className="mt-4 text-green-800">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Error cargando datos del usuario'}</p>
          <button 
            onClick={handleLogout}
            className="bg-green-800 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(user.weight, user.height);
  const bmiCategory = getBMICategory(parseFloat(bmi));
  const age = calculateAge(user.birthdate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">NutriTrack</h1>
            <p className="text-green-200">Tu compañero de nutrición</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-green-100">Hola, {user.name}!</span>
            <button
              onClick={handleLogout}
              className="bg-white text-green-800 px-4 py-2 rounded-lg hover:bg-green-100 font-medium transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Resumen Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Información del Usuario */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-4">👤 Tu Perfil</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-semibold">{user.name} {user.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Edad:</span>
                <span className="font-semibold">{age} años</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Género:</span>
                <span className="font-semibold">
                  {user.gender === 'M' ? 'Hombre' : user.gender === 'F' ? 'Mujer' : 'Otro'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actividad:</span>
                <span className="font-semibold">{getActivityLevelText(user.activity_level)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Objetivo:</span>
                <span className="font-semibold">{getObjectiveText(user.objective)}</span>
              </div>
            </div>
          </div>

          {/* Medidas Corporales */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-4">📏 Medidas Corporales</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Peso actual:</span>
                <span className="font-semibold">{user.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Altura:</span>
                <span className="font-semibold">{user.height} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IMC:</span>
                <span className="font-semibold">{bmi} ({bmiCategory})</span>
              </div>
              {weightHistory.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Último registro:</span>
                  <span className="font-semibold">
                    {weightHistory[weightHistory.length - 1].weight} kg
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Objetivos Diarios */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-4">🎯 Objetivos Diarios</h2>
            {nutritionalRequirements ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Calorías</span>
                    <span className="font-semibold">
                      {Math.round(todayConsumption.calories)} / {nutritionalRequirements.daily_calories} kcal
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${calculateProgress(todayConsumption.calories, nutritionalRequirements.daily_calories)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Proteína</span>
                    <span className="font-semibold">
                      {Math.round(todayConsumption.protein)} / {nutritionalRequirements.protein_grams} g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${calculateProgress(todayConsumption.protein, nutritionalRequirements.protein_grams)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Grasas</span>
                    <span className="font-semibold">
                      {Math.round(todayConsumption.fat)} / {nutritionalRequirements.fat_grams} g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${calculateProgress(todayConsumption.fat, nutritionalRequirements.fat_grams)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Carbohidratos</span>
                    <span className="font-semibold">
                      {Math.round(todayConsumption.carbs)} / {nutritionalRequirements.carbs_grams} g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${calculateProgress(todayConsumption.carbs, nutritionalRequirements.carbs_grams)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No se encontraron objetivos nutricionales</p>
            )}
          </div>
        </div>

        {/* Resto del código del dashboard... */}
      </main>
    </div>
  );
};

export default Dashboard;