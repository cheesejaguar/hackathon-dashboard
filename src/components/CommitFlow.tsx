import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitCommit, ExternalLink } from '@phosphor-icons/react';
import { Commit } from '@/lib/types';
import { formatTimeAgo } from '@/lib/github';
import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';

interface CommitFlowProps {
  commits: Commit[];
  isLoading: boolean;
}

export function CommitFlow({ commits, isLoading }: CommitFlowProps) {
  const { theme } = useTheme();
  const [recentActivity, setRecentActivity] = useState(false);

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
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="w-5 h-5" />
            Recent Commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
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
          <GitCommit className="w-5 h-5" />
          Recent Commits
          <Badge variant="secondary" className="ml-auto">
            {commits.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {commits.map((commit) => (
              <div key={commit.sha} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
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
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">{commit.sha.substring(0, 7)}</span>
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
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}