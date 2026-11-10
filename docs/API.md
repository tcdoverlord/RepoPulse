# RepoPulse API v1.1

RepoPulse now includes a read-only HTTP API. It fetches public GitHub data, normalizes the repository summary, caches responses in memory, applies a basic per-IP request limit, and returns consistent JSON envelopes.

## Run

```bash
npm install
npm run api:dev
```

API base URL: `http://localhost:8787`

Health check: `GET /health`

## Endpoints

- `GET /api/repos/:owner/:repo/summary`
- `GET /api/repos/:owner/:repo/contributors`
- `GET /api/repos/:owner/:repo/releases`
- `GET /api/repos/:owner/:repo/activity`
- `GET /api/repos/:owner/:repo/languages`

Example:

```bash
curl http://localhost:8787/api/repos/facebook/react/summary
```

Successful responses use `{ "data": ..., "meta": ... }`. Errors use `{ "error": { "code": ..., "message": ... } }`.

## Configuration

Copy `server/.env.example` to `.env` and set values for your environment. This starter uses environment variables when the runtime is configured to load them; for local development, the defaults in `server/index.ts` work without a `.env` file.

- `API_PORT`: server port (default 8787)
- `CORS_ORIGINS`: comma-separated allowed browser origins (default localhost Vite)
- `CACHE_TTL_MS`: in-memory cache lifetime (default 5 minutes)
- `API_RATE_LIMIT`: requests per IP per minute (default 60)

## Important boundaries

- Public repository data only. This API does not authenticate as a GitHub user and cannot access private repositories or owner-only traffic analytics.
- No GitHub token is required or stored.
- The cache and rate limiter are in-memory and reset when the process restarts. They are suitable for local development and a single-instance prototype, not a horizontally scaled production service.
- Before public production deployment, use a persistent/shared cache and rate limiter, add structured logging/monitoring, configure deployment secrets and proxy trust correctly, and review GitHub API rate limits.
- The API is read-only. It cannot create issues, modify repositories, or push code.
