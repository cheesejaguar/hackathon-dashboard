import { Repository, Commit, Branch, PullRequest, WorkflowRun } from './types';

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubAPI {
  private async fetchWithAuth(url: string): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Dashboard-App',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const response = await this.fetchWithAuth(`${GITHUB_API_BASE}/repos/${owner}/${repo}`);
    return response.json();
  }

  async getCommits(owner: string, repo: string, limit = 20): Promise<Commit[]> {
    const response = await this.fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${limit}`
    );
    return response.json();
  }

  async getBranches(owner: string, repo: string): Promise<Branch[]> {
    const response = await this.fetchWithAuth(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches`);
    return response.json();
  }

  async getPullRequests(owner: string, repo: string): Promise<PullRequest[]> {
    const response = await this.fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=open&sort=updated&direction=desc`
    );
    return response.json();
  }

  async getWorkflowRuns(owner: string, repo: string, limit = 10): Promise<WorkflowRun[]> {
    const response = await this.fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs?per_page=${limit}`
    );
    const data = await response.json();
    return data.workflow_runs;
  }

  async getCheckRuns(owner: string, repo: string, sha: string) {
    const response = await this.fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}/check-runs`
    );
    const data = await response.json();
    return data.check_runs;
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
      case 'success': return 'text-green-600';
      case 'failure': return 'text-red-600';
      case 'cancelled': return 'text-gray-500';
      case 'skipped': return 'text-gray-400';
      default: return 'text-yellow-600';
    }
  }
  if (status === 'in_progress') return 'text-blue-600';
  if (status === 'queued') return 'text-yellow-500';
  return 'text-gray-500';
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