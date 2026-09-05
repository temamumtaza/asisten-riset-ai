# Asisten Riset AI

Workspace riset untuk menyusun pertanyaan, membaca sumber, menyimpan bukti, dan meminta masukan dosen dalam putaran kerja yang bisa diulang.

## Local setup

1. Run npm install.
2. Copy .env.example to .env.local.
3. Fill the Supabase URL and publishable key.
4. Enable Google provider and the /auth/callback URL in Supabase Auth.
5. Set SUMOPOD_API_KEY for live AI assistance.
6. Run npm run dev.

## Checks

Run npm run typecheck, npm run lint, npm run test, npm run build, and npm run test:e2e.

## Deployment

The GitHub repository is connected to the Vercel project `asisten-riset-ai`.
Production: https://asisten-riset-ai-black.vercel.app

The production environment needs these variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUMOPOD_BASE_URL`
- `SUMOPOD_MODEL`
- `SUMOPOD_API_KEY`

The Supabase project must enable Google as the only provider and allow these callback URLs:

- `http://localhost:3000/auth/callback`
- `https://asisten-riset-ai-black.vercel.app/auth/callback`

The Google OAuth client ID and secret, plus the Sumopod API key, are account credentials and are
not committed to this repository. Until they are supplied, login and AI assistance show an explicit
configuration state. Paper search remains live through the configured external metadata providers.

## Production boundary

Paper metadata is fetched from OpenAlex, Semantic Scholar, and Crossref. Google Scholar is opened as external search because it does not provide a stable public API for automated retrieval. The application does not invent results when a provider or key is not available.

## Design

Read DESIGN.md before changing the interface. All major visual decisions need a short, inspectable reason.
