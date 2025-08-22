import { useState, useCallback } from 'react';
import { useKV } from '@github/spark/hooks';
import { RepositoryComparisonData } from '@/lib/types';
import { githubAPI } from '@/lib/github';

export function useRepositoryComparison() {
  const [comparedRepos, setComparedRepos] = useKV<string[]>('compared-repositories', []);
  const [repositoryData, setRepositoryData] = useState<Map<string, RepositoryComparisonData>>(new Map());

  const loadRepositoryData = useCallback(async (owner: string, repo: string): Promise<RepositoryComparisonData> => {
    const repoKey = `${owner}/${repo}`;
    
    // Set loading state
    const initialData: RepositoryComparisonData = {
      repository: {
        id: 0,
        name: repo,
        full_name: repoKey,
        owner: { login: owner, avatar_url: '' },
        description: '',
        html_url: `https://github.com/${repoKey}`,
        default_branch: 'main',
        open_issues_count: 0,
        stargazers_count: 0,
        forks_count: 0,
        updated_at: new Date().toISOString()
      },
      commits: [],
      branches: [],
      pullRequests: [],
      workflowRuns: [],
      contributors: [],
      languages: {},
      lastUpdate: new Date(),
      isLoading: true,
      error: null
    };

    setRepositoryData(prev => new Map(prev.set(repoKey, initialData)));

    try {
      // Load all data in parallel
      const [
        repository,
        commits,
        branches,
        pullRequests,
        workflowRuns,
        contributors,
        languages
      ] = await Promise.all([
        githubAPI.getRepository(owner, repo),
        githubAPI.getCommits(owner, repo).catch(() => []),
        githubAPI.getBranches(owner, repo).catch(() => []),
        githubAPI.getPullRequests(owner, repo).catch(() => []),
        githubAPI.getWorkflowRuns(owner, repo).catch(() => []),
        githubAPI.getContributors(owner, repo).catch(() => []),
        githubAPI.getLanguages(owner, repo).catch(() => ({}))
      ]);

      const completeData: RepositoryComparisonData = {
        repository,
        commits,
        branches,
        pullRequests,
        workflowRuns,
        contributors,
        languages,
        lastUpdate: new Date(),
        isLoading: false,
        error: null
      };

      setRepositoryData(prev => new Map(prev.set(repoKey, completeData)));
      return completeData;
    } catch (error) {
      const errorData: RepositoryComparisonData = {
        ...initialData,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load repository'
      };

      setRepositoryData(prev => new Map(prev.set(repoKey, errorData)));
      throw error;
    }
  }, []);

  const addRepository = useCallback(async (owner: string, repo: string) => {
    const repoKey = `${owner}/${repo}`;
    
    // Check if already added
    if (comparedRepos.includes(repoKey)) {
      throw new Error('Repository already added to comparison');
    }

    // Load repository data
    await loadRepositoryData(owner, repo);
    
    // Add to comparison list
    setComparedRepos(prev => [...prev, repoKey]);
  }, [comparedRepos, loadRepositoryData, setComparedRepos]);

  const removeRepository = useCallback((repoKey: string) => {
    setComparedRepos(prev => prev.filter(key => key !== repoKey));
    setRepositoryData(prev => {
      const newMap = new Map(prev);
      newMap.delete(repoKey);
      return newMap;
    });
  }, [setComparedRepos]);

  const refreshRepository = useCallback(async (repoKey: string) => {
    const [owner, repo] = repoKey.split('/');
    if (owner && repo) {
      await loadRepositoryData(owner, repo);
    }
  }, [loadRepositoryData]);

  const refreshAllRepositories = useCallback(async () => {
    const promises = comparedRepos.map(repoKey => {
      const [owner, repo] = repoKey.split('/');
      return owner && repo ? loadRepositoryData(owner, repo) : Promise.resolve();
    });

    await Promise.allSettled(promises);
  }, [comparedRepos, loadRepositoryData]);

  // Get current repository data as array
  const repositories = comparedRepos
    .map(repoKey => repositoryData.get(repoKey))
    .filter((data): data is RepositoryComparisonData => data !== undefined);

  return {
    repositories,
    addRepository,
    removeRepository,
    refreshRepository,
    refreshAllRepositories,
    isLoading: repositories.some(repo => repo.isLoading),
    hasRepositories: repositories.length > 0
  };
}