
import { Translation, TranslationStatus } from "../store/slices/translationSlice";

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Get auth token from localStorage
const getToken = () => localStorage.getItem("auth_token");

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error("API Error:", error);
  const message = error.response?.data?.detail || error.message || "An unknown error occurred";
  throw new Error(message);
};

export interface TranslationStatusResponse {
  id: string;
  status: TranslationStatus;
  progress: number;
  downloadUrl: string | null;
  errorMessage: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  is_email_user: boolean;
}

export const translationApi = {
  uploadDocument: async (file: File, targetLanguage: string, llmProvider?: string) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetLanguage", targetLanguage);
      
      if (llmProvider) {
        formData.append("llmProvider", llmProvider);
      }
      
      const headers: HeadersInit = {};
      const token = getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/translation/upload`, {
        method: "POST",
        body: formData,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }
      
      const data = await response.json();
      return data.translation;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  checkStatus: async (translationId: string): Promise<TranslationStatusResponse> => {
    try {
      const response = await fetch(`${API_URL}/api/translation/status/${translationId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Status check failed");
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  fetchTranslations: async () => {
    try {
      const headers: HeadersInit = {};
      const token = getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/translation/history`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch translations");
      }
      
      const data = await response.json();
      return data.translations;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  downloadTranslation: async (translationId: string) => {
    try {
      window.open(`${API_URL}/api/translation/download/${translationId}`, '_blank');
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getModelSelectionPermission: async () => {
    try {
      const headers: HeadersInit = {};
      const token = getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/config/model-selection-allowed`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to check model selection permission");
      }
      
      const data = await response.json();
      return data.allowed;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getAvailableWebTranslationServices: async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/available-web-translation-services`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch web translation services");
      }
      
      const data = await response.json();
      return data.services;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getSystemInfo: async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/system-info`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch system info");
      }
      
      const data = await response.json();
      return data.config;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Auth API Functions
export const authApi = {
  login: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }
      
      const data = await response.json();
      
      // Save token to localStorage
      localStorage.setItem("auth_token", data.token);
      
      return data.user;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  logout: async () => {
    try {
      const token = getToken();
      if (!token) {
        // Already logged out
        localStorage.removeItem("auth_token");
        return true;
      }
      
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      // Remove token regardless of response
      localStorage.removeItem("auth_token");
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn("Logout had issues:", errorData.detail);
      }
      
      return true;
    } catch (error) {
      localStorage.removeItem("auth_token");
      console.error("Logout error:", error);
      return true; // Always return true to allow client-side logout
    }
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = getToken();
      if (!token) {
        return null;
      }
      
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("auth_token");
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get user");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },
  
  isLoggedIn: async () => {
    const user = await authApi.getCurrentUser();
    return user !== null;
  }
};
