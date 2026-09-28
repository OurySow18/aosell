import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const TABLET_MIN_WIDTH = 700;
const DESKTOP_MIN_WIDTH = 1100;

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();

  if (width >= DESKTOP_MIN_WIDTH) {
    return 'desktop';
  }
  if (width >= TABLET_MIN_WIDTH) {
    return 'tablet';
  }
  return 'mobile';
}
