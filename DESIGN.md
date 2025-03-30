
# LingoAIO System Design Documentation

## Overview

LingoAIO is an AI-powered document translation platform that leverages modern language models, Translation Memory eXchange (TMX), and Retrieval-Augmented Generation (RAG) to provide accurate and context-aware translations across multiple languages and document formats.

## System Architecture

### Frontend

The frontend is built with React, Redux, and TypeScript, providing a responsive and intuitive user interface for document translation operations.

#### Key Components:

- **Authentication System**: Manages user sessions and access control
- **Translation Upload**: Handles document uploads and translation parameters
- **Translation History**: Tracks and displays past translations with status and download options
- **User Preferences**: Manages user-specific settings and configurations

### Backend

The backend uses a combination of Python services, SQLite for authentication, and ChromaDB for RAG functionalities.

#### Key Components:

- **Authentication Service**: Manages user credentials and session control using SQLite
- **Translation Service**: Coordinates the translation pipeline
- **RAG Translation Service**: Implements Retrieval-Augmented Generation for context-aware translations
- **TMX Service**: Processes and utilizes Translation Memory eXchange files
- **File Service**: Manages document uploads, storage, and retrieval
- **Web Translation Service**: Integrates with third-party translation APIs

## Database Structure

### SQLite (Auth Database)

Used for storing user authentication data with the following schema:

- **Users Table**:
  - id (Primary Key)
  - username (unique)
  - email (unique)
  - password_hash
  - is_email_type (Boolean) - determines password expiration rules
  - last_login
  - created_at
  - session_token (for web sessions)

### ChromaDB (Vector Database)

Used for storing and retrieving translation embeddings with user-specific collections:

- **Collections**: One per user
- **Documents**: Translation segments with metadata
- **Metadata**:
  - source_language
  - target_language
  - document_type
  - creation_date
  - confidence_score
  - original_document_id

## Key Features

### Authentication System

- **Password Rules**: Email-type users have session-based expiration; username-type users have persistent logins
- **Default User**: username: `tmxer`, password: `abcd1234`

### Translation Processing

1. **Document Upload**: Files are uploaded, validated, and stored
2. **Language Detection**: Source language is automatically detected
3. **Document Processing**: Files are parsed and segmented based on format
4. **RAG Integration**: 
   - Similar segments from previous translations are retrieved
   - Context is provided to the LLM for improved translation quality
5. **LLM Translation**: Documents are translated using configured language models
6. **Post-processing**: Formatting is preserved and output documents are generated

### TMX Support

- **TMX Upload**: Users can upload previous translation memory files
- **TMX Processing**: Files are parsed and stored in the user's ChromaDB collection
- **RAG Integration**: TMX data enhances translation quality through retrieval

### Storage and Persistence

- **SQLite**: Authentication data persists across sessions
- **ChromaDB**: Translation knowledge persists across sessions with user-specific collections
- **Git Integration**: Core database files are included in the repository for easy setup

## Third-Party Integrations

### LLM Services

- Primary support for SiliconFlow's cloud.siliconflow.cn
- Configurable model selection based on user permissions

### Translation APIs

- Integration with external translation services for comparison and backup

## Setup Instructions

### Backend Setup

1. **Environment Configuration**:
   - Configure environment variables or use defaults
   - Database paths for SQLite and ChromaDB are pre-configured

2. **Dependencies Installation**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Database Initialization**:
   - SQLite database is included with default user: tmxer/abcd1234
   - ChromaDB initializes automatically on first use

4. **Starting the Backend**:
   ```bash
   python app.py
   ```

### Frontend Setup

1. **Dependencies Installation**:
   ```bash
   npm install
   ```

2. **Starting the Frontend**:
   ```bash
   npm run dev
   ```

## Design Principles

1. **User-Centric Design**: Focused on ease of use and clear workflow
2. **Modularity**: Services are designed to be independent and replaceable
3. **Persistence**: User data and translation knowledge persist across sessions
4. **Security**: Authentication data is properly secured
5. **Extensibility**: The system is designed to accommodate additional languages, models, and features

## Future Enhancements

1. **Multi-tenant Support**: Enhanced isolation between user data
2. **Advanced RAG Models**: Implement more sophisticated retrieval mechanisms
3. **Collaborative Translations**: Allow multiple users to contribute to translations
4. **Terminology Management**: Custom terminology databases per user/organization
5. **Quality Metrics**: Implement objective translation quality assessment

---

This design document will be updated as the system evolves.

Last Updated: [Current Date]
