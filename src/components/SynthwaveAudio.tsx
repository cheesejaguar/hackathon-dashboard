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
      
      // Faster envelope for increased tempo - sharper attack and decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.008); // Faster attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration - 0.008);
      gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  };

  const playBassDrone = () => {
    if (!audioContextRef.current) return null;

    const createDroneOscillator = (freq: number) => {
      const synthNode = createSynthwaveOscillator(freq, 'square');
      if (!synthNode) return null;
      
      const { oscillator, gainNode } = synthNode;
      
      // Slow attack for ambient bass
      gainNode.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, audioContextRef.current!.currentTime + 2);
      
      oscillator.start();
      oscillatorsRef.current.push(oscillator);
      
      return oscillator;
    };

    // Create multiple bass frequencies for richer sound
    const bassFreqs = [55, 110]; // Low A and A octave
    bassFreqs.forEach(freq => createDroneOscillator(freq));
    
    // Schedule bass drone renewal to maintain continuous loop
    const renewDrone = () => {
      if (!isPlayingRef.current) return;
      
      // Create new bass drone before the old one fades
      bassFreqs.forEach(freq => createDroneOscillator(freq));
      
      // Schedule next renewal
      setTimeout(renewDrone, 8000); // Every 8 seconds
    };
    
    // Start renewal cycle
    setTimeout(renewDrone, 8000);
  };

  const playRepeatingPattern = () => {
    if (!audioContextRef.current || isPlayingRef.current) return;
    
    isPlayingRef.current = true;
    
    // Start bass drone
    playBassDrone();
    
    // Play arpeggios at intervals with 20% faster tempo
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
            // 20% faster arpeggio duration: 1.5 / 1.2 = 1.25
            playArpeggio(freq, 1.25);
          }
        }, index * 167); // 20% faster timing: 200 / 1.2 = 167ms
      });
      
      // Schedule next pattern with 20% faster timing and ensure continuous loop
      const nextDelay = 3333 + Math.random() * 1667; // (4000 + 2000) / 1.2 = faster tempo
      setTimeout(playPattern, nextDelay);
    };
    
    // Start the pattern immediately for seamless loop
    playPattern();
  };

  const stopSynthwave = () => {
    isPlayingRef.current = false;
    
    // Gracefully fade out and stop all oscillators
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.5);
    }
    
    // Stop oscillators after fade out
    setTimeout(() => {
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Oscillator might already be stopped
        }
      });
      oscillatorsRef.current = [];
      
      // Reset gain for next play
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      }
    }, 600);
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