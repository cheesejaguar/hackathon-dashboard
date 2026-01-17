import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseRepoInput, formatTimeAgo, getStatusColor, getStatusIcon, GitHubAPIError, NetworkError } from './github';

describe('parseRepoInput', () => {
  it('should parse simple owner/repo format', () => {
    const result = parseRepoInput('facebook/react');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  it('should parse full GitHub URL', () => {
    const result = parseRepoInput('https://github.com/facebook/react');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  it('should parse GitHub URL with .git suffix', () => {
    const result = parseRepoInput('https://github.com/facebook/react.git');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  it('should parse GitHub URL with trailing path', () => {
    const result = parseRepoInput('https://github.com/facebook/react/tree/main');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  it('should handle input with whitespace', () => {
    const result = parseRepoInput('  facebook/react  ');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  it('should return null for invalid input', () => {
    expect(parseRepoInput('invalid')).toBeNull();
    expect(parseRepoInput('')).toBeNull();
    expect(parseRepoInput('facebook')).toBeNull();
  });

  it('should handle http URLs', () => {
    const result = parseRepoInput('http://github.com/facebook/react');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });
});

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "just now" for times less than a minute ago', () => {
    const date = new Date('2024-01-15T11:59:30Z').toISOString();
    expect(formatTimeAgo(date)).toBe('just now');
  });

  it('should return minutes ago for times less than an hour', () => {
    const date = new Date('2024-01-15T11:30:00Z').toISOString();
    expect(formatTimeAgo(date)).toBe('30m ago');
  });

  it('should return hours ago for times less than a day', () => {
    const date = new Date('2024-01-15T06:00:00Z').toISOString();
    expect(formatTimeAgo(date)).toBe('6h ago');
  });

  it('should return days ago for times less than a month', () => {
    const date = new Date('2024-01-10T12:00:00Z').toISOString();
    expect(formatTimeAgo(date)).toBe('5d ago');
  });

  it('should return formatted date for older times', () => {
    const date = new Date('2023-10-15T12:00:00Z').toISOString();
    const result = formatTimeAgo(date);
    // The exact format depends on locale, just verify it's not in "ago" format
    expect(result).not.toContain('ago');
  });
});

describe('getStatusColor', () => {
  it('should return success color for completed success', () => {
    expect(getStatusColor('completed', 'success')).toBe('text-chart-success');
  });

  it('should return danger color for completed failure', () => {
    expect(getStatusColor('completed', 'failure')).toBe('text-chart-danger');
  });

  it('should return gray color for completed cancelled', () => {
    expect(getStatusColor('completed', 'cancelled')).toBe('text-chart-gray');
  });

  it('should return gray color for completed skipped', () => {
    expect(getStatusColor('completed', 'skipped')).toBe('text-chart-gray');
  });

  it('should return warning color for completed with unknown conclusion', () => {
    expect(getStatusColor('completed', 'other')).toBe('text-chart-warning');
    expect(getStatusColor('completed', null)).toBe('text-chart-warning');
  });

  it('should return info color for in_progress', () => {
    expect(getStatusColor('in_progress')).toBe('text-chart-info');
  });

  it('should return warning color for queued', () => {
    expect(getStatusColor('queued')).toBe('text-chart-warning');
  });

  it('should return gray color for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('text-chart-gray');
  });
});

describe('getStatusIcon', () => {
  it('should return checkmark for completed success', () => {
    expect(getStatusIcon('completed', 'success')).toBe('✓');
  });

  it('should return X for completed failure', () => {
    expect(getStatusIcon('completed', 'failure')).toBe('✗');
  });

  it('should return circle-slash for cancelled', () => {
    expect(getStatusIcon('completed', 'cancelled')).toBe('⊘');
  });

  it('should return circle-minus for skipped', () => {
    expect(getStatusIcon('completed', 'skipped')).toBe('⊝');
  });

  it('should return question mark for unknown conclusion', () => {
    expect(getStatusIcon('completed', 'other')).toBe('?');
  });

  it('should return spinner for in_progress', () => {
    expect(getStatusIcon('in_progress')).toBe('⟳');
  });

  it('should return ellipsis for queued', () => {
    expect(getStatusIcon('queued')).toBe('⋯');
  });

  it('should return dot for unknown status', () => {
    expect(getStatusIcon('unknown')).toBe('·');
  });
});

describe('GitHubAPIError', () => {
  it('should create error with correct properties', () => {
    const error = new GitHubAPIError('Rate limit exceeded', 403, true, 60000);

    expect(error.message).toBe('Rate limit exceeded');
    expect(error.status).toBe(403);
    expect(error.isRateLimited).toBe(true);
    expect(error.retryAfter).toBe(60000);
    expect(error.name).toBe('GitHubAPIError');
  });

  it('should default isRateLimited to false', () => {
    const error = new GitHubAPIError('Not found', 404);

    expect(error.isRateLimited).toBe(false);
    expect(error.retryAfter).toBeUndefined();
  });
});

describe('NetworkError', () => {
  it('should create error with correct properties', () => {
    const originalError = new Error('fetch failed');
    const error = new NetworkError('Network error', originalError);

    expect(error.message).toBe('Network error');
    expect(error.originalError).toBe(originalError);
    expect(error.name).toBe('NetworkError');
  });
});
