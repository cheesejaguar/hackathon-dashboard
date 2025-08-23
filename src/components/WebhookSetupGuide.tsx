import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Info, 
  ExternalLink, 
  Copy, 
  Settings, 
  Webhook,
  CheckCircle,
  AlertTriangle
} from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface WebhookSetupGuideProps {
  repositoryUrl?: string;
  isAuthenticated: boolean;
}

export function WebhookSetupGuide({ repositoryUrl, isAuthenticated }: WebhookSetupGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // In a real implementation, this would be your actual webhook endpoint
  const webhookUrl = `https://your-webhook-proxy.com/github/webhook`;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const steps = [
    {
      title: "Go to Repository Settings",
      description: "Navigate to your repository on GitHub and click on 'Settings'",
      action: repositoryUrl ? (
        <Button variant="outline" size="sm" asChild>
          <a href={`${repositoryUrl}/settings`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" />
            Open Settings
          </a>
        </Button>
      ) : null
    },
    {
      title: "Access Webhooks",
      description: "In the left sidebar, click on 'Webhooks' then 'Add webhook'",
      action: null
    },
    {
      title: "Configure Webhook URL",
      description: "Enter the webhook endpoint URL that will receive the events",
      action: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
            <span className="flex-1 break-all">{webhookUrl}</span>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(webhookUrl)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Note: In a production setup, this would be your actual webhook endpoint
          </p>
        </div>
      )
    },
    {
      title: "Select Content Type",
      description: "Choose 'application/json' as the content type",
      action: (
        <Badge variant="outline">application/json</Badge>
      )
    },
    {
      title: "Choose Events",
      description: "Select which events you want to receive:",
      action: (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-sm">Pushes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-sm">Pull requests</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-sm">Workflow runs</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-sm">Issues</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-sm">Releases</span>
          </div>
        </div>
      )
    },
    {
      title: "Add Webhook",
      description: "Click 'Add webhook' to save your configuration",
      action: null
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="w-4 h-4 mr-2" />
          Setup Guide
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Webhook Setup Guide
          </DialogTitle>
          <DialogDescription>
            Follow these steps to set up real-time webhook integration with your GitHub repository
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isAuthenticated && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                While you can set up webhooks without authentication, some repository settings may require admin access.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.action && (
                      <div className="mt-2">{step.action}</div>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && <Separator />}
              </div>
            ))}
          </div>
          
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Note:</strong> This demo uses simulated webhook events. In a production environment, 
              you would need to deploy a webhook endpoint server to receive and forward GitHub events to your dashboard.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="font-medium">Testing Your Webhook</h4>
            <p className="text-sm text-muted-foreground">
              After setting up the webhook, make a test commit or create a pull request to verify that events are being received.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setIsOpen(false)}>
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}