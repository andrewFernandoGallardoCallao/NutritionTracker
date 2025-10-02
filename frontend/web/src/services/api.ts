const API_URL = "https://nutritiontracker-1-c7sh.onrender.com/api";

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  },

  get(endpoint: string) {
    return this.request(endpoint);
  },

  post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  },
};

export const authService = {
  // Autenticación
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  
  register: (userData: any) => api.post("/auth/register", userData),

  verify2FA: (email: string, code: string, tempToken: string) =>
    api.post("/auth/verify-2fa", { email, code, tempToken }),

  resend2FA: (email: string, tempToken: string) =>
    api.post("/auth/resend-2fa", { email, tempToken }),

  changePassword: (userId: string, oldPassword: string, newPassword: string) =>
    api.put(`/auth/change-password/${userId}`, { oldPassword, newPassword }),

  // Datos del usuario
  getProfile: (userId: string) => api.get(`/auth/getProfile/${userId}`),

  getNutritionalRequirements: (userId: string) =>
    api.get(`/auth/nutritional-requirements/${userId}`),

  getWeightHistory: (userId: string) =>
    api.get(`/auth/weight-history/${userId}`),

  getTodayConsumption: (userId: string) =>
    api.get(`/auth/today-consumption/${userId}`),
};

// Servicio adicional para otras funcionalidades
export const nutritionService = {
  logFood: (consumptionData: any) =>
    api.post("/nutrition/log-food", consumptionData),

  getFoodHistory: (userId: string, date?: string) =>
    api.get(`/nutrition/food-history/${userId}${date ? `?date=${date}` : ""}`),

  searchFoods: (query: string) =>
    api.get(`/nutrition/search-foods?query=${query}`),
};

export const weightService = {
  logWeight: (userId: string, weight: number, date?: string) =>
    api.post("/weight/log", { userId, weight, date }),

  getWeightProgress: (userId: string) => api.get(`/weight/progress/${userId}`),
};

// Helper para agregar token a las requests
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
