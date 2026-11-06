import { Circle, Path, Rect, Svg } from 'react-native-svg';

export type IconName =
  | 'pin'
  | 'chart'
  | 'calendar'
  | 'person'
  | 'check'
  | 'route'
  | 'phone'
  | 'message'
  | 'bike'
  | 'scooter'
  | 'car'
  | 'badge';

const common = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function Icon({ name, size = 18, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) {
  switch (name) {
    case 'pin':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" stroke={color} {...common} />
          <Circle cx="12" cy="9" r="2.5" stroke={color} {...common} />
        </Svg>
      );
    case 'chart':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke={color} {...common} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Rect height="16" rx="2" stroke={color} width="18" x="3" y="5" {...common} />
          <Path d="M3 10h18M8 3v4M16 3v4" stroke={color} {...common} />
        </Svg>
      );
    case 'person':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx="12" cy="8" r="4" stroke={color} {...common} />
          <Path d="M4 21a8 8 0 0 1 16 0" stroke={color} {...common} />
        </Svg>
      );
    case 'check':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M5 12.5l4.5 4.5L19 7" stroke={color} {...common} strokeWidth={3} />
        </Svg>
      );
    case 'route':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M3 11l18-8-8 18-2-8z" stroke={color} {...common} />
        </Svg>
      );
    case 'phone':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path
            d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"
            stroke={color}
            {...common}
          />
        </Svg>
      );
    case 'message':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} {...common} />
        </Svg>
      );
    case 'bike':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx="6" cy="17" r="3.5" stroke={color} {...common} />
          <Circle cx="18" cy="17" r="3.5" stroke={color} {...common} />
          <Path d="M6 17l4-8h3l3 8M10 9h4M14 9l3 4h-5" stroke={color} {...common} />
        </Svg>
      );
    case 'scooter':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx="5.5" cy="17.5" r="3" stroke={color} {...common} />
          <Circle cx="18.5" cy="17.5" r="3" stroke={color} {...common} />
          <Path d="M8.5 17.5h7M12 17.5V11h4l2.5 3.5M6 11h4l1 2.5" stroke={color} {...common} />
        </Svg>
      );
    case 'car':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M4 16.5V12l2-5h12l2 5v4.5" stroke={color} {...common} />
          <Path d="M3.5 16.5h17M6 9h12" stroke={color} {...common} />
          <Circle cx="7.5" cy="16.5" r="1.6" stroke={color} {...common} />
          <Circle cx="16.5" cy="16.5" r="1.6" stroke={color} {...common} />
        </Svg>
      );
    case 'badge':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M12 2l2.5 3.5L19 6l-1 4.5L21 14l-4 2-1 5-4-2-4 2-1-5-4-2 3-3.5L5 6l4.5-.5z" stroke={color} {...common} />
        </Svg>
      );
    default:
      return null;
  }
}
