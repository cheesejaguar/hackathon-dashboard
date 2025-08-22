import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  GitBranch, 
  GitPullRequest, 
  Code, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  X,
  ExternalLink
} from '@phosphor-icons/react';
import { RepositoryComparisonData, ComparisonMetrics } from '@/lib/types';
import { AddRepositoryDialog } from '@/components/AddRepositoryDialog';
import { githubAPI } from '@/lib/github';
import { toast } from 'sonner';
import { useChartColors } from '@/hooks/useChartColors';

interface RepositoryComparisonProps {
  repositories: RepositoryComparisonData[];
  onAddRepository: (owner: string, repo: string) => Promise<void>;
  onRemoveRepository: (repoId: string) => void;
}

export function RepositoryComparison({ 
  repositories, 
  onAddRepository, 
  onRemoveRepository 
}: RepositoryComparisonProps) {
  const { statusColors, semanticColors } = useChartColors();
  
  // Calculate metrics for each repository
  const calculateMetrics = (repo: RepositoryComparisonData): ComparisonMetrics => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Commit frequency (commits per day over last week)
    const recentCommits = repo.commits.filter(
      commit => new Date(commit.commit.author.date) > weekAgo
    );
    const commitFrequency = recentCommits.length / 7;
    
    // Active branches (branches with commits in last 30 days)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeBranches = repo.branches.filter(branch => {
      const branchCommit = repo.commits.find(c => c.sha === branch.commit.sha);
      return branchCommit && new Date(branchCommit.commit.author.date) > monthAgo;
    }).length;
    
    // Main language
    const languages = Object.entries(repo.languages);
    const mainLanguage = languages.length > 0 
      ? languages.reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'Unknown';
    
    // Workflow success rate
    const completedRuns = repo.workflowRuns.filter(run => run.conclusion);
    const successfulRuns = completedRuns.filter(run => run.conclusion === 'success');
    const successRate = completedRuns.length > 0 
      ? (successfulRuns.length / completedRuns.length) * 100 
      : 0;
    
    // Last commit age in hours
    const lastCommit = repo.commits[0];
    const lastCommitAge = lastCommit 
      ? (now.getTime() - new Date(lastCommit.commit.author.date).getTime()) / (1000 * 60 * 60)
      : Infinity;
    
    return {
      commitFrequency,
      prCount: repo.pullRequests.length,
      activeBranches,
      contributorCount: repo.contributors.length,
      mainLanguage,
      successRate,
      lastCommitAge
    };
  };

  const metrics = repositories.map(calculateMetrics);

  const formatTimeAgo = (hours: number): string => {
    if (hours < 1) return '< 1h ago';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const getSuccessRateColor = (rate: number): React.CSSProperties => {
    if (rate >= 90) return { color: statusColors.success };
    if (rate >= 70) return { color: statusColors.pending };
    return { color: statusColors.failure };
  };

  const getActivityLevel = (frequency: number): { label: string; color: string } => {
    if (frequency >= 2) return { label: 'High', color: statusColors.success };
    if (frequency >= 0.5) return { label: 'Medium', color: statusColors.pending };
    if (frequency > 0) return { label: 'Low', color: semanticColors.accent };
    return { label: 'Inactive', color: statusColors.cancelled };
  };

  if (repositories.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Repository Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <GitBranch className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">No repositories to compare</h3>
              <p className="text-sm text-muted-foreground">
                Add repositories to compare their activity and metrics
              </p>
            </div>
            <AddRepositoryDialog onAddRepository={onAddRepository} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <GitBranch className="w-6 h-6" />
          Repository Comparison
        </h2>
        <AddRepositoryDialog onAddRepository={onAddRepository} />
      </div>

      {/* Comparison Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {repositories.map((repo, index) => {
          const repoMetrics = metrics[index];
          const activity = getActivityLevel(repoMetrics.commitFrequency);
          
          return (
            <Card key={repo.repository.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img 
                      src={repo.repository.owner.avatar_url} 
                      alt={repo.repository.owner.login}
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium truncate">
                        {repo.repository.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {repo.repository.owner.login}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(repo.repository.html_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveRepository(repo.repository.full_name)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Activity Badge */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: activity.color }}
                  />
                  <span className="text-xs font-medium">{activity.label} Activity</span>
                  <span className="text-xs text-muted-foreground">
                    {repoMetrics.commitFrequency.toFixed(1)} commits/day
                  </span>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <GitPullRequest 
                      className="w-3 h-3" 
                      style={{ color: semanticColors.primary }}
                    />
                    <span>{repoMetrics.prCount} PRs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitBranch 
                      className="w-3 h-3" 
                      style={{ color: semanticColors.accent }}
                    />
                    <span>{repoMetrics.activeBranches} active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users 
                      className="w-3 h-3" 
                      style={{ color: statusColors.success }}
                    />
                    <span>{repoMetrics.contributorCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Code 
                      className="w-3 h-3" 
                      style={{ color: semanticColors.secondary }}
                    />
                    <span className="truncate">{repoMetrics.mainLanguage}</span>
                  </div>
                </div>

                {/* Success Rate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {repoMetrics.successRate >= 90 ? (
                      <CheckCircle 
                        className="w-3 h-3" 
                        style={{ color: statusColors.success }}
                      />
                    ) : (
                      <XCircle 
                        className="w-3 h-3" 
                        style={{ color: statusColors.failure }}
                      />
                    )}
                    <span 
                      className="text-xs font-medium" 
                      style={getSuccessRateColor(repoMetrics.successRate)}
                    >
                      {repoMetrics.successRate.toFixed(0)}% success
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(repoMetrics.lastCommitAge)}</span>
                  </div>
                </div>

                {/* Loading/Error States */}
                {repo.isLoading && (
                  <div className="text-xs text-muted-foreground">Updating...</div>
                )}
                {repo.error && (
                  <div className="text-xs" style={{ color: statusColors.failure }}>
                    Error: {repo.error}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Comparison Table */}
      {repositories.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Repository</th>
                    <th className="text-center py-2 font-medium">Activity</th>
                    <th className="text-center py-2 font-medium">Pull Requests</th>
                    <th className="text-center py-2 font-medium">Active Branches</th>
                    <th className="text-center py-2 font-medium">Contributors</th>
                    <th className="text-center py-2 font-medium">Success Rate</th>
                    <th className="text-center py-2 font-medium">Last Commit</th>
                  </tr>
                </thead>
                <tbody>
                  {repositories.map((repo, index) => {
                    const repoMetrics = metrics[index];
                    const activity = getActivityLevel(repoMetrics.commitFrequency);
                    
                    return (
                      <tr key={repo.repository.id} className="border-b">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img 
                              src={repo.repository.owner.avatar_url} 
                              alt={repo.repository.owner.login}
                              className="w-5 h-5 rounded-full"
                            />
                            <div>
                              <div className="font-medium">{repo.repository.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {repo.repository.owner.login}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <Badge variant="secondary" className="text-xs">
                            <div 
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: activity.color }}
                            />
                            {activity.label}
                          </Badge>
                        </td>
                        <td className="text-center py-3">{repoMetrics.prCount}</td>
                        <td className="text-center py-3">{repoMetrics.activeBranches}</td>
                        <td className="text-center py-3">{repoMetrics.contributorCount}</td>
                        <td className="text-center py-3">
                          <span style={getSuccessRateColor(repoMetrics.successRate)}>
                            {repoMetrics.successRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="text-center py-3 text-muted-foreground">
                          {formatTimeAgo(repoMetrics.lastCommitAge)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}