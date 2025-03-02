
# Frontend-Backend Integration Guide

This document explains how the React frontend integrates with the FastAPI backend for document translation.

## Architecture Overview

The application consists of:

1. **React Frontend**: Handles user interface, file uploads, and displays translation status
2. **FastAPI Backend**: Processes documents using Langchain, DeepSeek LLM, RAG, and third-party translation services

## API Endpoints

The frontend communicates with the backend through these endpoints:

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/api/translation/upload` | POST | Upload document for translation | FormData with `file` and `targetLanguage` | Translation job details |
| `/api/translation/status/:id` | GET | Check translation status | Translation ID in URL | Status and progress |
| `/api/translation/history` | GET | Get all translations | None | Array of translation jobs |
| `/api/translation/download/:id` | GET | Download translated document | Translation ID in URL | File download |

## Integration Points

### Configuration

The frontend automatically determines the API base URL:
- In development: `http://localhost:5000`
- In production: Relative URL `/api` (assumes backend is served from the same domain)

```typescript
// From src/services/translationApi.ts
const API_BASE_URL = import.meta.env.DEV 
  ? "http://localhost:5000" 
  : "/api";
```

### File Upload Process

1. User selects a file and target language
2. Frontend sends file to backend via FormData
3. Backend creates a translation job and returns job details
4. Frontend polls status endpoint periodically to track progress
5. When translation is complete, frontend enables download

### Error Handling

The frontend handles these error scenarios:
- Network connectivity issues
- Invalid file types
- Backend processing errors
- Status check failures

## Development Setup

To run the application locally:

1. Start the backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

2. Start the frontend:
   ```bash
   npm install
   npm run dev
   ```

3. The frontend will connect to `http://localhost:5000` in development mode

## Deployment Considerations

For production deployment:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Configure your web server to:
   - Serve static frontend files
   - Route `/api/*` requests to the backend
   - Ensure proper CORS configuration if frontend and backend are on different domains

3. Set up environment variables for the backend
   - Create a `.env` file in the backend directory with appropriate configuration

## Tech Stack

- **Frontend**: React, Redux, TypeScript
- **Backend**: FastAPI, Langchain, DeepSeek LLM, FAISS vector store
- **API Communication**: Standard fetch API with FormData for file uploads

## Troubleshooting

Common issues:

1. **CORS errors**: Ensure backend has proper CORS configuration
2. **Large file uploads fail**: Check server upload limits
3. **Translation stuck in processing**: Check backend logs for errors
4. **Download not working**: Verify file paths and permissions on the backend

For more details, see the backend API documentation.
