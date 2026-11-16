# Sahajjo API (server)

Express 5 + TypeScript + MongoDB API for **Sahajjo**, a community-driven platform where people create, join and manage local social-service events.

The Next.js client lives in a separate repository. This API is stateless: every protected request carries a BetterAuth-issued JWT as a Bearer token.

## Tech

- Express 5 (native async error propagation)
- TypeScript (strict, compiled with `tsc`)
- MongoDB Atlas (`mongodb` driver, no ODM)
- Zod request validation
- `jose` JWT verification against the BetterAuth JWKS endpoint
- Helmet, CORS allow-list, rate limiting

## Getting started

```bash
npm install
cp .env.example .env   # fill in the values
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with `tsx watch` on `PORT` (default 5000) |
| `npm run dev:db` | Start a throwaway in-memory MongoDB on port 27017 for local testing |
| `npm run seed` | Insert eight demo events into the configured database (idempotent) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | Type-check without emitting files |

### Local development without an Atlas account

```bash
npm run dev:db   # terminal 1 — in-memory MongoDB on mongodb://127.0.0.1:27017
npm run dev      # terminal 2 — API on port 5000
npm run seed     # terminal 3 — optional demo events
```

`dev:db` keeps everything in memory, so data disappears when the process stops. In the client repository, leave `MONGODB_URI` unset (or pointed at `mongodb://127.0.0.1:27017`) so BetterAuth uses the same in-memory instance.

## Environment variables

| Name | Purpose |
| --- | --- |
| `PORT` | HTTP port (Render sets this automatically) |
| `MONGODB_URI` | Atlas connection string, shared with the BetterAuth MongoDB adapter |
| `DB_NAME` | Database name (default `sahajjo`) |
| `CLIENT_ORIGINS` | Comma-separated browser origins allowed by CORS |
| `BETTER_AUTH_JWKS_URL` | Public JWKS URL, e.g. `https://your-app.vercel.app/api/auth/jwks` |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Must match the Next.js JWT plugin config |

## API

Public:

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/health` | Render health check |
| GET | `/api/events/upcoming?limit=6&type=Cleanup&q=dhaka` | Future events only, sorted by date, Mongo `.limit()` |
| GET | `/api/events/:id` | Optional Bearer token adds `isJoined` / `isOwner` |

Requires `Authorization: Bearer <jwt>`:

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/api/events` | Creator identity comes from the token |
| PATCH | `/api/events/:id` | Owner only (403 otherwise) |
| DELETE | `/api/events/:id` | Owner only, removes attendee records too |
| POST | `/api/events/:id/join` | Future events, duplicate joins blocked |
| GET | `/api/events/mine` | Events created by the caller |
| GET | `/api/joined-events` | Joined events sorted by event date ascending |
| GET | `/api/me/stats` | Created / joined / upcoming counts |

See `api.http` for ready-to-run request examples.

## Data

`events` documents store the creator's id, email and name alongside the event (the assignment requires the creator email). `eventJoins` stores an attendee snapshot and has a unique index on `(eventId, userEmail)` to make duplicate joins impossible.

Event dates are normalised to 12:00 UTC so a date-only event does not expire partway through the chosen day.

## Deployment (Render)

1. Create a **Web Service** from this repository.
2. Build: `npm ci && npm run build`; start: `node dist/index.js`.
3. Add the environment variables above. `BETTER_AUTH_JWKS_URL` must point at the deployed Next.js app.
4. Health check path: `/api/health`.
5. Allow Render outbound traffic in MongoDB Atlas (Network Access).

`render.yaml` is included as a blueprint.
