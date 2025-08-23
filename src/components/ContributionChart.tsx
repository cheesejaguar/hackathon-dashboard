import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Commit, ContributorStats } from '@/lib/types';
import { useChartColors } from '@/hooks/useChartColors';

interface ContributionChartProps {
  commits: Commit[];
  contributors: ContributorStats[];
  isLoading?: boolean;
}

interface HourlyContribution {
  hour: number;
  commitCount: number;
}

interface UserContribution {
  user: ContributorStats;
  hourlyData: HourlyContribution[];
  totalCommits: number;
}

export function ContributionChart({ commits, contributors, isLoading }: ContributionChartProps) {
  const { colors, theme } = useChartColors();
  
  const contributionData = useMemo(() => {
    if (!contributors.length) return [];

    // Get the last 12 hours
    const now = new Date();
    const hours = Array.from({ length: 12 }, (_, i) => {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - (11 - i));
      hour.setMinutes(0, 0, 0);
      return hour;
    });

    // Group commits by author and hour
    const userCommitsByHour = new Map<string, Map<number, number>>();

    if (commits.length > 0) {
      commits.forEach(commit => {
        const commitDate = new Date(commit.commit.committer.date);
        const commitHour = new Date(commitDate);
        commitHour.setMinutes(0, 0, 0);
        
        // Only include commits from the last 12 hours
        if (commitHour >= hours[0] && commitHour <= now) {
          const author = commit.author?.login || commit.commit.author.name;
          const hourKey = commitHour.getTime();
          
          if (!userCommitsByHour.has(author)) {
            userCommitsByHour.set(author, new Map());
          }
          
          const userHours = userCommitsByHour.get(author)!;
          userHours.set(hourKey, (userHours.get(hourKey) || 0) + 1);
        }
      });
    }

    // Create contribution data for each contributor
    const contributionData: UserContribution[] = contributors
      .map(contributor => {
        const userHours = userCommitsByHour.get(contributor.login) || new Map();
        
        const hourlyData = hours.map(hour => ({
          hour: hour.getHours(),
          commitCount: userHours.get(hour.getTime()) || 0
        }));
        
        const totalCommits = hourlyData.reduce((sum, hour) => sum + hour.commitCount, 0);
        
        return {
          user: contributor,
          hourlyData,
          totalCommits
        };
      })
      .sort((a, b) => {
        // First sort by recent activity, then by total contributions
        if (b.totalCommits !== a.totalCommits) {
          return b.totalCommits - a.totalCommits;
        }
        return b.user.total - a.user.total;
      });

    // Ensure we show at least 6 users, but prioritize those with recent activity
    const minUsersToShow = 6;
    const maxUsersToShow = 12;
    
    // Take the top contributors, ensuring at least 6 are shown
    const finalData = contributionData.slice(0, Math.max(minUsersToShow, Math.min(maxUsersToShow, contributors.length)));

    return finalData;
  }, [commits, contributors]);

  const maxCommitsInHour = useMemo(() => {
    return Math.max(
      ...contributionData.flatMap(user => 
        user.hourlyData.map(hour => hour.commitCount)
      ),
      1
    );
  }, [contributionData]);

  const getIntensityClass = (commitCount: number) => {
    if (commitCount === 0) return 'bg-muted';
    
    const intensity = commitCount / maxCommitsInHour;
    // Use CSS custom properties for theme-aware colors
    if (intensity >= 0.8) return 'opacity-100';
    if (intensity >= 0.6) return 'opacity-80';
    if (intensity >= 0.4) return 'opacity-60';
    if (intensity >= 0.2) return 'opacity-40';
    return 'opacity-20';
  };

  const getIntensityStyle = (commitCount: number) => {
    if (commitCount === 0) return {};
    
    return {
      backgroundColor: colors.success,
    };
  };

  const formatHour = (hour: number) => {
    return hour.toString().padStart(2, '0') + ':00';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 12 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-24 h-6" />
                <div className="flex gap-1">
                  {Array.from({ length: 12 }).map((_, j) => (
                    <Skeleton key={j} className="w-3 h-3 rounded-sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contributionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 12 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-4">No commits in the last 12 hours</div>
            <div className="text-sm">Showing top contributors by total activity</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate hour labels for the last 12 hours
  const now = new Date();
  const hourLabels = Array.from({ length: 12 }, (_, i) => {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - (11 - i));
    return hour.getHours();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            Recent Activity (Last 12 Hours)
            <div className="text-sm font-normal text-muted-foreground">
              Showing top contributors {contributionData.length >= 6 ? `(${contributionData.length} users)` : '(minimum 6 users)'}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-normal">
            <span className="text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-muted rounded-sm" />
              <div className="w-3 h-3 rounded-sm opacity-20" style={{ backgroundColor: colors.success }} />
              <div className="w-3 h-3 rounded-sm opacity-40" style={{ backgroundColor: colors.success }} />
              <div className="w-3 h-3 rounded-sm opacity-60" style={{ backgroundColor: colors.success }} />
              <div className="w-3 h-3 rounded-sm opacity-80" style={{ backgroundColor: colors.success }} />
              <div className="w-3 h-3 rounded-sm opacity-100" style={{ backgroundColor: colors.success }} />
            </div>
            <span className="text-muted-foreground">More</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Hour labels */}
          <div className="flex items-center gap-4">
            <div className="w-24" /> {/* Spacer for user names */}
            <div className="flex gap-1">
              {hourLabels.map((hour, index) => (
                <div key={index} className="w-3 text-xs text-center text-muted-foreground">
                  {index % 3 === 0 ? formatHour(hour).slice(0, 2) : ''}
                </div>
              ))}
            </div>
          </div>

          {/* User contribution rows */}
          {contributionData.map((userContribution) => (
            <div key={userContribution.user.login} className="flex items-center gap-4">
              <div className="w-24 flex items-center gap-2">
                <img
                  src={userContribution.user.avatar_url}
                  alt={userContribution.user.login}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm font-medium truncate">
                  {userContribution.user.login}
                </span>
              </div>
              <div className="flex gap-1">
                {userContribution.hourlyData.map((hourData, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-sm ${hourData.commitCount === 0 ? 'bg-muted' : getIntensityClass(hourData.commitCount)}`}
                    style={getIntensityStyle(hourData.commitCount)}
                    title={`${formatHour(hourData.hour)}: ${hourData.commitCount} commits`}
                  />
                ))}
              </div>
              <Badge variant="secondary" className="text-xs">
                {userContribution.totalCommits}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}