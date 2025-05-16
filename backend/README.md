
# LingoAIO Backend

This is the backend service for LingoAIO, a document translation application that uses various LLM services and RAG (Retrieval-Augmented Generation) to provide high-quality translations.

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/Mac: `source venv/bin/activate`
4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
5. Copy `.env.development` to `.env` and configure your environment variables:
   ```
   cp .env.development .env
   ```
6. Run the FastAPI server:
   ```
   uvicorn app:app --reload --port 5000
   ```

## VS Code Integration

This project includes VS Code configuration files in the `.vscode` directory for easy setup and debugging. To use them:

1. Open the project in VS Code
2. Install recommended extensions
3. Press F5 to start debugging the FastAPI application

## Project Structure

- `app.py`: Main FastAPI application entry point
- `app_auth.py`: Authentication routes and logic
- `app_tmx.py`: TMX file management routes and logic
- `models/`: Database models and schemas
- `services/`: Business logic and services

## API Documentation

When the server is running, access the Swagger UI documentation at:

```
http://localhost:5000/docs
```

Or the ReDoc documentation at:

```
http://localhost:5000/redoc
```
