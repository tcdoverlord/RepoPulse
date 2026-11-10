import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'api', 'registry.json');
const outputRoot = path.join(root, 'public', 'api');
const githubApi = 'https://api.github.com';
const generatedAt = new Date().toISOString();

async function github(endpoint) {
  const response = await fetch(`${githubApi}${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'RepoPulse-Static-API'
    }
  });
  if (!response.ok) {
    const detail = response.status === 403
      ? 'GitHub rate limit or access restriction.'
      : response.status === 404 ? 'Repository or resource not found.' : `GitHub returned ${response.status}.`;
    throw new Error(`${detail} Request: ${endpoint}`);
  }
  return response.json();
}

async function saveJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const registry = JSON.parse(await readFile(registryPath, 'utf8'));
if (!Array.isArray(registry.repositories) || registry.repositories.length === 0) {
  throw new Error('api/registry.json must contain at least one repository.');
}

const index = [];
await saveJson(path.join(outputRoot, 'health.json'), {
  status: 'ok',
  service: 'RepoPulse Static JSON API',
  generated_at: generatedAt,
  repository_count: registry.repositories.length
});

for (const entry of registry.repositories) {
  const owner = String(entry.owner || '');
  const repoName = String(entry.repo || '');
  const valid = /^[a-zA-Z0-9_.-]{1,100}$/.test(owner) &&
    /^[a-zA-Z0-9_.-]{1,100}$/.test(repoName) && owner !== '..' && repoName !== '..';
  if (!valid) throw new Error(`Invalid repository entry: ${JSON.stringify(entry)}`);

  const slug = `${encodeURIComponent(owner)}/${encodeURIComponent(repoName.replace(/\.git$/i, ''))}`;
  console.log(`Generating JSON for ${owner}/${repoName}`);

  const [repo, contributors, releases, commits, issues, languages] = await Promise.all([
    github(`/repos/${slug}`),
    github(`/repos/${slug}/contributors?per_page=30`),
    github(`/repos/${slug}/releases?per_page=20`),
    github(`/repos/${slug}/commits?per_page=20`),
    github(`/repos/${slug}/issues?state=open&per_page=100`),
    github(`/repos/${slug}/languages`)
  ]);

  const data = {
    repository: {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      subscribers: repo.subscribers_count,
      language: repo.language,
      default_branch: repo.default_branch,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      license: repo.license?.spdx_id || null
    },
    contributors,
    releases,
    activity: commits,
    issues: issues.filter(issue => !issue.pull_request),
    languages
  };
  const meta = { source: 'GitHub REST API', generated_at: generatedAt, repository: repo.full_name };
  const base = path.join(outputRoot, 'repos', owner, repoName.replace(/\.git$/i, ''));

  await Promise.all([
    saveJson(path.join(base, 'summary.json'), { data: { repository: data.repository, languages }, meta }),
    saveJson(path.join(base, 'contributors.json'), { data: contributors, meta }),
    saveJson(path.join(base, 'releases.json'), { data: releases, meta }),
    saveJson(path.join(base, 'activity.json'), { data: commits, meta }),
    saveJson(path.join(base, 'issues.json'), { data: data.issues, meta }),
    saveJson(path.join(base, 'languages.json'), { data: languages, meta }),
    saveJson(path.join(base, 'all.json'), { data, meta })
  ]);

  index.push({
    repository: repo.full_name,
    url: repo.html_url,
    generated_at: generatedAt,
    endpoints: {
      all: `repos/${owner}/${repoName.replace(/\.git$/i, '')}/all.json`,
      summary: `repos/${owner}/${repoName.replace(/\.git$/i, '')}/summary.json`,
      contributors: `repos/${owner}/${repoName.replace(/\.git$/i, '')}/contributors.json`,
      releases: `repos/${owner}/${repoName.replace(/\.git$/i, '')}/releases.json`,
      activity: `repos/${owner}/${repoName.replace(/\.git$/i, '')}/activity.json`,
      issues: `repos/${owner}/${repoName.replace(/\.git$/i, '')}/issues.json`,
      languages: `repos/${owner}/${repoName.replace(/\.git$/i, '')}/languages.json`
    }
  });
}

await saveJson(path.join(outputRoot, 'index.json'), {
  service: 'RepoPulse Static JSON API',
  generated_at: generatedAt,
  repository_count: index.length,
  repositories: index
});
console.log(`Generated static JSON for ${index.length} repository/repositories.`);
