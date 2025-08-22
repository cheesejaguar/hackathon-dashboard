import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitPullRequest, ExternalLink, Clock, GitBranch } from '@phosphor-icons/react';
import { PullRequest } from '@/lib/types';
import { formatTimeAgo } from '@/lib/github';

interface PullRequestDashboardProps {
  pullRequests: PullRequest[];
  isLoading: boolean;
}

export function PullRequestDashboard({ pullRequests, isLoading }: PullRequestDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" />
            Pull Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStateColor = (state: string, draft: boolean, mergeableState: string) => {
    if (draft) return 'text-gray-500';
    if (state === 'open') {
      if (mergeableState === 'blocked') return 'text-red-500';
      if (mergeableState === 'clean') return 'text-green-500';
      return 'text-blue-500';
    }
    return 'text-gray-500';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitPullRequest className="w-5 h-5" />
          Pull Requests
          <Badge variant="secondary" className="ml-auto">
            {pullRequests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pullRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No open pull requests</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {pullRequests.map((pr) => (
                <div key={pr.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
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
                            >
                              {pr.title}
                            </a>
                          </h4>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span>#{pr.number}</span>
                            <span>by {pr.user.login}</span>
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(pr.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <GitBranch className="w-3 h-3" />
                            <span className="font-mono">{pr.head.ref}</span>
                            <span>→</span>
                            <span className="font-mono">{pr.base.ref}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getStateColor(pr.state, pr.draft, pr.mergeable_state)}
                          >
                            {getStateLabel(pr.state, pr.draft, pr.mergeable_state)}
                          </Badge>
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      
                      {pr.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pr.labels.slice(0, 3).map((label) => (
                            <Badge 
                              key={label.name} 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: `#${label.color}`, 
                                color: `#${label.color}` 
                              }}
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
                          <div className="flex -space-x-1">
                            {pr.requested_reviewers.slice(0, 3).map((reviewer) => (
                              <Avatar key={reviewer.login} className="w-5 h-5 border-2 border-background">
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
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}