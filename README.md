
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/96da4a68-5fe4-4905-9a26-e89dc3ee0c17

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/96da4a68-5fe4-4905-9a26-e89dc3ee0c17) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/96da4a68-5fe4-4905-9a26-e89dc3ee0c17) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

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
uvicorn app:app --host 0.0.0.0 --port 5000 --reload --debug
```

You can also set the DEBUG environment variable to "True" in your .env file or directly in the command:

```sh
# On Windows
set DEBUG=True && uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# On macOS/Linux
DEBUG=True uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

### Downloading Translated Files

Once a translation is completed:

1. Navigate to the dashboard in the application
2. Find your completed translation in the list
3. Click the "Download" button next to the completed translation
4. The file will be downloaded to your computer with the translated content

Alternatively, you can access the download API directly at:
`/api/translation/download/{translation_id}`

Where `translation_id` is the unique identifier for your translation. This ID is provided when you submit a document for translation and can also be found in the translation history.
