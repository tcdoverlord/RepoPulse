# RepoPulse Architecture

## Overview
RepoPulse is a frontend-only Vite + TypeScript application. It calls the public GitHub REST API directly from the browser. GitHub is an external integration, not a RepoPulse backend.

## Layers
- `src/main.ts`: UI composition, rendering, events, and chart lifecycle.
- `src/api.ts`: GitHub REST API client, input normalization, and API error handling.
- `src/types.ts`: TypeScript shapes for GitHub response data used by the UI.
- `src/utils.ts`: formatting and safe HTML helpers.
- `src/style.css`: responsive design system and component styles.

## Data flow
1. User submits `owner/repo` or a GitHub URL.
2. `normalizeRepoInput` validates and normalizes the repository identifier.
3. `getRepository` fetches repository details and supporting public endpoints.
4. The UI renders repository metrics, language composition, contributors, releases, and recent commits.
5. Supporting endpoint failures degrade gracefully; failure to load the repository itself displays a retryable error.

## Known constraints
- Unauthenticated GitHub REST API rate limits apply.
- GitHub may return partial data or deny an endpoint; supporting sections show empty states.
- The dashboard does not currently store searches or historical snapshots.
- This version does not calculate a true trend line because historical snapshots are not persisted.


## API service (v1.1)
- `server/index.ts`: read-only Express API service.
- API endpoints call the GitHub REST API server-side, cache responses in memory, and return consistent JSON envelopes.
- The API currently exposes public repository summary, contributors, releases, recent activity, and languages.


## Static JSON publishing
- `api/registry.json` lists repositories for static snapshot publication.
- `scripts/generate-api.mjs` fetches public GitHub REST API resources and writes JSON under `public/api/`.
- `.github/workflows/deploy.yml` generates the JSON before the Vite build and deploys the combined `dist` output to GitHub Pages. It runs on pushes, daily, and manual dispatch.
- Static endpoints are snapshots for registered repositories; they do not make GitHub Pages a dynamic API server.
