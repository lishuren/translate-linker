
import { requestPasswordHandler, loginHandler, uploadDocumentHandler, fetchTranslationsHandler } from "../mocks/handlers";
import config from "../config/environment";

// Mock API keys (would be stored securely in a real app)
const MOCK_DEEPSEEK_API_KEY = "mock-api-key-for-demo";
const MOCK_TRANSLATION_API_KEY = "mock-translation-api-key";

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
      console.log(`Processing translation for language: ${targetLanguage}`);
      
      try {
        // 1. Read the file content
        const fileContent = await readFileAsText(file);
        
        // 2. Process with mock processing
        const translation = await processMockTranslation(file.name, fileContent, targetLanguage);
        
        // 3. Use the original handler to maintain compatibility with existing code
        const result = await uploadDocumentHandler(file, targetLanguage);
        
        // Add artificial delay to simulate the real processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 4. Enhance result with mock metadata
        result.processingDetails = {
          engine: "langchain",
          model: "deepseek-coder",
          vectorStore: "MemoryVectorStore",
          documentChunks: translation.chunks,
          ragEnabled: true,
          processingTime: translation.processingTime,
          totalTokens: translation.totalTokens,
          translationProvider: "third-party-api",
          agentEnabled: true,
          confidenceScore: translation.confidenceScore
        };
        
        return { translation: result };
      } catch (error) {
        console.error("Translation processing error:", error);
        throw new Error(`Translation failed: ${error.message}`);
      }
    },
    
    checkStatus: async (translationId: string) => {
      // Simulate checking the status of a translation job
      console.log(`Checking status of translation job ${translationId}`);
      
      // Artificial delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get the translation from the mock database
      const translations = await fetchTranslationsHandler();
      const translation = translations.find(t => t.id === translationId);
      
      if (!translation) {
        throw new Error(`Translation job ${translationId} not found`);
      }
      
      // Calculate a progress value based on the status
      let progress = 0;
      if (translation.status === "pending") progress = 10;
      else if (translation.status === "processing") progress = Math.floor(Math.random() * 60) + 30; // 30-90%
      else if (translation.status === "completed") progress = 100;
      
      return {
        id: translation.id,
        status: translation.status,
        progress,
        downloadUrl: translation.downloadUrl
      };
    },
    
    fetchTranslations: async () => {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const translations = await fetchTranslationsHandler();
      
      return { translations };
    }
  }
};

// Helper function to read file content as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Extended file format detection and preprocessing
const detectFileTypeAndPreprocess = (fileName: string, content: string): { format: string, processedContent: string, confidence: number } => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  let format = 'plaintext';
  let processedContent = content;
  let confidence = 0.8; // Default confidence score
  
  if (['docx', 'doc'].includes(extension)) {
    format = 'msword';
    // In a real implementation, we would use a library to parse DOCX
    console.log("Detected Microsoft Word document, preprocessing...");
    confidence = 0.75; // Lower confidence for Word docs as they're more complex
  } else if (extension === 'pdf') {
    format = 'pdf';
    // In a real implementation, we would use a PDF parser
    console.log("Detected PDF document, preprocessing...");
    confidence = 0.7; // Even lower for PDFs as they're harder to parse
  } else if (['xlsx', 'xls'].includes(extension)) {
    format = 'excel';
    // In a real implementation, we would use a spreadsheet parser
    console.log("Detected Excel document, preprocessing...");
    confidence = 0.65; // Lowest for Excel as it's structured differently
  } else if (['txt', 'md', 'html', 'xml', 'json'].includes(extension)) {
    confidence = 0.95; // Higher confidence for simple text formats
  }
  
  return { format, processedContent, confidence };
};

// Detect source language (simplified mock implementation)
const detectLanguage = async (text: string): Promise<{language: string, confidence: number}> => {
  console.log("Detecting source language...");
  // In a real implementation, this would call a language detection service
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simple mock detection based on text characteristics
  const hasAsianChars = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
  const hasCyrillicChars = /[\u0400-\u04FF]/.test(text);
  const hasArabicChars = /[\u0600-\u06FF]/.test(text);
  
  if (hasAsianChars) {
    return { language: 'japanese', confidence: 0.82 };
  } else if (hasCyrillicChars) {
    return { language: 'russian', confidence: 0.88 };
  } else if (hasArabicChars) {
    return { language: 'arabic', confidence: 0.85 };
  } else {
    return { language: 'english', confidence: 0.94 }; // Default to English
  }
};

// Enhanced Mock processing function instead of Langchain
async function processMockTranslation(fileName: string, content: string, targetLanguage: string) {
  console.log(`Starting mock translation pipeline for ${targetLanguage}`);
  const startTime = performance.now();
  
  // 1. Detect file type and preprocess
  const { format, processedContent, confidence: fileConfidence } = detectFileTypeAndPreprocess(fileName, content);
  console.log(`Detected file format: ${format} with confidence ${fileConfidence}`);
  
  // 2. Detect source language
  const { language: sourceLanguage, confidence: languageConfidence } = await detectLanguage(processedContent);
  console.log(`Detected source language: ${sourceLanguage} with confidence ${languageConfidence}`);
  
  // 3. Mock text chunking
  const chunkSize = 1000;
  const chunks = [];
  
  for (let i = 0; i < processedContent.length; i += chunkSize) {
    chunks.push(processedContent.slice(i, i + chunkSize));
  }
  
  console.log(`Document split into ${chunks.length} chunks`);
  
  // 4. Mock document processing and translation
  console.log("Simulating translation process");
  
  // Simulate various translation steps with delays
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 5. Call mock third-party translation API
  console.log("Calling third-party translation API");
  await simulateThirdPartyTranslationAPI(sourceLanguage, targetLanguage, chunks.length);
  
  const endTime = performance.now();
  const processingTime = Math.round(endTime - startTime);
  
  // Calculate a confidence score based on various factors
  const overallConfidence = calculateConfidenceScore(
    fileConfidence,
    languageConfidence,
    chunks.length,
    sourceLanguage,
    targetLanguage
  );
  
  console.log("Translation process completed successfully");
  console.log(`Overall confidence score: ${overallConfidence}`);
  
  return {
    success: true,
    chunks: chunks.length,
    vectorStore: "completed",
    modelUsed: "deepseek-coder",
    processingTime,
    totalTokens: chunks.length * 1500, // Rough estimate of tokens used
    confidenceScore: overallConfidence
  };
}

// Simulate calling a third-party translation API
async function simulateThirdPartyTranslationAPI(sourceLanguage: string, targetLanguage: string, chunkCount: number) {
  console.log(`Calling third-party API to translate from ${sourceLanguage} to ${targetLanguage}`);
  
  // Simulate API call with artificial delay based on document size
  const delay = Math.min(2000 + (chunkCount * 100), 5000);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  console.log(`Third-party API translation completed for ${chunkCount} chunks`);
  return {
    success: true,
    translatedChunks: chunkCount,
    apiName: "GlobalTranslate API" // Mock API name
  };
}

// Calculate a confidence score for the translation
function calculateConfidenceScore(
  fileConfidence: number, 
  languageConfidence: number,
  chunkCount: number,
  sourceLanguage: string,
  targetLanguage: string
): number {
  // Base score from our detection confidences
  let score = (fileConfidence + languageConfidence) / 2;
  
  // Adjust based on document complexity
  if (chunkCount > 20) {
    score -= 0.05; // Larger documents might have more translation inconsistencies
  }
  
  // Adjust based on language pair complexity
  const complexPairs = [
    ['japanese', 'english'],
    ['chinese', 'english'],
    ['arabic', 'english'],
    ['english', 'japanese'],
    ['english', 'chinese'],
    ['english', 'arabic']
  ];
  
  const langPair = [sourceLanguage, targetLanguage];
  const isComplexPair = complexPairs.some(pair => 
    pair[0] === langPair[0] && pair[1] === langPair[1]
  );
  
  if (isComplexPair) {
    score -= 0.1; // Complex language pairs are harder to translate accurately
  }
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

// Setup intercept for fetch to use our mock API
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
  if (typeof url === 'string') {
    // Auth endpoints
    if (url.endsWith('/api/auth/login') && options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      try {
        // Extract username and password from the request body
        // Note: The backend expects 'username' but our mock handlers use 'email'
        const result = await api.auth.login(body.username, body.password);
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error: any) {
        return new Response(JSON.stringify({ message: error.message }), { status: 401 });
      }
    }
    
    if (url.endsWith('/api/auth/logout') && options?.method === 'POST') {
      try {
        const result = await api.auth.logout();
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error: any) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
    }
    
    if (url === '/api/auth/request-password' && options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      try {
        const result = await api.auth.requestPassword(body.email);
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error: any) {
        return new Response(JSON.stringify({ message: error.message }), { status: 400 });
      }
    }
    
    // Translation endpoints with fixed URL handling to work with proxies
    if (url.endsWith('/api/translation/upload') && options?.method === 'POST') {
      const formData = options.body as FormData;
      const file = formData.get('file') as File;
      const targetLanguage = formData.get('targetLanguage') as string;
      
      try {
        const result = await api.translation.uploadDocument(file, targetLanguage);
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error: any) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
    }
    
    // New endpoint for checking translation status
    if (url.match(/\/api\/translation\/status\/[^\/]+$/) && !options?.method) {
      const translationId = url.split('/').pop();
      try {
        const result = await api.translation.checkStatus(translationId);
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error: any) {
        return new Response(JSON.stringify({ message: error.message }), { status: 404 });
      }
    }
    
    if (url.endsWith('/api/translation/history')) {
      try {
        const result = await api.translation.fetchTranslations();
        return new Response(JSON.stringify(result), { status: 200 });
      } catch (error: any) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
    }
  }
  
  // Pass through to real fetch for any other requests
  return originalFetch(url, options);
};
