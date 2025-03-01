
import { requestPasswordHandler, loginHandler, uploadDocumentHandler, fetchTranslationsHandler } from "../mocks/handlers";

// Create a mock API layer for our demo
// This simulates network requests with artificial delays

export const api = {
  auth: {
    requestPassword: async (email: string) => {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const success = await requestPasswordHandler(email);
      
      if (!success) {
        throw new Error("Failed to send password");
      }
      
      return { success };
    },
    
    login: async (email: string, password: string) => {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const user = await loginHandler(email, password);
      
      if (!user) {
        throw new Error("Invalid email or password");
      }
      
      return { user };
    },
    
    logout: async () => {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    }
  },
  
  translation: {
    uploadDocument: async (file: File, targetLanguage: string) => {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const translation = await uploadDocumentHandler(file, targetLanguage);
      
      return { translation };
    },
    
    fetchTranslations: async () => {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const translations = await fetchTranslationsHandler();
      
      return { translations };
    }
  }
};

// Setup intercept for fetch to use our mock API
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
  if (typeof url === 'string') {
    // Auth endpoints
    if (url === '/api/auth/request-password' && options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      try {
        const result = await api.auth.requestPassword(body.email);
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 400 });
      }
    }
    
    if (url === '/api/auth/login' && options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      try {
        const result = await api.auth.login(body.email, body.password);
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 401 });
      }
    }
    
    if (url === '/api/auth/logout' && options?.method === 'POST') {
      try {
        const result = await api.auth.logout();
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
    }
    
    // Translation endpoints
    if (url === '/api/translation/upload' && options?.method === 'POST') {
      const formData = options.body as FormData;
      const file = formData.get('file') as File;
      const targetLanguage = formData.get('targetLanguage') as string;
      
      try {
        const result = await api.translation.uploadDocument(file, targetLanguage);
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
    }
    
    if (url === '/api/translation/history') {
      try {
        const result = await api.translation.fetchTranslations();
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
    }
  }
  
  // Pass through to real fetch for any other requests
  return originalFetch(url, options);
};
