# RepoPulse Static JSON API

RepoPulse publishes static JSON snapshots through GitHub Pages. GitHub Actions fetches repository data from the GitHub REST API, generates files under `public/api/`, and includes them in the Vite Pages artifact.

## Register repositories

Edit `api/registry.json`:

```json
{
  "repositories": [
    { "owner": "tcdoverlord", "repo": "RepoPulse" },
    { "owner": "facebook", "repo": "react" }
  ]
}
```

Use public repositories only. Each entry must contain a GitHub owner and repository name. Push to `main` to regenerate and deploy, or run **Deploy RepoPulse to GitHub Pages** manually in GitHub Actions. The workflow also runs daily at 06:17 UTC.

## Endpoints

For `tcdoverlord/RepoPulse`:

- `/RepoPulse/api/health.json`
- `/RepoPulse/api/index.json`
- `/RepoPulse/api/repos/tcdoverlord/RepoPulse/all.json`
- `/RepoPulse/api/repos/tcdoverlord/RepoPulse/summary.json`
- `/RepoPulse/api/repos/tcdoverlord/RepoPulse/contributors.json`
- `/RepoPulse/api/repos/tcdoverlord/RepoPulse/releases.json`
- `/RepoPulse/api/repos/tcdoverlord/RepoPulse/activity.json`
- `/RepoPulse/api/repos/tcdoverlord/RepoPulse/issues.json`
- `/RepoPulse/api/repos/tcdoverlord/RepoPulse/languages.json`

Base URL: `https://tcdoverlord.github.io/RepoPulse`

Successful repository responses use this shape:

```json
{
  "data": {},
  "meta": {
    "source": "GitHub REST API",
    "generated_at": "2026-11-10T06:17:00.000Z",
    "repository": "owner/repo"
  }
}
```

`all.json` contains the combined repository summary, contributors, releases, recent commits, open issues (pull requests excluded), and languages. `index.json` lists registered repositories and their endpoint paths.

## Refresh and limitations

- Pushes to `main`, a daily schedule, and manual workflow dispatch regenerate the snapshots.
- These are static snapshots, not live/dynamic API calls. Data freshness depends on the most recent successful workflow run.
- Only repositories in `api/registry.json` receive static JSON endpoints. The dashboard can still look up any public repository directly.
- GitHub Pages cannot run the Express server or dynamically fetch an arbitrary repository on request. For true on-demand JSON for any public repository, host the Express API or use a serverless backend.
- The generator uses unauthenticated GitHub REST API requests. Large registries can hit GitHub's unauthenticated rate limit; keep the registry modest or configure a carefully scoped GitHub token as a GitHub Actions secret in a future enhancement. Never put a token in published JSON or browser code.
- A failed fetch fails the workflow rather than publishing misleading partial data.
