import { useState, useEffect, useCallback } from 'react';
import { useKV } from '@github/spark/hooks';
import { toast } from 'sonner';
import { WebhookEvent } from '@/hooks/useWebhookIntegration';

interface UseRealtimeUpdatesProps {
  owner?: string;
  repo?: string;
  isWebhookEnabled: boolean;
  webhookEvents: WebhookEvent[];
  latestEvent: WebhookEvent | null;
}

interface UseRealtimeUpdatesReturn {
  shouldRefreshCommits: boolean;
  shouldRefreshPRs: boolean;
  shouldRefreshWorkflows: boolean;
  shouldRefreshBranches: boolean;
  shouldRefreshContributors: boolean;
  markDataRefreshed: (dataType: string) => void;
  getEventsSinceLastRefresh: (dataType: string) => WebhookEvent[];
}

/**
 * Hook to manage real-time data updates based on webhook events
 * Determines when different data types need refreshing based on received events
 */
export function useRealtimeUpdates({
  owner,
  repo,
  isWebhookEnabled,
  webhookEvents,
  latestEvent
}: UseRealtimeUpdatesProps): UseRealtimeUpdatesReturn {
  const [lastRefreshTimes, setLastRefreshTimes] = useKV<Record<string, number>>('last-refresh-times', {});
  
  const [refreshFlags, setRefreshFlags] = useState({
    commits: false,
    pullRequests: false,
    workflows: false,
    branches: false,
    contributors: false
  });

  // Get current repository key for scoped refresh tracking
  const repoKey = owner && repo ? `${owner}/${repo}` : null;

  // Determine which data types need refreshing based on event types
  const getDataTypesForEvent = useCallback((eventType: string): string[] => {
    switch (eventType) {
      case 'push':
        return ['commits', 'branches', 'contributors'];
      case 'pull_request':
        return ['pullRequests', 'contributors'];
      case 'workflow_run':
        return ['workflows'];
      case 'release':
        return ['commits', 'contributors'];
      case 'issues':
        return []; // Issues don't affect the data we track
      default:
        return [];
    }
  }, []);

  // Get events since last refresh for a specific data type
  const getEventsSinceLastRefresh = useCallback((dataType: string): WebhookEvent[] => {
    if (!repoKey) return [];
    
    const lastRefreshKey = `${repoKey}:${dataType}`;
    const lastRefreshTime = lastRefreshTimes[lastRefreshKey] || 0;
    
    return webhookEvents.filter(event => {
      const eventTime = event.timestamp.getTime();
      const affectedDataTypes = getDataTypesForEvent(event.type);
      return eventTime > lastRefreshTime && affectedDataTypes.includes(dataType);
    });
  }, [repoKey, lastRefreshTimes, webhookEvents, getDataTypesForEvent]);

  // Mark data as refreshed and update the last refresh time
  const markDataRefreshed = useCallback((dataType: string) => {
    if (!repoKey) return;
    
    const now = Date.now();
    const refreshKey = `${repoKey}:${dataType}`;
    
    setLastRefreshTimes(prev => ({
      ...prev,
      [refreshKey]: now
    }));
    
    setRefreshFlags(prev => ({
      ...prev,
      [dataType]: false
    }));
  }, [repoKey, setLastRefreshTimes]);

  // Update refresh flags when new events are received
  useEffect(() => {
    if (!isWebhookEnabled || !latestEvent || !repoKey) return;

    const affectedDataTypes = getDataTypesForEvent(latestEvent.type);
    
    if (affectedDataTypes.length > 0) {
      setRefreshFlags(prev => {
        const newFlags = { ...prev };
        affectedDataTypes.forEach(dataType => {
          newFlags[dataType as keyof typeof newFlags] = true;
        });
        return newFlags;
      });

      // Show notification about what needs updating
      const dataTypeNames = {
        commits: 'commits',
        pullRequests: 'pull requests',
        workflows: 'workflows',
        branches: 'branches',
        contributors: 'contributors'
      };

      const affectedNames = affectedDataTypes
        .map(type => dataTypeNames[type as keyof typeof dataTypeNames])
        .filter(Boolean);

      if (affectedNames.length > 0) {
        toast.info(`Repository data updated`, {
          description: `${affectedNames.join(', ')} will be refreshed automatically`
        });
      }
    }
  }, [latestEvent, isWebhookEnabled, repoKey, getDataTypesForEvent]);

  // Auto-refresh data when repository changes
  useEffect(() => {
    if (repoKey) {
      // Reset all refresh flags when switching repositories
      setRefreshFlags({
        commits: false,
        pullRequests: false,
        workflows: false,
        branches: false,
        contributors: false
      });
    }
  }, [repoKey]);

  return {
    shouldRefreshCommits: refreshFlags.commits,
    shouldRefreshPRs: refreshFlags.pullRequests,
    shouldRefreshWorkflows: refreshFlags.workflows,
    shouldRefreshBranches: refreshFlags.branches,
    shouldRefreshContributors: refreshFlags.contributors,
    markDataRefreshed,
    getEventsSinceLastRefresh
  };
}