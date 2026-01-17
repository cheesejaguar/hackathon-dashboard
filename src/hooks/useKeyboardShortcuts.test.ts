import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcutKey, KeyboardShortcut } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockAction: ReturnType<typeof vi.fn>;
  let shortcuts: KeyboardShortcut[];

  beforeEach(() => {
    mockAction = vi.fn();
    shortcuts = [
      { key: 'r', description: 'Refresh', action: mockAction, category: 'General' },
      { key: 's', modifiers: ['ctrl'], description: 'Save', action: mockAction, category: 'General' },
      { key: 'k', modifiers: ['ctrl', 'shift'], description: 'Command', action: mockAction, category: 'Navigation' },
    ];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger action on matching keypress', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    const event = new KeyboardEvent('keydown', { key: 'r' });
    window.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should trigger action with modifier keys', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    window.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should trigger action with multiple modifier keys', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
    });
    window.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not trigger action when disabled', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }));

    const event = new KeyboardEvent('keydown', { key: 'r' });
    window.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should toggle help with ? key', () => {
    const { result } = renderHook(() => useKeyboardShortcuts({ shortcuts }));

    expect(result.current.showHelp).toBe(false);

    const event = new KeyboardEvent('keydown', { key: '?', shiftKey: true });
    window.dispatchEvent(event);

    expect(result.current.showHelp).toBe(true);
  });

  it('should provide toggleHelp function', () => {
    const { result } = renderHook(() => useKeyboardShortcuts({ shortcuts }));

    expect(result.current.showHelp).toBe(false);

    act(() => {
      result.current.toggleHelp();
    });

    expect(result.current.showHelp).toBe(true);
  });

  it('should provide closeHelp function', () => {
    const { result } = renderHook(() => useKeyboardShortcuts({ shortcuts }));

    act(() => {
      result.current.toggleHelp();
    });
    expect(result.current.showHelp).toBe(true);

    act(() => {
      result.current.closeHelp();
    });
    expect(result.current.showHelp).toBe(false);
  });

  it('should return shortcuts array', () => {
    const { result } = renderHook(() => useKeyboardShortcuts({ shortcuts }));

    expect(result.current.shortcuts).toBe(shortcuts);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts }));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});

describe('formatShortcutKey', () => {
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  it('should format simple key', () => {
    const shortcut: KeyboardShortcut = {
      key: 'r',
      description: 'Refresh',
      action: () => {},
    };

    expect(formatShortcutKey(shortcut)).toBe('R');
  });

  it('should format key with ctrl modifier on Windows', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
    });

    const shortcut: KeyboardShortcut = {
      key: 's',
      modifiers: ['ctrl'],
      description: 'Save',
      action: () => {},
    };

    expect(formatShortcutKey(shortcut)).toBe('Ctrl + S');
  });

  it('should format key with shift modifier', () => {
    const shortcut: KeyboardShortcut = {
      key: 'p',
      modifiers: ['shift'],
      description: 'Print',
      action: () => {},
    };

    expect(formatShortcutKey(shortcut)).toContain('⇧');
  });

  it('should format Escape key', () => {
    const shortcut: KeyboardShortcut = {
      key: 'Escape',
      description: 'Close',
      action: () => {},
    };

    expect(formatShortcutKey(shortcut)).toBe('Esc');
  });

  it('should format Space key', () => {
    const shortcut: KeyboardShortcut = {
      key: ' ',
      description: 'Toggle',
      action: () => {},
    };

    expect(formatShortcutKey(shortcut)).toBe('Space');
  });

  it('should format arrow keys', () => {
    expect(formatShortcutKey({ key: 'ArrowUp', description: '', action: () => {} })).toBe('↑');
    expect(formatShortcutKey({ key: 'ArrowDown', description: '', action: () => {} })).toBe('↓');
    expect(formatShortcutKey({ key: 'ArrowLeft', description: '', action: () => {} })).toBe('←');
    expect(formatShortcutKey({ key: 'ArrowRight', description: '', action: () => {} })).toBe('→');
  });
});
