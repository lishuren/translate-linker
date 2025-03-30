
# Advanced Translation Service - Setup Guide

This document provides instructions for setting up the Translation Service backend with RAG, TMX support, and multiple LLM providers.

## System Requirements

- Python 3.9 or later
- pip package manager
- SQLite/PostgreSQL/MySQL (optional, for persistent storage)
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

```bash
python -c "from models.database import init_db; init_db()"
```

### 5. Create Required Directories

```bash
mkdir -p vector_stores tmx_files config translations uploads
```

### 6. Start the Server

```bash
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

The API will be available at http://localhost:5000

## Using Translation Memory eXchange (TMX)

### Importing TMX Files

To import existing translation memories, use the `/api/tmx/upload` endpoint:

```bash
curl -X POST -F "file=@your_file.tmx" http://localhost:5000/api/tmx/upload
```

### Exporting Translations as TMX

Use the `/api/translation/{translation_id}/export-tmx` endpoint to export a completed translation as a TMX file.

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
- `vector_store_type`: Type of vector store to use (faiss, redis, pinecone)

### User-Specific Settings

User-specific settings are stored in the `user_settings.json` file. These override global settings when a user ID is provided with API requests.

## Adding a New LLM Provider

To add a new LLM provider:

1. Create a new service file in the `services` directory
2. Update the `get_llm` method in `TranslationService` to support the new provider
3. Add the provider's configuration to the `.env` file
4. Update the global configuration

## Troubleshooting

- **API Key Issues**: Ensure all required API keys are set correctly in the `.env` file
- **Memory Errors**: If you encounter memory issues, try reducing batch sizes and model complexity
- **Database Errors**: Check database connection settings and ensure the database exists
