export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  html_url: string;
  default_branch: string;
  open_issues_count: number;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

export interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  };
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  mergeable_state: string;
  draft: boolean;
  requested_reviewers: Array<{
    login: string;
    avatar_url: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

export interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  head_commit: {
    message: string;
    author: {
      name: string;
    };
  };
}

export interface CheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string | null;
  html_url: string;
}

export interface ContributorStats {
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  total: number;
  weeks: Array<{
    w: number; // Week timestamp
    a: number; // Additions
    d: number; // Deletions
    c: number; // Commits
  }>;
}

export interface FileChange {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  patch?: string;
}

export interface LanguageStats {
  [language: string]: number;
}

export interface RepositoryInsights {
  contributors: ContributorStats[];
  languages: LanguageStats;
  totalCommits: number;
  totalContributors: number;
  recentFileChanges: {
    commit: Commit;
    files: FileChange[];
  }[];
}