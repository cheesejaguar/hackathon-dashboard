import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Webhook, 
  Activity, 
  Zap, 
  Settings, 
  Trash2, 
  RefreshCw, 
  Clock, 
  GitBranch, 
  GitPullRequest, 
  Play,
  AlertCircle,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react';
import { useState } from 'react';
import { WebhookEvent, WebhookConfig } from '@/hooks/useWebhookIntegration';
import { WebhookSetupGuide } from './WebhookSetupGuide';

interface WebhookPanelProps {
  isConnected: boolean;
  config: WebhookConfig;
  events: WebhookEvent[];
  latestEvent: WebhookEvent | null;
  connectionError: string | null;
  repositoryUrl?: string;
  isAuthenticated?: boolean;
  onConfigUpdate: (config: Partial<WebhookConfig>) => void;
  onClearEvents: () => void;
  onRetryConnection: () => void;
}

export function WebhookPanel({
  isConnected,
  config,
  events,
  latestEvent,
  connectionError,
  repositoryUrl,
  isAuthenticated,
  onConfigUpdate,
  onClearEvents,
  onRetryConnection
}: WebhookPanelProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'push':
        return <GitBranch className="w-4 h-4" />;
      case 'pull_request':
        return <GitPullRequest className="w-4 h-4" />;
      case 'workflow_run':
        return <Play className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEventStatusColor = (event: WebhookEvent) => {
    if (event.type === 'workflow_run') {
      if (event.data.conclusion === 'failure') return 'destructive';
      if (event.data.conclusion === 'success') return 'default';
      return 'secondary';
    }
    if (event.type === 'pull_request' && event.data.action === 'closed') {
      return 'outline';
    }
    return 'default';
  };

  const formatEventTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getEventDescription = (event: WebhookEvent) => {
    switch (event.type) {
      case 'push':
        return `${event.data.commits?.length || 0} commits to ${event.data.ref?.replace('refs/heads/', '') || 'main'}`;
      case 'pull_request':
        return `PR #${event.data.number} ${event.data.action}: ${event.data.title}`;
      case 'workflow_run':
        return `${event.data.name} ${event.data.status} (${event.data.conclusion || 'pending'})`;
      default:
        return 'Repository activity';
    }
  };

  const handleConfigSave = () => {
    onConfigUpdate(tempConfig);
    setIsConfigOpen(false);
  };

  const handleEventTypeToggle = (eventType: string, checked: boolean) => {
    setTempConfig(prev => ({
      ...prev,
      events: checked 
        ? [...prev.events, eventType]
        : prev.events.filter(e => e !== eventType)
    }));
  };

  return (
    <Card className={`w-full ${isConnected ? 'webhook-connected' : ''} webhook-panel`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            <CardTitle>Real-time Updates</CardTitle>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </Badge>
              ) : connectionError ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Error
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onConfigUpdate({ enabled })}
            />
            
            <WebhookSetupGuide 
              repositoryUrl={repositoryUrl}
              isAuthenticated={isAuthenticated}
            />
            
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Webhook Configuration</DialogTitle>
                  <DialogDescription>
                    Configure real-time webhook integration settings
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
                    <Input
                      id="webhook-secret"
                      type="password"
                      placeholder="Enter webhook secret for verification"
                      value={tempConfig.secret || ''}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, secret: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Event Types</Label>
                    <div className="space-y-2">
                      {[
                        { id: 'push', label: 'Push Events', description: 'New commits and branches' },
                        { id: 'pull_request', label: 'Pull Requests', description: 'PR opens, closes, merges' },
                        { id: 'workflow_run', label: 'Workflow Runs', description: 'CI/CD pipeline status' },
                        { id: 'issues', label: 'Issues', description: 'Issue creation and updates' },
                        { id: 'release', label: 'Releases', description: 'New releases and tags' }
                      ].map(eventType => (
                        <div key={eventType.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={eventType.id}
                            checked={tempConfig.events.includes(eventType.id)}
                            onCheckedChange={(checked) => handleEventTypeToggle(eventType.id, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={eventType.id} className="text-sm font-medium">
                              {eventType.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{eventType.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfigSave}>
                    Save Configuration
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <CardDescription>
          {config.enabled ? (
            <>
              Monitoring repository events in real-time
              {latestEvent && (
                <span className="block text-xs mt-1">
                  Last event: {formatEventTime(latestEvent.timestamp)}
                </span>
              )}
            </>
          ) : (
            'Enable to receive instant repository updates'
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {config.enabled && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full webhook-status-active ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Live connection active' : 'Connection inactive'}
              </span>
            </div>
            
            {connectionError && (
              <Button variant="outline" size="sm" onClick={onRetryConnection}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
        
        {connectionError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Connection Error</span>
            </div>
            <p className="text-xs text-destructive/80 mt-1">{connectionError}</p>
          </div>
        )}

        {/* Latest Event */}
        {latestEvent && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Latest Event
                </h4>
                <Badge variant={getEventStatusColor(latestEvent)}>
                  {latestEvent.type.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="p-3 rounded-lg border bg-card/50">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getEventIcon(latestEvent.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getEventDescription(latestEvent)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatEventTime(latestEvent.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
          </>
        )}

        {/* Event History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Recent Events</h4>
            {events.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearEvents}>
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          {events.length > 0 ? (
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {events.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded border webhook-event">
                    <div className="flex-shrink-0">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {getEventDescription(event)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatEventTime(event.timestamp)}
                      </p>
                    </div>
                    <Badge variant={getEventStatusColor(event)} className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events received yet</p>
              {config.enabled && (
                <p className="text-xs mt-1">Waiting for repository activity...</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}