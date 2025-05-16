
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
      console.log(`[TMX_API_DEBUG] ${message}:`, data);
    } else {
      console.log(`[TMX_API_DEBUG] ${message}`);
    }
  }
};

export interface TMXUploadResult {
  success: boolean;
  tmx_id: string;
  result: {
    filename: string;
    header: Record<string, string>;
    units_parsed: number;
    units_new: number;
    units_updated: number;
    total_units_in_memory: number;
  };
}

export interface TMXSearchResult {
  success: boolean;
  matches: Array<{
    source_text: string;
    target_text: string;
    similarity: number;
    unit_id: string;
  }>;
  match_count: number;
}

export const tmxApi = {
  uploadTmxFile: async (file: File): Promise<TMXUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      debugLog('Upload TMX request details', { fileName: file.name, size: file.size });
      
      const response = await axios.post(`${API_BASE_URL}/tmx/upload`, formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      
      debugLog('TMX upload response', response.data);
      return response.data;
    } catch (error: any) {
      console.error("TMX API error:", error?.response?.data || error);
      debugLog('TMX upload error', error?.response?.data || error.message);
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error.message || "An unknown error occurred";
    }
  },
  
  searchTranslationMemory: async (text: string, sourceLanguage: string, targetLanguage: string, threshold: number = 0.7): Promise<TMXSearchResult> => {
    try {
      debugLog('Search TMX request details', { text, sourceLanguage, targetLanguage, threshold });
      
      const formData = new FormData();
      formData.append('text', text);
      formData.append('source_language', sourceLanguage);
      formData.append('target_language', targetLanguage);
      formData.append('threshold', threshold.toString());
      
      const response = await axios.post(`${API_BASE_URL}/tmx/search`, formData, {
        headers: {
          ...authHeader(),
        },
      });
      
      debugLog('TMX search response', response.data);
      return response.data;
    } catch (error: any) {
      console.error("TMX search API error:", error?.response?.data || error);
      debugLog('TMX search error', error?.response?.data || error.message);
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error.message || "An unknown error occurred";
    }
  },
  
  exportTranslationAsTmx: async (translationId: string): Promise<Blob> => {
    try {
      debugLog('Export TMX request details', { translationId });
      
      const response = await axios.get(`${API_BASE_URL}/tmx/export/${translationId}`, {
        headers: {
          ...authHeader(),
        },
        responseType: 'blob'
      });
      
      debugLog('TMX export response received');
      return response.data;
    } catch (error: any) {
      console.error("TMX export API error:", error?.response?.data || error);
      debugLog('TMX export error', error?.response?.data || error.message);
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error.message || "An unknown error occurred";
    }
  }
};
