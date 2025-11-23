// API Client for backend communication
// In Vercel, API routes are served from the same domain, so we use relative paths
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

// Get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('kachaTaka_token') || '';
};

// Set auth token
export const setToken = (token) => {
  localStorage.setItem('kachaTaka_token', token);
};

// Remove auth token
export const removeToken = () => {
  localStorage.removeItem('kachaTaka_token');
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Expected JSON but got ${contentType}. Status: ${response.status}`);
    }
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Transform MongoDB user to app format
const transformUser = (user) => {
  if (!user) return null;
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    demoPoints: user.demoPoints || 0,
    realBalance: user.realBalance || 0,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt || new Date().toISOString(),
    kycStatus: user.kycStatus || 'pending',
    referralCode: user.referralCode,
    referredBy: user.referredBy?.toString() || user.referredBy || '',
    referralEarnings: user.referralEarnings || 0,
    lastDailySpin: user.lastDailySpin || undefined,
  };
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: userData,
    });
    if (data.token) {
      setToken(data.token);
    }
    // Transform user object
    if (data.user) {
      data.user = transformUser(data.user);
    }
    return data;
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.token) {
      setToken(data.token);
    }
    // Transform user object
    if (data.user) {
      data.user = transformUser(data.user);
    }
    return data;
  },

  getCurrentUser: async () => {
    const data = await apiRequest('/auth/me');
    // Transform user object
    if (data.user) {
      data.user = transformUser(data.user);
    }
    return data;
  },

  sendOTP: async (email, purpose) => {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: { email, purpose },
    });
  },

  verifyOTP: async (email, code, purpose) => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: { email, code, purpose },
    });
  },

  resetPassword: async (email, newPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: { email, newPassword },
    });
  },

  logout: () => {
    removeToken();
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return apiRequest('/users');
  },

  getById: async (id) => {
    return apiRequest(`/users/${id}`);
  },

  update: async (id, data) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  updateBalance: async (id, demoPoints, realBalance) => {
    return apiRequest(`/users/${id}/balance`, {
      method: 'PATCH',
      body: { demoPoints, realBalance },
    });
  },

  getByReferralCode: async (code) => {
    return apiRequest(`/users/referral/${code}`);
  },

  getReferrals: async (id) => {
    return apiRequest(`/users/${id}/referrals`);
  },
};

// Games API
export const gamesAPI = {
  addHistory: async (data) => {
    return apiRequest('/games/history', {
      method: 'POST',
      body: data,
    });
  },

  getHistory: async (game, limit) => {
    const params = new URLSearchParams();
    if (game) params.append('game', game);
    if (limit) params.append('limit', limit);
    return apiRequest(`/games/history?${params.toString()}`);
  },

  getStats: async () => {
    return apiRequest('/games/stats');
  },
};

// Transactions API
export const transactionsAPI = {
  add: async (data) => {
    return apiRequest('/transactions', {
      method: 'POST',
      body: data,
    });
  },

  getAll: async (userId) => {
    const params = userId ? new URLSearchParams({ userId }) : '';
    return apiRequest(`/transactions?${params.toString()}`);
  },
};

// Messages API
export const messagesAPI = {
  add: async (data) => {
    return apiRequest('/messages', {
      method: 'POST',
      body: data,
    });
  },

  getAll: async () => {
    return apiRequest('/messages');
  },

  update: async (id, data) => {
    return apiRequest(`/messages/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },
};

// Payments API
export const paymentsAPI = {
  add: async (data) => {
    return apiRequest('/payments', {
      method: 'POST',
      body: data,
    });
  },

  getAll: async (status) => {
    const params = status ? new URLSearchParams({ status }) : '';
    return apiRequest(`/payments?${params.toString()}`);
  },

  update: async (id, data) => {
    return apiRequest(`/payments/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  delete: async (id) => {
    return apiRequest(`/payments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Settings API
export const settingsAPI = {
  getGameSettings: async () => {
    return apiRequest('/settings/game');
  },

  updateGameSettings: async (data) => {
    return apiRequest('/settings/game', {
      method: 'PUT',
      body: data,
    });
  },

  getGlobalSettings: async () => {
    return apiRequest('/settings/global');
  },

  updateGlobalSettings: async (data) => {
    return apiRequest('/settings/global', {
      method: 'PUT',
      body: data,
    });
  },

  getPlatformStats: async () => {
    return apiRequest('/settings/stats');
  },

  updatePlatformStats: async (data) => {
    return apiRequest('/settings/stats', {
      method: 'PUT',
      body: data,
    });
  },
};

export default {
  auth: authAPI,
  users: usersAPI,
  games: gamesAPI,
  transactions: transactionsAPI,
  messages: messagesAPI,
  payments: paymentsAPI,
  settings: settingsAPI,
  setToken,
  removeToken,
};

