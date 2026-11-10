import { describe, expect, it } from 'vitest';
import { compact, percent, initials, escapeHtml } from '../src/utils';
import { normalizeRepoInput } from '../src/api';

describe('RepoPulse utilities', () => {
  it('formats compact numbers', () => {
    expect(compact(1200)).toBe('1.2K');
  });
  it('calculates safe percentages', () => {
    expect(percent(25, 100)).toBe(25);
    expect(percent(2, 0)).toBe(0);
  });
  it('creates initials', () => {
    expect(initials('repo-pulse')).toBe('RP');
  });
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });
  it('normalizes GitHub URLs and owner/repo input', () => {
    expect(normalizeRepoInput('https://github.com/facebook/react/')).toBe('facebook/react');
    expect(normalizeRepoInput('vercel/next.js')).toBe('vercel/next.js');
  });
  it('rejects malformed repository input', () => {
    expect(() => normalizeRepoInput('not-a-repo')).toThrow();
  });
});