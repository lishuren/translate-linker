
# LingoAIO - Setup Guide

This document provides instructions for setting up the LingoAIO backend with RAG, TMX support, and multiple LLM providers.

## System Requirements

- Python 3.9 or later
- pip package manager
- SQLite (included with the project)
- 4GB+ RAM (recommended for embedding models)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>/backend
```

### 2. Set Up Python Environment

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example environment file and update it with your API keys and configuration:

```bash
cp .env.example .env
```

Edit the `.env` file to set your API keys and configuration:

- Set `DEFAULT_LLM_MODEL` to your preferred provider (openai, anthropic, google, groq, cohere, huggingface, deepseek, siliconflow)
- Add API keys for the LLM providers you plan to use
- Configure web translation services if needed
- Set `RAG_ENABLED=true` to enable Retrieval Augmented Generation
- Configure database settings if you want to use a persistent database

### 4. Initialize the Database

The SQLite database will be automatically initialized when you start the server. The default user (username: tmxer, password: abcd1234) will be created automatically.

### 5. Create Required Directories

```bash
mkdir -p vector_stores tmx_files config translations uploads data/chroma
```

### 6. Start the Server

```bash
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

The API will be available at http://localhost:5000

## Authentication

The system uses SQLite for user authentication with the following features:

- Default user: username=tmxer, password=abcd1234
- Email-type usernames (containing @) have session-expiring passwords
- Regular usernames have non-expiring passwords
- Authentication endpoints:
  - POST /api/auth/login - Log in with username/password
  - POST /api/auth/logout - Log out and invalidate token
  - GET /api/auth/me - Get current user information

## Using Translation Memory eXchange (TMX)

### Importing TMX Files

To import existing translation memories, use the `/api/tmx/upload` endpoint:

```bash
curl -X POST -F "file=@your_file.tmx" -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/tmx/upload
```

### Exporting Translations as TMX

Use the `/api/translation/{translation_id}/export-tmx` endpoint to export a completed translation as a TMX file.

## ChromaDB for RAG

The system uses ChromaDB for translation memory and RAG:

- Each user has their own ChromaDB collection
- Translation data is automatically added to the user's RAG store
- ChromaDB stores are persisted to disk in the data/chroma directory
- The database will grow as more translations are performed

## Frontend Setup

The frontend is a React application that communicates with this backend. To set it up:

1. Navigate to the frontend directory: `cd ../frontend`
2. Install dependencies: `npm install` or `yarn install`
3. Update the API base URL in `src/services/translationApi.ts` if needed
4. Start the development server: `npm run dev` or `yarn dev`

## Advanced Configuration

### Global Configuration

To modify global settings, edit the `global_config.json` file in the `config` directory.

### RAG Configuration

Retrieval Augmented Generation settings can be adjusted in the global config file:

- `rag_enabled`: Enable/disable RAG
- `chunk_size`: Size of document chunks for embedding
- `chunk_overlap`: Overlap between chunks
- `vector_store_type`: Type of vector store (now using "chroma")

### User-Specific Settings

User-specific settings are stored in the `user_settings.json` file. These override global settings when a user ID is provided with API requests.

## Adding a New LLM Provider

To add a new LLM provider:

1. Create a new service file in the `services` directory
2. Update the `get_llm` method in `TranslationService` to support the new provider
3. Add the provider's configuration to the `.env` file
4. Update the global configuration

## Database Files

The following database files are used and should be included in git:

- `backend/data/auth.db` - SQLite database for authentication
- `backend/data/chroma/` - ChromaDB directory for vector storage

## Troubleshooting

- **API Key Issues**: Ensure all required API keys are set correctly in the `.env` file
- **Authentication Issues**: Check that the SQLite database is writable and accessible
- **Memory Errors**: If you encounter memory errors, try reducing batch sizes and model complexity
- **ChromaDB Errors**: Ensure the ChromaDB directory is writable

