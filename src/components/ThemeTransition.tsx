import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

/**
 * ThemeTransition component handles special transition effects between themes
 * Provides enhanced visual feedback for theme changes, especially vibes mode
 */
export function ThemeTransition() {
  const { theme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousTheme, setPreviousTheme] = useState<string | null>(null);

  useEffect(() => {
    if (previousTheme && previousTheme !== theme) {
      setIsTransitioning(true);
      
      // Special effects for transitioning to vibes mode
      if (theme === 'vibes') {
        // Add a flash effect when entering vibes mode
        const flashElement = document.createElement('div');
        flashElement.className = 'fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300';
        flashElement.style.background = 'radial-gradient(circle at center, oklch(0.70 0.25 320 / 0.3) 0%, transparent 50%)';
        flashElement.style.opacity = '1';
        document.body.appendChild(flashElement);
        
        // Fade out the flash effect
        setTimeout(() => {
          flashElement.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(flashElement);
          }, 300);
        }, 100);
      }
      
      // Reset transition state
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
    
    setPreviousTheme(theme);
  }, [theme, previousTheme]);

  // Add special transition overlays for vibes mode
  if (isTransitioning && theme === 'vibes') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[9998]">
        {/* Scanning line effect during transition */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[oklch(0.75_0.25_180)] to-transparent opacity-80 animate-pulse" />
        
        {/* Grid overlay that fades in */}
        <div 
          className="absolute inset-0 opacity-20 transition-opacity duration-300"
          style={{
            backgroundImage: `
              linear-gradient(oklch(0.25 0.15 280 / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, oklch(0.25 0.15 280 / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Corner glow effects */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-[oklch(0.70_0.25_320_/_0.2)] to-transparent rounded-full blur-xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-[oklch(0.75_0.25_180_/_0.2)] to-transparent rounded-full blur-xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-radial from-[oklch(0.80_0.25_60_/_0.2)] to-transparent rounded-full blur-xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-radial from-[oklch(0.75_0.30_15_/_0.2)] to-transparent rounded-full blur-xl" />
      </div>
    );
  }

  return null;
}