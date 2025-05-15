
import axios from 'axios';
import config from '../config/environment';
import { toast } from 'sonner';

const API_BASE_URL = config.apiProxyEnabled ? '/api' : config.apiBaseUrl;
const DEBUG_MODE = config.debug || false;

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    if (data) {
      console.log(`[API_DEBUG] ${message}:`, data);
    } else {
      console.log(`[API_DEBUG] ${message}`);
    }
  }
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
      console.log(`Uploading document with provider: ${llmProvider || 'default'}`);
      debugLog('Upload request details', { fileName: file.name, size: file.size, targetLanguage, llmProvider });
      
      const response = await axios.post(`${API_BASE_URL}/translation/upload`, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      
      debugLog('Upload response', response.data);
      return response.data;
    } catch (error: any) {
      console.error("Translation API error:", error?.response?.data || error);
      debugLog('Upload error', error?.response?.data || error.message);
      
      // Check for specific error messages
      if (error.response?.data?.detail) {
        if (error.response.data.detail.includes("No API keys configured")) {
          throw new Error("No API keys configured. Please set up at least one LLM provider API key.");
        }
        throw new Error(error.response.data.detail);
      }
      throw error.message || "An unknown error occurred";
    }
  },

  fetchTranslationHistory: async () => {
    try {
      debugLog('Fetching translation history');
      
      const response = await axios.get(`${API_BASE_URL}/translation/history`, {
        headers: authHeader(),
      });
      console.log("Translation history response:", response.data);
      debugLog('Translation history response', response.data);
      
      // Handle possible undefined translations array
      if (!response.data.translations) {
        console.warn("No translations found in response");
        return { translations: [] };
      }
      
      return response.data;
    } catch (error: any) {
      console.error("Error fetching translation history:", error);
      debugLog('Translation history error', error?.response?.data || error.message);
      throw error.response?.data?.detail || error.message;
    }
  },
  
  deleteTranslation: async (translationId: string) => {
    try {
      console.log(`Deleting translation with ID: ${translationId}`);
      debugLog('Deleting translation', { translationId });
      
      const response = await axios.delete(`${API_BASE_URL}/translation/${translationId}`, {
        headers: authHeader(),
      });
      console.log("Delete response:", response.data);
      debugLog('Delete response', response.data);
      
      // Show success toast
      toast.success("Translation deleted successfully");
      
      return response.data;
    } catch (error: any) {
      console.error("Error deleting translation:", error?.response?.data || error);
      debugLog('Delete error', error?.response?.data || error.message);
      
      // Show error toast
      toast.error(error.response?.data?.detail || "Failed to delete translation");
      
      if (error.response?.status === 404) {
        throw new Error("Translation not found or already deleted");
      }
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || "Failed to delete translation");
    }
  },
  
  checkTranslationStatus: async (translationId: string) => {
    try {
      debugLog('Checking translation status', { translationId });
      
      const response = await axios.get(`${API_BASE_URL}/translation/status/${translationId}`, {
        headers: authHeader(),
      });
      
      debugLog('Status response', response.data);
      return response.data;
    } catch (error: any) {
      debugLog('Status check error', error?.response?.data || error.message);
      throw error.response?.data?.detail || error.message;
    }
  },
  
  getDownloadUrl: (translationId: string) => {
    return `${API_BASE_URL}/translation/download/${translationId}`;
  },
  
  getSystemInfo: async () => {
    try {
      debugLog('Getting system info');
      
      const response = await axios.get(`${API_BASE_URL}/config/system-info`, {
        headers: authHeader(),
      });
      
      debugLog('System info response', response.data);
      return response.data;
    } catch (error: any) {
      debugLog('System info error', error?.response?.data || error.message);
      throw error.response?.data?.detail || error.message;
    }
  },
  
  // Enhanced method to get API key status
  checkApiKeyStatus: async () => {
    try {
      console.log("Checking API key status...");
      debugLog('Checking API key status');
      
      const response = await axios.get(`${API_BASE_URL}/config/api-key-status`, {
        headers: authHeader(),
      });
      
      console.log("API key status response:", response.data);
      debugLog('API key status response', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error("Error checking API key status:", error?.response?.data || error);
      debugLog('API key status error', error?.response?.data || error.message);
      throw error.response?.data?.detail || error.message;
    }
  },
  
  // Test SiliconFlow API directly (debug endpoint)
  testSiliconFlowApi: async () => {
    try {
      debugLog('Testing SiliconFlow API');
      
      const response = await axios.get(`${API_BASE_URL}/debug/siliconflow-test`, {
        headers: authHeader(),
      });
      
      debugLog('SiliconFlow test response', response.data);
      return response.data;
    } catch (error: any) {
      debugLog('SiliconFlow test error', error?.response?.data || error.message);
      throw error.response?.data?.detail || error.message;
    }
  },
  
  // Helper function to get available LLM providers (those with API keys)
  getAvailableLlmProviders: async () => {
    try {
      debugLog('Getting available LLM providers');
      
      const { api_key_status } = await translationApi.checkApiKeyStatus();
      
      console.log("Available providers check:", api_key_status);
      
      // Filter out non-boolean values and only include providers with keys
      const providers = Object.entries(api_key_status)
        .filter(([key, value]) => 
          typeof value === 'boolean' && 
          value === true && 
          !['has_default_key', 'default_provider', 'configured_providers_count'].includes(key)
        )
        .map(([key]) => key);
      
      console.log("Available providers:", providers);
      debugLog('Available providers', providers);
      
      return providers;
    } catch (error) {
      console.error("Error fetching available LLM providers:", error);
      debugLog('Error fetching available LLM providers', error);
      return [];
    }
  }
};

// Export auth API as a separate object
export const authApi = {
  login: async (username: string, password: string) => {
    try {
      console.log(`[AUTH] Login attempt for user: ${username}`);
      debugLog('Login attempt', { username });
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      
      console.log(`[AUTH] Login successful for user: ${username}`);
      debugLog('Login successful', { username });
      
      localStorage.setItem('token', response.data.token);
      return {
        ...response.data.user,
        isLoggedIn: true
      };
    } catch (error: any) {
      console.error(`[AUTH] Login failed for user: ${username}`, error?.response?.data || error);
      debugLog('Login failed', { username, error: error?.response?.data || error.message });
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw error.response?.data?.message || error.message;
      }
    }
  },

  logout: async () => {
    try {
      console.log(`[AUTH] Logout attempt`);
      debugLog('Logout attempt');
      
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { headers: authHeader() });
      
      console.log(`[AUTH] Logout successful`);
      debugLog('Logout successful');
      
      localStorage.removeItem('token');
    } catch (error: any) {
      console.error(`[AUTH] Logout failed`, error?.response?.data || error);
      debugLog('Logout failed', error?.response?.data || error.message);
      
      localStorage.removeItem('token');
      throw error.response?.data?.message || error.message;
    }
  },

  getCurrentUser: async () => {
    try {
      console.log(`[AUTH] Fetching current user info`);
      debugLog('Fetching current user info');
      
      const response = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeader() });
      
      console.log(`[AUTH] Current user info retrieved`);
      debugLog('Current user info retrieved', response.data);
      
      return {
        ...response.data,
        isLoggedIn: true
      };
    } catch (error: any) {
      console.error(`[AUTH] Failed to fetch current user info`, error?.response?.data || error);
      debugLog('Failed to fetch current user info', error?.response?.data || error.message);
      return null; // Not authenticated
    }
  },

  // Add new user function
  createUser: async (username: string, password: string, email: string | null = null, adminToken: string) => {
    try {
      console.log(`[AUTH] Creating new user: ${username}`);
      debugLog('Creating new user', { username, email });
      
      const response = await axios.post(`${API_BASE_URL}/auth/create-user`, 
        { username, password, email },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      console.log(`[AUTH] User created successfully: ${username}`);
      debugLog('User created successfully', { username });
      
      return response.data;
    } catch (error: any) {
      console.error(`[AUTH] Failed to create user: ${username}`, error?.response?.data || error);
      debugLog('Failed to create user', { username, error: error?.response?.data || error.message });
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw error.response?.data?.message || error.message;
      }
    }
  }
};
