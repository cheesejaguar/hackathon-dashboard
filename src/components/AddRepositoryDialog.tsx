import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, GitBranch } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface AddRepositoryDialogProps {
  onAddRepository: (owner: string, repo: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export function AddRepositoryDialog({ onAddRepository, trigger }: AddRepositoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!owner.trim() || !repo.trim()) {
      toast.error('Please enter both owner and repository name');
      return;
    }

    setIsLoading(true);
    try {
      await onAddRepository(owner.trim(), repo.trim());
      setOwner('');
      setRepo('');
      setOpen(false);
      toast.success(`Added ${owner}/${repo} to comparison`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add repository');
    } finally {
      setIsLoading(false);
    }
  };

  const parseRepositoryUrl = (url: string) => {
    // Handle GitHub URLs like https://github.com/owner/repo
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      setOwner(match[1]);
      setRepo(match[2].replace(/\.git$/, ''));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Repository
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Add Repository to Comparison
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repository-url">Repository URL (optional)</Label>
            <Input
              id="repository-url"
              placeholder="https://github.com/owner/repository"
              onChange={(e) => parseRepositoryUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste a GitHub URL to auto-fill the fields below
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                placeholder="microsoft"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo">Repository</Label>
              <Input
                id="repo"
                placeholder="vscode"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Repository'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}