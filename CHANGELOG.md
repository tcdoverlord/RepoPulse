## 1.3.0 - GitHub Pages Static JSON API

- Added a repository registry and GitHub Actions JSON snapshot generator.
- Added static endpoints for health, index, summary, contributors, releases, activity, issues, languages, and combined repository data.
- Updated Pages deployment to generate JSON on pushes, daily, and manual dispatch.
- Documented registry setup, endpoint paths, refresh behavior, and static-hosting limitations.

## 1.2.1 - MCP startup fix

- Fixed MCP stdio startup handling: `serveStdio()` returns a server handle, not a Promise.

## 1.2.0 - RepoPulse MCP

- Added a local stdio MCP server with six tools for API health, repository summaries, contributors, releases, activity, and languages.
- Normalized contributor, release, and activity results for AI-friendly output.
- Added MCP client setup and security documentation.

# Changelog

## 1.0.0 — Initial build
- Responsive dark dashboard for public GitHub repositories.
- Repository lookup by `owner/name` or GitHub URL.
- Live GitHub REST API integration for repository metrics, contributors, releases, commits, issues, and language composition.
- Language composition doughnut chart.
- Loading, not-found, rate-limit, and retry states.
- Vitest utility and input-validation tests.
- Vite production build and GitHub Pages workflow.

## 1.1.0 — API foundation
- Added read-only Express HTTP API for public GitHub repository summaries, contributors, releases, commits, and languages.
- Added health endpoint, response caching, CORS allowlist, security headers, and basic in-memory rate limiting.
- Documented API routes, response envelopes, and deployment limitations.
