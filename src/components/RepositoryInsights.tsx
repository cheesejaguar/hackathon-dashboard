import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Code, 
  GitCommit, 
  FileText, 
  Plus, 
  Minus, 
  Edit,
  TrendingUp,
  Calendar,
  Clock
} from '@phosphor-icons/react';

import { ContributorStats, LanguageStats, FileChange, Commit } from '@/lib/types';
import { ContributionChart } from '@/components/ContributionChart';
import { formatTimeAgo } from '@/lib/github';
import { useChartColors } from '@/hooks/useChartColors';

interface RepositoryInsightsProps {
  contributors: ContributorStats[];
  languages: LanguageStats;
  recentFileChanges: Array<{
    commit: Commit;
    files: FileChange[];
  }>;
  commits: Commit[];
  isLoading: {
    contributors: boolean;
    languages: boolean;
    fileChanges: boolean;
  };
}

export function RepositoryInsights({ 
  contributors, 
  languages, 
  recentFileChanges,
  commits,
  isLoading 
}: RepositoryInsightsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const { languageColors, seriesColors } = useChartColors();

  // Calculate language percentages
  const totalLanguageBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  const languagePercentages = Object.entries(languages)
    .map(([lang, bytes]) => ({
      language: lang,
      bytes,
      percentage: totalLanguageBytes > 0 ? (bytes / totalLanguageBytes) * 100 : 0
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8); // Show top 8 languages

  // Get recent activity for contributors based on selected period
  const getContributorActivity = (contributor: ContributorStats) => {
    if (!contributor.weeks.length) return { commits: 0, additions: 0, deletions: 0 };
    
    const now = Date.now() / 1000;
    const periodSeconds = selectedPeriod === 'week' ? 7 * 24 * 60 * 60 : 
                         selectedPeriod === 'month' ? 30 * 24 * 60 * 60 : 
                         Infinity;
    
    const cutoff = selectedPeriod === 'all' ? 0 : now - periodSeconds;
    
    return contributor.weeks
      .filter(week => week.w >= cutoff)
      .reduce(
        (acc, week) => ({
          commits: acc.commits + week.c,
          additions: acc.additions + week.a,
          deletions: acc.deletions + week.d
        }),
        { commits: 0, additions: 0, deletions: 0 }
      );
  };

  // Sort contributors by recent activity
  const sortedContributors = [...contributors]
    .map(contributor => ({
      ...contributor,
      activity: getContributorActivity(contributor)
    }))
    .sort((a, b) => b.activity.commits - a.activity.commits)
    .slice(0, 10); // Show top 10 contributors

  // Calculate file change patterns
  const fileChangePatterns = recentFileChanges.reduce((acc, { files }) => {
    files.forEach(file => {
      const extension = file.filename.split('.').pop()?.toLowerCase() || 'no-ext';
      if (!acc[extension]) {
        acc[extension] = { count: 0, additions: 0, deletions: 0 };
      }
      acc[extension].count++;
      acc[extension].additions += file.additions;
      acc[extension].deletions += file.deletions;
    });
    return acc;
  }, {} as Record<string, { count: number; additions: number; deletions: number }>);

  const topFileTypes = Object.entries(fileChangePatterns)
    .map(([ext, stats]) => ({ extension: ext, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const getLanguageColor = (language: string, index: number = 0): string => {
    // First try to get a predefined language color
    const predefinedColor = languageColors[language];
    if (predefinedColor) {
      return predefinedColor;
    }
    
    // Fall back to series colors for unknown languages
    return seriesColors[index % seriesColors.length];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Repository Insights
        </CardTitle>
        <CardDescription>
          Contributor activity, language usage, and file change patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="contributors" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contributors" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contributors
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="languages" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Languages
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              File Changes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contributors" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Activity period:</span>
              <div className="flex gap-1">
                {(['week', 'month', 'all'] as const).map((period) => (
                  <Badge
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period === 'all' ? 'All time' : `Last ${period}`}
                  </Badge>
                ))}
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {isLoading.contributors ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-3 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedContributors.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No contributor data available</p>
                  <p className="text-sm">GitHub may still be computing statistics</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedContributors.map((contributor, index) => (
                    <div key={contributor.author?.login || index} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={contributor.author?.avatar_url} 
                          alt={contributor.author?.login} 
                        />
                        <AvatarFallback>
                          {contributor.author?.login?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {contributor.author?.login || 'Unknown'}
                          </span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <GitCommit className="w-3 h-3" />
                            {contributor.activity.commits}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1" style={{ color: seriesColors[1] }}>
                            <Plus className="w-3 h-3" />
                            {contributor.activity.additions}
                          </span>
                          <span className="flex items-center gap-1" style={{ color: seriesColors[8] }}>
                            <Minus className="w-3 h-3" />
                            {contributor.activity.deletions}
                          </span>
                          <span className="text-xs">
                            Total: {contributor.total} commits
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ContributionChart
              commits={commits}
              contributors={contributors}
              isLoading={isLoading.contributors}
            />
          </TabsContent>

          <TabsContent value="languages" className="space-y-4">
            {isLoading.languages ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[60px]" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : languagePercentages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No language data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {languagePercentages.map(({ language, percentage, bytes }, index) => (
                  <div key={language} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getLanguageColor(language, index) }}
                        />
                        <span className="font-medium">{language}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: getLanguageColor(language, index)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Most Changed File Types
                </h4>
                {isLoading.fileChanges ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[120px]" />
                      </div>
                    ))}
                  </div>
                ) : topFileTypes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No file changes available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topFileTypes.map(({ extension, count, additions, deletions }) => (
                      <div key={extension} className="flex items-center justify-between p-2 rounded border bg-card/30">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            .{extension}
                          </code>
                          <span className="text-sm text-muted-foreground">
                            {count} files
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <Plus className="w-3 h-3" />
                            {additions}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <Minus className="w-3 h-3" />
                            {deletions}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <GitCommit className="w-4 h-4" />
                  Recent File Changes
                </h4>
                <ScrollArea className="h-[250px]">
                  {isLoading.fileChanges ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2 p-3 border rounded">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-[150px]" />
                            <Skeleton className="h-3 w-[120px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentFileChanges.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent file changes available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentFileChanges.map(({ commit, files }) => (
                        <div key={commit.sha} className="p-3 border rounded-lg bg-card/30">
                          <div className="flex items-start gap-3 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage 
                                src={commit.author?.avatar_url} 
                                alt={commit.author?.login} 
                              />
                              <AvatarFallback className="text-xs">
                                {commit.author?.login?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2">
                                {commit.commit.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{commit.author?.login}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(commit.commit.author.date)}</span>
                                <span>•</span>
                                <span>{files.length} files</span>
                              </div>
                            </div>
                          </div>
                          
                          {files.length > 0 && (
                            <div className="space-y-1">
                              {files.slice(0, 3).map((file) => (
                                <div key={file.filename} className="flex items-center justify-between text-xs">
                                  <span className="font-mono text-muted-foreground truncate">
                                    {file.filename}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="flex items-center gap-1 text-green-600">
                                      <Plus className="w-2 h-2" />
                                      {file.additions}
                                    </span>
                                    <span className="flex items-center gap-1 text-red-600">
                                      <Minus className="w-2 h-2" />
                                      {file.deletions}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {files.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{files.length - 3} more files
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}