export const calculateMacronutrients = (calories, objective = "mantener") => {
  // Ajuste de calorías según objetivo
  let adjustedCalories = calories;
  if (objective === "perder_peso") adjustedCalories -= 500;
  if (objective === "ganar_masa") adjustedCalories += 500;

  // Cálculo de macronutrientes (proporciones estándar)
  const proteinGrams = Math.round((adjustedCalories * 0.3) / 4); // 30% de calorías, 4kcal/g
  const fatGrams = Math.round((adjustedCalories * 0.25) / 9); // 25% de calorías, 9kcal/g
  const carbsGrams = Math.round((adjustedCalories * 0.45) / 4); // 45% de calorías, 4kcal/g

  return {
    daily_calories: adjustedCalories,
    protein_grams: proteinGrams,
    fat_grams: fatGrams,
    carbs_grams: carbsGrams,
  };
};
// Cálculo de Tasa Metabólica Basal
export const calculateBMR = ({ weight, height, gender, birthdate }) => {
  const age = new Date().getFullYear() - new Date(birthdate).getFullYear();

  if (gender.toLowerCase() === "male") {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
};

// Factores de actividad
export const getActivityFactor = (level) => {
  const factors = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    activo: 1.725,
    muy_activo: 1.9,
  };
  return factors[level] || 1.55;
};
