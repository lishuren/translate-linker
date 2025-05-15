
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

## Web3 projects

Note: If you're working with Web3 technology, please be aware of the following:

- The Preview page in Lovable currently has a blocker for Web3 technology.
- For MetaMask, even in the local preview, you need to open the preview in a new tab using the dedicated button.
- Your deployed app will work perfectly fine with Web3 technologies.

## Custom domains

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Backend Setup and Debug Mode

### Starting the Backend

To run the backend server:

```sh
# Navigate to the backend directory
cd backend

# Standard mode
uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# Debug mode - provides detailed logging including API conversations and bearer tokens
# Option 1: Set the DEBUG environment variable before running uvicorn
# On Windows
set DEBUG=True && uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# On macOS/Linux
DEBUG=True uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# Option 2: Add DEBUG=True to your .env file
```

Important: Uvicorn doesn't support a `--debug` flag directly. Instead, use the DEBUG environment variable as shown above.

### Downloading Translated Files

Once a translation is completed:

1. Navigate to the dashboard in the application
2. Find your completed translation in the list (marked as "Completed")
3. Click the "Download" button next to the completed translation
4. The file will be downloaded to your computer with the translated content

Alternatively, you can access the download API directly at:
`/api/translation/download/{translation_id}`

Where `translation_id` is the unique identifier for your translation. This ID is provided when you submit a document for translation and can also be found in the translation history.

### Translation Failure Debugging

If a translation fails:

1. Check that your LLM provider API keys are correctly configured in the backend .env file
2. Use debug mode to see detailed API conversation logs
3. View the specific error by clicking "View Error" on the failed translation in the dashboard
4. Check the server logs for more detailed information
