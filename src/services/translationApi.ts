import axios from 'axios';
import config from '../config/environment';

const API_BASE_URL = config.apiProxyEnabled ? '/api' : config.apiBaseUrl;

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const translationApi = {
  uploadDocument: async (file: File, targetLanguage: string, llmProvider?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetLanguage', targetLanguage);
    if (llmProvider) {
      formData.append('llmProvider', llmProvider);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/translation/upload`, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.detail || error.message;
    }
  },

  fetchTranslationHistory: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/translation/history`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.detail || error.message;
    }
  },
  
  checkTranslationStatus: async (translationId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/translation/status/${translationId}`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.detail || error.message;
    }
  },
  
  getDownloadUrl: (translationId: string) => {
    return `${API_BASE_URL}/translation/download/${translationId}`;
  },
  
  getSystemInfo: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/config/system-info`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.detail || error.message;
    }
  },
  
  // New method to get API key status
  checkApiKeyStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/config/api-key-status`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.detail || error.message;
    }
  }
};

// Export auth API as a separate object
export const authApi = {
  login: async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      localStorage.setItem('token', response.data.token);
      return {
        ...response.data.user,
        isLoggedIn: true
      };
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw error.response?.data?.message || error.message;
      }
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { headers: authHeader() });
      localStorage.removeItem('token');
    } catch (error: any) {
      localStorage.removeItem('token');
      throw error.response?.data?.message || error.message;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeader() });
      return {
        ...response.data,
        isLoggedIn: true
      };
    } catch (error: any) {
      return null; // Not authenticated
    }
  },

  // Add new user function
  createUser: async (username: string, password: string, email: string | null = null, adminToken: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/create-user`, 
        { username, password, email },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw error.response?.data?.message || error.message;
      }
    }
  }
};
