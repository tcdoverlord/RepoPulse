import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = Number(process.env.API_PORT || 8787);
const GITHUB_API = 'https://api.github.com';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 5 * 60 * 1000);
const MAX_REQUESTS_PER_MINUTE = Number(process.env.API_RATE_LIMIT || 60);
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',').map(value => value.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients without an Origin header; restrict browser origins.
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by RepoPulse API'));
  }
}));
app.use(express.json({ limit: '32kb' }));

type CacheEntry = { expiresAt: number; value: unknown };
const cache = new Map<string, CacheEntry>();
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  current.count += 1;
  if (current.count > MAX_REQUESTS_PER_MINUTE) {
    res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
    return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait and try again.' } });
  }
  return next();
}
app.use('/api', rateLimit);

function validPart(value: string) {
  return /^[a-zA-Z0-9_.-]{1,100}$/.test(value) && value !== '.' && value !== '..';
}
function repoPath(req: Request, res: Response): string | null {
  const { owner, repo } = req.params;
  if (!validPart(owner) || !validPart(repo)) {
    res.status(400).json({ error: { code: 'INVALID_REPOSITORY', message: 'Use a valid owner and repository name.' } });
    return null;
  }
  return `${encodeURIComponent(owner)}/${encodeURIComponent(repo.replace(/\.git$/i, ''))}`;
}
async function github<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'RepoPulse-API/1.1' }
  });
  if (!response.ok) {
    const message = response.status === 404 ? 'GitHub repository or resource not found.'
      : response.status === 403 ? 'GitHub rate limit or access restriction. Try again later.'
      : `GitHub API request failed (${response.status}).`;
    const error = new Error(message) as Error & { status?: number; code?: string };
    error.status = response.status === 404 ? 404 : response.status === 403 ? 429 : 502;
    error.code = response.status === 404 ? 'NOT_FOUND' : response.status === 403 ? 'GITHUB_LIMIT' : 'GITHUB_ERROR';
    throw error;
  }
  return response.json() as Promise<T>;
}
async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value as T;
  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
function asyncRoute(handler: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => { handler(req, res).catch(next); };
}

app.get('/health', (_req, res) => res.json({
  status: 'ok',
  service: 'RepoPulse API',
  version: '1.1.0',
  timestamp: new Date().toISOString()
}));

app.get('/api/repos/:owner/:repo/summary', asyncRoute(async (req, res) => {
  const slug = repoPath(req, res); if (!slug) return;
  const data = await cached(`summary:${slug}`, async () => {
    const [repo, languages] = await Promise.all([
      github<any>(`/repos/${slug}`),
      github<Record<string, number>>(`/repos/${slug}/languages`)
    ]);
    return {
      repository: { id: repo.id, name: repo.name, full_name: repo.full_name, description: repo.description,
        url: repo.html_url, stars: repo.stargazers_count, forks: repo.forks_count,
        open_issues: repo.open_issues_count, subscribers: repo.subscribers_count,
        watchers_field_note: 'GitHub watchers_count mirrors stars; subscribers is the distinct watch/subscription metric.',
        language: repo.language, default_branch: repo.default_branch, created_at: repo.created_at,
        updated_at: repo.updated_at, pushed_at: repo.pushed_at, license: repo.license?.spdx_id || null },
      languages
    };
  });
  res.json({ data, meta: { source: 'GitHub REST API', cached: true, cache_ttl_seconds: CACHE_TTL_MS / 1000 } });
}));

app.get('/api/repos/:owner/:repo/contributors', asyncRoute(async (req, res) => {
  const slug = repoPath(req, res); if (!slug) return;
  const data = await cached(`contributors:${slug}`, () => github(`/repos/${slug}/contributors?per_page=30`));
  res.json({ data, meta: { source: 'GitHub REST API' } });
}));

app.get('/api/repos/:owner/:repo/releases', asyncRoute(async (req, res) => {
  const slug = repoPath(req, res); if (!slug) return;
  const data = await cached(`releases:${slug}`, () => github(`/repos/${slug}/releases?per_page=20`));
  res.json({ data, meta: { source: 'GitHub REST API' } });
}));

app.get('/api/repos/:owner/:repo/activity', asyncRoute(async (req, res) => {
  const slug = repoPath(req, res); if (!slug) return;
  const data = await cached(`activity:${slug}`, () => github(`/repos/${slug}/commits?per_page=20`));
  res.json({ data, meta: { source: 'GitHub REST API' } });
}));

app.get('/api/repos/:owner/:repo/languages', asyncRoute(async (req, res) => {
  const slug = repoPath(req, res); if (!slug) return;
  const data = await cached(`languages:${slug}`, () => github(`/repos/${slug}/languages`));
  res.json({ data, meta: { source: 'GitHub REST API' } });
}));

app.use((err: Error & { status?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 502;
  res.status(status).json({ error: { code: err.code || 'API_ERROR', message: err.message || 'Unexpected API error.' } });
});

app.listen(PORT, () => {
  console.log(`RepoPulse API listening at http://localhost:${PORT}`);
});
