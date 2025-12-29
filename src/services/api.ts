import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base URL for the API
const API_BASE_URL = 'https://app.riyalmind.com/api';

// Storage keys
const AUTH_TOKEN_KEY = 'riyalmind_auth_token';
const REFRESH_TOKEN_KEY = 'riyalmind_refresh_token';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        
        if (refreshToken) {
          const response = await axios.put(`${API_BASE_URL}/auth/mobile`, {
            refreshToken,
          });
          
          if (response.data.success) {
            const newToken = response.data.token;
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, newToken);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // Token refresh failed, clear auth data
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    
    return Promise.reject(error);
  }
);

// ============ Auth API ============
export const authAPI = {
  // Google OAuth login for mobile
  loginWithGoogle: async (idToken: string, accessToken?: string) => {
    const response = await api.post('/auth/mobile', { 
      idToken, 
      accessToken,
      provider: 'google' 
    });
    
    if (response.data.success) {
      // Store tokens
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.data.token);
      if (response.data.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refreshToken);
      }
    }
    
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Check if authenticated
  isAuthenticated: async () => {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return !!token;
  },

  // Get stored token
  getToken: async () => {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  },

  // Logout
  logout: async () => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync('riyalmind_user');
  },
};

// ============ Expenses API ============
export const expensesAPI = {
  // Get all expenses
  getAll: async (params?: { 
    month?: string; 
    category?: string; 
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  // Get single expense
  getById: async (id: string) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create expense
  create: async (data: {
    amount: number;
    categoryId: string;
    description?: string;
    date?: string;
    notes?: string;
    receipt?: string;
  }) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  // Update expense
  update: async (id: string, data: Partial<{
    amount: number;
    categoryId: string;
    description: string;
    date: string;
    notes: string;
  }>) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  // Delete expense
  delete: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

// ============ Income API ============
export const incomeAPI = {
  // Get all income
  getAll: async (params?: { month?: string }) => {
    const response = await api.get('/income', { params });
    return response.data;
  },

  // Create income
  create: async (data: {
    amount: number;
    source: string;
    description?: string;
    date?: string;
  }) => {
    const response = await api.post('/income', data);
    return response.data;
  },

  // Delete income
  delete: async (id: string) => {
    const response = await api.delete(`/income/${id}`);
    return response.data;
  },
};

// ============ Budgets API ============
export const budgetsAPI = {
  // Get all budgets
  getAll: async () => {
    const response = await api.get('/budgets');
    return response.data;
  },

  // Create budget
  create: async (data: {
    category: string;
    amount: number;
    period: string;
  }) => {
    const response = await api.post('/budgets', data);
    return response.data;
  },

  // Update budget
  update: async (id: string, data: { amount: number }) => {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
  },

  // Delete budget
  delete: async (id: string) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

// ============ Goals API ============
export const goalsAPI = {
  // Get all goals
  getAll: async () => {
    const response = await api.get('/goals');
    return response.data;
  },

  // Create goal
  create: async (data: {
    name: string;
    targetAmount: number;
    deadline?: string;
    icon?: string;
  }) => {
    const response = await api.post('/goals', data);
    return response.data;
  },

  // Update goal
  update: async (id: string, data: Partial<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
  }>) => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data;
  },

  // Add to goal
  addAmount: async (id: string, amount: number) => {
    const response = await api.post(`/goals/${id}/add`, { amount });
    return response.data;
  },

  // Delete goal
  delete: async (id: string) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },
};

// ============ Loans API ============
export const loansAPI = {
  // Get all loans
  getAll: async () => {
    const response = await api.get('/loans');
    return response.data;
  },

  // Create loan
  create: async (data: {
    name: string;
    type: string;
    lender?: string;
    totalAmount: number;
    monthlyPayment: number;
    startDate: string;
    nextPaymentDate?: string;
  }) => {
    const response = await api.post('/loans', data);
    return response.data;
  },

  // Record payment
  recordPayment: async (id: string, data: {
    amount: number;
    paymentDate?: string;
    addAsExpense?: boolean;
  }) => {
    const response = await api.post(`/loans/${id}/pay`, data);
    return response.data;
  },

  // Pay loan (alias for recordPayment)
  pay: async (id: string, amount: number) => {
    const response = await api.post(`/loans/${id}/pay`, { amount });
    return response.data;
  },

  // Update loan
  update: async (id: string, data: Partial<{
    name: string;
    paidAmount: number;
    monthlyPayment: number;
  }>) => {
    const response = await api.put(`/loans/${id}`, data);
    return response.data;
  },

  // Delete loan
  delete: async (id: string) => {
    const response = await api.delete(`/loans/${id}`);
    return response.data;
  },
};

// ============ Scanner API ============
export const scannerAPI = {
  // Scan receipt
  scanReceipt: async (imageBase64: string) => {
    const response = await api.post('/scanner', { image: imageBase64 });
    return response.data;
  },
};

// ============ Reports API ============
export const reportsAPI = {
  // Get summary report
  getSummary: async (period: string = 'month') => {
    const response = await api.get('/reports/summary', {
      params: { period },
    });
    return response.data;
  },

  // Get weekly report
  getWeekly: async () => {
    const response = await api.get('/reports/weekly');
    return response.data;
  },

  // Get monthly comparison
  getComparison: async (month1: string, month2: string) => {
    const response = await api.get('/reports/comparison', {
      params: { month1, month2 },
    });
    return response.data;
  },

  // Export data
  exportData: async (format: 'csv' | 'json' | 'pdf', dateRange?: { start: string; end: string }) => {
    const response = await api.get('/export', {
      params: { format, ...dateRange },
    });
    return response.data;
  },
};

// ============ Alerts API ============
export const alertsAPI = {
  // Get all alerts
  getAll: async () => {
    const response = await api.get('/alerts');
    return response.data;
  },

  // Dismiss alert
  dismiss: async (id: string) => {
    const response = await api.post(`/alerts/${id}/dismiss`);
    return response.data;
  },
};

// ============ Recurring Expenses API ============
export const recurringAPI = {
  // Get all recurring expenses
  getAll: async () => {
    const response = await api.get('/recurring');
    return response.data;
  },

  // Create recurring expense
  create: async (data: {
    name: string;
    amount: number;
    categoryId: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }) => {
    const response = await api.post('/recurring', data);
    return response.data;
  },

  // Update recurring expense
  update: async (id: string, data: Partial<{
    name: string;
    amount: number;
    categoryId: string;
    frequency: string;
    isActive: boolean;
  }>) => {
    const response = await api.put(`/recurring/${id}`, data);
    return response.data;
  },

  // Delete recurring expense
  delete: async (id: string) => {
    const response = await api.delete(`/recurring/${id}`);
    return response.data;
  },
};

// ============ Dashboard API ============
export const dashboardAPI = {
  // Get dashboard data
  getData: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  // Get stats for period
  getStats: async (period: 'week' | 'month' | 'year') => {
    const response = await api.get('/dashboard/stats', {
      params: { period },
    });
    return response.data;
  },
};

// ============ Categories API ============
export const categoriesAPI = {
  // Get all categories
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// ============ Seasonal Budgets API ============
export const seasonalAPI = {
  // Get all seasonal budgets
  getAll: async () => {
    const response = await api.get('/seasonal');
    return response.data;
  },

  // Create seasonal budget
  create: async (data: {
    name: string;
    type: string;
    amount: number;
    startDate: string;
    endDate: string;
  }) => {
    const response = await api.post('/seasonal', data);
    return response.data;
  },

  // Update seasonal budget
  update: async (id: string, data: Partial<{
    name: string;
    amount: number;
    spent: number;
  }>) => {
    const response = await api.put(`/seasonal/${id}`, data);
    return response.data;
  },

  // Delete seasonal budget
  delete: async (id: string) => {
    const response = await api.delete(`/seasonal/${id}`);
    return response.data;
  },
};

// ============ Notifications API ============
export const notificationsAPI = {
  // Get all notifications
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Mark as read
  markAsRead: async (id: string) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },
};

export default api;
