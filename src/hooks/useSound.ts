import { useEffect, useRef } from 'react';

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine', secondFrequency?: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    if (secondFrequency) {
      oscillator.frequency.linearRampToValueAtTime(secondFrequency, ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const pop = () => playSound(200, 0.1, 'sine');
  const combo = () => {
    playSound(400, 0.2, 'sine');
    setTimeout(() => playSound(600, 0.15, 'sine'), 50);
  };
  const tick = () => playSound(800, 0.05, 'square');
  const victory = () => playSound(300, 0.5, 'sine', 600);
  const defeat = () => playSound(400, 0.3, 'sine', 200);

  return { pop, combo, tick, victory, defeat };
};
