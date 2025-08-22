import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  GitBranch, 
  Star, 
  GitFork, 
  Clock, 
  Lock,
  Globe,
  LogOut
} from '@phosphor-icons/react';
import { formatTimeAgo } from '@/lib/github';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface User {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
}

interface RepositorySelectionProps {
  user: User;
  token: string;
  onRepositorySelect: (owner: string, repo: string) => void;
  onLogout: () => void;
}

export function RepositorySelection({ user, token, onRepositorySelect, onLogout }: RepositorySelectionProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRepositories();
  }, [token]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRepos(repositories);
    } else {
      const filtered = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.language?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRepos(filtered);
    }
  }, [searchQuery, repositories]);

  const fetchRepositories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const data = await response.json();
      setRepositories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load repositories';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepositoryClick = (repo: Repository) => {
    onRepositorySelect(repo.owner.login, repo.name);
  };

  const getLanguageColor = (language: string | null): string => {
    const colors: Record<string, string> = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-blue-600',
      'Java': 'bg-orange-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-600',
      'C++': 'bg-pink-500',
      'C#': 'bg-purple-500',
      'Ruby': 'bg-red-500',
      'PHP': 'bg-indigo-500',
      'Swift': 'bg-orange-400',
      'Kotlin': 'bg-purple-600',
    };
    return colors[language || ''] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="w-32 h-5 mb-1" />
              <Skeleton className="w-24 h-4" />
            </div>
          </div>
          <Skeleton className="w-20 h-9" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-64 h-4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="w-full h-10" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-20" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* User header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar_url} alt={user.name} />
            <AvatarFallback>{user.login[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">@{user.login}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Select Repository
          </CardTitle>
          <CardDescription>
            Choose a repository to monitor its activity and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Repository list */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredRepos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No repositories found matching your search.' : 'No repositories found.'}
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => handleRepositoryClick(repo)}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{repo.name}</h3>
                          <div className="flex items-center gap-1">
                            {repo.private ? (
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <Globe className="w-3 h-3 text-muted-foreground" />
                            )}
                            {repo.fork && <GitFork className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        </div>
                        
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {repo.language && (
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language)}`} />
                              {repo.language}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {repo.stargazers_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="w-3 h-3" />
                            {repo.forks_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(repo.updated_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}