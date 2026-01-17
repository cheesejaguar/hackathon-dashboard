import { useState, useEffect, memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lightning, Warning } from '@phosphor-icons/react';
import { githubAPI, RateLimitInfo } from '@/lib/github';

interface RateLimitIndicatorProps {
  className?: string;
}

export const RateLimitIndicator = memo(function RateLimitIndicator({ className = '' }: RateLimitIndicatorProps) {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    githubAPI.getRateLimitInfo()
  );

  useEffect(() => {
    // Subscribe to rate limit changes
    const unsubscribe = githubAPI.onRateLimitChange((info) => {
      setRateLimitInfo(info);
    });

    return unsubscribe;
  }, []);

  if (!rateLimitInfo) {
    return null;
  }

  const percentUsed = Math.round((rateLimitInfo.used / rateLimitInfo.limit) * 100);
  const percentRemaining = 100 - percentUsed;
  const isLow = rateLimitInfo.remaining < rateLimitInfo.limit * 0.2;
  const isCritical = rateLimitInfo.remaining < rateLimitInfo.limit * 0.05;

  const getStatusColor = () => {
    if (isCritical) return 'text-red-500';
    if (isLow) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isLow) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatResetTime = (resetDate: Date) => {
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();

    if (diffMs <= 0) return 'now';

    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 cursor-help ${className}`}
            role="status"
            aria-label={`API rate limit: ${rateLimitInfo.remaining} of ${rateLimitInfo.limit} requests remaining`}
          >
            {isCritical ? (
              <Warning className={`w-4 h-4 ${getStatusColor()} animate-pulse`} aria-hidden="true" />
            ) : (
              <Lightning className={`w-4 h-4 ${getStatusColor()}`} aria-hidden="true" />
            )}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${getStatusColor()}`}>
                {rateLimitInfo.remaining}
              </span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${percentRemaining}%` }}
                />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="font-medium">GitHub API Rate Limit</div>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className={getStatusColor()}>{rateLimitInfo.remaining} / {rateLimitInfo.limit}</span>
              </div>
              <div className="flex justify-between">
                <span>Used:</span>
                <span>{rateLimitInfo.used} ({percentUsed}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Resets in:</span>
                <span>{formatResetTime(rateLimitInfo.reset)}</span>
              </div>
            </div>
            {isLow && (
              <div className={`text-xs ${isCritical ? 'text-red-500' : 'text-yellow-500'}`}>
                {isCritical
                  ? 'Critical: API requests may fail soon'
                  : 'Low rate limit remaining'}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
