import { useState, useEffect } from 'react';

interface TimeCounterProps {
  timestamp: number; // Unix timestamp in milliseconds
  className?: string;
}

export function TimeCounter({ timestamp, className }: TimeCounterProps) {
  const [timeElapsed, setTimeElapsed] = useState('');

  const formatTimeElapsed = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const elapsed = now - timestamp;

      if (elapsed < 0) {
        setTimeElapsed('0s');
        return;
      }

      setTimeElapsed(formatTimeElapsed(elapsed));
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [timestamp]);

  return <span className={className}>{timeElapsed}</span>;
}
