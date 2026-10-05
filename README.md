# DevDesk

DevDesk is a personal dashboard for answering two daily questions:

- What should I do today?
- What did I actually do today?

The MVP is a single-user Next.js application with manually managed tasks, activity logs, and daily reviews.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Drizzle ORM
- Neon PostgreSQL
- Vitest for unit tests
- Playwright for browser tests
- Vercel deployment

## Local development

```bash
npm install
copy .env.example .env.local
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

The application connects to Neon through `DATABASE_URL`.

## Environment variables

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Use the connection string supplied by Neon. Keep it in `.env.local` and never commit it.

## Useful commands

```bash
npm run dev          # Start local development
npm run lint         # Run ESLint
npm test             # Run unit tests
npm run build        # Create a production build
npm run db:generate  # Generate a Drizzle migration
npm run db:migrate   # Apply migrations
```

PostgreSQL migrations are generated in `src/db/migrations-postgres`. The
earlier SQLite migration directory is retained only as legacy history and is
not used by the current Drizzle configuration.

## Main routes

- `/` — Today dashboard
- `/activity` — Full activity history with date filtering
- `/api/dashboard` — Tasks and recent activities
- `/api/tasks` — Task CRUD operations
- `/api/activities` — Activity CRUD and date filtering
- `/api/reviews` — Daily review load/save

## Neon and Vercel deployment

1. Create a Neon project and copy its pooled PostgreSQL connection string.
2. Set `DATABASE_URL` in `.env.local`.
3. Run `npm run db:migrate` against the Neon database.
4. Add `DATABASE_URL` to the Vercel project environment settings.
5. Deploy the repository to Vercel.
6. Verify task creation, activity logging, and daily review persistence in the deployed app.

Authentication is an opt-in single-user password gate. Set both `AUTH_PASSWORD` and
`AUTH_SECRET` in `.env.local` and Vercel before exposing the deployment publicly.
Use a long random secret and never commit either value.

Before production deployment:

1. Run `npm run db:migrate` against the intended Neon database.
2. Set `DATABASE_URL`, `AUTH_PASSWORD`, and `AUTH_SECRET` in Vercel.
3. Run `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build`.
4. Verify login, task/activity CRUD, daily review persistence, and timezone-aware Today data.
