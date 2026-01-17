import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface SynthwaveAudioProps {
  isPlaying?: boolean;
}

export function SynthwaveAudio({ isPlaying = false }: SynthwaveAudioProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Set<OscillatorNode>>(new Set());
  const gainNodeRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const patternTimeoutRef = useRef<number | null>(null);
  const droneTimeoutRef = useRef<number | null>(null);
  const { theme } = useTheme();

  // Initialize Web Audio API
  const initAudio = useCallback(() => {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return false;

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    }

    return true;
  }, []);

  const createSynthwaveOscillator = useCallback((frequency: number, type: OscillatorType = 'sawtooth') => {
    if (!audioContextRef.current || !gainNodeRef.current) return null;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);

    // Create envelope for synthwave sound
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(gainNodeRef.current);

    // Track oscillator for cleanup
    oscillatorsRef.current.add(oscillator);
    oscillator.onended = () => {
      oscillatorsRef.current.delete(oscillator);
    };

    return { oscillator, gainNode };
  }, []);

  const playArpeggio = useCallback((baseFreq: number, duration: number) => {
    if (!audioContextRef.current || !isPlayingRef.current) return;

    const notes = [0, 4, 7, 12, 16, 12, 7, 4]; // Synthwave arpeggio pattern
    const noteDuration = duration / notes.length;

    notes.forEach((semitone, index) => {
      if (!audioContextRef.current || !isPlayingRef.current) return;

      const frequency = baseFreq * Math.pow(2, semitone / 12);
      const startTime = audioContextRef.current.currentTime + (index * noteDuration);

      const synthNode = createSynthwaveOscillator(frequency, 'sawtooth');
      if (!synthNode) return;

      const { oscillator, gainNode } = synthNode;

      // Faster envelope for increased tempo - sharper attack and decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration - 0.008);
      gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  }, [createSynthwaveOscillator]);

  const playBassDrone = useCallback(() => {
    if (!audioContextRef.current || !isPlayingRef.current) return;

    const createDroneOscillator = (freq: number) => {
      if (!audioContextRef.current || !isPlayingRef.current) return null;

      const synthNode = createSynthwaveOscillator(freq, 'square');
      if (!synthNode) return null;

      const { oscillator, gainNode } = synthNode;

      // Slow attack for ambient bass
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, audioContextRef.current.currentTime + 2);

      // Schedule fade out and stop
      const fadeOutTime = audioContextRef.current.currentTime + 10;
      gainNode.gain.setValueAtTime(0.08, fadeOutTime);
      gainNode.gain.linearRampToValueAtTime(0, fadeOutTime + 2);

      oscillator.start();
      oscillator.stop(fadeOutTime + 2.1);

      return oscillator;
    };

    // Create bass frequencies
    const bassFreqs = [55, 110];
    bassFreqs.forEach(freq => createDroneOscillator(freq));

    // Schedule next bass drone for continuous loop
    const scheduleNextDrone = () => {
      if (!isPlayingRef.current) return;
      droneTimeoutRef.current = window.setTimeout(() => {
        playBassDrone();
      }, 8000);
    };

    scheduleNextDrone();
  }, [createSynthwaveOscillator]);

  const playRepeatingPattern = useCallback(() => {
    if (!audioContextRef.current || isPlayingRef.current) return;

    isPlayingRef.current = true;

    // Start bass drone
    playBassDrone();

    // Play arpeggios at intervals
    const playPattern = () => {
      if (!isPlayingRef.current) return;

      // Different chord progressions for variety
      const chords = [
        [220, 277.18, 329.63], // A minor
        [196, 246.94, 293.66], // G major
        [164.81, 207.65, 246.94], // E minor
        [174.61, 220, 261.63], // F major
      ];

      const chord = chords[Math.floor(Math.random() * chords.length)];
      chord.forEach((freq, index) => {
        setTimeout(() => {
          if (isPlayingRef.current) {
            playArpeggio(freq, 1.25);
          }
        }, index * 167);
      });

      // Schedule next pattern for continuous loop
      const nextDelay = 3333 + Math.random() * 1667;
      patternTimeoutRef.current = window.setTimeout(playPattern, nextDelay);
    };

    // Start the pattern immediately
    playPattern();
  }, [playBassDrone, playArpeggio]);

  const stopSynthwave = useCallback(() => {
    isPlayingRef.current = false;

    // Clear scheduled timeouts
    if (patternTimeoutRef.current) {
      clearTimeout(patternTimeoutRef.current);
      patternTimeoutRef.current = null;
    }
    if (droneTimeoutRef.current) {
      clearTimeout(droneTimeoutRef.current);
      droneTimeoutRef.current = null;
    }

    // Gracefully fade out
    if (gainNodeRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.5);
      } catch (e) {
        // Audio context might be in an invalid state
      }
    }

    // Stop all oscillators after fade out
    setTimeout(() => {
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Oscillator might already be stopped
        }
      });
      oscillatorsRef.current.clear();

      // Reset gain for next play
      if (gainNodeRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          gainNodeRef.current.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        } catch (e) {
          // Audio context might be in an invalid state
        }
      }
    }, 600);
  }, []);

  // Control audio based on props and theme
  useEffect(() => {
    if (theme === 'vibes' && isPlaying && !isPlayingRef.current) {
      if (initAudio()) {
        // Resume audio context if suspended (required by some browsers)
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        playRepeatingPattern();
      }
    } else if ((!isPlaying || theme !== 'vibes') && isPlayingRef.current) {
      stopSynthwave();
    }
  }, [theme, isPlaying, initAudio, playRepeatingPattern, stopSynthwave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSynthwave();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopSynthwave]);

  // This component doesn't render anything visible
  return null;
}
