import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitBranch, Shield } from '@phosphor-icons/react';
import { Branch } from '@/lib/types';

interface BranchMonitorProps {
  branches: Branch[];
  defaultBranch: string;
  isLoading: boolean;
}

export function BranchMonitor({ branches, defaultBranch, isLoading }: BranchMonitorProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Active Branches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="w-16 h-6 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedBranches = [...branches].sort((a, b) => {
    if (a.name === defaultBranch) return -1;
    if (b.name === defaultBranch) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Active Branches
          <Badge variant="secondary" className="ml-auto">
            {branches.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {sortedBranches.map((branch) => (
              <div 
                key={branch.name} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <GitBranch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{branch.name}</span>
                      {branch.name === defaultBranch && (
                        <Badge variant="default" className="text-xs">
                          default
                        </Badge>
                      )}
                      {branch.protected && (
                        <Shield className="w-3 h-3 text-accent" title="Protected branch" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {branch.commit.sha.substring(0, 7)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}