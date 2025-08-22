import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RotateCcw } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { GitHubLogin } from '@/components/GitHubLogin';
import { RepositorySelection } from '@/components/RepositorySelection';
import { RepositoryHeader } from '@/components/RepositoryHeader';
import { CommitFlow } from '@/components/CommitFlow';
import { BranchMonitor } from '@/components/BranchMonitor';
import { PullRequestDashboard } from '@/components/PullRequestDashboard';
import { ActionStatus } from '@/components/ActionStatus';
import { RepositoryInsights } from '@/components/RepositoryInsights';

import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { githubAPI } from '@/lib/github';
import { Repository, Commit, Branch, PullRequest, WorkflowRun, ContributorStats, LanguageStats, FileChange } from '@/lib/types';

function App() {
  const auth = useGitHubAuth();
  const [currentRepo, setCurrentRepo] = useKV<{owner: string, repo: string} | null>('current-repo', null);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [contributors, setContributors] = useState<ContributorStats[]>([]);
  const [languages, setLanguages] = useState<LanguageStats>({});
  const [recentFileChanges, setRecentFileChanges] = useState<Array<{commit: Commit, files: FileChange[]}>>([]);
  
  const [loading, setLoading] = useState({
    repository: false,
    commits: false,
    branches: false,
    pullRequests: false,
    workflowRuns: false,
    contributors: false,
    languages: false,
    fileChanges: false,
  });
  
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Set GitHub API token when authenticated
  useEffect(() => {
    if (auth.token) {
      githubAPI.setToken(auth.token);
    }
  }, [auth.token]);

  const handleRepositorySelect = async (owner: string, repo: string) => {
    setError(null);
    setLoading(prev => ({ ...prev, repository: true }));
    
    try {
      const repoData = await githubAPI.getRepository(owner, repo);
      setRepository(repoData);
      setCurrentRepo({ owner, repo });
      
      await loadRepositoryData(owner, repo);
      
      toast.success(`Connected to ${owner}/${repo}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load repository';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(prev => ({ ...prev, repository: false }));
    }
  };

  const loadRepositoryData = async (owner: string, repo: string) => {
    const loadingPromises = [
      loadCommits(owner, repo),
      loadBranches(owner, repo),
      loadPullRequests(owner, repo),
      loadWorkflowRuns(owner, repo),
      loadContributors(owner, repo),
      loadLanguages(owner, repo),
      loadFileChanges(owner, repo),
    ];

    await Promise.allSettled(loadingPromises);
    setLastRefresh(new Date());
  };

  const loadCommits = async (owner: string, repo: string) => {
    setLoading(prev => ({ ...prev, commits: true }));
    try {
      const commitsData = await githubAPI.getCommits(owner, repo);
      setCommits(commitsData);
    } catch (err) {
      console.error('Failed to load commits:', err);
    } finally {
      setLoading(prev => ({ ...prev, commits: false }));
    }
  };

  const loadBranches = async (owner: string, repo: string) => {
    setLoading(prev => ({ ...prev, branches: true }));
    try {
      const branchesData = await githubAPI.getBranches(owner, repo);
      setBranches(branchesData);
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(prev => ({ ...prev, branches: false }));
    }
  };

  const loadPullRequests = async (owner: string, repo: string) => {
    setLoading(prev => ({ ...prev, pullRequests: true }));
    try {
      const prsData = await githubAPI.getPullRequests(owner, repo);
      setPullRequests(prsData);
    } catch (err) {
      console.error('Failed to load pull requests:', err);
    } finally {
      setLoading(prev => ({ ...prev, pullRequests: false }));
    }
  };

  const loadWorkflowRuns = async (owner: string, repo: string) => {
    setLoading(prev => ({ ...prev, workflowRuns: true }));
    try {
      const workflowData = await githubAPI.getWorkflowRuns(owner, repo);
      setWorkflowRuns(workflowData);
    } catch (err) {
      console.error('Failed to load workflow runs:', err);
    } finally {
      setLoading(prev => ({ ...prev, workflowRuns: false }));
    }
  };

  const loadContributors = async (owner: string, repo: string) => {
    setLoading(prev => ({ ...prev, contributors: true }));
    try {
      const contributorsData = await githubAPI.getContributors(owner, repo);
      setContributors(contributorsData);
    } catch (err) {
      console.error('Failed to load contributors:', err);
    } finally {
      setLoading(prev => ({ ...prev, contributors: false }));
    }
  };

  const loadLanguages = async (owner: string, repo: string) => {
    setLoading(prev => ({ ...prev, languages: true }));
    try {
      const languagesData = await githubAPI.getLanguages(owner, repo);
      setLanguages(languagesData);
    } catch (err) {
      console.error('Failed to load languages:', err);
    } finally {
      setLoading(prev => ({ ...prev, languages: false }));
    }
  };

  const loadFileChanges = async (owner: string, repo: string) => {
    setLoading(prev => ({ ...prev, fileChanges: true }));
    try {
      const fileChangesData = await githubAPI.getRecentCommitsWithFiles(owner, repo);
      setRecentFileChanges(fileChangesData);
    } catch (err) {
      console.error('Failed to load file changes:', err);
    } finally {
      setLoading(prev => ({ ...prev, fileChanges: false }));
    }
  };

  const handleRefresh = async () => {
    if (!currentRepo) return;
    
    toast.info('Refreshing repository data...');
    await loadRepositoryData(currentRepo.owner, currentRepo.repo);
    toast.success('Data refreshed');
  };

  const handleBackToSelection = () => {
    setCurrentRepo(null);
    setRepository(null);
    setCommits([]);
    setBranches([]);
    setPullRequests([]);
    setWorkflowRuns([]);
    setContributors([]);
    setLanguages({});
    setRecentFileChanges([]);
    setError(null);
    setLastRefresh(null);
  };

  const handleLogin = async (token: string) => {
    try {
      await auth.loginWithToken(token);
      toast.success('Successfully connected to GitHub!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    }
  };

  const handleLogout = () => {
    auth.logout();
    handleBackToSelection();
    toast.info('Logged out from GitHub');
  };

  // Auto-refresh every 30 seconds when repository is loaded and user is authenticated
  useEffect(() => {
    if (!currentRepo || !auth.isAuthenticated) return;

    const interval = setInterval(() => {
      loadRepositoryData(currentRepo.owner, currentRepo.repo);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentRepo, auth.isAuthenticated]);

  // Load repository on mount if currentRepo exists and user is authenticated
  useEffect(() => {
    if (currentRepo && !repository && auth.isAuthenticated) {
      handleRepositorySelect(currentRepo.owner, currentRepo.repo);
    }
  }, [currentRepo, repository, auth.isAuthenticated]);

  // Show login screen if not authenticated
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <GitHubLogin 
          onLogin={handleLogin}
          isLoading={auth.isLoading}
          error={auth.error}
        />
      </div>
    );
  }

  // Show repository selection if no repository is selected
  if (!currentRepo || !repository) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <RepositorySelection 
          user={auth.user!}
          token={auth.token!}
          onRepositorySelect={handleRepositorySelect}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with back button and refresh */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleBackToSelection}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Repository
          </Button>
          
          <div className="flex items-center gap-4">
            {lastRefresh && (
              <span className="text-sm text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={Object.values(loading).some(Boolean)}
              className="flex items-center gap-2"
            >
              <RotateCcw className={`w-4 h-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Repository header */}
        <RepositoryHeader repository={repository} />

        <Separator />

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <CommitFlow commits={commits} isLoading={loading.commits} />
            <div className="xl:hidden">
              <PullRequestDashboard 
                pullRequests={pullRequests} 
                isLoading={loading.pullRequests} 
              />
            </div>
            <BranchMonitor 
              branches={branches} 
              defaultBranch={repository.default_branch}
              isLoading={loading.branches} 
            />
          </div>

          {/* Middle column */}
          <div className="space-y-6">
            <div className="hidden xl:block">
              <PullRequestDashboard 
                pullRequests={pullRequests} 
                isLoading={loading.pullRequests} 
              />
            </div>
            <ActionStatus 
              workflowRuns={workflowRuns} 
              isLoading={loading.workflowRuns} 
            />
          </div>

          {/* Right column - Insights */}
          <div className="xl:col-span-1">
            <RepositoryInsights
              contributors={contributors}
              languages={languages}
              recentFileChanges={recentFileChanges}
              commits={commits}
              isLoading={{
                contributors: loading.contributors,
                languages: loading.languages,
                fileChanges: loading.fileChanges
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;