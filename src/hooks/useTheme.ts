import { useEffect, useRef } from 'react';
import { useKV } from '@github/spark/hooks';

export type Theme = 'light' | 'dark' | 'vibes';

export function useTheme() {
  const [theme, setTheme] = useKV<Theme>('theme', 'light');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'vibes');
    
    // Add current theme class
    root.classList.add(theme);

    // Handle vibes mode audio
    if (theme === 'vibes') {
      // Create and play synthwave audio
      if (!audioRef.current) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Create multiple oscillators for rich synthwave sound
          const bass = audioContext.createOscillator();
          const lead = audioContext.createOscillator();
          const pad = audioContext.createOscillator();
          
          // Filter for that classic synthwave sound
          const filter = audioContext.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1200, audioContext.currentTime);
          filter.Q.setValueAtTime(1, audioContext.currentTime);
          
          // Gain nodes for volume control
          const bassGain = audioContext.createGain();
          const leadGain = audioContext.createGain();
          const padGain = audioContext.createGain();
          const masterGain = audioContext.createGain();
          
          // Set up bass line (low frequency, steady)
          bass.frequency.setValueAtTime(55, audioContext.currentTime); // A1
          bass.type = 'sawtooth';
          bassGain.gain.setValueAtTime(0.3, audioContext.currentTime);
          
          // Set up lead synth (melody line)
          lead.frequency.setValueAtTime(220, audioContext.currentTime); // A3
          lead.type = 'square';
          leadGain.gain.setValueAtTime(0.2, audioContext.currentTime);
          
          // Set up pad (ambient background)
          pad.frequency.setValueAtTime(330, audioContext.currentTime); // E4
          pad.type = 'triangle';
          padGain.gain.setValueAtTime(0.15, audioContext.currentTime);
          
          // Master volume
          masterGain.gain.setValueAtTime(0.1, audioContext.currentTime);
          
          // Connect everything
          bass.connect(bassGain);
          lead.connect(leadGain);
          pad.connect(padGain);
          
          bassGain.connect(filter);
          leadGain.connect(filter);
          padGain.connect(filter);
          filter.connect(masterGain);
          masterGain.connect(audioContext.destination);
          
          // Create chord progression and rhythm pattern
          const now = audioContext.currentTime;
          let time = now;
          
          // Function to schedule chord changes
          const scheduleChord = (startTime: number, bassFreq: number, leadFreq: number, padFreq: number) => {
            bass.frequency.setValueAtTime(bassFreq, startTime);
            lead.frequency.setValueAtTime(leadFreq, startTime);
            pad.frequency.setValueAtTime(padFreq, startTime);
            
            // Add some rhythm to the lead
            leadGain.gain.setValueAtTime(0.2, startTime);
            leadGain.gain.linearRampToValueAtTime(0.05, startTime + 0.25);
            leadGain.gain.setValueAtTime(0.2, startTime + 0.5);
            leadGain.gain.linearRampToValueAtTime(0.05, startTime + 0.75);
          };
          
          // Synthwave chord progression (Am - F - C - G)
          const chords = [
            { bass: 55, lead: 220, pad: 330 },   // Am
            { bass: 44, lead: 175, pad: 262 },   // F
            { bass: 65, lead: 262, pad: 392 },   // C
            { bass: 49, lead: 196, pad: 294 },   // G
          ];
          
          // Schedule chord progression (each chord lasts 2 seconds)
          for (let i = 0; i < 50; i++) { // 100 seconds of music
            const chord = chords[i % chords.length];
            scheduleChord(time, chord.bass, chord.lead, chord.pad);
            time += 2;
          }
          
          // Start all oscillators
          bass.start();
          lead.start();
          pad.start();
          
          // Store references for cleanup
          audioRef.current = {
            audioContext,
            oscillators: [bass, lead, pad],
            cleanup: () => {
              try {
                bass.stop();
                lead.stop();
                pad.stop();
                audioContext.close();
              } catch (e) {
                // Ignore errors during cleanup
              }
            }
          } as any;
          
        } catch (error) {
          console.warn('Could not initialize synthwave audio:', error);
        }
      }
    } else {
      // Stop vibes audio when switching away
      if (audioRef.current && (audioRef.current as any).cleanup) {
        (audioRef.current as any).cleanup();
        audioRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current && (audioRef.current as any).cleanup) {
        (audioRef.current as any).cleanup();
      }
    };
  }, [theme]);

  const cycleTheme = () => {
    setTheme(currentTheme => {
      switch (currentTheme) {
        case 'light': return 'dark';
        case 'dark': return 'vibes';
        case 'vibes': return 'light';
        default: return 'light';
      }
    });
  };

  return {
    theme,
    setTheme,
    cycleTheme,
    isDark: theme === 'dark',
    isVibes: theme === 'vibes'
  };
}