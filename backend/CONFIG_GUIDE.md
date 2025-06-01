
# LingoAIO Configuration Guide

This guide provides detailed instructions for configuring LingoAIO with various third-party LLM services and translation APIs.

## Environment Variables Configuration

Create a `.env` file in the backend directory with the following configuration options:

### Basic Settings
```bash
# Application Settings
DEBUG=True
SECRET_KEY=your_secret_key_here
API_TOKEN_EXPIRY=3600
HOST=0.0.0.0
PORT=5000

# Database Configuration
DATABASE_URL=sqlite:///data/auth.db

# Upload Settings
UPLOAD_FOLDER=./uploads
TRANSLATIONS_FOLDER=./translations
```

### LLM Provider Configuration

#### OpenAI Configuration
```bash
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Custom OpenAI settings
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_BASE=https://api.openai.com/v1
```

#### Anthropic (Claude) Configuration
```bash
# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Optional: Custom Anthropic settings
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

#### Google (Gemini) Configuration
```bash
# Google AI API Key
GOOGLE_API_KEY=your-google-ai-api-key-here

# Optional: Custom Google settings
GOOGLE_MODEL=gemini-pro
```

#### Groq Configuration
```bash
# Groq API Key
GROQ_API_KEY=gsk_your-groq-api-key-here

# Optional: Custom Groq settings
GROQ_MODEL=mixtral-8x7b-32768
```

#### Cohere Configuration
```bash
# Cohere API Key
COHERE_API_KEY=your-cohere-api-key-here

# Optional: Custom Cohere settings
COHERE_MODEL=command
```

#### Hugging Face Configuration
```bash
# Hugging Face API Key
HUGGINGFACE_API_KEY=hf_your-huggingface-token-here

# Optional: Custom Hugging Face settings
HUGGINGFACE_MODEL=microsoft/DialoGPT-medium
```

#### DeepSeek Configuration
```bash
# DeepSeek API Key
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here

# Optional: Custom DeepSeek settings
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_API_BASE=https://api.deepseek.com/v1
```

#### SiliconFlow Configuration
```bash
# SiliconFlow API Key
SILICONFLOW_API_KEY=sk-your-siliconflow-api-key-here

# Optional: Custom SiliconFlow settings
SILICONFLOW_MODEL_NAME=deepseek-ai/DeepSeek-V2.5
SILICONFLOW_API_BASE=https://api.siliconflow.cn/v1
```

### Translation Service Configuration

#### Default LLM Provider
```bash
# Set the default LLM provider
DEFAULT_LLM_MODEL=openai  # Options: openai, anthropic, google, groq, cohere, huggingface, deepseek, siliconflow
```

#### Web Translation Services

##### Google Translate API (Paid)
```bash
# Google Translate API Key (different from Google AI)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key-here
```

##### Microsoft Translator
```bash
# Microsoft Translator API Key
MICROSOFT_TRANSLATOR_API_KEY=your-microsoft-translator-key-here
MICROSOFT_TRANSLATOR_REGION=global  # or your specific region
```

##### DeepL Translator
```bash
# DeepL API Key
DEEPL_API_KEY=your-deepl-api-key-here
```

##### Web Translation Service Settings
```bash
# Default web translation service
WEB_TRANSLATION_SERVICE=googletrans  # Options: none, googletrans, google, microsoft, deepl

# Fallback API key (for backward compatibility)
TRANSLATION_API_KEY=your-fallback-translation-api-key
```

### RAG and Vector Database Configuration
```bash
# Enable/disable RAG functionality
RAG_ENABLED=True

# ChromaDB settings
CHROMA_PERSIST_DIRECTORY=./data/chroma_db

# Vector database configuration
VECTOR_STORE_TYPE=chroma  # Currently only chroma is supported
```

### CORS and Security Settings
```bash
# Allowed origins for CORS
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Security settings
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOW_HEADERS=*
```

## API Key Setup Instructions

### 1. OpenAI API Key
1. Visit [OpenAI API Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file as `OPENAI_API_KEY`

### 2. Anthropic API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to "API Keys"
4. Create a new API key
5. Copy the key and add it to your `.env` file as `ANTHROPIC_API_KEY`

### 3. Google AI API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file as `GOOGLE_API_KEY`

### 4. Groq API Key
1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign in or create an account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file as `GROQ_API_KEY`

### 5. DeepSeek API Key
1. Visit [DeepSeek Platform](https://platform.deepseek.com/api_keys)
2. Sign in or create an account
3. Create a new API key
4. Copy the key and add it to your `.env` file as `DEEPSEEK_API_KEY`

### 6. SiliconFlow API Key
1. Visit [SiliconFlow Console](https://siliconflow.cn/)
2. Sign in or create an account
3. Navigate to API settings
4. Create a new API key
5. Copy the key and add it to your `.env` file as `SILICONFLOW_API_KEY`

## Translation Services Setup

### Google Translate API (Paid Service)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Cloud Translation API"
4. Create credentials (API Key)
5. Add the key as `GOOGLE_TRANSLATE_API_KEY`

### Microsoft Translator
1. Visit [Azure Portal](https://portal.azure.com/)
2. Create a "Translator" resource
3. Copy the API key and region
4. Add as `MICROSOFT_TRANSLATOR_API_KEY` and `MICROSOFT_TRANSLATOR_REGION`

### DeepL API
1. Visit [DeepL API](https://www.deepl.com/pro-api)
2. Sign up for DeepL API Pro
3. Get your authentication key
4. Add as `DEEPL_API_KEY`

### Free Google Translate (googletrans)
- No API key required
- Uses the free Google Translate service
- Set `WEB_TRANSLATION_SERVICE=googletrans` to use it
- Limited by Google's usage policies

## Testing Your Configuration

### 1. Test API Keys
Run the following command to test your API key configuration:
```bash
curl -X GET "http://localhost:5000/api/config/api-key-status"
```

### 2. Test LLM Provider
Use the debug endpoint to test a specific provider:
```bash
curl -X GET "http://localhost:5000/api/debug/llm-test/openai?prompt=Hello%20world"
```

### 3. Test Translation Service
Check available translation services:
```bash
curl -X GET "http://localhost:5000/api/config/available-web-translation-services"
```

## Common Issues and Solutions

### Issue: "No API keys configured"
**Solution**: Ensure you have at least one LLM provider API key configured in your `.env` file.

### Issue: "Provider not available"
**Solution**: Check that the provider name in `DEFAULT_LLM_MODEL` matches one of the configured providers.

### Issue: "Translation service error"
**Solution**: 
1. Check your translation API keys
2. Verify your internet connection
3. Check API quotas and limits
4. Try switching to `googletrans` for free translation

### Issue: "RAG functionality not working"
**Solution**: 
1. Ensure `RAG_ENABLED=True` in your `.env`
2. Check that ChromaDB directory is writable
3. Verify vector database permissions

## Performance Optimization

### 1. Model Selection
- Use `gpt-4o-mini` for faster, cheaper responses
- Use `gpt-4o` for higher quality translations
- Use `claude-3-sonnet` for balanced performance

### 2. Translation Service Selection
- `googletrans`: Free, no API key required, rate limited
- `google`: Paid, high quality, high rate limits
- `microsoft`: Paid, good quality, moderate pricing
- `deepl`: Paid, excellent quality, higher pricing

### 3. RAG Configuration
- Enable RAG for better context-aware translations
- Disable RAG for faster processing of simple documents

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **API Key Rotation**: Regularly rotate your API keys
3. **Rate Limiting**: Monitor API usage to avoid unexpected charges
4. **Access Control**: Restrict API access to authorized users only
5. **HTTPS**: Always use HTTPS in production environments

## Support and Troubleshooting

For additional support:
1. Check the application logs for detailed error messages
2. Enable `DEBUG=True` for verbose logging
3. Use the `/api/config/system-info` endpoint for configuration debugging
4. Monitor API usage and quotas in respective provider dashboards
