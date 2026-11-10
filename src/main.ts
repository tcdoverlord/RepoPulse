import Chart from 'chart.js/auto';
import { getRepository, GitHubApiError } from './api';
import { compact, relativeDate, percent, escapeHtml } from './utils';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
let activeCharts: Chart[] = [];
let lastQuery = 'vercel/next.js';
let currentData: Awaited<ReturnType<typeof getRepository>> | null = null;

const icon = (name: string) => {
  const paths: Record<string, string> = {
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    fork: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8m12 0v-3a5 5 0 0 0-5-5H9"/>',
    issue: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    code: '<path d="m8 17-5-5 5-5m8 10 5-5-5-5m-2-7-4 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
};

function shell() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#" aria-label="RepoPulse home"><span class="brand-mark">R<span>•</span></span><span>Repo<span class="brand-light">Pulse</span></span></a>
        <div class="side-label">WORKSPACE</div>
        <button class="side-link active" data-action="dashboard">${icon('pulse')} Overview</button>
        <div class="sidebar-bottom">
          <div class="api-status"><span class="status-dot"></span><div><b>GitHub API</b><small>Public data connection</small></div></div>
          <div class="side-foot">REPO INTELLIGENCE <span>v1.0</span></div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div><div class="eyebrow">GITHUB INTELLIGENCE</div><h1>Repository overview</h1></div>
          <a class="github-link" href="https://github.com" target="_blank" rel="noreferrer">GitHub ${icon('arrow')}</a>
        </header>
        <section class="search-panel">
          <div class="search-copy"><span class="search-kicker">DISCOVER THE SIGNAL</span><h2>Know what’s happening<br><em>inside your code.</em></h2><p>Explore repository health, momentum, and community activity in one place.</p></div>
          <form id="repo-form" class="search-form">
            <label for="repo-input">GITHUB REPOSITORY</label>
            <div class="search-box">${icon('search')}<input id="repo-input" name="repo" value="${escapeHtml(lastQuery)}" placeholder="owner/repository" autocomplete="off" required><button type="submit">Analyze <span>→</span></button></div>
            <div class="search-hint">Try <button type="button" class="example" data-repo="facebook/react">facebook/react</button> or paste a GitHub URL</div>
          </form>
          <div class="orb orb-one"></div><div class="orb orb-two"></div>
        </section>
        <div id="notice" role="status" aria-live="polite"></div>
        <section id="dashboard-content" aria-live="polite">
          <div class="loading-state"><div class="loader"></div><span>Connecting to GitHub…</span></div>
        </section>
        <footer><span>RepoPulse <b>•</b> Open-source repository intelligence</span><span>Data provided by the GitHub REST API</span></footer>
      </main>
    </div>`;
  document.querySelector('#repo-form')!.addEventListener('submit', onSubmit);
  document.querySelectorAll<HTMLButtonElement>('[data-repo]').forEach(button => button.addEventListener('click', () => loadRepo(button.dataset.repo!)));
}

function metric(label: string, value: string, detail: string, symbol: string) {
  return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon(symbol)}</span></div><strong>${value}</strong><small>${detail}</small></article>`;
}

function renderDashboard(data: NonNullable<typeof currentData>) {
  activeCharts.forEach(chart => chart.destroy());
  activeCharts = [];
  const { repo, contributors, releases, commits, issues, languages } = data;
  const langEntries = Object.entries(languages).sort((a,b) => b[1]-a[1]).slice(0,6);
  const langTotal = langEntries.reduce((sum, entry) => sum + entry[1], 0);
  const issueCount = issues.length;
  const lastPush = relativeDate(repo.pushed_at);
  const releaseMarkup = releases.length ? releases.map(release => `<a class="release-row" href="${release.html_url}" target="_blank" rel="noreferrer"><span class="release-icon">✦</span><span class="release-info"><b>${escapeHtml(release.name || release.tag_name)}</b><small>${escapeHtml(release.tag_name)} · ${release.published_at ? relativeDate(release.published_at) : 'Draft release'}</small></span><span class="row-arrow">↗</span></a>`).join('') : '<div class="empty-mini">No public releases found.</div>';
  const contributorMarkup = contributors.length ? contributors.map(person => `<a class="contributor" href="${person.html_url}" target="_blank" rel="noreferrer" title="${escapeHtml(person.login)} — ${person.contributions} contributions"><img src="${person.avatar_url}" alt="" loading="lazy"><span>${escapeHtml(person.login)}</span><b>${compact(person.contributions)}</b></a>`).join('') : '<div class="empty-mini">Contributor data is unavailable.</div>';
  const commitMarkup = commits.length ? commits.slice(0,6).map(commit => `<a class="activity-row" href="${commit.html_url}" target="_blank" rel="noreferrer"><span class="activity-line"></span><span class="activity-copy"><b>${escapeHtml(commit.commit.message.split('\\n')[0].slice(0,90))}</b><small>${escapeHtml(commit.author?.login || commit.commit.author?.name || 'Unknown author')} · ${commit.commit.author?.date ? relativeDate(commit.commit.author.date) : 'Date unavailable'}</small></span><span class="row-arrow">↗</span></a>`).join('') : '<div class="empty-mini">No recent public commits found.</div>';
  const languageMarkup = langEntries.length ? langEntries.map(([name, bytes]) => `<div class="language-row"><span>${escapeHtml(name)}</span><div class="language-track"><i style="width:${percent(bytes,langTotal)}%"></i></div><b>${percent(bytes,langTotal)}%</b></div>`).join('') : '<div class="empty-mini">Language data is unavailable.</div>';
  const description = repo.description ? escapeHtml(repo.description) : 'No repository description has been provided.';
  const license = repo.license?.spdx_id || repo.license?.name || 'Not specified';
  document.querySelector('#dashboard-content')!.innerHTML = `
    <div class="repo-heading">
      <div class="repo-identity"><img src="${repo.owner.avatar_url}" alt="${escapeHtml(repo.owner.login)} avatar"><div><div class="repo-path">${escapeHtml(repo.owner.login)} <span>/</span> <b>${escapeHtml(repo.name)}</b></div><p>${description}</p></div></div>
      <a class="outline-button" href="${repo.html_url}" target="_blank" rel="noreferrer">View on GitHub ${icon('arrow')}</a>
    </div>
    <div class="metrics-grid">
      ${metric('STARS', compact(repo.stargazers_count), 'Community appreciation', 'star')}
      ${metric('FORKS', compact(repo.forks_count), 'Shared development', 'fork')}
      ${metric('OPEN ISSUES', compact(issueCount), 'Open issues (PRs excluded)', 'issue')}
      ${metric('WATCHERS', compact(repo.watchers_count), 'Repository watchers', 'eye')}
    </div>
    <div class="section-heading"><div><span class="section-kicker">PROJECT HEALTH</span><h2>At a glance</h2></div><span class="updated"><i></i> Updated ${lastPush}</span></div>
    <div class="content-grid">
      <article class="panel language-panel"><div class="panel-head"><div><h3>Language footprint</h3><p>Code composition by bytes</p></div><span class="panel-symbol">${icon('code')}</span></div><div class="chart-wrap"><canvas id="language-chart" aria-label="Doughnut chart showing repository language composition"></canvas><div class="chart-center"><b>${langEntries.length}</b><small>LANGUAGES</small></div></div><div class="language-legend">${languageMarkup}</div></article>
      <article class="panel community-panel"><div class="panel-head"><div><h3>Community pulse</h3><p>People contributing to this project</p></div><span class="panel-symbol">↗</span></div><div class="contributors-list">${contributorMarkup}</div><div class="panel-foot">Top contributors by public contribution count</div></article>
      <article class="panel releases-panel"><div class="panel-head"><div><h3>Latest releases</h3><p>Published project milestones</p></div><span class="panel-symbol">✦</span></div><div class="release-list">${releaseMarkup}</div></article>
      <article class="panel activity-panel"><div class="panel-head"><div><h3>Recent activity</h3><p>Latest public commits</p></div><span class="panel-symbol">${icon('clock')}</span></div><div class="activity-list">${commitMarkup}</div></article>
    </div>
    <div class="repo-meta"><span>Default branch <b>${escapeHtml(repo.default_branch)}</b></span><span>License <b>${escapeHtml(license)}</b></span><span>Created <b>${new Date(repo.created_at).toLocaleDateString(undefined,{month:'short',year:'numeric'})}</b></span><span>Last push <b>${new Date(repo.pushed_at).toLocaleDateString()}</b></span></div>`;
  if (langEntries.length) {
    const canvas = document.querySelector<HTMLCanvasElement>('#language-chart');
    if (canvas) activeCharts.push(new Chart(canvas, {
      type: 'doughnut',
      data: { labels: langEntries.map(x => x[0]), datasets: [{ data: langEntries.map(x => x[1]), backgroundColor: ['#6d8dff','#40d6bd','#b18cff','#ffbd6b','#ff7e9d','#78c6ef'], borderWidth: 0, hoverOffset: 5 }] },
      options: { cutout: '78%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.label}: ${percent(Number(context.raw),langTotal)}%` } } }, maintainAspectRatio: false }
    }));
  }
}

function setNotice(message: string, type: 'error' | 'info' = 'info') {
  const el = document.querySelector<HTMLDivElement>('#notice');
  if (el) el.innerHTML = message ? `<div class="notice ${type}">${type === 'error' ? '!' : 'i'} ${escapeHtml(message)}</div>` : '';
}

async function loadRepo(query: string) {
  lastQuery = query;
  const input = document.querySelector<HTMLInputElement>('#repo-input');
  if (input) input.value = query;
  const content = document.querySelector('#dashboard-content');
  if (content) content.innerHTML = '<div class="loading-state"><div class="loader"></div><span>Reading repository signals…</span></div>';
  setNotice('');
  try {
    currentData = await getRepository(query);
    renderDashboard(currentData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong while loading this repository.';
    if (content) content.innerHTML = `<div class="error-state"><div class="error-mark">!</div><h2>Couldn’t analyze this repository</h2><p>${escapeHtml(message)}</p><button id="retry-button" class="primary-button">Try again</button></div>`;
    document.querySelector('#retry-button')?.addEventListener('click', () => loadRepo(lastQuery));
    if (!(error instanceof GitHubApiError)) setNotice(message, 'error');
  }
}

async function onSubmit(event: Event) {
  event.preventDefault();
  const input = document.querySelector<HTMLInputElement>('#repo-input')!;
  const query = input.value.trim();
  if (!query) return;
  await loadRepo(query);
}

shell();
void loadRepo(lastQuery);

