import { useEffect, useState, useCallback } from 'react';

export function useCountdown(initialMinutes: number, autoStart = false) {
  const totalSeconds = Math.max(1, initialMinutes) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    setIsRunning(autoStart);
  }, [totalSeconds, autoStart]);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const toggle = useCallback(() => setIsRunning((r) => !r), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const start = useCallback(() => setIsRunning(true), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    secondsLeft,
    formatted,
    isRunning,
    isExpired: secondsLeft === 0,
    toggle,
    pause,
    start,
    reset,
  };
}
