import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface SynthwaveAudioProps {
  isPlaying?: boolean;
}

export function SynthwaveAudio({ isPlaying = false }: SynthwaveAudioProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const { theme } = useTheme();

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.setValueAtTime(0.1, audioContextRef.current.currentTime); // Low volume
    }

    return () => {
      stopSynthwave();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const createSynthwaveOscillator = (frequency: number, type: OscillatorType = 'sawtooth') => {
    if (!audioContextRef.current || !gainNodeRef.current) return null;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    
    // Create envelope for synthwave sound
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(gainNodeRef.current);
    
    return { oscillator, gainNode };
  };

  const playArpeggio = (baseFreq: number, duration: number) => {
    if (!audioContextRef.current) return;

    const notes = [0, 4, 7, 12, 16, 12, 7, 4]; // Synthwave arpeggio pattern
    const noteDuration = duration / notes.length;
    
    notes.forEach((semitone, index) => {
      const frequency = baseFreq * Math.pow(2, semitone / 12);
      const startTime = audioContextRef.current!.currentTime + (index * noteDuration);
      
      const synthNode = createSynthwaveOscillator(frequency, 'sawtooth');
      if (!synthNode) return;
      
      const { oscillator, gainNode } = synthNode;
      
      // Envelope: quick attack, gradual decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  };

  const playBassDrone = () => {
    if (!audioContextRef.current) return null;

    const synthNode = createSynthwaveOscillator(55, 'square'); // Low A
    if (!synthNode) return null;
    
    const { oscillator, gainNode } = synthNode;
    
    // Slow attack for ambient bass
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 2);
    
    oscillator.start();
    oscillatorsRef.current.push(oscillator);
    
    return oscillator;
  };

  const playRepeatingPattern = () => {
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
            playArpeggio(freq, 1.5);
          }
        }, index * 200);
      });
      
      // Schedule next pattern
      setTimeout(playPattern, 4000 + Math.random() * 2000);
    };
    
    // Start the pattern
    setTimeout(playPattern, 1000);
  };

  const stopSynthwave = () => {
    isPlayingRef.current = false;
    
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    oscillatorsRef.current = [];
  };

  // Control audio based on props and theme
  useEffect(() => {
    if (theme === 'vibes' && isPlaying && !isPlayingRef.current) {
      // Resume audio context if suspended (required by some browsers)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      playRepeatingPattern();
    } else if ((!isPlaying || theme !== 'vibes') && isPlayingRef.current) {
      stopSynthwave();
    }
  }, [theme, isPlaying]);

  // This component doesn't render anything visible
  return null;
}