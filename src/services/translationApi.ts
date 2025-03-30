
export interface User {
  id: string;
  email: string;
  username: string;
  isLoggedIn: boolean;
  role?: string;
  lastLogin?: string;
}

export interface Translation {
  id: string;
  originalFileName: string;
  targetLanguage: string;
  status: string;
  downloadUrl?: string | null;
  createdAt: string;
  errorMessage?: string | null;
}

export const getDownloadUrl = (translationId: string): string => {
  return `/api/translation/download/${translationId}`;
};

export const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    const data = await response.json();
    return data.user;
  },
  
  logout: async (): Promise<void> => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Logout failed');
    }
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
};

export const translationApi = {
  uploadDocument: async (file: File, targetLanguage: string, llmProvider?: string): Promise<Translation> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetLanguage', targetLanguage);
    
    if (llmProvider) {
      formData.append('llmProvider', llmProvider);
    }
    
    const response = await fetch('/api/translation/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    const { translation } = await response.json();
    return translation;
  },
  
  checkStatus: async (translationId: string): Promise<any> => {
    const response = await fetch(`/api/translation/status/${translationId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check status');
    }
    
    return await response.json();
  },
  
  fetchTranslations: async (): Promise<Translation[]> => {
    const response = await fetch('/api/translation/history');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch translations');
    }
    
    const { translations } = await response.json();
    return translations;
  },
  
  downloadTranslation: async (translationId: string): Promise<void> => {
    window.location.href = getDownloadUrl(translationId);
  },
  
  getModelSelectionPermission: async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/permissions/model-selection');
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.allowed;
    } catch (error) {
      console.error('Error getting model selection permission:', error);
      return false;
    }
  },
  
  getAvailableWebTranslationServices: async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/translation/web-services');
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.services;
    } catch (error) {
      console.error('Error getting web translation services:', error);
      return [];
    }
  },
  
  getSystemInfo: async (): Promise<any> => {
    try {
      const response = await fetch('/api/system/info');
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting system info:', error);
      return null;
    }
  }
};
