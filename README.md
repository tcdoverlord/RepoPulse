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
