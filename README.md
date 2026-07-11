PersonaVault

This is an older personal project of mine. I built it to explore RAG (retrieval augmented generation) with a focus on storing your own documents and chatting with them. The goal was a simple multi-user document vault where you upload files, search them in natural language, and get answers backed by your data.

This repo is a monorepo with two packages:

- backend (root): Mastra agent, Express API, document ingestion, Qdrant vector search
- fe: Next.js frontend with Supabase auth

Package manager: pnpm

Requirements

- Node.js 20.9.0 or newer
- pnpm
- OpenAI API key
- Qdrant (local Docker or cloud)
- Supabase project (for the web app and multi-user features)

Setup

1. Install dependencies from the repo root:

   pnpm install

2. Copy env files and fill in your keys:

   cp env.example .env
   cp fe/env.example fe/.env.local

3. Set up Supabase. Run supabase-schema.sql in your Supabase SQL editor.

4. Set up Qdrant.

   Local:
   docker run -p 6333:6333 qdrant/qdrant
   pnpm run setup-qdrant

   Cloud:
   Add QDRANT_URL and QDRANT_API_KEY to .env
   pnpm run setup-cloud-qdrant

5. Put documents in the data/ folder and ingest:

   pnpm run ingest

Running

You need three terminals for the full app:

Terminal 1 - frontend (port 3000):
  pnpm --filter fe dev

Terminal 2 - Mastra agent:
  pnpm dev

Terminal 3 - REST API (port 4112):
  pnpm api

Open http://localhost:3000, sign up, upload documents, and use the chat tab.

Scripts

Backend (from root):
  pnpm dev              Mastra dev server
  pnpm api              Express API
  pnpm api:dev          API with hot reload
  pnpm ingest           Ingest files from data/
  pnpm setup-qdrant     Create local Qdrant index
  pnpm setup-cloud-qdrant  Create cloud Qdrant index
  pnpm test-api         Test API endpoints
  pnpm test-db          Test Supabase connection

Frontend:
  pnpm --filter fe dev
  pnpm --filter fe build
  pnpm --filter fe start

Environment variables

Backend (.env):
  OPENAI_API_KEY        required
  QDRANT_URL            Qdrant endpoint
  QDRANT_API_KEY        Qdrant key (cloud)
  SUPABASE_URL          Supabase project URL
  SUPABASE_ANON_KEY     Supabase anon key
  API_PORT              default 4112
  FRONTEND_URL          default http://localhost:3000

Frontend (fe/.env.local):
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_API_URL           default http://localhost:4112
  NEXT_PUBLIC_MASTRA_API_URL    default http://localhost:4112

Supported file types

PDF, DOC, DOCX, TXT, MD

License

MIT
