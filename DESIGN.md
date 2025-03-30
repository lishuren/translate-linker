
# LingoAIO Design Document

## System Architecture

LingoAIO is a document translation platform built with a modern React frontend and FastAPI backend. The system leverages AI technology for high-quality translations and uses efficient document processing workflows.

### Technology Stack

#### Frontend
- **Framework**: React with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **UI Components**: Custom components with Tailwind CSS
- **API Communication**: Fetch API with async/await

#### Backend
- **Framework**: FastAPI (Python)
- **Authentication**: JWT-based authentication with SQLite storage
- **Database**: 
  - SQLite for user authentication and session management
  - ChromaDB for RAG (Retrieval-Augmented Generation) and document processing
- **File Storage**: Local file system with organized directory structure
- **Translation Processing**: Custom translation service with AI integration

## Core Features

### Authentication
- Username/password authentication
- Session management (email users have session expiration, username users have persistent sessions)
- JWT token-based API security

### Document Translation
- Document upload with language selection
- Background processing with status tracking
- RAG-enhanced translation for improved accuracy
- Download of completed translations

### User Management
- User preferences and settings
- Role-based permissions
- Activity tracking

## Data Models

### User
```
User {
  id: string
  username: string
  email: string (optional)
  isLoggedIn: boolean
  role: string (optional)
  lastLogin: datetime (optional)
  preferences: {
    theme: string (optional)
    language: string (optional)
    notifications: boolean (optional)
  }
}
```

### Translation
```
Translation {
  id: string
  originalFileName: string
  targetLanguage: string
  status: TranslationStatus (PENDING, PROCESSING, COMPLETED, FAILED)
  downloadUrl: string (optional)
  createdAt: datetime
  errorMessage: string (optional)
  processingDetails: {
    engine: string
    model: string
    vectorStore: string
    documentChunks: number
    ragEnabled: boolean
    processingTime: number (optional)
    totalTokens: number (optional)
    translationProvider: string (optional)
    agentEnabled: boolean
    confidenceScore: number (optional)
  }
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user information

### Translation
- `POST /api/translation/upload` - Upload document for translation
- `GET /api/translation/status/:id` - Check translation status
- `GET /api/translation/history` - Get user's translation history
- `GET /api/translation/download/:id` - Download translated document

## Data Storage

### SQLite Database
- Used for authentication, user data, and session management
- Tables:
  - users - User information
  - sessions - Active user sessions
  - user_preferences - User settings and preferences

### ChromaDB
- Vector database for RAG (Retrieval-Augmented Generation)
- Used for document chunking and embedding storage
- Each user has dedicated ChromaDB collections for their documents
- Enables context-aware translation with better accuracy

## Development Setup

### Prerequisites
- Node.js 18+ for frontend development
- Python 3.9+ for backend development
- SQLite3 for database
- ChromaDB for vector storage

### Initial Setup
1. Clone repository
2. Install frontend dependencies: `npm install`
3. Install backend dependencies: `pip install -r requirements.txt`
4. Set up environment variables
5. Initialize database: `python init_db.py`
6. Start development servers:
   - Frontend: `npm run dev`
   - Backend: `python app.py`

## Deployment
- Frontend can be deployed as static files on any web server
- Backend requires Python runtime with appropriate dependencies
- Ensure database files are properly secured and backed up
- Configure proper CORS settings for production

## Future Enhancements
- Multi-language UI
- Advanced document processing options
- Integration with more translation providers
- Analytics dashboard for usage statistics
- Collaborative translation workflows
