import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

/**
 * 1. Sections / Architecture Layers Icon
 * Sleek stacked isometric architecture planes
 */
export const SectionsNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 17L12 22L22 17"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 12L12 17L22 12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

/**
 * 2. Relations / Directed Graph Tree Icon
 * Clean git-branch / node hierarchy graph
 */
export const RelationsNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M8.59 13.51L15.42 17.49"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M15.41 6.51L8.59 10.49"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/**
 * 3. ADR & Metrics Icon
 * Precision pulse & telemetry chart
 */
export const MetricsNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 20V10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 20V4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 20V14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 20H21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/**
 * 4. Global FTS Search Icon
 * Minimalist geometric search lens
 */
export const SearchNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="11"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M20 20L16.2 16.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/**
 * 5. System Settings / Sliders Icon
 * Minimalist horizontal adjustment sliders
 */
export const SettingsNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21V14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M4 10V3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M12 21V12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M12 8V3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M20 21V16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M20 12V3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M1 14H7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M9 8H15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M17 16H23"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/**
 * 6. Quick Drop / Fast Clipboard Sync Icon
 * Precision clipboard tray with fast drop indicator
 */
export const QuickDropNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4H18C19.1046 4 20 4.89543 20 6V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4H8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="8"
        y="2"
        width="8"
        height="4"
        rx="1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11V17M9.5 14.5L12 17L14.5 14.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

/**
 * 7. Free-Ride Ideas & Brainstorming Icon
 * Clean minimalist lightbulb
 */
export const IdeasNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18H15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 22H14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 2C8.13401 2 5 5.13401 5 9C5 11.383 6.19 13.489 8 14.735V16C8 16.5523 8.44772 17 9 17H15C15.5523 17 16 16.5523 16 16V14.735C17.81 13.489 19 11.383 19 9C19 5.13401 15.866 2 12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6V9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};
