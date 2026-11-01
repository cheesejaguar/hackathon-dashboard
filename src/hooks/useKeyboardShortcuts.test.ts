import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcutKey, KeyboardShortcut } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let refresh: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let command: ReturnType<typeof vi.fn>;
  let shortcuts: KeyboardShortcut[];

  const press = (init: KeyboardEventInit, target: EventTarget = window) => {
    act(() => {
      target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
    });
  };

  beforeEach(() => {
    refresh = vi.fn();
    save = vi.fn();
    command = vi.fn();
    shortcuts = [
      { key: 'r', description: 'Refresh', action: refresh, category: 'General' },
      { key: 's', modifiers: ['ctrl'], description: 'Save', action: save, category: 'General' },
      { key: 'k', modifiers: ['ctrl', 'shift'], description: 'Command', action: command, category: 'Navigation' },
    ];
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should trigger action on matching keypress', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    press({ key: 'r' });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    expect(command).not.toHaveBeenCalled();
  });

  it('should trigger action with modifier keys', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    press({ key: 's', ctrlKey: true });

    expect(save).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('should not trigger a modifier shortcut when the modifier is missing', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    press({ key: 's' });
    press({ key: 'k', ctrlKey: true });

    expect(save).not.toHaveBeenCalled();
    expect(command).not.toHaveBeenCalled();
  });

  it('should trigger action with multiple modifier keys', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));

    press({ key: 'k', ctrlKey: true, shiftKey: true });

    expect(command).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
  });

  it('should not trigger action when disabled', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }));

    press({ key: 'r' });

    expect(refresh).not.toHaveBeenCalled();
  });

  it('should ignore shortcuts while typing in an input', () => {
    renderHook(() => useKeyboardShortcuts({ shortcuts }));
    const input = document.createElement('input');
    document.body.appendChild(input);

    press({ key: 'r' }, input);

    expect(refresh).not.toHaveBeenCalled();
  });

  it('should toggle help with ? key', () => {
    const { result } = renderHook(() => useKeyboardShortcuts({ shortcuts }));

    expect(result.current.showHelp).toBe(false);

    press({ key: '?', shiftKey: true });
    expect(result.current.showHelp).toBe(true);

    press({ key: '?', shiftKey: true });
    expect(result.current.showHelp).toBe(false);
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

  it('should stop handling keypresses after unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts }));
    unmount();

    press({ key: 'r' });

    expect(refresh).not.toHaveBeenCalled();
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

    expect(formatShortcutKey(shortcut)).toBe('⇧ + P');
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
