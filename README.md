# FreshMansions

Lawn care estimate and dispatching platform. Homeowners request an on-site property visit, provide details about the work they need, and receive a quote they can review and approve from a dashboard.

## How it works

1. **Request a visit** — Pick a date range and preferred time of day for the estimate visit.
2. **Share property details** — Create an account, add the address, describe the work, and upload optional photos.
3. **Review your quote** — The crew visits the property, then posts a detailed quote to your dashboard.

## Tech stack

- **Monorepo** — Turborepo with Bun workspaces
- **Web** — React, TanStack Router, TailwindCSS, shadcn/ui
- **Server** — Hono on Cloudflare Workers
- **Database** — SQLite / Turso with Drizzle ORM
- **Auth** — Better Auth (email/password)
- **Mobile** — React Native with Expo
- **Infra** — Cloudflare via Alchemy

## Project structure

```
fresh-mansions/
├── apps/
│   ├── web/         # Frontend (React + TanStack Router)
│   ├── server/      # API (Hono)
│   └── native/      # Mobile app (React Native, Expo)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── auth/        # Authentication configuration
│   ├── db/          # Database schema, migrations, and validators
│   ├── env/         # Shared environment variable access
│   └── infra/       # Cloudflare deployment (Alchemy)
```

## Getting started

```bash
bun install
bun run dev          # Start all apps
bun run dev:web      # Web only
bun run dev:server   # Server only
bun run dev:native   # Mobile only
```

### Database

```bash
bun run db:push      # Apply schema to database
bun run db:generate  # Generate database types
```

### Code quality

```bash
bun run check        # Lint and format check (Ultracite / Oxlint + Oxfmt)
bun run fix          # Auto-fix lint and formatting issues
```

### Testing

```bash
bun run test         # Run all tests once
bun run test:unit    # Run unit tests
bun run test:watch   # Run tests in watch mode
```

Testing strategy and phased roadmap:

- `docs/testing-strategy.md`

### Deployment

```bash
bun run deploy       # Deploy to Cloudflare via Alchemy
bun run destroy      # Tear down deployment
```
