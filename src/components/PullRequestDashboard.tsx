import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitPullRequest, ExternalLink, Clock, GitBranch, MagnifyingGlass, CaretLeft, CaretRight, X, Funnel } from '@phosphor-icons/react';
import { PullRequest } from '@/lib/types';
import { formatTimeAgo } from '@/lib/github';
import { useChartColors } from '@/hooks/useChartColors';
import { useTheme } from '@/hooks/useTheme';

interface PullRequestDashboardProps {
  pullRequests: PullRequest[];
  isLoading: boolean;
}

type PRFilter = 'all' | 'ready' | 'draft' | 'blocked';

// Memoized PR item for performance
const PullRequestItem = memo(function PullRequestItem({
  pr,
  statusColors,
}: {
  pr: PullRequest;
  statusColors: ReturnType<typeof useChartColors>['statusColors'];
}) {
  const getStateColor = (state: string, draft: boolean, mergeableState: string) => {
    if (draft) return { color: statusColors.cancelled };
    if (state === 'open') {
      if (mergeableState === 'blocked') return { color: statusColors.failure };
      if (mergeableState === 'clean') return { color: statusColors.success };
      return { color: statusColors.pending };
    }
    return { color: statusColors.cancelled };
  };

  const getStateLabel = (state: string, draft: boolean, mergeableState: string) => {
    if (draft) return 'Draft';
    if (state === 'open') {
      if (mergeableState === 'blocked') return 'Blocked';
      if (mergeableState === 'clean') return 'Ready';
      if (mergeableState === 'unstable') return 'Checks';
      return 'Open';
    }
    return state;
  };

  return (
    <div
      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
      role="listitem"
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={pr.user.avatar_url} alt={pr.user.login} />
          <AvatarFallback>{pr.user.login[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm leading-relaxed mb-1">
                <a
                  href={pr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                  aria-label={`Pull request: ${pr.title}`}
                >
                  {pr.title}
                </a>
              </h4>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>#{pr.number}</span>
                <span>by {pr.user.login}</span>
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>{formatTimeAgo(pr.created_at)}</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <GitBranch className="w-3 h-3" aria-hidden="true" />
                <span className="font-mono">{pr.head.ref}</span>
                <span aria-hidden="true">→</span>
                <span className="font-mono">{pr.base.ref}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                style={getStateColor(pr.state, pr.draft, pr.mergeable_state)}
              >
                {getStateLabel(pr.state, pr.draft, pr.mergeable_state)}
              </Badge>
              <a
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Open PR #${pr.number} on GitHub`}
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {pr.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2" role="list" aria-label="Labels">
              {pr.labels.slice(0, 3).map((label) => (
                <Badge
                  key={label.name}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: `#${label.color}`,
                    color: `#${label.color}`
                  }}
                  role="listitem"
                >
                  {label.name}
                </Badge>
              ))}
              {pr.labels.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{pr.labels.length - 3}
                </Badge>
              )}
            </div>
          )}

          {pr.requested_reviewers.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Reviewers:</span>
              <div className="flex -space-x-1" role="list" aria-label="Requested reviewers">
                {pr.requested_reviewers.slice(0, 3).map((reviewer) => (
                  <Avatar key={reviewer.login} className="w-5 h-5 border-2 border-background" role="listitem">
                    <AvatarImage src={reviewer.avatar_url} alt={reviewer.login} />
                    <AvatarFallback className="text-xs">
                      {reviewer.login[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Loading skeleton for PRs
const PRSkeleton = memo(function PRSkeleton() {
  return (
    <div className="p-4 rounded-lg border animate-pulse" role="status" aria-label="Loading pull request">
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
});

export const PullRequestDashboard = memo(function PullRequestDashboard({
  pullRequests,
  isLoading
}: PullRequestDashboardProps) {
  const { statusColors } = useChartColors();
  const { theme } = useTheme();
  const [recentActivity, setRecentActivity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PRFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Detect recent PR activity for visual effects
  useEffect(() => {
    const hasRecentActivity = pullRequests.some(pr =>
      new Date(pr.updated_at) > new Date(Date.now() - 5 * 60 * 1000)
    );

    if (hasRecentActivity) {
      setRecentActivity(true);
      const timer = setTimeout(() => setRecentActivity(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pullRequests]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filter PRs based on search and status
  const filteredPRs = useMemo(() => {
    let filtered = pullRequests;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pr => {
        if (statusFilter === 'draft') return pr.draft;
        if (statusFilter === 'ready') return !pr.draft && pr.mergeable_state === 'clean';
        if (statusFilter === 'blocked') return pr.mergeable_state === 'blocked';
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pr =>
        pr.title.toLowerCase().includes(query) ||
        pr.user.login.toLowerCase().includes(query) ||
        pr.head.ref.toLowerCase().includes(query) ||
        pr.number.toString().includes(query) ||
        pr.labels.some(label => label.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [pullRequests, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPRs.length / itemsPerPage);
  const paginatedPRs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPRs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPRs, currentPage, itemsPerPage]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" aria-hidden="true" />
            Pull Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" role="status" aria-label="Loading pull requests">
            {Array.from({ length: 3 }).map((_, i) => (
              <PRSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${theme === 'vibes' && recentActivity ? 'animate-pulse glow-effect' : ''}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${theme === 'vibes' ? 'animate-neon' : ''}`}>
          <GitPullRequest className="w-5 h-5" aria-hidden="true" />
          Pull Requests
          <Badge variant="secondary" className="ml-auto">
            {filteredPRs.length}
            {(searchQuery || statusFilter !== 'all') && ` / ${pullRequests.length}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and filter controls */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search PRs by title, author, or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Search pull requests"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PRFilter)}>
            <SelectTrigger className="w-32" aria-label="Filter by status">
              <Funnel className="w-4 h-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredPRs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" role="status">
            <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
            {searchQuery || statusFilter !== 'all' ? (
              <p>No pull requests match your filters</p>
            ) : (
              <p>No open pull requests</p>
            )}
          </div>
        ) : (
          <>
            <ScrollArea className="h-[350px]">
              <div className="space-y-4" role="list" aria-label="Pull request list">
                {paginatedPRs.map((pr) => (
                  <PullRequestItem key={pr.id} pr={pr} statusColors={statusColors} />
                ))}
              </div>
            </ScrollArea>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <CaretLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                  Prev
                </Button>
                <span className="text-sm text-muted-foreground" aria-live="polite">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next
                  <CaretRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});
