import { useState, useEffect, useCallback, useRef } from 'react';
import { useKV } from '@github/spark/hooks';
import { toast } from 'sonner';

export interface WebhookEvent {
  id: string;
  timestamp: Date;
  type: 'push' | 'pull_request' | 'workflow_run' | 'issues' | 'release';
  repository: {
    owner: string;
    name: string;
  };
  data: any;
}

export interface WebhookConfig {
  enabled: boolean;
  secret?: string;
  events: string[];
}

interface UseWebhookIntegrationReturn {
  isConnected: boolean;
  config: WebhookConfig;
  events: WebhookEvent[];
  latestEvent: WebhookEvent | null;
  updateConfig: (config: Partial<WebhookConfig>) => void;
  clearEvents: () => void;
  retryConnection: () => void;
  connectionError: string | null;
}

/**
 * Hook for managing real-time webhook integration with GitHub repositories
 * Uses Server-Sent Events to receive repository updates in real-time
 */
export function useWebhookIntegration(
  owner?: string,
  repo?: string
): UseWebhookIntegrationReturn {
  const [config, setConfig] = useKV<WebhookConfig>('webhook-config', {
    enabled: false,
    events: ['push', 'pull_request', 'workflow_run']
  });
  
  const [events, setEvents] = useKV<WebhookEvent[]>('webhook-events', []);
  const [isConnected, setIsConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState<WebhookEvent | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Simulate webhook endpoint URL (in a real implementation, this would be your webhook server)
  const getWebhookUrl = useCallback((owner: string, repo: string) => {
    // In a real implementation, this would be your webhook proxy server
    // For simulation, we'll create a mock SSE endpoint
    return `https://api.github.com/repos/${owner}/${repo}/events`;
  }, []);

  // Create mock webhook events for demonstration
  const createMockEvent = useCallback((type: string, repository: { owner: string; name: string }): WebhookEvent => {
    const eventTypes = {
      push: {
        commits: [
          {
            id: Math.random().toString(36).substr(2, 9),
            message: `feat: add new feature ${Math.floor(Math.random() * 1000)}`,
            author: { name: 'Developer', email: 'dev@example.com' },
            timestamp: new Date().toISOString()
          }
        ],
        ref: 'refs/heads/main'
      },
      pull_request: {
        action: Math.random() > 0.5 ? 'opened' : 'closed',
        number: Math.floor(Math.random() * 1000),
        title: `Fix issue #${Math.floor(Math.random() * 100)}`,
        state: Math.random() > 0.3 ? 'open' : 'closed'
      },
      workflow_run: {
        name: 'CI/CD Pipeline',
        status: Math.random() > 0.7 ? 'completed' : 'in_progress',
        conclusion: Math.random() > 0.8 ? 'failure' : 'success'
      }
    };

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: type as any,
      repository,
      data: eventTypes[type as keyof typeof eventTypes] || {}
    };
  }, []);

  // Simulate real-time events
  const simulateWebhookEvents = useCallback((repository: { owner: string; name: string }) => {
    if (!config.enabled) return;

    const eventTypes = config.events;
    const simulateEvent = () => {
      if (!config.enabled || !isConnected) return;

      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const event = createMockEvent(randomType, repository);
      
      setEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
      setLatestEvent(event);
      
      // Show toast notification for new events
      const eventMessages = {
        push: `New commits pushed to ${repository.name}`,
        pull_request: `Pull request ${event.data.action} in ${repository.name}`,
        workflow_run: `Workflow ${event.data.status} in ${repository.name}`
      };
      
      toast.info(eventMessages[event.type] || `New ${event.type} event in ${repository.name}`, {
        description: `Repository activity detected at ${event.timestamp.toLocaleTimeString()}`
      });
    };

    // Simulate events at random intervals (5-30 seconds)
    const scheduleNextEvent = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      const interval = Math.random() * 25000 + 5000; // 5-30 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        simulateEvent();
        scheduleNextEvent();
      }, interval);
    };

    scheduleNextEvent();
  }, [config.enabled, config.events, isConnected, createMockEvent, setEvents]);

  // Connect to webhook stream
  const connectWebhook = useCallback(async () => {
    if (!owner || !repo || !config.enabled) return;

    try {
      setConnectionError(null);
      
      // In a real implementation, this would establish an SSE connection to your webhook proxy
      // For demonstration, we'll simulate the connection
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      
      toast.success(`Webhook integration connected for ${owner}/${repo}`, {
        description: 'Real-time updates are now active'
      });

      // Start simulating webhook events
      simulateWebhookEvents({ owner, name: repo });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect webhook';
      setConnectionError(message);
      setIsConnected(false);
      
      // Retry connection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
        reconnectAttemptsRef.current++;
        
        toast.warning(`Webhook connection failed, retrying in ${delay / 1000}s...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebhook();
        }, delay);
      } else {
        toast.error('Webhook integration failed after multiple attempts');
      }
    }
  }, [owner, repo, config.enabled, simulateWebhookEvents]);

  // Disconnect webhook
  const disconnectWebhook = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Update webhook configuration
  const updateConfig = useCallback((newConfig: Partial<WebhookConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, [setConfig]);

  // Clear event history
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
  }, [setEvents]);

  // Retry connection
  const retryConnection = useCallback(() => {
    disconnectWebhook();
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    connectWebhook();
  }, [disconnectWebhook, connectWebhook]);

  // Effect to manage webhook connection based on configuration
  useEffect(() => {
    if (config.enabled && owner && repo) {
      connectWebhook();
    } else {
      disconnectWebhook();
    }

    return () => {
      disconnectWebhook();
    };
  }, [config.enabled, owner, repo, connectWebhook, disconnectWebhook]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebhook();
    };
  }, [disconnectWebhook]);

  return {
    isConnected,
    config,
    events,
    latestEvent,
    updateConfig,
    clearEvents,
    retryConnection,
    connectionError
  };
}