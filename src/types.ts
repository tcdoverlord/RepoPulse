export interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  license: { name: string; spdx_id: string | null } | null;
  owner: { login: string; avatar_url: string; html_url: string };
}
export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}
export interface Release {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  published_at: string | null;
  prerelease: boolean;
}
export interface Commit {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author: { login: string; avatar_url: string } | null;
}
export interface Issue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  user: { login: string; avatar_url: string };
  pull_request?: unknown;
}
export type LoadState = 'idle' | 'loading' | 'success' | 'error';
