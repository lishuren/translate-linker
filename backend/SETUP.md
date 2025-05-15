
# LingoAIO Backend Setup Guide

This guide provides step-by-step instructions for setting up the LingoAIO backend.

## Prerequisites

- Python 3.8 or higher
- Virtual environment tool (venv, conda, etc.)
- Required Python packages (specified in requirements.txt)

## Setup Instructions

### 1. Clone the Repository

If you haven't already, clone the repository to your local machine.

### 2. Create a Virtual Environment

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# App configuration
SECRET_KEY=your_secret_key_here
DEBUG=False  # Set to True for development

# Database configuration
DATABASE_URL=sqlite:///./data/auth.db

# Default LLM provider
DEFAULT_LLM_MODEL=openai

# LLM API keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here
COHERE_API_KEY=your_cohere_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
SILICONFLOW_API_BASE=https://api.siliconflow.cn/v1/chat/completions
SILICONFLOW_MODEL_NAME=Pro/deepseek-ai/DeepSeek-V3

# RAG settings
RAG_ENABLED=true
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

You only need to provide API keys for the LLM providers you intend to use.

### 5. Initialize the Database

```bash
python -c "from models.database import initialize_db; initialize_db()"
```

This will create the necessary database tables.

### 6. Start the Server

#### Standard Mode
```bash
# Basic mode (no detailed logging)
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

#### Debug Mode
To enable detailed logging, including bearer tokens and API conversations, set the DEBUG environment variable:

```bash
# On Windows
set DEBUG=True && uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# On macOS/Linux
DEBUG=True uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

Note: Uvicorn doesn't have a `--debug` flag directly. Instead, use the DEBUG environment variable or add it to your .env file.

The API will be available at http://localhost:5000

## API Documentation

The API documentation will be available at http://localhost:5000/docs when the server is running.

## Authentication

### Creating the First User

To create a first admin user, use the following command:

```bash
python -c "from models.authentication import create_admin_user; create_admin_user('admin', 'password')"
```

This will create a user with the username "admin" and the specified password.

### Authentication Endpoints

- **POST /api/auth/login** - Log in with username and password
- **POST /api/auth/logout** - Log out (requires authentication)
- **GET /api/auth/me** - Get current user details (requires authentication)

### Adding Additional Users

You can create additional users using the admin token:

```
POST /api/auth/create-user
```

Request body:
```json
{
  "username": "newuser",
  "password": "newpassword",
  "email": "user@example.com" // Optional
}
```

Include the admin token in the Authorization header.

## Frontend Integration

### Setting Up the Frontend

1. Configure the frontend to connect to the backend API
2. Set the API base URL in `.env` or configuration files
3. Update the API base URL in `src/services/translationApi.ts` if needed
4. Start the development server: `npm run dev` or `yarn dev`

## Translation Files

### Accessing Translated Files

Completed translations can be accessed in several ways:

1. **Through the web interface**:
   - Navigate to the translation history in the application
   - Find your completed translation
   - Click the "Download" button to retrieve the file

2. **Direct API access**:
   - For programmatic access: `GET /api/translation/download/{translation_id}`
   - Add your authentication token in the headers

3. **File system location**:
   - Translated files are stored in the `translations` directory on the server
   - File naming format: `{translation_id}_{original_filename}`

### Translation Status Monitoring

You can check the status of a translation by using:
- Web interface: Status indicators on the dashboard
- API: `GET /api/translation/status/{translation_id}`

## Advanced Configuration

### Global Configuration

The backend uses a global configuration file (`global_config.json`) to store various settings:

```json
{
  "llm_settings": {
    "default_provider": "openai",
    "providers": {
      "openai": {
        "model": "gpt-3.5-turbo"
      },
      "anthropic": {
        "model": "claude-2"
      }
    }
  },
  "translation_settings": {
    "max_chunk_size": 2000,
    "default_service": "none",
    "rag_enabled": true
  },
  "user_settings": {
    "allow_model_selection": true
  }
}
```

### Configuring RAG (Retrieval-Augmented Generation)

RAG is enabled by default and can be configured in the `global_config.json` file:

```json
"translation_settings": {
  "rag_enabled": true,
  "chunk_size": 1000,
  "chunk_overlap": 200
}
```

## Troubleshooting

Common issues and solutions:

- **API Key Issues**: Ensure API keys are correctly set in the .env file
- **Permission Errors**: Check that file directories have appropriate write permissions
- **Database Errors**: Verify that the database path is correct and accessible
- **Memory Errors**: If you encounter memory errors, try reducing batch sizes and model complexity
- **ChromaDB Errors**: Ensure the ChromaDB directory is writable
