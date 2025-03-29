
/**
 * Translation API Service
 * 
 * This service provides methods to interact with the backend translation API
 * which uses Langchain with multiple LLM providers (OpenAI/ChatGPT, Anthropic/Claude,
 * Google/Vertex AI/Grok, Groq, Cohere, HuggingFace, DeepSeek) for document translation.
 * 
 * All actual translation processing happens on the backend - this service
 * only handles API communication.
 */

// API base URL determined by environment
// In development, connect to localhost:5000
// In production, use relative URL to the backend
const API_BASE_URL = import.meta.env.DEV 
  ? "http://localhost:5000" 
  : "/api";

/**
 * Uploads a document for translation
 * 
 * @param file - The document file to be translated
 * @param targetLanguage - The target language code (e.g., 'es', 'fr')
 * @param llmProvider - Optional LLM provider to use (e.g., 'openai', 'anthropic', 'google', 'groq', 'cohere', 'huggingface', 'deepseek')
 * @returns The created translation job data
 */
export const uploadDocument = async (
  file: File, 
  targetLanguage: string, 
  llmProvider?: string
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetLanguage", targetLanguage);
  if (llmProvider) {
    formData.append("llmProvider", llmProvider);
  }

  const response = await fetch(`${API_BASE_URL}/api/translation/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to upload document");
  }

  return await response.json();
};

/**
 * Checks the status of a translation job
 * 
 * @param translationId - The ID of the translation job
 * @returns The current status and progress of the translation
 */
export const checkTranslationStatus = async (translationId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/translation/status/${translationId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to check translation status");
  }

  return await response.json();
};

/**
 * Fetches the translation history
 * 
 * @returns List of all translation jobs
 */
export const fetchTranslationHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/api/translation/history`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch translation history");
  }

  return await response.json();
};

/**
 * Gets the download URL for a completed translation
 * 
 * @param translationId - The ID of the completed translation
 * @returns The download URL for the translated document
 */
export const getDownloadUrl = (translationId: string) => {
  return `${API_BASE_URL}/api/translation/download/${translationId}`;
};

export default {
  uploadDocument,
  checkTranslationStatus,
  fetchTranslationHistory,
  getDownloadUrl
};
