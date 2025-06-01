
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store'
import { LanguageProvider } from './contexts/LanguageContext'
import App from './App.tsx'
import './index.css'

/**
 * Frontend-Backend Integration Guide
 * 
 * This application uses a clear separation of concerns:
 * 
 * FRONTEND:
 * - Handles UI, file selection, and displays translation progress
 * - Communicates with backend through RESTful API calls
 * - No language processing is done on the frontend
 * 
 * BACKEND (FastAPI Python):
 * - Handles all document processing and translation using:
 *   - Langchain for document handling and processing
 *   - DeepSeek LLM for translation and understanding
 *   - RAG (Retrieval Augmented Generation) for improved quality
 *   - Third-party translation APIs for verification
 *   - FAISS vector store for document embeddings
 * 
 * The backend API is expected to be running at:
 * - Development: http://localhost:5000
 * - Production: Same domain as frontend (relative /api path)
 * 
 * Key endpoints used:
 * - POST /api/translation/upload - Upload documents for translation
 * - GET /api/translation/status/:id - Check translation status
 * - GET /api/translation/history - Get all translations
 * - GET /api/translation/download/:id - Download translated document
 * 
 * See INTEGRATION.md for detailed integration instructions.
 */

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </PersistGate>
  </Provider>
);
