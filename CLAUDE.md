# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Personel İş Akışı — a personnel workflow / SOP management app in Turkish. Users browse categorized, step-by-step "iş akışları" (workflows) with attached screenshots. Admins approve pending registrations, manage categories and users. Built with Next.js 16 (App Router, `src/`), NextAuth v5, Prisma + SQLite, Tailwind v4.

## Commands

All commands run from repo root.

```bash
npm install                                    # install deps
npx prisma migrate dev --name <name>           # create/apply migration in dev
npm run seed                                   # seed admin/user + sample workflows (idempotent)
npm run dev                                    # next dev (Turbopack default in v16)
npm run build                                  # next build (Turbopack default in v16)
npm start                                      # next start (production)

npm run lint                                   # ESLint (Next.js 16 migrated from `next lint` to the ESLint CLI)

npx prisma studio                              # GUI DB browser
npx prisma generate                            # regenerate client after schema change
npx prisma migrate deploy                      # apply migrations in prod (no auto-create)

# Production first-time setup
npm run build && npx prisma migrate deploy && npm run seed && npm start
```

There is no test suite. There are stray debug scripts at `prisma/debug-auth.ts` and `prisma/debug-login.ts` that are not wired into any command — ignore unless investigating auth bugs.

## Next.js 16 conventions in this repo

Per `AGENTS.md`: Next.js 16 has breaking changes vs. training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code.

Key v16 facts this repo relies on:

- **Middleware → Proxy.** The file is `src/proxy.ts`, not `middleware.ts`. It re-exports NextAuth's `auth` as default and uses a `config.matcher` (excluding `/api`, `/_next`, static assets, favicon). See `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- **Turbopack is the default** for `next dev` and `next build`. Don't add `--turbopack` flags; `package.json` scripts are intentionally plain.
- **`next lint` is gone.** Use the ESLint CLI directly (`npm run lint`).
- **Route handler / dynamic-route params are async.** `params` is a `Promise<{ id: string }>` — must be awaited. Example: `src/app/api/is-akislari/[id]/route.ts`.
- Node.js 20.9+ and TypeScript 5.1+ are required.

## High-level architecture

### Layout

```
src/
  app/                    # App Router routes
    api/                  # Route handlers (server-side, NextAuth-aware)
    admin/                # ADMIN-only pages (kategoriler, kullanicilar)
    is-akislari/          # Public workflow browse + detail + add/edit
    giris/, kayit/        # Auth pages
    layout.tsx            # Root layout: AuthProvider → Navbar → <main>
    page.tsx              # Landing (homepage)
  components/
    layout/Navbar.tsx     # Client; hides on /giris & /kayit; admin links gated on role
    providers/AuthProvider.tsx  # Client wrapper around next-auth SessionProvider
  lib/
    auth.ts               # NextAuth config — Credentials provider, JWT session, role on token+session
    prisma.ts             # PrismaClient singleton (dev: cached on globalThis)
  proxy.ts                # Next.js 16 Proxy — exports NextAuth's auth as the handler
  types/next-auth.d.ts    # Module augmentation: adds `id` + `role` to Session.user and JWT
prisma/
  schema.prisma           # Data model (see below)
  seed.ts                 # Idempotent seed: admin + personel user + 5 categories + 6 tags + 4 sample workflows
  migrations/             # SQLite migrations
public/uploads/           # User-uploaded step screenshots (gitignored)
```

### Data model (Prisma / SQLite)

SQLite doesn't support enums — `User.role` is a `String` defaulting to `"PENDING"`. Three roles: `ADMIN`, `USER`, `PENDING`. `signIn` callback rejects `PENDING`.

- **User** → processes (authored), images (uploaded)
- **Category** → processes
- **Process** (iş akışı) → category, author, **Step**[] (ordered by `order`), **Tag**[] via `ProcessTag` join table
- **Step** → images (ordered by `order`, each tied to the uploader)
- **Tag** ↔ Process via `ProcessTag` (composite PK `[processId, tagId]`)

`onDelete: Cascade` on all relations — deleting a process removes its steps/tags/images.

### Auth flow

- NextAuth v5 (`next-auth@5.0.0-beta.31`) with `Credentials` provider, JWT session strategy (`src/lib/auth.ts`).
- `jwt` callback copies `id` + `role` onto the token on first sign-in.
- `session` callback projects them onto `session.user`.
- `signIn` callback returns `false` for `PENDING` users (redirects to `/giris` with error).
- `src/proxy.ts` re-exports `auth` so NextAuth wraps the request — every non-API/non-static page gets a session.
- New registrations hit `POST /api/auth/kayit` and are created with `role: "PENDING"`. An admin promotes them via `PATCH /api/admin/kullanicilar`.
- Type augmentation in `src/types/next-auth.d.ts` makes `session.user.id` and `session.user.role` typed everywhere.

### API conventions

All under `src/app/api/`. Server-side route handlers — they call `await auth()` directly (not via the Proxy) for permission checks.

Pattern in mutating handlers (POST/PATCH/DELETE):
1. `const session = await auth()` → 403 if missing or `role === "PENDING"`.
2. For per-resource writes (e.g. `PATCH /api/is-akislari/[id]`): 403 unless `session.user.role === "ADMIN"` OR `resource.authorId === session.user.id`.
3. Admin-only endpoints (`/api/admin/*`) require `session.user.role === "ADMIN"`.

Search on `/api/is-akislari` supports `?search=`, `?categoryId=`, `?tagId=` query params.

Image uploads: `POST /api/yukleme` accepts `multipart/form-data` with `file` + `stepId`, writes to `public/uploads/` with a timestamp-random filename, returns `{ url, alt }`. Files must have an `image/*` MIME type.

### Frontend conventions

- All page components under `src/app/**/page.tsx` are **client components** (`"use client"`) — they `useSession()` and `fetch('/api/...')` directly. No server components here; this app does no SSR data fetching.
- `useSearchParams()` consumers must be wrapped in `<Suspense>` (see `src/app/is-akislari/page.tsx` for the pattern).
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Tailwind v4 via `@tailwindcss/postcss` — utility classes throughout. Custom utility classes (`btn-primary`, `card`, `badge-indigo`, `glass-*`, `input`) are defined in `src/app/globals.css`.
- Form labels and copy are in Turkish; preserve that for any new UI.

## Environment

`.env` (already committed in this repo, do not commit secrets in a fresh setup):
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="..."        # must change for prod
NEXTAUTH_URL="http://localhost:3000"
```

Seed accounts: `admin@ozgurapp.com / admin123` (ADMIN) and `personel@ozgurapp.com / personel123` (USER). Change before deploying.

`next.config.ts` sets `output: "standalone"` and configures `images.remotePatterns` for localhost uploads with `unoptimized: true`.

## Gotchas

- **SQLite + `mode: "insensitive"`** in Prisma `where` works on SQLite (handled by Prisma as `LIKE` — case-insensitive by default in SQLite). Don't assume this on Postgres without verifying.
- **`prisma/dev.db` and `public/uploads/`** are persistent state. They survive `npm run build` but get wiped by container rebuilds — preserve both in any deploy.
- The `src/proxy.ts` file is the Next.js 16 Proxy (formerly Middleware). Don't rename to `middleware.ts` — that's the v15 name and Next 16 won't pick it up.
- `src/lib/auth.ts` exports `handlers` — re-exported as `{ GET, POST }` from `src/app/api/auth/[...nextauth]/route.ts`. Don't import `handlers` from anywhere else.
- `prisma.config.ts` is a stub. Prisma reads `schema.prisma` directly; do not add config there unless migrating to Prisma 6.