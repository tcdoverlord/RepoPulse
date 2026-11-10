# RepoPulse

**GitHub repository intelligence, at a glance.**

RepoPulse is a responsive dashboard for exploring the public activity and composition of GitHub repositories. Enter `owner/repo` or paste a GitHub repository URL to inspect stars, forks, watchers, open issues, languages, contributors, releases, and recent commits.

## Preview

The app uses a dark navy interface with electric-blue accents, responsive metric cards, and a language-composition chart.

## Requirements
- Node.js 20 or newer
- npm
- Internet connection for GitHub public API requests

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite.

## Run the RepoPulse API
In a second terminal:
```bash
npm run api:dev
```
The API listens at `http://localhost:8787`. See [docs/API.md](docs/API.md) for endpoints and examples.

## Build and test
```bash
npm test
npm run build
npm run preview
```

## Deploy to GitHub Pages
1. Create a public GitHub repository named `RepoPulse`.
2. Push this project to its `main` branch.
3. In GitHub, open **Settings → Pages**.
4. Set the source to **GitHub Actions**.
5. The included workflow builds and deploys the site after a push to `main`.

## API and rate limits
RepoPulse uses the public GitHub REST API without an authentication token. Unauthenticated rate limits apply. If you hit a rate limit, wait until GitHub resets it or add a properly designed authenticated proxy in a future version. Never put a private access token in browser code.

## Project structure
```text
RepoPulse/
├── .github/workflows/deploy.yml
├── docs/
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── server/\n│   └── index.ts\n├── src/
│   ├── api.ts
│   ├── main.ts
│   ├── style.css
│   ├── types.ts
│   └── utils.ts
├── tests/
│   └── utils.test.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Current scope
This is a frontend-only application. GitHub is an external API integration; RepoPulse does not have its own server or database in v1.0. Historical trend analysis and saved cloud data are intentionally not claimed as implemented.

## License
MIT.


## RepoPulse MCP (v1.2.0)

RepoPulse now includes a local Model Context Protocol server for AI clients. See [MCP setup and client configuration](docs/MCP.md). Start the REST API with `npm run api:dev`, then run the MCP server with `npm run mcp:dev`.
