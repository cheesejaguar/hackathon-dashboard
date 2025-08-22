import { useTheme } from './useTheme';

/**
 * Hook to get theme-aware chart colors
 * Returns colors optimized for visibility in current theme
 */
export function useChartColors() {
  const { theme } = useTheme();

  // Base color palette that works for most charts
  const colors = {
    success: 'var(--chart-success)',
    warning: 'var(--chart-warning)', 
    danger: 'var(--chart-danger)',
    info: 'var(--chart-info)',
    purple: 'var(--chart-purple)',
    pink: 'var(--chart-pink)',
    teal: 'var(--chart-teal)',
    orange: 'var(--chart-orange)',
    cyan: 'var(--chart-cyan)',
    gray: 'var(--chart-gray)',
  };

  // Color arrays for multi-series charts
  const seriesColors = [
    colors.info,
    colors.success,
    colors.warning,
    colors.purple,
    colors.pink,
    colors.teal,
    colors.orange,
    colors.cyan,
    colors.danger,
    colors.gray,
  ];

  // Semantic colors for common chart types
  const semanticColors = {
    positive: colors.success,
    negative: colors.danger,
    neutral: colors.gray,
    active: colors.info,
    inactive: colors.gray,
    primary: 'var(--primary)',
    secondary: 'var(--secondary)',
    accent: 'var(--accent)',
  };

  // Status colors for workflow/action indicators
  const statusColors = {
    success: colors.success,
    failure: colors.danger,
    pending: colors.warning,
    cancelled: colors.gray,
    skipped: colors.gray,
    in_progress: colors.info,
  };

  // Language colors for programming language charts
  const languageColors = {
    TypeScript: colors.info,
    JavaScript: colors.warning,
    Python: colors.success,
    Java: colors.orange,
    'C++': colors.purple,
    'C#': colors.purple,
    Go: colors.cyan,
    Rust: colors.orange,
    PHP: colors.purple,
    Ruby: colors.danger,
    Swift: colors.orange,
    Kotlin: colors.purple,
    Dart: colors.cyan,
    Shell: colors.gray,
    HTML: colors.orange,
    CSS: colors.info,
    SCSS: colors.pink,
    Vue: colors.success,
    React: colors.cyan,
    Other: colors.gray,
  };

  return {
    colors,
    seriesColors,
    semanticColors,
    statusColors,
    languageColors,
    theme,
  };
}