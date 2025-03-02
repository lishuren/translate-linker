
# Translation API Backend

This is the Python backend for the translation application that utilizes:
- Langchain for document processing and orchestration
- DeepSeek LLM for translation intelligence
- RAG (Retrieval Augmented Generation) for context-aware translation
- Integration with third-party translation APIs

## Setup

1. Install Python 3.9+ if not already installed
2. Install dependencies:
```
pip install -r requirements.txt
```
3. Set up environment variables:
```
cp .env.example .env
```
Then edit the .env file with your API keys

4. Run the server:
```
python app.py
```

The server will start on http://localhost:5000 by default.
