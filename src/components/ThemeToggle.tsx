import { Button } from '@/components/ui/button';
import { Sun, Moon, Waveform } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <Button
        variant={theme === 'light' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('light')}
        className="w-8 h-8 p-0 rounded-md transition-all"
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('dark')}
        className="w-8 h-8 p-0 rounded-md transition-all"
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </Button>
      <Button
        variant={theme === 'vibes' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('vibes')}
        className={`w-8 h-8 p-0 rounded-md transition-all ${
          theme === 'vibes' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600' : ''
        }`}
        aria-label="Vibes mode"
      >
        <Waveform className={`w-4 h-4 ${theme === 'vibes' ? 'text-white animate-pulse' : ''}`} />
      </Button>
    </div>
  );
}