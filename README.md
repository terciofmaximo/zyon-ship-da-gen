# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d3d05465-c0cc-42f6-9754-aaeda4e2b177

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d3d05465-c0cc-42f6-9754-aaeda4e2b177) and start prompting.

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

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (external project integration)

## How can I change Supabase configuration?

If you need to rotate keys or connect to a different Supabase project:

1. Open `src/config/supabase.ts`
2. Update `SUPABASE_URL` with your project URL
3. Update `SUPABASE_PUBLISHABLE_KEY` with your anon/public key

**Note:** The publishable key (anon key) is safe to expose in client-side code. It is protected by Row Level Security (RLS) policies on the database. The service role key (private) should only be stored in Supabase Secrets for edge functions.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d3d05465-c0cc-42f6-9754-aaeda4e2b177) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
