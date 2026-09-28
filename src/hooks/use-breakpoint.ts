import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const TABLET_MIN_WIDTH = 700;
const DESKTOP_MIN_WIDTH = 1100;

function computeBreakpoint(width: number): Breakpoint {
  if (width >= DESKTOP_MIN_WIDTH) {
    return 'desktop';
  }
  if (width >= TABLET_MIN_WIDTH) {
    return 'tablet';
  }
  return 'mobile';
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // The static web export pre-renders with no real window, so the first
  // client render must match that ('mobile') to avoid a hydration mismatch.
  // The real breakpoint is applied right after mount, once effects run.
  if (!hasMounted) {
    return 'mobile';
  }

  return computeBreakpoint(width);
}
