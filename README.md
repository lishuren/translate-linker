
# Welcome to your Lovable project

## Project info

Project ID: 96da4a68-5fe4-4905-9a26-e89dc3ee0c17
Created: May 15th, 2025

### Project structure

We've set up a basic project structure for you.

- **src**: Contains your source code, including the React components and Typescript files.
- **assets**: A directory for your static assets, like images and fonts.
- **public**: This folder contains the static files that will be served by your web server.
- **components.json**: Configuration file for shadcn/ui.
- **tailwind.config.ts**: Configuration file for Tailwind CSS.
- **tsconfig.json**: Configuration file for TypeScript.
- **vite.config.ts**: Configuration file for Vite.

### Available commands

- `npm run dev`: Start the development server.
- `npm run build`: Build the project for production.
- `npm run serve`: Serve the production build.
- `npm run lint`: Run the linter.
- `npm run test`: Run the tests.

### Learn more

Check out the [shadcn/ui documentation](https://ui.shadcn.com/docs) to learn more about the UI components.

## Deploy your project

To deploy your project to Lovable, the simplest way is to click the Publish button.

Once published, you'll get a shared URL that you can use to share your project with others.

### Custom domains

You can add a custom domain to your project in the Lovable dashboard.

1. Go to the [Lovable dashboard](https://app.lovable.dev/projects)
2. Click on your project
3. Go to the "Settings" tab
4. Click on the "Domains" tab
5. Add your custom domain

After adding your custom domain, you'll need to configure your DNS settings to point to Lovable. You'll find the instructions in the dashboard.

## Run locally

1. Clone this repository
2. Install the dependencies with `npm install`
3. Start the development server with `npm run dev`

## Backend Setup and Debugging

### Required Environment Variables

Create a `.env` file in the backend directory with these minimum settings:
```
# App configuration
SECRET_KEY=your_secret_key_here
DEBUG=True  # Set to True to enable debug mode

# LLM Settings
DEFAULT_LLM_MODEL=siliconflow  # or openai, anthropic, etc.
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_API_BASE=https://api.siliconflow.cn/v1/chat/completions
SILICONFLOW_MODEL_NAME=Pro/deepseek-ai/DeepSeek-V3

# Server Settings
PORT=5000
HOST=0.0.0.0
```

### Starting the Backend Server

To run the backend server with debug logging:

```sh
# Navigate to the backend directory
cd backend

# Set DEBUG=True in your .env file or use:
# On Windows:
set DEBUG=True && uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# On macOS/Linux:
DEBUG=True uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

### Debug Mode Features

When DEBUG=True is set in the .env file or environment variables:
- Detailed API conversations are logged
- Bearer tokens are shown (partially masked for security)
- Request/response payloads are displayed
- Error traces are printed
- Performance metrics (timing) are included

### Testing LLM API Directly

For direct testing of the LLM API integration:
```
GET /api/debug/llm-test/{provider}?prompt=your_test_prompt
```

Example URL:
```
http://localhost:5000/api/debug/llm-test/siliconflow?prompt=Translate%20this%20to%20French:%20Hello%20world
```

### Downloading Translated Files

Once a translation is completed:

1. Via Web UI:
   - Go to the dashboard
   - Find your completed translation
   - Click the "Download" button

2. Via Direct API:
   ```
   GET /api/translation/download/{translation_id}
   ```

3. File System Location:
   - Translated files are stored in the `translations` directory
   - Files are named as `{translation_id}_{original_filename}`

### Common Debug Issues

If you encounter translation errors:

1. Check API key configuration in .env
2. Verify the DEBUG=True is set to see detailed error logs
3. Look for error messages in console output
4. Test the LLM provider directly using the debug endpoint
5. Check the translation files directory for any output
6. Verify network connectivity to the LLM API service
7. Check file permissions for read/write access to necessary directories

For additional backend setup details, please refer to the `backend/SETUP.md` file.

## Web3 projects

Note: If you're working with Web3 technology, please be aware of the following:

- The Preview page in Lovable currently has a blocker for Web3 technology.
- For MetaMask, even in the local preview, you need to open the preview in a new tab using the dedicated button.
- Your deployed app will work perfectly fine with Web3 technologies.
