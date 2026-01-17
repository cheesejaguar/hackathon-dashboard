import { useEffect, useCallback, useState } from 'react';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  action: () => void;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Allow Escape to work in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const modifiers = shortcut.modifiers || [];

        const ctrlMatch = modifiers.includes('ctrl') ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = modifiers.includes('alt') ? event.altKey : !event.altKey;
        const shiftMatch = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey;
        const metaMatch = modifiers.includes('meta') ? event.metaKey : true; // Don't require meta to be false

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }

      // Toggle help with ?
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        setShowHelp((prev) => !prev);
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  const closeHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  return {
    showHelp,
    toggleHelp,
    closeHelp,
    shortcuts,
  };
}

// Format shortcut key for display
export function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const modifiers = shortcut.modifiers || [];

  if (modifiers.includes('ctrl') || modifiers.includes('meta')) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (modifiers.includes('alt')) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }
  if (modifiers.includes('shift')) {
    parts.push('⇧');
  }

  // Format the key
  let keyDisplay = shortcut.key.toUpperCase();
  if (shortcut.key === ' ') keyDisplay = 'Space';
  if (shortcut.key === 'Escape') keyDisplay = 'Esc';
  if (shortcut.key === 'ArrowUp') keyDisplay = '↑';
  if (shortcut.key === 'ArrowDown') keyDisplay = '↓';
  if (shortcut.key === 'ArrowLeft') keyDisplay = '←';
  if (shortcut.key === 'ArrowRight') keyDisplay = '→';

  parts.push(keyDisplay);

  return parts.join(' + ');
}
