import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, ExternalLink, Clock, GitBranch } from '@phosphor-icons/react';
import { WorkflowRun } from '@/lib/types';
import { formatTimeAgo, getStatusColor, getStatusIcon } from '@/lib/github';

interface ActionStatusProps {
  workflowRuns: WorkflowRun[];
  isLoading: boolean;
}

export function ActionStatus({ workflowRuns, isLoading }: ActionStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            CI/CD Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                  <div className="w-16 h-6 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRunDuration = (run: WorkflowRun) => {
    const start = new Date(run.created_at);
    const end = new Date(run.updated_at);
    const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`;
    return `${Math.floor(diffInSeconds / 3600)}h ${Math.floor((diffInSeconds % 3600) / 60)}m`;
  };

  const getRunStatusBadge = (run: WorkflowRun) => {
    const color = getStatusColor(run.status, run.conclusion);
    const icon = getStatusIcon(run.status, run.conclusion);
    
    let label = run.status;
    if (run.status === 'completed' && run.conclusion) {
      label = run.conclusion;
    }
    
    return (
      <Badge variant="outline" className={`${color} border-current`}>
        <span className="mr-1">{icon}</span>
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          CI/CD Status
          <Badge variant="secondary" className="ml-auto">
            {workflowRuns.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {workflowRuns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No workflow runs found</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {workflowRuns.map((run) => (
                <div 
                  key={run.id} 
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm truncate">
                          <a
                            href={run.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {run.name}
                          </a>
                        </h4>
                        <a
                          href={run.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <GitBranch className="w-3 h-3" />
                        <span className="font-mono">{run.head_branch}</span>
                        <span className="font-mono">{run.head_sha.substring(0, 7)}</span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {run.head_commit.message}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(run.created_at)}</span>
                        </div>
                        {run.status === 'completed' && (
                          <span>Duration: {getRunDuration(run)}</span>
                        )}
                        <span>by {run.head_commit.author.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {getRunStatusBadge(run)}
                      {run.status === 'in_progress' && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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