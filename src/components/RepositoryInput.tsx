import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, Search, AlertCircle } from '@phosphor-icons/react';
import { parseRepoInput } from '@/lib/github';

interface RepositoryInputProps {
  onRepositorySelect: (owner: string, repo: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function RepositoryInput({ onRepositorySelect, isLoading, error }: RepositoryInputProps) {
  const [input, setInput] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsed = parseRepoInput(input);
    if (!parsed) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
    onRepositorySelect(parsed.owner, parsed.repo);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!isValid && value.trim()) {
      setIsValid(true);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GitBranch className="w-6 h-6 text-primary" />
          <CardTitle className="text-2xl font-bold">GitHub Repository Dashboard</CardTitle>
        </div>
        <CardDescription>
          Monitor live commit flow, branches, pull requests, and CI/CD status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="repository-input" className="text-sm font-medium">
              Repository
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="repository-input"
                type="text"
                placeholder="owner/repository (e.g., facebook/react)"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`pl-10 ${!isValid ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {!isValid && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                Please enter a valid repository format (owner/repository)
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Monitor Repository
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-xs text-muted-foreground text-center">
          <p>Supports any public GitHub repository</p>
          <p className="mt-1">Format: owner/repository or full GitHub URL</p>
        </div>
      </CardContent>
    </Card>
  );
}