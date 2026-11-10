import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const API_BASE_URL = (process.env.REPOPULSE_API_URL || 'http://localhost:8787').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = Number(process.env.REPOPULSE_TIMEOUT_MS || 20_000);

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };

async function apiGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    const body = await response.json() as ApiEnvelope<T> | { error?: { message?: string; code?: string } };
    if (!response.ok) {
      const error = body as { error?: { message?: string; code?: string } };
      throw new Error(error.error?.message || `RepoPulse API returned HTTP ${response.status}`);
    }
    return (body as ApiEnvelope<T>).data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`RepoPulse API request timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function repoPath(owner: string, repo: string, endpoint: string) {
  const safeOwner = encodeURIComponent(owner.trim());
  const safeRepo = encodeURIComponent(repo.trim().replace(/\.git$/i, ''));
  return `/api/repos/${safeOwner}/${safeRepo}/${endpoint}`;
}

function jsonResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }]
  };
}

const repoInput = {
  owner: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/).describe('GitHub repository owner or organization'),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/).describe('GitHub repository name')
};

const server = new McpServer({
  name: 'repopulse',
  version: '1.2.0'
});

server.registerTool(
  'check_repopulse_api',
  {
    description: 'Check whether the local RepoPulse REST API is reachable and return its service status.',
    inputSchema: {}
  },
  async () => {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`RepoPulse API health check failed with HTTP ${response.status}`);
    return jsonResult(body);
  }
);

server.registerTool(
  'get_repository_summary',
  {
    description: 'Get a GitHub repository overview including stars, forks, open issues, subscribers, metadata, and language byte counts.',
    inputSchema: repoInput
  },
  async ({ owner, repo }) => jsonResult(await apiGet(repoPath(owner, repo, 'summary')))
);

server.registerTool(
  'get_repository_contributors',
  {
    description: 'Get the leading contributors and their contribution counts for a public GitHub repository.',
    inputSchema: repoInput
  },
  async ({ owner, repo }) => {
    const rows = await apiGet<Array<any>>(repoPath(owner, repo, 'contributors'));
    const clean = rows.map(item => ({
      username: item.login,
      profile_url: item.html_url,
      avatar_url: item.avatar_url,
      contributions: item.contributions,
      account_type: item.type
    }));
    return jsonResult(clean);
  }
);

server.registerTool(
  'get_repository_releases',
  {
    description: 'Get published releases for a public GitHub repository. An empty list means no published releases were returned.',
    inputSchema: repoInput
  },
  async ({ owner, repo }) => {
    const rows = await apiGet<Array<any>>(repoPath(owner, repo, 'releases'));
    const clean = rows.map(item => ({
      name: item.name,
      tag_name: item.tag_name,
      draft: item.draft,
      prerelease: item.prerelease,
      published_at: item.published_at,
      html_url: item.html_url,
      description: item.body
    }));
    return jsonResult(clean);
  }
);

server.registerTool(
  'get_repository_activity',
  {
    description: 'Get recent commits for a public GitHub repository, with compact author, date, message, and commit URL fields.',
    inputSchema: repoInput
  },
  async ({ owner, repo }) => {
    const rows = await apiGet<Array<any>>(repoPath(owner, repo, 'activity'));
    const clean = rows.map(item => ({
      sha: item.sha,
      message: item.commit?.message,
      author: item.author?.login || item.commit?.author?.name || 'Unknown',
      date: item.commit?.author?.date,
      url: item.html_url,
      verified: item.commit?.verification?.verified
    }));
    return jsonResult(clean);
  }
);

server.registerTool(
  'get_repository_languages',
  {
    description: 'Get the language byte counts reported by GitHub for a public repository.',
    inputSchema: repoInput
  },
  async ({ owner, repo }) => jsonResult(await apiGet(repoPath(owner, repo, 'languages')))
);

// serveStdio owns stdin/stdout for MCP JSON-RPC. Keep diagnostics on stderr only.
try {
  serveStdio(() => {
    console.error(`RepoPulse MCP server connected; API: ${API_BASE_URL}`);
    return server;
  });
} catch (error) {
  console.error('RepoPulse MCP server failed to start:', error);
  process.exitCode = 1;
}
