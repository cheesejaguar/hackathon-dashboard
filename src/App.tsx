import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RotateCcw } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { RepositoryInput } from '@/components/RepositoryInput';
import { RepositoryHeader } from '@/components/RepositoryHeader';
import { CommitFlow } from '@/components/CommitFlow';
import { BranchMonitor } from '@/components/BranchMonitor';
import { PullRequestDashboard } from '@/components/PullRequestDashboard';
import { ActionStatus } from '@/components/ActionStatus';

import { githubAPI } from '@/lib/github';
import { Repository, Commit, Branch, PullRequest, WorkflowRun } from '@/lib/types';

function App() {
  const [currentRepo, setCurrentRepo] = useKV<{owner: string, repo: string} | null>('current-repo', null);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  
  const [loading, setLoading] = useState({
    repository: false,
    commits: false,
    branches: false,
    pullRequests: false,
    workflowRuns: false,
  });
  
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
    setError(null);
    setLastRefresh(null);
  };

  // Auto-refresh every 30 seconds when repository is loaded
  useEffect(() => {
    if (!currentRepo) return;

    const interval = setInterval(() => {
      loadRepositoryData(currentRepo.owner, currentRepo.repo);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentRepo]);

  // Load repository on mount if currentRepo exists
  useEffect(() => {
    if (currentRepo && !repository) {
      handleRepositorySelect(currentRepo.owner, currentRepo.repo);
    }
  }, [currentRepo, repository]);

  if (!currentRepo || !repository) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <RepositoryInput 
          onRepositorySelect={handleRepositorySelect}
          isLoading={loading.repository}
          error={error}
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
          </div>
        </div>

        {/* Repository header */}
        <RepositoryHeader repository={repository} />

        <Separator />

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

          {/* Right column */}
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
        </div>
      </div>
    </div>
  );
}

export default App;