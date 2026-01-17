import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { GitCommit, ExternalLink, MagnifyingGlass, CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { Commit } from '@/lib/types';
import { formatTimeAgo } from '@/lib/github';
import { useTheme } from '@/hooks/useTheme';

interface CommitFlowProps {
  commits: Commit[];
  isLoading: boolean;
  owner?: string;
  repo?: string;
}

// Memoized commit item for performance
const CommitItem = memo(function CommitItem({ commit }: { commit: Commit }) {
  return (
    <div
      className="flex items-start gap-3 pb-4 border-b border-border last:border-0"
      role="listitem"
    >
      <Avatar className="w-8 h-8">
        <AvatarImage
          src={commit.author?.avatar_url}
          alt={commit.author?.login || commit.commit.author.name}
        />
        <AvatarFallback>
          {(commit.author?.login || commit.commit.author.name)[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-relaxed">
            {commit.commit.message.split('\n')[0]}
          </p>
          <a
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label={`View commit ${commit.sha.substring(0, 7)} on GitHub`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="font-mono" aria-label={`Commit hash ${commit.sha.substring(0, 7)}`}>
            {commit.sha.substring(0, 7)}
          </span>
          <span>by {commit.author?.login || commit.commit.author.name}</span>
          <span>{formatTimeAgo(commit.commit.author.date)}</span>
        </div>

        {commit.commit.message.includes('\n') && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {commit.commit.message.split('\n').slice(1).join('\n').trim()}
          </p>
        )}
      </div>
    </div>
  );
});

// Loading skeleton for commits
const CommitSkeleton = memo(function CommitSkeleton() {
  return (
    <div className="flex items-start gap-3 animate-pulse" role="status" aria-label="Loading commit">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
});

export const CommitFlow = memo(function CommitFlow({ commits, isLoading, owner, repo }: CommitFlowProps) {
  const { theme } = useTheme();
  const [recentActivity, setRecentActivity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detect recent commits (within last 5 minutes) for visual effects
  useEffect(() => {
    const hasRecentCommits = commits.some(commit =>
      new Date(commit.commit.author.date) > new Date(Date.now() - 5 * 60 * 1000)
    );

    if (hasRecentCommits) {
      setRecentActivity(true);
      const timer = setTimeout(() => setRecentActivity(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [commits]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter commits based on search query
  const filteredCommits = useMemo(() => {
    if (!searchQuery.trim()) return commits;

    const query = searchQuery.toLowerCase();
    return commits.filter(commit =>
      commit.commit.message.toLowerCase().includes(query) ||
      commit.sha.toLowerCase().includes(query) ||
      commit.author?.login?.toLowerCase().includes(query) ||
      commit.commit.author.name.toLowerCase().includes(query)
    );
  }, [commits, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredCommits.length / itemsPerPage);
  const paginatedCommits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCommits.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCommits, currentPage, itemsPerPage]);

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
            <GitCommit className="w-5 h-5" aria-hidden="true" />
            Recent Commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" role="status" aria-label="Loading commits">
            {Array.from({ length: 5 }).map((_, i) => (
              <CommitSkeleton key={i} />
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
          <GitCommit className="w-5 h-5" aria-hidden="true" />
          Recent Commits
          <Badge variant="secondary" className="ml-auto">
            {filteredCommits.length}
            {searchQuery && ` / ${commits.length}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search input */}
        <div className="relative mb-4">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search commits by message, author, or SHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
            aria-label="Search commits"
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

        {filteredCommits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" role="status">
            <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
            {searchQuery ? (
              <p>No commits match your search</p>
            ) : (
              <p>No commits found</p>
            )}
          </div>
        ) : (
          <>
            <ScrollArea className="h-[350px]">
              <div className="space-y-4" role="list" aria-label="Commit list">
                {paginatedCommits.map((commit) => (
                  <CommitItem key={commit.sha} commit={commit} />
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
