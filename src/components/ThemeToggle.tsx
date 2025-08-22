import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Waveform } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'vibes') => {
    if (newTheme === theme) return;
    
    setIsChanging(true);
    setTheme(newTheme);
    
    // Reset changing state after transition
    setTimeout(() => {
      setIsChanging(false);
    }, 300);
  };

  return (
    <div className={`flex items-center bg-muted rounded-lg p-1 transition-all duration-300 ${
      isChanging ? 'scale-105' : ''
    }`}>
      <Button
        variant={theme === 'light' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('light')}
        className={`w-8 h-8 p-0 rounded-md transition-all duration-300 ${
          theme === 'light' ? 'shadow-md' : ''
        } ${isChanging && theme === 'light' ? 'animate-pulse' : ''}`}
        aria-label="Light mode"
        disabled={isChanging}
      >
        <Sun className={`w-4 h-4 transition-transform duration-300 ${
          theme === 'light' ? 'scale-110' : ''
        }`} />
      </Button>
      <Button
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('dark')}
        className={`w-8 h-8 p-0 rounded-md transition-all duration-300 ${
          theme === 'dark' ? 'shadow-md' : ''
        } ${isChanging && theme === 'dark' ? 'animate-pulse' : ''}`}
        aria-label="Dark mode"
        disabled={isChanging}
      >
        <Moon className={`w-4 h-4 transition-transform duration-300 ${
          theme === 'dark' ? 'scale-110' : ''
        }`} />
      </Button>
      <Button
        variant={theme === 'vibes' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('vibes')}
        className={`w-8 h-8 p-0 rounded-md transition-all duration-300 ${
          theme === 'vibes' 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50' 
            : ''
        } ${isChanging && theme === 'vibes' ? 'animate-pulse scale-110' : ''}`}
        aria-label="Vibes mode"
        disabled={isChanging}
      >
        <Waveform className={`w-4 h-4 transition-all duration-300 ${
          theme === 'vibes' ? 'text-white animate-pulse scale-110' : ''
        } ${isChanging && theme === 'vibes' ? 'animate-bounce' : ''}`} />
      </Button>
    </div>
  );
}