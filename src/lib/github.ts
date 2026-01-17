import { Repository, Commit, Branch, PullRequest, WorkflowRun, ContributorStats, LanguageStats, FileChange } from './types';

const GITHUB_API_BASE = 'https://api.github.com';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Rate limit information
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

// Pagination info
export interface PaginationInfo {
  page: number;
  perPage: number;
  totalCount?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// API Response with pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Custom error types for better error handling
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public isRateLimited: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

class GitHubAPI {
  private token: string | null = null;
  private rateLimitInfo: RateLimitInfo | null = null;
  private rateLimitListeners: ((info: RateLimitInfo) => void)[] = [];

  setToken(token: string | null) {
    this.token = token;
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  onRateLimitChange(listener: (info: RateLimitInfo) => void) {
    this.rateLimitListeners.push(listener);
    return () => {
      this.rateLimitListeners = this.rateLimitListeners.filter(l => l !== listener);
    };
  }

  private notifyRateLimitChange(info: RateLimitInfo) {
    this.rateLimitListeners.forEach(listener => listener(info));
  }

  private updateRateLimitInfo(response: Response) {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    const used = response.headers.get('X-RateLimit-Used');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: new Date(parseInt(reset, 10) * 1000),
        used: used ? parseInt(used, 10) : 0
      };
      this.notifyRateLimitChange(this.rateLimitInfo);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(
    url: string,
    retries = MAX_RETRIES,
    delay = INITIAL_RETRY_DELAY
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Dashboard-App',
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { headers });

        // Update rate limit info from response headers
        this.updateRateLimitInfo(response);

        // Handle rate limiting
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0') {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            const resetDate = resetTime ? new Date(parseInt(resetTime, 10) * 1000) : new Date();
            const waitTime = Math.max(0, resetDate.getTime() - Date.now());

            throw new GitHubAPIError(
              `GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`,
              403,
              true,
              waitTime
            );
          }
        }

        // Handle secondary rate limiting (abuse detection)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay * Math.pow(2, attempt);

          if (attempt < retries) {
            await this.sleep(waitTime);
            continue;
          }

          throw new GitHubAPIError(
            'Too many requests. Please wait before trying again.',
            429,
            true,
            waitTime
          );
        }

        // Handle server errors with retry
        if (response.status >= 500 && attempt < retries) {
          await this.sleep(delay * Math.pow(2, attempt));
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;

          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch {
            // Use default error message
          }

          throw new GitHubAPIError(errorMessage, response.status);
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Don't retry for client errors (except rate limiting)
        if (error instanceof GitHubAPIError && error.status >= 400 && error.status < 500 && !error.isRateLimited) {
          throw error;
        }

        // Network errors - retry with exponential backoff
        if (error instanceof TypeError && error.message.includes('fetch')) {
          if (attempt < retries) {
            await this.sleep(delay * Math.pow(2, attempt));
            continue;
          }
          throw new NetworkError('Network error. Please check your connection.', error);
        }

        // Re-throw other errors
        if (attempt === retries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unknown error occurred');
  }

  private parseLinkHeader(linkHeader: string | null): { next?: string; prev?: string; last?: string } {
    if (!linkHeader) return {};

    const links: { next?: string; prev?: string; last?: string } = {};
    const parts = linkHeader.split(',');

    for (const part of parts) {
      const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match) {
        const [, url, rel] = match;
        if (rel === 'next' || rel === 'prev' || rel === 'last') {
          links[rel] = url;
        }
      }
    }

    return links;
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const response = await this.fetchWithRetry(`${GITHUB_API_BASE}/repos/${owner}/${repo}`);
    return response.json();
  }

  async getCommits(owner: string, repo: string, limit = 20): Promise<Commit[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${limit}`
    );
    return response.json();
  }

  async getCommitsPaginated(
    owner: string,
    repo: string,
    page = 1,
    perPage = 20
  ): Promise<PaginatedResponse<Commit>> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`
    );

    const data = await response.json();
    const links = this.parseLinkHeader(response.headers.get('Link'));

    return {
      data,
      pagination: {
        page,
        perPage,
        hasNextPage: !!links.next,
        hasPrevPage: page > 1
      }
    };
  }

  async getBranches(owner: string, repo: string): Promise<Branch[]> {
    const response = await this.fetchWithRetry(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches`);
    return response.json();
  }

  async getBranchesPaginated(
    owner: string,
    repo: string,
    page = 1,
    perPage = 30
  ): Promise<PaginatedResponse<Branch>> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`
    );

    const data = await response.json();
    const links = this.parseLinkHeader(response.headers.get('Link'));

    return {
      data,
      pagination: {
        page,
        perPage,
        hasNextPage: !!links.next,
        hasPrevPage: page > 1
      }
    };
  }

  async getPullRequests(owner: string, repo: string): Promise<PullRequest[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=open&sort=updated&direction=desc`
    );
    return response.json();
  }

  async getPullRequestsPaginated(
    owner: string,
    repo: string,
    page = 1,
    perPage = 30,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<PaginatedResponse<PullRequest>> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=${state}&sort=updated&direction=desc&per_page=${perPage}&page=${page}`
    );

    const data = await response.json();
    const links = this.parseLinkHeader(response.headers.get('Link'));

    return {
      data,
      pagination: {
        page,
        perPage,
        hasNextPage: !!links.next,
        hasPrevPage: page > 1
      }
    };
  }

  async getWorkflowRuns(owner: string, repo: string, limit = 10): Promise<WorkflowRun[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs?per_page=${limit}`
    );
    const data = await response.json();
    return data.workflow_runs;
  }

  async getWorkflowRunsPaginated(
    owner: string,
    repo: string,
    page = 1,
    perPage = 10
  ): Promise<PaginatedResponse<WorkflowRun> & { totalCount: number }> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs?per_page=${perPage}&page=${page}`
    );

    const data = await response.json();
    const links = this.parseLinkHeader(response.headers.get('Link'));

    return {
      data: data.workflow_runs,
      totalCount: data.total_count,
      pagination: {
        page,
        perPage,
        totalCount: data.total_count,
        hasNextPage: !!links.next,
        hasPrevPage: page > 1
      }
    };
  }

  async getCheckRuns(owner: string, repo: string, sha: string) {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}/check-runs`
    );
    const data = await response.json();
    return data.check_runs;
  }

  async getContributors(owner: string, repo: string): Promise<ContributorStats[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/stats/contributors`
    );

    // GitHub stats endpoints can return 202 when data is being computed
    if (response.status === 202) {
      // Return empty array for now, will be populated on next request
      return [];
    }

    return response.json();
  }

  async getLanguages(owner: string, repo: string): Promise<LanguageStats> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`
    );
    return response.json();
  }

  async getCommitFiles(owner: string, repo: string, sha: string): Promise<FileChange[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}`
    );
    const data = await response.json();
    return data.files || [];
  }

  async getRecentCommitsWithFiles(owner: string, repo: string, limit = 10): Promise<Array<{commit: Commit, files: FileChange[]}>> {
    const commits = await this.getCommits(owner, repo, limit);
    const commitsWithFiles = [];

    // Only fetch file details for the first few commits to avoid rate limiting
    for (const commit of commits.slice(0, 5)) {
      try {
        const files = await this.getCommitFiles(owner, repo, commit.sha);
        commitsWithFiles.push({ commit, files });
      } catch (error) {
        // If we can't get files for a commit, just include it without files
        commitsWithFiles.push({ commit, files: [] });
      }
    }

    return commitsWithFiles;
  }

  // Search commits by message
  async searchCommits(
    owner: string,
    repo: string,
    query: string,
    page = 1,
    perPage = 20
  ): Promise<PaginatedResponse<Commit> & { totalCount: number }> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/search/commits?q=${encodeURIComponent(query)}+repo:${owner}/${repo}&per_page=${perPage}&page=${page}`
    );

    const data = await response.json();
    const links = this.parseLinkHeader(response.headers.get('Link'));

    // Transform search results to match Commit interface
    const commits = data.items.map((item: { sha: string; commit: Commit['commit']; author: Commit['author']; html_url: string }) => ({
      sha: item.sha,
      commit: item.commit,
      author: item.author,
      html_url: item.html_url
    }));

    return {
      data: commits,
      totalCount: data.total_count,
      pagination: {
        page,
        perPage,
        totalCount: data.total_count,
        hasNextPage: !!links.next,
        hasPrevPage: page > 1
      }
    };
  }

  // Search pull requests
  async searchPullRequests(
    owner: string,
    repo: string,
    query: string,
    state: 'open' | 'closed' | 'all' = 'open',
    page = 1,
    perPage = 20
  ): Promise<PaginatedResponse<PullRequest> & { totalCount: number }> {
    const stateQuery = state !== 'all' ? `+is:${state}` : '';
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}+repo:${owner}/${repo}+is:pr${stateQuery}&per_page=${perPage}&page=${page}`
    );

    const data = await response.json();
    const links = this.parseLinkHeader(response.headers.get('Link'));

    // Search API returns different format, need to fetch full PR data
    const pullRequests: PullRequest[] = await Promise.all(
      data.items.map(async (item: { number: number }) => {
        try {
          const prResponse = await this.fetchWithRetry(
            `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${item.number}`
          );
          return prResponse.json();
        } catch {
          return null;
        }
      })
    ).then(results => results.filter((pr): pr is PullRequest => pr !== null));

    return {
      data: pullRequests,
      totalCount: data.total_count,
      pagination: {
        page,
        perPage,
        totalCount: data.total_count,
        hasNextPage: !!links.next,
        hasPrevPage: page > 1
      }
    };
  }
}

export const githubAPI = new GitHubAPI();

export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const match = input.trim().match(/^(?:https?:\/\/github\.com\/)?([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/);
  if (!match) return null;

  const [, owner, repo] = match;
  return { owner, repo };
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

export function getStatusColor(status: string, conclusion?: string | null): string {
  if (status === 'completed') {
    switch (conclusion) {
      case 'success': return 'text-chart-success';
      case 'failure': return 'text-chart-danger';
      case 'cancelled': return 'text-chart-gray';
      case 'skipped': return 'text-chart-gray';
      default: return 'text-chart-warning';
    }
  }
  if (status === 'in_progress') return 'text-chart-info';
  if (status === 'queued') return 'text-chart-warning';
  return 'text-chart-gray';
}

export function getStatusIcon(status: string, conclusion?: string | null): string {
  if (status === 'completed') {
    switch (conclusion) {
      case 'success': return '✓';
      case 'failure': return '✗';
      case 'cancelled': return '⊘';
      case 'skipped': return '⊝';
      default: return '?';
    }
  }
  if (status === 'in_progress') return '⟳';
  if (status === 'queued') return '⋯';
  return '·';
}
