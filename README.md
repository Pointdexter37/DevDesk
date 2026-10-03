# DevDesk

DevDesk is a personal dashboard for answering two daily questions:

- What should I do today?
- What did I actually do today?

The MVP is a single-user Next.js application with manually managed tasks, activity logs, and daily reviews.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Drizzle ORM
- SQLite locally
- Turso/libSQL in production
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

The default local database is `local.db`. It is ignored by Git.

## Environment variables

```env
TURSO_DATABASE_URL=file:local.db
TURSO_AUTH_TOKEN=
```

For production, set `TURSO_DATABASE_URL` to the Turso libSQL URL and provide the database token.

## Useful commands

```bash
npm run dev          # Start local development
npm run lint         # Run ESLint
npm test             # Run unit tests
npm run build        # Create a production build
npm run db:generate  # Generate a Drizzle migration
npm run db:migrate   # Apply migrations
```

## Main routes

- `/` — Today dashboard
- `/activity` — Full activity history with date filtering
- `/api/dashboard` — Tasks and recent activities
- `/api/tasks` — Task CRUD operations
- `/api/activities` — Activity CRUD and date filtering
- `/api/reviews` — Daily review load/save

## Turso and Vercel deployment

1. Create a Turso database and obtain its URL and auth token.
2. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the local environment.
3. Run `npm run db:migrate` against the production database.
4. Add both variables to the Vercel project environment settings.
5. Deploy the repository to Vercel.
6. Verify task creation, activity logging, and daily review persistence in the deployed app.

Authentication is intentionally not included in this MVP. Do not expose a production deployment publicly until an authentication layer is added.
