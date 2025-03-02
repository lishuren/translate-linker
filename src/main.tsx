
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store'
import App from './App.tsx'
import './index.css'

// Create an integration guide comment
/**
 * Frontend-Backend Integration Guide
 * 
 * This application integrates with a FastAPI backend that provides:
 * 1. Document translation using Langchain, DeepSeek LLM, and RAG
 * 2. Translation job status tracking and progress updates
 * 3. Translated document storage and retrieval
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
 */

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
