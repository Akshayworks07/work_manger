# Creative Team Production Manager

An internal project and task management system for a creative production team,
covering the workflow: Project → Task → Assigned Team Member → Production
Stage → Review → Completion.

## Status
🚧 In active development, built in phases. See `PHASE-0-architecture.md` for
the full plan.

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + a hand-built shadcn/ui-style component library
- Supabase (Postgres database, Auth, Storage, Row Level Security)
- Deployed on Vercel

## Local Development
```bash
npm install
npm run dev
```

## Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase project values.
Never commit `.env.local` — it's already excluded in `.gitignore`.
