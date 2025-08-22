import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Key, ExternalLink, Settings, CheckCircle, XCircle } from '@phosphor-icons/react';

interface ApiSetupProps {
  isAuthenticated: boolean;
  userLogin?: string;
  onLogin: (token: string) => Promise<void>;
  onLogout: () => void;
  isLoading: boolean;
  error: string | null;
}

export function ApiSetup({ 
  isAuthenticated, 
  userLogin, 
  onLogin, 
  onLogout, 
  isLoading, 
  error 
}: ApiSetupProps) {
  const [token, setToken] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    
    await onLogin(token.trim());
    setToken('');
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  const openGitHubTokenPage = () => {
    window.open('https://github.com/settings/tokens/new?scopes=repo,user:email&description=GitHub%20Repository%20Dashboard', '_blank');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          API Setup
          {isAuthenticated ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            <h3 className="font-semibold">GitHub API Setup</h3>
          </div>
          
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Connected</p>
                  <p className="text-xs text-green-600">Logged in as {userLogin}</p>
                </div>
              </div>
              
              <Separator />
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full"
              >
                Disconnect GitHub
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to access private repositories and get higher rate limits.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dropdown-token" className="text-sm">Personal Access Token</Label>
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
                    id="dropdown-token"
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
                    size="sm"
                  >
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </Button>
                </form>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Required permissions:</strong></p>
                <ul className="space-y-0.5 ml-2">
                  <li>• <code className="text-xs">repo</code> - Access to repository data</li>
                  <li>• <code className="text-xs">user:email</code> - Access to user profile</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}