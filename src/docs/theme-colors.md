# Theme-Aware Chart Colors

This document outlines the theme-aware chart color system implemented in the GitHub Repository Dashboard.

## Overview

The application now uses CSS custom properties to define chart colors that automatically adapt to light and dark themes, ensuring optimal visibility and accessibility.

## Color Variables

### Light Theme Colors
- **Success**: `oklch(0.45 0.18 142)` - Used for positive states (success, additions)
- **Warning**: `oklch(0.55 0.20 45)` - Used for caution states (pending, warnings)
- **Danger**: `oklch(0.55 0.20 15)` - Used for negative states (failure, deletions)
- **Info**: `oklch(0.50 0.15 210)` - Used for informational states
- **Purple**: `oklch(0.50 0.18 280)` - Additional chart color
- **Pink**: `oklch(0.55 0.20 340)` - Additional chart color
- **Teal**: `oklch(0.45 0.18 180)` - Additional chart color
- **Orange**: `oklch(0.55 0.20 30)` - Additional chart color
- **Cyan**: `oklch(0.50 0.15 190)` - Additional chart color
- **Gray**: `oklch(0.40 0.02 240)` - Used for neutral/inactive states

### Dark Theme Colors
All colors are brightened in dark mode for better visibility:
- **Success**: `oklch(0.65 0.18 142)`
- **Warning**: `oklch(0.75 0.20 45)`
- **Danger**: `oklch(0.75 0.20 15)`
- And so on...

## Usage

### React Hook
```typescript
import { useChartColors } from '@/hooks/useChartColors';

function MyComponent() {
  const { colors, seriesColors, statusColors, languageColors } = useChartColors();
  
  // Use colors directly
  const style = { color: colors.success };
  
  // Or use series colors for multi-series charts
  const chartData = data.map((item, index) => ({
    ...item,
    color: seriesColors[index % seriesColors.length]
  }));
}
```

### CSS Classes
The colors are also available as Tailwind CSS classes:
- `text-chart-success`
- `bg-chart-success`
- `border-chart-success`
- etc.

## Color Mappings

### Status Colors
- **Success**: Success workflows, completed tasks, positive metrics
- **Failure**: Failed workflows, errors, negative metrics  
- **Pending**: In-progress workflows, warnings, neutral states
- **Cancelled**: Cancelled workflows, inactive states
- **Skipped**: Skipped workflows, disabled features

### Semantic Colors
- **Positive**: Success states, gains, improvements
- **Negative**: Failure states, losses, declines
- **Neutral**: Inactive states, placeholders
- **Active**: Currently active items
- **Primary**: Main brand color
- **Secondary**: Supporting brand color
- **Accent**: Highlight color

### Language Colors
Pre-defined colors for common programming languages:
- **TypeScript**: Info blue
- **JavaScript**: Warning yellow
- **Python**: Success green
- **Java**: Orange
- **C++**: Purple
- **Go**: Cyan
- **Rust**: Orange
- And more...

## Accessibility

All color combinations meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text) in both light and dark themes.

## Components Updated

The following components now use theme-aware colors:
1. **ContributionChart** - GitHub-style contribution activity charts
2. **RepositoryInsights** - Language usage and contributor activity
3. **ActionStatus** - CI/CD workflow status indicators
4. **PullRequestDashboard** - PR state indicators  
5. **RepositoryComparison** - Repository metrics and comparisons

## Benefits

1. **Consistency**: Unified color system across all charts and data visualizations
2. **Accessibility**: Optimal contrast in both light and dark themes
3. **Maintainability**: Centralized color management
4. **User Experience**: Colors automatically adapt to user's theme preference
5. **Flexibility**: Easy to extend with new colors or modify existing ones