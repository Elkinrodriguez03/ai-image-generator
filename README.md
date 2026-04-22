# AI Image Generator

A scalable, SOLID-compliant AI image generator built with **Next.js (App Router)**,
**TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Zod**, and **TanStack Query**.
Backed by the free-tier [Pollinations AI](https://image.pollinations.ai) provider
behind a swappable `IImageProvider` interface.

## Features

- Prompt-based image generation with aspect-ratio control (`1:1`, `16:9`, `4:3`).
- Skeleton loading state, friendly error messages (rate limit, timeout, provider down).
- Direct image download from the browser.
- Layered architecture (Presentation / Application / Domain / Infrastructure).
- Result pattern — no raw provider errors leak to the UI.
- 22 unit tests (Vitest) covering schema, service layer, and provider error mapping.

## Architecture

```
app/                 # Presentation (routes, route handlers)
src/
├── components/      # UI (shadcn/ui + composed components)
├── hooks/           # TanStack Query hooks
├── lib/             # Infrastructure (provider, api client, env)
├── services/        # Domain (IImageProvider, ImageService, Result<T,E>)
└── types/           # Zod schemas and shared types
```

## Getting started

```bash
nvm use           # Node 22 (see .nvmrc)
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Script                  | Purpose                        |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start the Next.js dev server   |
| `npm run build`         | Production build               |
| `npm run start`         | Run the production build       |
| `npm run lint`          | ESLint                         |
| `npm run lint:fix`      | ESLint with autofix            |
| `npm run format`        | Prettier write                 |
| `npm run format:check`  | Prettier check (used in CI)    |
| `npm run typecheck`     | `tsc --noEmit`                 |
| `npm test`              | Vitest (one-shot)              |
| `npm run test:watch`    | Vitest watch mode              |
| `npm run test:coverage` | Vitest with v8 coverage report |

### Git hooks

- **pre-commit** — runs `lint-staged` (ESLint + Prettier on staged files).
- **pre-push** — runs `npm run typecheck && npm test` so broken code never
  reaches the remote. `npm run build` stays out of the hook to keep it fast;
  CI runs the full pipeline.

## Environment variables

All server env is validated with Zod in `src/lib/env.ts`.

| Key                       | Default                                | Description               |
| ------------------------- | -------------------------------------- | ------------------------- |
| `POLLINATIONS_BASE_URL`   | `https://image.pollinations.ai/prompt` | Provider base URL.        |
| `POLLINATIONS_TIMEOUT_MS` | `30000`                                | Per-request timeout (ms). |

Copy `.env.example` to `.env.local` for development, or configure the same keys
in the Vercel project settings for preview/production.

## Deployment — Vercel

1. Import the GitHub repository into Vercel.
2. Framework preset: **Next.js** (auto-detected via `vercel.json`).
3. Add the env vars from `.env.example` under **Project Settings → Environment Variables**
   for the `Production` and `Preview` scopes.
4. Deploy. The `/api/generate` route has `maxDuration: 60` configured in
   `vercel.json` to accommodate slower free-tier responses.

## Continuous Integration

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. `npm ci`
2. `npm run format:check`
3. `npm run lint`
4. `npm run typecheck`
5. `npm test`
6. `npm run build`

## API

### `POST /api/generate`

Request body:

```json
{ "text": "a cozy cabin in a snowy pine forest", "aspectRatio": "16:9" }
```

Success (200):

```json
{
  "data": {
    "url": "https://image.pollinations.ai/prompt/...",
    "prompt": "a cozy cabin in a snowy pine forest",
    "aspectRatio": "16:9",
    "providerName": "pollinations"
  }
}
```

Error (400 / 429 / 502 / 504 / 500):

```json
{ "error": { "code": "RATE_LIMITED", "message": "..." } }
```

Error codes: `INVALID_INPUT`, `RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, `TIMEOUT`, `UNKNOWN`.
