import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GitBranch, Key, ExternalLink } from '@phosphor-icons/react';

interface GitHubLoginProps {
  onLogin: (token: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function GitHubLogin({ onLogin, isLoading, error }: GitHubLoginProps) {
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    
    await onLogin(token.trim());
  };

  const openGitHubTokenPage = () => {
    window.open('https://github.com/settings/tokens/new?scopes=repo,user:email&description=GitHub%20Repository%20Dashboard', '_blank');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <GitBranch className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">GitHub Repository Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your repositories with live commit flow, branches, pull requests, and actions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Connect with GitHub
          </CardTitle>
          <CardDescription>
            Sign in with your GitHub personal access token to access your repositories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="token">Personal Access Token</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={openGitHubTokenPage}
                className="h-auto p-0 text-xs"
              >
                Create token <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                id="token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                className="font-mono text-sm"
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!token.trim() || isLoading}
              >
                {isLoading ? 'Connecting...' : 'Connect to GitHub'}
              </Button>
            </form>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Required permissions:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• <code>repo</code> - Access to repository data</li>
              <li>• <code>user:email</code> - Access to user profile</li>
            </ul>
            <p className="mt-2">
              Your token is stored securely in your browser and never shared.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}