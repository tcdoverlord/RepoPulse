import type { Commit, Contributor, Issue, Release, Repo } from './types';

const API = 'https://api.github.com';

export class GitHubApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!response.ok) {
    if (response.status === 403) {
      const reset = response.headers.get('x-ratelimit-reset');
      const when = reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : 'later';
      throw new GitHubApiError(`GitHub rate limit reached. Try again ${when}.`, 403);
    }
    if (response.status === 404) throw new GitHubApiError('Repository not found. Check the owner and repository name.', 404);
    throw new GitHubApiError(`GitHub returned an error (${response.status}). Please try again.`, response.status);
  }
  return response.json() as Promise<T>;
}

export function normalizeRepoInput(input: string): string {
  const cleaned = input.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length !== 2 || parts.some(part => !/^[a-zA-Z0-9_.-]+$/.test(part))) {
    throw new Error('Enter a repository as owner/name or paste its GitHub URL.');
  }
  return `${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`;
}

export async function getRepository(input: string) {
  const slug = normalizeRepoInput(input);
  const [repo, contributors, releases, commits, issues, languages] = await Promise.all([
    request<Repo>(`/repos/${slug}`),
    request<Contributor[]>(`/repos/${slug}/contributors?per_page=6`).catch(() => []),
    request<Release[]>(`/repos/${slug}/releases?per_page=5`).catch(() => []),
    request<Commit[]>(`/repos/${slug}/commits?per_page=8`).catch(() => []),
    request<Issue[]>(`/repos/${slug}/issues?state=open&per_page=100`).catch(() => []),
    request<Record<string, number>>(`/repos/${slug}/languages`).catch(() => ({}))
  ]);
  return {
    repo,
    contributors,
    releases,
    commits,
    issues: issues.filter(issue => !issue.pull_request),
    languages
  };
}

export async function searchRepositories(query: string): Promise<Repo[]> {
  const result = await request<{ items: Repo[] }>(`/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`);
  return result.items;
}