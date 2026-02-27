import { useCallback, useRef } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.6;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } catch {}
  }, []);

  return { play };
};
