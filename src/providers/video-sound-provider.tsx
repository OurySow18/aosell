import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

// A single app-wide sound preference, not per-video — same as Instagram:
// toggling one video's speaker keeps every video muted/unmuted afterwards,
// in this session and (via AsyncStorage) the next one too.
const STORAGE_KEY = 'aosell.videoSoundOn';

type VideoSoundContextValue = {
  soundOn: boolean;
  toggleSound: () => void;
};

const VideoSoundContext = createContext<VideoSoundContextValue | undefined>(undefined);

export function VideoSoundProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isMounted && stored === 'true') {
          setSoundOn(true);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<VideoSoundContextValue>(
    () => ({
      soundOn,
      toggleSound() {
        setSoundOn((current) => {
          const next = !current;
          void AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => undefined);
          return next;
        });
      },
    }),
    [soundOn]
  );

  return <VideoSoundContext.Provider value={value}>{children}</VideoSoundContext.Provider>;
}

export function useVideoSound() {
  const context = useContext(VideoSoundContext);

  if (!context) {
    throw new Error('useVideoSound must be used within VideoSoundProvider');
  }

  return context;
}
