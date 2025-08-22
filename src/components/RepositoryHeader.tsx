import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, GitFork, AlertCircle, ExternalLink } from '@phosphor-icons/react';
import { Repository } from '@/lib/types';
import { formatTimeAgo } from '@/lib/github';

interface RepositoryHeaderProps {
  repository: Repository;
}

export function RepositoryHeader({ repository }: RepositoryHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={repository.owner.avatar_url} alt={repository.owner.login} />
              <AvatarFallback>{repository.owner.login[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">
                <a 
                  href={repository.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  {repository.full_name}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </CardTitle>
              {repository.description && (
                <p className="text-muted-foreground mt-1">{repository.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full pulse-live"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{repository.stargazers_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="w-4 h-4" />
            <span>{repository.forks_count.toLocaleString()}</span>
          </div>
          {repository.open_issues_count > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>{repository.open_issues_count} open issues</span>
            </div>
          )}
          <Badge variant="secondary" className="text-xs">
            {repository.default_branch}
          </Badge>
          <span>Updated {formatTimeAgo(repository.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}