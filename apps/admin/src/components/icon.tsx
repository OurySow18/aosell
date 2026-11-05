import { Circle, Path, Rect, Svg } from 'react-native-svg';

export type IconName =
  | 'dashboard'
  | 'orders'
  | 'sellers'
  | 'couriers'
  | 'users'
  | 'moderation'
  | 'payments'
  | 'settings'
  | 'search'
  | 'bell'
  | 'check'
  | 'missing'
  | 'chevron';

const common = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function Icon({ name, size = 18, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) {
  switch (name) {
    case 'dashboard':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Rect height="7" rx="1.5" stroke={color} width="7" x="3" y="3" {...common} />
          <Rect height="7" rx="1.5" stroke={color} width="7" x="14" y="3" {...common} />
          <Rect height="7" rx="1.5" stroke={color} width="7" x="3" y="14" {...common} />
          <Rect height="7" rx="1.5" stroke={color} width="7" x="14" y="14" {...common} />
        </Svg>
      );
    case 'orders':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" stroke={color} {...common} />
          <Path d="M9 8h6M9 12h6" stroke={color} {...common} />
        </Svg>
      );
    case 'sellers':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M3 9l1.5-5h15L21 9" stroke={color} {...common} />
          <Path d="M4 9v11h16V9" stroke={color} {...common} />
          <Path d="M9 20v-6h6v6" stroke={color} {...common} />
        </Svg>
      );
    case 'couriers':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx="5.5" cy="17.5" r="3.5" stroke={color} {...common} />
          <Circle cx="18.5" cy="17.5" r="3.5" stroke={color} {...common} />
          <Path d="M5.5 17.5L9 10h6l3.5 7.5M14 6h3l1.5 4" stroke={color} {...common} />
        </Svg>
      );
    case 'users':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx="9" cy="7" r="4" stroke={color} {...common} />
          <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={color} {...common} />
          <Path d="M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9" stroke={color} {...common} />
        </Svg>
      );
    case 'moderation':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M4 22V4" stroke={color} {...common} />
          <Path d="M4 4h13l-2 4 2 4H4" stroke={color} {...common} />
        </Svg>
      );
    case 'payments':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Rect height="14" rx="2" stroke={color} width="18" x="3" y="6" {...common} />
          <Path d="M3 10h18M16 15h2" stroke={color} {...common} />
        </Svg>
      );
    case 'settings':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" stroke={color} {...common} />
          <Circle cx="15" cy="6" r="2" stroke={color} {...common} />
          <Circle cx="9" cy="12" r="2" stroke={color} {...common} />
          <Circle cx="17" cy="18" r="2" stroke={color} {...common} />
        </Svg>
      );
    case 'search':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx="11" cy="11" r="7" stroke={color} {...common} />
          <Path d="M16.5 16.5L21 21" stroke={color} {...common} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke={color} {...common} />
          <Path d="M10.3 21a2 2 0 0 0 3.4 0" stroke={color} {...common} />
        </Svg>
      );
    case 'check':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx="12" cy="12" fill="#DDF3E6" r="10" />
          <Path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#1E6B44" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} />
        </Svg>
      );
    case 'missing':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx="12" cy="12" fill="#FFE1E1" r="10" />
          <Path d="M12 7v6M12 16.5v.5" fill="none" stroke="#A3202A" strokeLinecap="round" strokeWidth={2.2} />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M9 6l6 6-6 6" stroke={color} {...common} />
        </Svg>
      );
    default:
      return null;
  }
}
