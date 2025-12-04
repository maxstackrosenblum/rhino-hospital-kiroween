import { useEffect, useRef, useState } from 'react';

interface UseIdleTimeoutOptions {
  onIdle: () => void;
  idleTime?: number; // in milliseconds
  warningTime?: number; // show warning before logout
}

export const useIdleTimeout = ({
  onIdle,
  idleTime = 30 * 60 * 1000, // 30 minutes default
  warningTime = 2 * 60 * 1000, // 2 minutes warning
}: UseIdleTimeoutOptions) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    setShowWarning(false);
    setRemainingTime(0);

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(warningTime);

      // Start countdown
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, idleTime - warningTime);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      onIdle();
    }, idleTime);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [idleTime, warningTime, onIdle]);

  return { showWarning, remainingTime, resetTimer };
};
