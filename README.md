# Video Delivery Tracker 🎬

A modern, high-performance Trello/Notion-style dashboard built for video production companies and creative studios to track deliverables per client, manage drag-and-drop kanban boards, and monitor real-time delivery analytics.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Actions, Route Handlers) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components (Radix primitives, Glassmorphism, Dark Mode)
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Data Caching & Fetching**: TanStack Query (React Query)
- **Forms & Validation**: `react-hook-form` + `zod`
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Analytics Charts**: `recharts`
- **Icons**: `lucide-react`
- **Celebration Effects**: `canvas-confetti`
- **Deployment**: Vercel

---

## 📂 File Structure

```
video-tracker/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx            # Supabase email/password login + 1-click preview
│   │   └── signup/page.tsx           # Account registration (Admin / Client)
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar, profile badge & status pill
│   │   ├── page.tsx                  # Executive overview dashboard
│   │   ├── clients/
│   │   │   ├── page.tsx              # Clients list & Add Client modal
│   │   │   └── [clientId]/page.tsx   # Client detail & projects progress
│   │   ├── projects/
│   │   │   └── [projectId]/page.tsx  # Interactive Kanban board
│   │   └── settings/page.tsx         # Profile settings & Supabase config guide
│   ├── api/
│   │   └── videos/route.ts           # REST API endpoints for deliverables
│   ├── layout.tsx                    # Root HTML layout with TanStack Query provider
│   └── globals.css                   # Theme tokens, custom scrollbar & glass styles
├── components/
│   ├── ui/                           # Button, Input, Textarea, Card, Dialog, Badge, Progress
│   ├── dashboard/
│   │   ├── StatCard.tsx              # Glowing metric cards
│   │   └── ClientSummaryCard.tsx     # Per-client delivery progress cards
│   ├── kanban/
│   │   ├── Board.tsx                 # dnd-kit context, optimistic updates & confetti
│   │   ├── Column.tsx                # Droppable container with item badges
│   │   └── VideoCard.tsx             # Sortable video card with due date urgency & thumbnails
│   └── charts/
│       └── StatusPieChart.tsx        # Recharts interactive donut chart
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (@supabase/ssr)
│   │   ├── server.ts                 # Server client (@supabase/ssr with cookies)
│   │   └── middleware.ts             # Session refresh helper
│   ├── types.ts                      # TypeScript definitions (Profile, Client, Project, Video)
│   ├── utils.ts                      # ClassName merger, date formatting, badge colors
│   ├── data-store.ts                 # Universal data layer (Supabase + demo fallback)
│   └── providers.tsx                 # QueryClientProvider & AppContext
├── supabase/
│   └── schema.sql                    # SQL migration with RLS policies, functions & triggers
├── middleware.ts                     # Protects (dashboard) routes
├── .env.local                        # Supabase credentials
└── package.json
```

---

## 🚀 Step-by-Step Setup Guide

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Note your database password and wait ~1-2 minutes for the database to provision.

### 2. Run the SQL Migration
1. In your Supabase dashboard, click on the **SQL Editor** tab on the left sidebar.
2. Open `supabase/schema.sql` from this repository.
3. Paste the entire contents into the SQL Editor and click **Run**.
4. This will create:
   - `profiles`, `clients`, `projects`, `videos`, and `kanban_columns` tables.
   - Row Level Security (RLS) policies for full admin access and scoped client access.
   - Triggers for automatic user profile generation and default kanban columns.
   - Storage buckets (`thumbnails`, `deliverables`).

### 3. Configure Environment Variables
1. In Supabase, navigate to **Project Settings &rarr; API**.
2. Copy your **Project URL** and **anon public key**.
3. Create or update `.env.local` at the root of `video-tracker`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 4. Promote Your First Account to Admin
1. Run the app and visit `http://localhost:3000/signup`.
2. Register your user account.
3. In your Supabase dashboard, open the **Table Editor &rarr; profiles**.
4. Find your row and verify the `role` column is set to `'admin'`. (Admins can view and manage all clients, projects, and deliverables).

---

## 💻 Local Development

Run the development server using npm:

```bash
# Navigate to project folder
cd video-tracker

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Zero-Config Demo Mode**: If you run `npm run dev` before entering `.env.local` credentials, the dashboard automatically boots in **Demo Preview Mode** with sample production data, allowing you to explore the Kanban board, charts, and client management immediately!

---

## 🌐 Deploy to Vercel

1. Push this repository to **GitHub**.
2. Go to [https://vercel.com](https://vercel.com) and import the repository.
3. If deploying from the root folder or subfolder, set the **Root Directory** to `video-tracker` (or leave default if at root).
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**. Vercel will build and launch your production application!
