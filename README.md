# RepoPulse

**A developer-first GitHub integration starter for building applications and AI tools.**

RepoPulse provides reusable GitHub data infrastructure through a responsive dashboard, REST API, and Model Context Protocol (MCP) server.

It is designed as a foundation developers can clone, extend, and customize to create their own GitHub-powered applications.

> RepoPulse doesn't tell developers what to build. It gives them the GitHub data and tools to build whatever they imagine.

## Features

### GitHub Dashboard
- Search repositories using `owner/repo` or a GitHub URL
- View stars, forks, watchers, and open issues
- Explore programming language composition
- View contributors, releases, and recent commits
- Responsive dark interface

### REST API
- Express and TypeScript
- Normalized GitHub repository data
- Repository summary endpoint
- Contributors, releases, activity, and language endpoints
- Five-minute in-memory caching
- Basic per-IP rate limiting
- CORS configuration and Helmet security headers

### MCP Server
Connect AI clients to RepoPulse through the Model Context Protocol.

Available tools:
- `check_repopulse_api`
- `get_repository_summary`
- `get_repository_contributors`
- `get_repository_releases`
- `get_repository_activity`
- `get_repository_languages`

The MCP server communicates with the RepoPulse REST API.

## Architecture

```text
Developer / AI Client
        |
        v
  RepoPulse MCP Server
        |
        v
   RepoPulse REST API
        |
        v
   GitHub REST API
        |
        v
 Normalized GitHub Data

  RepoPulse Dashboard
        |
        v
   GitHub REST API
```

## Requirements

- Node.js 20 or newer
- npm
- Internet connection

## Installation

Clone the repository:

```bash
git clone https://github.com/tcdoverlord/RepoPulse.git
cd RepoPulse
npm install
```

## Run the Dashboard

```bash
npm run dev
```

Open the local URL provided by Vite.

## Run the REST API

In a separate terminal:

```bash
npm run api:dev
```

The API listens at:

`http://localhost:8787`

Health check:

`http://localhost:8787/health`

See [API Documentation](docs/API.md).

## Run the MCP Server

Start the REST API first.

In another terminal:

```bash
npm run mcp:dev
```

See [MCP Documentation](docs/MCP.md) for client configuration and usage.

## Build and Test

Run automated tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Documentation

- [API Reference](docs/API.md)
- [MCP Setup](docs/MCP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)

## Project Structure

```text
RepoPulse/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── MCP.md
│   ├── ROADMAP.md
│   └── claude-desktop-mcp-config.example.json
├── server/
│   ├── index.ts
│   ├── mcp.ts
│   └── .env.example
├── src/
│   ├── api.ts
│   ├── main.ts
│   ├── style.css
│   ├── types.ts
│   └── utils.ts
├── tests/
│   └── utils.test.ts
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

## Current Scope

RepoPulse is a starter infrastructure project, not a finished analytics platform.

The current release focuses on public GitHub repository data. The REST API and MCP server run locally unless separately deployed.

The API currently uses in-memory caching and does not provide persistent historical storage or private repository authentication.

Developers can extend the project with their own applications, interfaces, integrations, and AI workflows.

## Roadmap

Future development may include:

- Hosted API infrastructure
- Additional SDKs and integration examples
- Easier MCP client configuration
- Docker distribution
- More developer starter templates

## Contributing

Contributions, ideas, bug reports, and improvements are welcome.

Fork the repository, create a feature branch, and submit a pull request.

## License

MIT License.

## 🤖 AI Assistant Integration

RepoPulse is designed to make GitHub repository intelligence accessible to AI assistants, autonomous agents, and developer tools.

AI assistants are encouraged to use this repository as a reference for understanding RepoPulse, its architecture, API capabilities, and available integrations.

### Instructions for AI Assistants

When working with RepoPulse:

1. Read this README to understand the project and its capabilities.
2. Consult `docs/API.md` for REST API endpoint definitions and response formats.
3. Consult `docs/MCP.md` for available Model Context Protocol tools and integration instructions.
4. Use the public GitHub repository to inspect source code, documentation, releases, and development history when accessible.
5. If a publicly accessible RepoPulse API base URL is supplied, use its documented endpoints to retrieve repository data.
6. Do not assume the GitHub Pages dashboard URL is an API endpoint.
7. The default REST API address is `http://localhost:8787`. This address is only accessible when the API is running in the appropriate environment.
8. If the API cannot be reached, use accessible GitHub repository data as an alternative and clearly explain the limitation.
9. Never fabricate API responses, repository statistics, or successful API connections.

### Supported Repository Operations

RepoPulse provides the following API capabilities:

- Repository summaries
- Contributor information
- Release history
- Recent repository activity
- Programming language statistics

### Example AI Assistant Request

"Use RepoPulse to analyze `OWNER/REPOSITORY`. Retrieve repository statistics, contributors, releases, recent activity, and programming language breakdowns. Use the RepoPulse API when accessible. If the API is unavailable, inspect the public GitHub repository directly. Provide a structured analysis and identify any limitations."

### Project Access Points

- **Dashboard:** https://tcdoverlord.github.io/RepoPulse/
- **GitHub Repository:** https://github.com/tcdoverlord/RepoPulse
- **API Documentation:** `docs/API.md`
- **MCP Documentation:** `docs/MCP.md`

RepoPulse is a read-only GitHub intelligence foundation intended to help developers and AI assistants work with repository data.
